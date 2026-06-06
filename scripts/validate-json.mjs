// Validador estatico de JSON de contenido.
// Uso: node scripts/validate-json.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");
const load = (n) => JSON.parse(readFileSync(join(dataDir, n), "utf8"));

const tragedies = load("tragedyCards.json");
const opportunities = load("opportunityCards.json");
const fakes = load("fakeOpportunityCards.json");
const paydays = load("paydayCards.json");
const normals = load("normalCards.json");
const personajes = load("personajes.json");

const warnings = [];
const errors = [];

function checkIdsConsecutive(name, arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    errors.push(`${name}: arreglo vacio o invalido`);
    return;
  }
  const ids = arr.map((x) => x.id);
  const seen = new Set();
  for (const id of ids) {
    if (typeof id !== "number" && typeof id !== "string") {
      errors.push(`${name}: id invalido ${id}`);
    }
    if (seen.has(id)) errors.push(`${name}: id duplicado ${id}`);
    seen.add(id);
  }
  const numIds = ids.filter((x) => typeof x === "number");
  if (numIds.length === ids.length) {
    const sorted = [...numIds].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        warnings.push(
          `${name}: ids no consecutivos (hueco entre ${sorted[i - 1]} y ${sorted[i]})`
        );
        break;
      }
    }
  }
}

function checkOpciones(name, arr, perOpcion) {
  for (const card of arr) {
    if (!Array.isArray(card.opciones)) {
      errors.push(`${name} id=${card.id}: opciones no es array`);
      continue;
    }
    for (let i = 0; i < card.opciones.length; i++) {
      const op = card.opciones[i];
      if (typeof op !== "object" || !op) {
        errors.push(`${name} id=${card.id} op#${i}: no es objeto`);
        continue;
      }
      perOpcion(card, op, i);
    }
  }
}

function checkInversion(name, card, op, idx) {
  const inv = op.inversion;
  if (!inv) return;
  const required = ["nombre", "costo", "delayMin", "delayMax", "outcomes"];
  for (const k of required) {
    if (inv[k] === undefined) errors.push(`${name} id=${card.id} op#${idx}: inversion sin '${k}'`);
  }
  if (typeof inv.costo === "number" && inv.costo <= 0) {
    errors.push(`${name} id=${card.id} op#${idx}: costo no positivo (${inv.costo})`);
  }
  if (typeof inv.delayMin === "number" && typeof inv.delayMax === "number") {
    if (inv.delayMin > inv.delayMax) {
      errors.push(`${name} id=${card.id} op#${idx}: delayMin > delayMax`);
    }
  }
  if (Array.isArray(inv.outcomes)) {
    let sumP = 0;
    for (const o of inv.outcomes) {
      if (typeof o?.p !== "number") errors.push(`${name} id=${card.id} op#${idx}: outcome.p no numerico`);
      else sumP += o.p;
      if (typeof o?.delta !== "number") errors.push(`${name} id=${card.id} op#${idx}: outcome.delta no numerico`);
    }
    if (Math.abs(sumP - 1) > 0.01) {
      warnings.push(`${name} id=${card.id} op#${idx}: probabilidades suman ${sumP.toFixed(3)}, no ~1`);
    }
  } else {
    errors.push(`${name} id=${card.id} op#${idx}: outcomes no es array`);
  }
}

function checkNum(name, card, op, idx, key) {
  if (op[key] !== undefined && typeof op[key] !== "number") {
    errors.push(`${name} id=${card.id} op#${idx}: ${key} no es numero (${typeof op[key]})`);
  }
}

// --- Tragedies ---
checkIdsConsecutive("tragedyCards", tragedies);
const SEVERIDADES = new Set(["leve", "media", "fuerte"]);
for (const c of tragedies) {
  if (!SEVERIDADES.has(c.severidad)) {
    errors.push(`tragedyCards id=${c.id}: severidad invalida (${c.severidad})`);
  }
}
checkOpciones("tragedyCards", tragedies, (card, op, i) => {
  ["dinero", "salud", "deuda", "bienestar"].forEach((k) => checkNum("tragedyCards", card, op, i, k));
});

// --- Opportunities ---
checkIdsConsecutive("opportunityCards", opportunities);
checkOpciones("opportunityCards", opportunities, (card, op, i) => {
  checkInversion("opportunityCards", card, op, i);
  ["dinero", "salud", "deuda", "bienestar"].forEach((k) => checkNum("opportunityCards", card, op, i, k));
});

// --- Fakes ---
checkIdsConsecutive("fakeOpportunityCards", fakes);
checkOpciones("fakeOpportunityCards", fakes, (card, op, i) => {
  ["dinero", "salud", "deuda", "bienestar"].forEach((k) => checkNum("fakeOpportunityCards", card, op, i, k));
});
// Cada fake debe tener al menos una opcion prudente o de salida
for (const c of fakes) {
  const tieneSalida = (c.opciones || []).some((op) => {
    const t = (op?.texto || "").toLowerCase();
    if (/rechazar|pasar|no\s|salir|escapar|ignorar|dejar|paz|prudente/i.test(t)) return true;
    if (typeof op?.bienestar === "number" && op.bienestar > 0) return true;
    return false;
  });
  if (!tieneSalida) warnings.push(`fakeOpportunityCards id=${c.id}: sin opcion prudente clara`);
}

// --- Paydays ---
checkIdsConsecutive("paydayCards", paydays);
checkOpciones("paydayCards", paydays, (card, op, i) => {
  ["dinero", "salud", "deuda", "bienestar"].forEach((k) => checkNum("paydayCards", card, op, i, k));
});

// --- Normals ---
checkIdsConsecutive("normalCards", normals);
for (const c of normals) {
  ["dinero", "salud", "deuda", "bienestar"].forEach((k) => {
    if (c[k] !== undefined && typeof c[k] !== "number") {
      errors.push(`normalCards id=${c.id}: ${k} no es numero (${typeof c[k]})`);
    }
  });
}

// --- Reporte ---
console.log(`\n=== Validacion JSON ===`);
console.log(`tragedyCards:   ${tragedies.length}`);
console.log(`opportunityCards: ${opportunities.length}`);
console.log(`fakeOpportunityCards: ${fakes.length}`);
console.log(`paydayCards:    ${paydays.length}`);
console.log(`normalCards:    ${normals.length}`);
console.log(`personajes:     ${personajes.length}`);

console.log(`\nErrores: ${errors.length}`);
for (const e of errors) console.log(`  ✗ ${e}`);
console.log(`\nWarnings: ${warnings.length}`);
for (const w of warnings) console.log(`  ⚠ ${w}`);

if (errors.length > 0) process.exit(1);
