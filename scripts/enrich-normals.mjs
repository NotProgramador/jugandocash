// Enriquece normalCards.json con micro-efectos opcionales.
// Idempotente: borra dinero/salud/bienestar/deuda y los recalcula con heuristicas.
// ~55-65% de cartas reciben algun efecto. El resto queda como puro humor.
// Uso: node scripts/enrich-normals.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "..", "src", "data", "normalCards.json");

const cards = JSON.parse(readFileSync(file, "utf8"));

// IDs que mejor se quedan como humor puro (sin efecto)
const HUMOR_PURO = new Set([
  2, 3, 7, 11, 14, 18, 22, 24, 26, 27, 28, 32, 33, 38, 39, 41, 50, 53, 54, 56,
  57, 60, 61, 62, 64, 65, 74, 78, 79, 82, 83, 84, 88, 90, 91, 92, 93, 96, 99,
  103, 104, 108, 109, 110, 111, 112, 114, 115, 116, 117, 119, 121, 122,
]);

// Efectos curados por id. Solo se aplica si la carta NO esta en HUMOR_PURO.
// dinero: [-500, +500], salud: [-3, +3], bienestar: [-5, +5], deuda solo cuando claro.
const EFECTOS = {
  1: { dinero: 200, bienestar: 2 },                          // Encontraste $200 en chamarra
  3: { bienestar: 2 },                                       // Saldo positivo
  4: { dinero: -250, salud: -1, bienestar: 1 },              // Lunch sobrevivio + tacos
  5: { dinero: 100, bienestar: 3 },                          // Cancelaste suscripcion
  6: { dinero: -400, bienestar: 2 },                         // Supermercado + Rogelio
  7: { bienestar: -2 },                                      // Antojitos emocionales
  8: { salud: -1, bienestar: -2 },                           // Internet se cayo
  9: { dinero: -80, bienestar: 1 },                          // Muffin
  10: { bienestar: -3 },                                     // Notificacion bancaria sudada
  12: { salud: 1, bienestar: 1 },                            // Camino a la cocina
  13: { bienestar: 3 },                                      // Perro vecino te saluda
  14: { bienestar: -1 },                                     // Modo ahorro personalidad
  15: { bienestar: 2 },                                      // No fui al plan caro
  16: { dinero: 30, bienestar: 1 },                          // Monedas en sillon
  17: { dinero: -150, salud: -1, bienestar: -1 },            // Meal prep fallido
  19: { dinero: -250, bienestar: -1 },                       // Compra online "solo a ver"
  20: { bienestar: 1 },                                      // Comparas papel higienico
  21: { dinero: -300, bienestar: 1 },                        // Compraste con cupon
  23: { dinero: -90, bienestar: -1 },                        // Junta y cafe
  25: { salud: -1, bienestar: -1 },                          // Agua fria por error
  27: { dinero: -60, bienestar: 2 },                         // Libreta para taquitos
  29: { salud: 2, bienestar: 3 },                            // Planta sobrevive
  30: { bienestar: 3 },                                      // Pagaste a tiempo
  31: { dinero: -120, salud: -1, bienestar: 1 },             // Quesadillas
  32: { bienestar: 2 },                                      // Cierras app por salud mental
  34: { bienestar: -2 },                                     // Mercado subio sin invertir
  35: { bienestar: 2 },                                      // Reutilizar bolsa
  36: { dinero: -50, bienestar: 1 },                         // Cafe soluble
  37: { dinero: -180, bienestar: -1 },                       // Antojo de sushi
  39: { bienestar: -3 },                                     // $99/mes son $1188
  40: { salud: 1, bienestar: 2 },                            // Limpiar para evitar deudas
  42: { dinero: 200, bienestar: 3 },                         // Antojo cerrado
  43: { dinero: 500, bienestar: 4 },                         // Te pagaron por transferencia
  44: { dinero: 37, bienestar: 2 },                          // Tarjeta de regalo $37
  45: { salud: 1, bienestar: 2 },                            // Microondas a tiempo
  46: { bienestar: 3 },                                      // Ignoraste "ultima oportunidad"
  47: { dinero: -250, salud: -1, bienestar: 1 },             // Comida callejera
  48: { bienestar: 4 },                                      // No a la tanda
  49: { salud: 3, bienestar: 4 },                            // Siesta deducible
  51: { dinero: -350, bienestar: -1 },                       // "Solo a cambiar"
  52: { dinero: -30, bienestar: 2 },                         // Cafe en casa
  53: { bienestar: -1 },                                     // Amigo: "esta vez si te pago"
  54: { dinero: 10 },                                        // Ficha de maquinitas
  55: { bienestar: -1 },                                     // App clasifica gastos
  58: { dinero: -150, salud: -1, bienestar: -1 },            // Fruta y pizza
  59: { bienestar: 3 },                                      // No abriste delivery
  63: { dinero: 200, bienestar: 2 },                         // Recibo de luz mas bajo
  66: { bienestar: 3 },                                      // Contrasenas organizadas
  67: { salud: 2, bienestar: 2 },                            // Bloqueador
  68: { dinero: 80, bienestar: 2 },                          // Genericos
  69: { dinero: -60, salud: 1, bienestar: 3 },               // Sopita anti-ansiedad
  70: { salud: 2, bienestar: -1 },                           // Escaleras crossfit
  71: { dinero: 50, bienestar: 1 },                          // Frasco de cambio
  72: { bienestar: 4 },                                      // "No esta en mi presupuesto"
  73: { dinero: -60, bienestar: -1 },                        // Pena pedir descuento
  75: { bienestar: 1 },                                      // Camara apagada, cereal
  76: { dinero: -150, bienestar: 2 },                        // Alcancia
  77: { bienestar: 2 },                                      // Tarjeta paso a la primera
  80: { bienestar: 4 },                                      // Dia sin gastos
  81: { dinero: -200, bienestar: 1 },                        // Pago en efectivo
  84: { bienestar: -1 },                                     // Snacks tambien cuentan
  85: { dinero: -350, bienestar: 2 },                        // Termo
  86: { salud: 2, bienestar: 3 },                            // Cocinar
  87: { bienestar: -1 },                                     // Tres papelitos
  89: { dinero: 100, bienestar: 3 },                         // Billete lavado
  92: { dinero: 20, bienestar: 2 },                          // Cajero sin comision
  94: { dinero: -40, bienestar: 1 },                         // Pan dulce
  95: { salud: 2, bienestar: 2 },                            // Caminar es gratis
  96: { bienestar: 2 },                                      // Recibo de agua normal
  97: { dinero: 80, bienestar: 1 },                          // Comida recalentada
  98: { dinero: -200, bienestar: 3 },                        // Pilas recargables
  100: { dinero: -150, bienestar: -1 },                      // "Barato" no es necesario
  101: { salud: -1, bienestar: 2 },                          // 10 min mas de sueno
  102: { bienestar: 3 },                                     // Resististe panaderia
  103: { bienestar: 1 },                                     // Guardaste factura
  105: { dinero: -120, bienestar: -2 },                      // Gasto hormiga con familia
  106: { dinero: 30, bienestar: 2 },                         // Semaforo verde
  107: { salud: 2, bienestar: 2 },                           // Agua en vez de refresco
  109: { bienestar: 1 },                                     // Ataque de minimalismo
  112: { dinero: 5, bienestar: 1 },                          // Vuelto exacto
  113: { dinero: -300, deuda: -300, bienestar: 4 },          // Pagaste deuda pequena
  118: { dinero: 80, bienestar: -1 },                        // Olvidaste comprar mitad
  120: { bienestar: 3 },                                     // Momento de paz
  123: { bienestar: 4 },                                     // "Luego vemos" gasto
};

// Limpiar primero (idempotencia)
for (const card of cards) {
  delete card.dinero;
  delete card.salud;
  delete card.bienestar;
  delete card.deuda;
}

let conEfecto = 0;
let sinEfecto = 0;
let rangoDinero = { min: 0, max: 0 };
let rangoSalud = { min: 0, max: 0 };
let rangoBienestar = { min: 0, max: 0 };
let rangoDeuda = { min: 0, max: 0 };

for (const card of cards) {
  if (HUMOR_PURO.has(card.id)) {
    sinEfecto += 1;
    continue;
  }
  const ef = EFECTOS[card.id];
  if (!ef) {
    sinEfecto += 1;
    continue;
  }
  if (typeof ef.dinero === "number") {
    card.dinero = ef.dinero;
    rangoDinero.min = Math.min(rangoDinero.min, ef.dinero);
    rangoDinero.max = Math.max(rangoDinero.max, ef.dinero);
  }
  if (typeof ef.salud === "number") {
    card.salud = ef.salud;
    rangoSalud.min = Math.min(rangoSalud.min, ef.salud);
    rangoSalud.max = Math.max(rangoSalud.max, ef.salud);
  }
  if (typeof ef.bienestar === "number") {
    card.bienestar = ef.bienestar;
    rangoBienestar.min = Math.min(rangoBienestar.min, ef.bienestar);
    rangoBienestar.max = Math.max(rangoBienestar.max, ef.bienestar);
  }
  if (typeof ef.deuda === "number") {
    card.deuda = ef.deuda;
    rangoDeuda.min = Math.min(rangoDeuda.min, ef.deuda);
    rangoDeuda.max = Math.max(rangoDeuda.max, ef.deuda);
  }
  conEfecto += 1;
}

writeFileSync(file, JSON.stringify(cards, null, 2) + "\n", "utf8");
console.log(`Total cartas normales: ${cards.length}`);
console.log(`Con efecto: ${conEfecto} (${((conEfecto / cards.length) * 100).toFixed(0)}%)`);
console.log(`Sin efecto: ${sinEfecto} (${((sinEfecto / cards.length) * 100).toFixed(0)}%)`);
console.log(`Rangos:`);
console.log(`  dinero: ${rangoDinero.min} a ${rangoDinero.max}`);
console.log(`  salud: ${rangoSalud.min} a ${rangoSalud.max}`);
console.log(`  bienestar: ${rangoBienestar.min} a ${rangoBienestar.max}`);
console.log(`  deuda: ${rangoDeuda.min} a ${rangoDeuda.max}`);
