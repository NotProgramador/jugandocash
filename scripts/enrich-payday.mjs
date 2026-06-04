// Agrega bienestar a opciones de paydayCards.json segun accion.
// Idempotente: sobrescribe bienestar siempre.
// Uso: node scripts/enrich-payday.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "..", "src", "data", "paydayCards.json");

const cards = JSON.parse(readFileSync(file, "utf8"));

function estimarBienestar(op) {
  if (typeof op !== "object" || !op) return 0;
  const accion = op.accion || "";
  const dinero = Number(op.dinero || 0);
  const salud = Number(op.salud || 0);
  const deuda = Number(op.deuda || 0);

  switch (accion) {
    case "pagarDeuda":
      // Si tiene montoPago explicito (dinero<0 y deuda<0) -> bienestar +4
      // Si solo abre modal -> bienestar +3
      if (dinero < 0 && deuda < 0) return Math.abs(dinero) >= 4000 ? 5 : 4;
      return 3;
    case "pagarIntereses":
      return 2; // cumples lo minimo
    case "invertir":
    case "invertirBajoRiesgo":
      return 3; // sembrar futuro estresa poco, calma mucho
    case "ahorrar":
      return 4; // guardar = paz
    case "cumplirSuenio":
      return 0; // bienestar se aplica al cumplir en Game.jsx (+12)
    case "fiesta":
      // Fiesta = sube bienestar bastante, salud baja
      if (Math.abs(dinero) >= 2000) return 10;
      if (Math.abs(dinero) >= 1000) return 7;
      return 5;
    case "gastoInnecesario":
      // Gratificacion corta, remordimiento despues -> negativo neto leve
      if (Math.abs(dinero) >= 3000) return -3;
      if (Math.abs(dinero) >= 1500) return -2;
      return -1;
    case "salud":
      // Autocuidado: sube bienestar moderado
      if (salud >= 15) return 6;
      if (salud >= 8) return 4;
      return 3;
    case "seguirNormal":
      // Descansar / no hacer nada: paz mental
      if (salud >= 10) return 5;
      return 4;
    default:
      return 0;
  }
}

for (const card of cards) {
  for (const op of card.opciones || []) {
    if (typeof op === "object" && op) {
      op.bienestar = estimarBienestar(op);
    }
  }
}

writeFileSync(file, JSON.stringify(cards, null, 2) + "\n", "utf8");
console.log("Escrito a:", file);
console.log("Procesadas " + cards.length + " cartas de PayDay con bienestar.");
