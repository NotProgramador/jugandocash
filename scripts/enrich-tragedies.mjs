// Enriquece tragedyCards.json con severidad explicita y bienestar en opciones.
// Idempotente: filtra IDs >= 87 antes de procesar.
// Uso: node scripts/enrich-tragedies.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "..", "src", "data", "tragedyCards.json");

const all = JSON.parse(readFileSync(file, "utf8"));
// Quedarse solo con las 86 originales (id 1-86) para procesar
const cards = all.filter((c) => Number(c.id) <= 86);

function estimarBienestar(op) {
  if (typeof op !== "object" || !op) return 0;
  const dinero = Number(op.dinero || 0);
  const salud = Number(op.salud || 0);
  const deuda = Number(op.deuda || 0);

  let b = 0;
  if (salud >= 8) b += 4;
  else if (salud >= 3) b += 3;
  else if (salud > 0) b += 1;

  if (salud <= -15) b -= 9;
  else if (salud <= -10) b -= 6;
  else if (salud <= -5) b -= 3;
  else if (salud < 0) b -= 1;

  if (deuda >= 4000) b -= 4;
  else if (deuda >= 2000) b -= 3;
  else if (deuda >= 500) b -= 2;

  if (dinero <= -3000 && salud <= 0) b -= 1;
  if (dinero < 0 && salud >= 0 && deuda === 0) b += 1;
  if (dinero === 0 && deuda === 0 && salud <= -5) b -= 1;

  if (b > 5) b = 5;
  if (b < -10) b = -10;
  return b;
}

function calcularScore(op) {
  if (typeof op !== "object" || !op) return 0;
  let s = 0;
  if (typeof op.dinero === "number" && op.dinero < 0) s += Math.abs(op.dinero) / 1000;
  if (typeof op.deuda === "number" && op.deuda > 0) s += op.deuda / 1000;
  if (typeof op.salud === "number" && op.salud < 0) s += Math.abs(op.salud) / 5;
  if (typeof op.bienestar === "number" && op.bienestar < 0) s += Math.abs(op.bienestar) / 5;
  return s;
}

// Thresholds calibrados para apuntar a ~45/35/20:
// score <= 2.5  -> leve
// score 2.5..6  -> media
// score > 6     -> fuerte
function severidadAutomatica(card) {
  let max = 0;
  for (const op of card.opciones || []) {
    const s = calcularScore(op);
    if (s > max) max = s;
  }
  if (max <= 2.5) return "leve";
  if (max <= 6) return "media";
  return "fuerte";
}

// IDs que merecen subir a fuerte aunque la matematica no llegue
const PROMOVER_FUERTE = new Set([18, 27, 45, 52, 74]); // muela -20, estres -18, no dormir -20, resbalon -15, evento -15

for (const card of cards) {
  // Quitar severidad previa para recalcular limpio
  delete card.severidad;
  for (const op of card.opciones || []) {
    if (typeof op === "object" && op) {
      // Sobrescribir bienestar si ya existe (idempotente)
      op.bienestar = estimarBienestar(op);
    }
  }
  let sev = severidadAutomatica(card);
  if (PROMOVER_FUERTE.has(card.id)) sev = "fuerte";
  card.severidad = sev;
}

// --- Tragedias fuertes nuevas (12) ---
const nuevas = [
  {
    id: 87,
    severidad: "fuerte",
    texto: "Te hospitalizaron unos dias. El hospital cobra mas rapido que tu compania.",
    opciones: [
      { texto: "Hospital privado -$15,000 (+25 salud)", dinero: -15000, salud: 25, deuda: 0, bienestar: 4 },
      { texto: "Hospital publico -$3,500 (+12 salud)", dinero: -3500, salud: 12, deuda: 0, bienestar: 1 },
      { texto: "Auto-medicarte (-25 salud)", dinero: 0, salud: -25, deuda: 0, bienestar: -10 },
    ],
  },
  {
    id: 88,
    severidad: "fuerte",
    texto: "Tu auto necesita reparacion mayor. El motor pidio renuncia formal.",
    opciones: [
      { texto: "Reparacion completa -$18,000", dinero: -18000, salud: 0, deuda: 0, bienestar: -2 },
      { texto: "Arreglo a medias -$6,000 (-5 salud)", dinero: -6000, salud: -5, deuda: 0, bienestar: -4 },
      { texto: "Vender chatarra +$3,000 (-3 salud)", dinero: 3000, salud: -3, deuda: 0, bienestar: -5 },
    ],
  },
  {
    id: 89,
    severidad: "fuerte",
    texto: "Tu laptop de trabajo se quemo. Entrega manana sin Plan B.",
    opciones: [
      { texto: "Comprar nueva ya -$22,000", dinero: -22000, salud: 0, deuda: 0, bienestar: -2 },
      { texto: "Rentar mientras -$3,000 (-4 salud)", dinero: -3000, salud: -4, deuda: 0, bienestar: -3 },
      { texto: "Pedir prestada +$8,000 deuda", dinero: 0, salud: -2, deuda: 8000, bienestar: -6 },
    ],
  },
  {
    id: 90,
    severidad: "fuerte",
    texto: "Detectaron fraude en tu cuenta. Cargos en una ciudad que ni conoces.",
    opciones: [
      { texto: "Bloquear y disputar -$1,500 (+2 salud)", dinero: -1500, salud: 2, deuda: 0, bienestar: 3 },
      { texto: "Pagar y olvidar -$9,500", dinero: -9500, salud: -4, deuda: 0, bienestar: -6 },
      { texto: "Ignorar +$12,000 deuda", dinero: 0, salud: -8, deuda: 12000, bienestar: -10 },
    ],
  },
  {
    id: 91,
    severidad: "fuerte",
    texto: "Una deuda olvidada llego a juicio. El cobrador trae fecha y abogado.",
    opciones: [
      { texto: "Pagar acuerdo -$12,000", dinero: -12000, salud: -2, deuda: -5000, bienestar: 0 },
      { texto: "Convenio mensual +$15,000 deuda", dinero: 0, salud: -3, deuda: 15000, bienestar: -5 },
      { texto: "Pelear en corte -$4,000 (-8 salud)", dinero: -4000, salud: -8, deuda: 0, bienestar: -7 },
    ],
  },
  {
    id: 92,
    severidad: "fuerte",
    texto: "Te mudan del depto con poca aviso. El casero tambien quiere depositos viejos.",
    opciones: [
      { texto: "Mudanza decente -$14,000", dinero: -14000, salud: -2, deuda: 0, bienestar: -3 },
      { texto: "Mudanza express -$6,000 (-8 salud)", dinero: -6000, salud: -8, deuda: 0, bienestar: -6 },
      { texto: "Pedir prestado +$10,000 deuda", dinero: 0, salud: -4, deuda: 10000, bienestar: -7 },
    ],
  },
  {
    id: 93,
    severidad: "fuerte",
    texto: "Familiar cercano necesita apoyo urgente. La cartera no estaba lista.",
    opciones: [
      { texto: "Apoyar fuerte -$10,000 (+5 salud)", dinero: -10000, salud: 5, deuda: 0, bienestar: 5 },
      { texto: "Apoyar poquito -$2,500 (-3 salud)", dinero: -2500, salud: -3, deuda: 0, bienestar: -2 },
      { texto: "No poder ayudar (-10 salud)", dinero: 0, salud: -10, deuda: 0, bienestar: -9 },
    ],
  },
  {
    id: 94,
    severidad: "fuerte",
    texto: "Fuga de agua grave en tu casa. Charcos con personalidad.",
    opciones: [
      { texto: "Plomero serio + danos -$8,500", dinero: -8500, salud: 0, deuda: 0, bienestar: -2 },
      { texto: "Arreglar a medias -$2,000 (-10 salud)", dinero: -2000, salud: -10, deuda: 0, bienestar: -6 },
      { texto: "Credito reparacion +$10,000 deuda", dinero: 0, salud: -3, deuda: 10000, bienestar: -5 },
    ],
  },
  {
    id: 95,
    severidad: "fuerte",
    texto: "Te despidieron temporalmente. Indemnizacion magra, recibos puntuales.",
    opciones: [
      { texto: "Ahorros + plan -$6,000 (-3 salud)", dinero: -6000, salud: -3, deuda: 0, bienestar: -3 },
      { texto: "Aceptar deuda +$12,000", dinero: 0, salud: -5, deuda: 12000, bienestar: -7 },
      { texto: "Buscar freelance ya -$1,000 (-8 salud)", dinero: -1000, salud: -8, deuda: 0, bienestar: -5 },
    ],
  },
  {
    id: 96,
    severidad: "fuerte",
    texto: "Accidente domestico: tropiezo con la mesa, mano rota, factura entera.",
    opciones: [
      { texto: "Hospital + yeso -$7,500 (+15 salud)", dinero: -7500, salud: 15, deuda: 0, bienestar: 2 },
      { texto: "Clinica barata -$2,000 (+3 salud)", dinero: -2000, salud: 3, deuda: 0, bienestar: -1 },
      { texto: "Aguantar (-25 salud)", dinero: 0, salud: -25, deuda: 0, bienestar: -10 },
    ],
  },
  {
    id: 97,
    severidad: "fuerte",
    texto: "Tu mascota necesita cirugia. El veterinario habla bonito y caro.",
    opciones: [
      { texto: "Cirugia completa -$11,000 (+5 salud)", dinero: -11000, salud: 5, deuda: 0, bienestar: 5 },
      { texto: "Tratamiento basico -$3,000 (-3 salud)", dinero: -3000, salud: -3, deuda: 0, bienestar: -4 },
      { texto: "No hacer nada (-15 salud)", dinero: 0, salud: -15, deuda: 0, bienestar: -10 },
    ],
  },
  {
    id: 98,
    severidad: "fuerte",
    texto: "Te robaron herramientas de trabajo. El emprendedor lloro en silencio.",
    opciones: [
      { texto: "Reponer todo -$14,000", dinero: -14000, salud: 0, deuda: 0, bienestar: -2 },
      { texto: "Reponer minimo -$4,000 (-5 salud)", dinero: -4000, salud: -5, deuda: 0, bienestar: -5 },
      { texto: "Credito urgente +$12,000 deuda", dinero: 0, salud: -3, deuda: 12000, bienestar: -7 },
    ],
  },
  {
    id: 99,
    severidad: "fuerte",
    texto: "Problema legal menor pero caro: una notificacion con sello, abogado obligatorio.",
    opciones: [
      { texto: "Abogado serio -$9,000 (+2 salud)", dinero: -9000, salud: 2, deuda: 0, bienestar: 1 },
      { texto: "Abogado amigo -$3,000 (-4 salud)", dinero: -3000, salud: -4, deuda: 0, bienestar: -4 },
      { texto: "Ignorar +$8,000 deuda", dinero: 0, salud: -6, deuda: 8000, bienestar: -8 },
    ],
  },
];

const out = [...cards, ...nuevas];

const finalCount = { leve: 0, media: 0, fuerte: 0 };
for (const c of out) finalCount[c.severidad || "leve"] += 1;
console.log("Total cartas:", out.length);
console.log("Distribucion:", finalCount);
console.log("  leves: " + ((finalCount.leve / out.length) * 100).toFixed(0) + "%");
console.log("  medias: " + ((finalCount.media / out.length) * 100).toFixed(0) + "%");
console.log("  fuertes: " + ((finalCount.fuerte / out.length) * 100).toFixed(0) + "%");

writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Escrito a:", file);
