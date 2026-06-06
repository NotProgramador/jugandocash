// Agrega bienestar a opciones de opportunityCards.json segun tipo de opcion.
// No modifica costo, delayMin, delayMax, outcomes, p, delta.
// Idempotente: sobrescribe bienestar en opciones.
// Uso: node scripts/enrich-opportunities.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "..", "src", "data", "opportunityCards.json");

const cards = JSON.parse(readFileSync(file, "utf8"));

function expectedDelta(outcomes) {
  if (!Array.isArray(outcomes)) return 0;
  let e = 0;
  for (const o of outcomes) {
    e += Number(o?.p || 0) * Number(o?.delta || 0);
  }
  return e;
}

function bienestarInversionFuerte(costo) {
  if (costo >= 40000) return -5;
  if (costo >= 25000) return -4;
  if (costo >= 15000) return -3;
  return -2;
}

function bienestarInversionPoco(costo) {
  if (costo >= 6000) return -1;
  if (costo >= 3000) return 0;
  if (costo >= 1500) return 1;
  return 2;
}

function bienestarPasar(esBuenaOportunidad) {
  // FOMO si la opcion de invertir tiene retorno esperado claramente positivo
  if (esBuenaOportunidad) return -1;
  return 3;
}

function bienestarPorFlujo(op) {
  const dinero = Number(op.dinero || 0);
  const salud = Number(op.salud || 0);
  const deuda = Number(op.deuda || 0);

  // Freelance / trabajo extra: dinero positivo, salud negativa
  if (dinero > 0 && salud < 0) {
    if (salud <= -6) return -5;
    if (salud <= -3) return -3;
    return -2;
  }
  // Bono / devolucion / cobro recibido: dinero positivo y sin perdida de salud
  if (dinero > 0 && salud >= 0 && deuda <= 0) {
    if (dinero >= 2000) return 5;
    if (dinero >= 1000) return 4;
    if (dinero >= 500) return 3;
    return 2;
  }
  // Ignorar multa / cargo no resuelto: deuda sube
  if (deuda > 0) {
    if (deuda >= 3000) return -4;
    if (deuda >= 1500) return -3;
    return -2;
  }
  // Pagar multa / resolver: dinero negativo sin deuda y sin salud negativa
  if (dinero < 0 && deuda <= 0 && salud >= 0) {
    return 2;
  }
  // Solo salud negativa (trabajar duro / aguantar)
  if (salud < 0) {
    if (salud <= -8) return -4;
    if (salud <= -4) return -2;
    return -1;
  }
  // Solo salud positiva (descansar / cuidarse)
  if (salud > 0) {
    if (salud >= 8) return 4;
    return 3;
  }
  return 0;
}

let totalOpciones = 0;
let opcionesConBienestar = 0;
let opcionesPasarConFomo = 0;

for (const card of cards) {
  const opciones = Array.isArray(card.opciones) ? card.opciones : [];

  // Detectar si la opcion "fuerte" tiene buena perspectiva (para calcular FOMO)
  let esBuenaOportunidad = false;
  for (const op of opciones) {
    if (op?.inversion && /fuerte/i.test(op.texto || "")) {
      const e = expectedDelta(op.inversion.outcomes);
      const ratio = e / Math.max(1, Number(op.inversion.costo || 1));
      if (ratio >= 0.13) esBuenaOportunidad = true;
    }
  }

  for (const op of opciones) {
    if (typeof op !== "object" || !op) continue;
    totalOpciones += 1;

    let bienestar = null;
    if (op.inversion) {
      const costo = Number(op.inversion.costo || 0);
      if (/fuerte/i.test(op.texto || "")) {
        bienestar = bienestarInversionFuerte(costo);
      } else if (/poco|peque|chico|medio/i.test(op.texto || "")) {
        bienestar = bienestarInversionPoco(costo);
      } else {
        bienestar = bienestarInversionPoco(costo);
      }
    } else if (
      typeof op.dinero === "number" ||
      typeof op.salud === "number" ||
      typeof op.deuda === "number"
    ) {
      bienestar = bienestarPorFlujo(op);
    } else if (/pasar|ignorar|dejar/i.test(op.texto || "")) {
      bienestar = bienestarPasar(esBuenaOportunidad);
      if (esBuenaOportunidad) opcionesPasarConFomo += 1;
    }

    if (typeof bienestar === "number") {
      op.bienestar = bienestar;
      opcionesConBienestar += 1;
    }
  }
}

writeFileSync(file, JSON.stringify(cards, null, 2) + "\n", "utf8");
console.log(`Cartas de oportunidad: ${cards.length}`);
console.log(`Opciones totales: ${totalOpciones}`);
console.log(`Opciones con bienestar: ${opcionesConBienestar}`);
console.log(`Opciones "pasar" con FOMO (-1): ${opcionesPasarConFomo}`);
