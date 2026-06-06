// Simulador de balance — corre la misma logica de Game.jsx en Node.
// Uso: node scripts/simulate.mjs
// Borrable despues de usar.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");
const loadJSON = (name) =>
  JSON.parse(readFileSync(join(dataDir, name), "utf8"));

const normalCards = loadJSON("normalCards.json");
const tragedyCards = loadJSON("tragedyCards.json");
const opportunityCards = loadJSON("opportunityCards.json");
const fakeOpportunityCards = loadJSON("fakeOpportunityCards.json");

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getBienestarTier(b) {
  if (b <= 24) return "critico";
  if (b <= 49) return "bajo";
  if (b <= 74) return "medio";
  return "alto";
}

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

const EVENTO_PRINCIPAL_WEIGHTS = {
  critico: [
    { value: "tragedia", weight: 50 },
    { value: "fake", weight: 22 },
    { value: "oportunidad", weight: 28 },
  ],
  bajo: [
    { value: "tragedia", weight: 40 },
    { value: "fake", weight: 25 },
    { value: "oportunidad", weight: 35 },
  ],
  medio: [
    { value: "tragedia", weight: 30 },
    { value: "fake", weight: 20 },
    { value: "oportunidad", weight: 50 },
  ],
  alto: [
    { value: "tragedia", weight: 18 },
    { value: "fake", weight: 17 },
    { value: "oportunidad", weight: 65 },
  ],
};

const EVENTO_FLEX_WEIGHTS = {
  critico: [
    { value: "normal", weight: 30 },
    { value: "tragedia", weight: 35 },
    { value: "fake", weight: 25 },
    { value: "oportunidad", weight: 10 },
  ],
  bajo: [
    { value: "normal", weight: 35 },
    { value: "tragedia", weight: 25 },
    { value: "fake", weight: 25 },
    { value: "oportunidad", weight: 15 },
  ],
  medio: [
    { value: "normal", weight: 40 },
    { value: "tragedia", weight: 15 },
    { value: "fake", weight: 20 },
    { value: "oportunidad", weight: 25 },
  ],
  alto: [
    { value: "normal", weight: 40 },
    { value: "tragedia", weight: 8 },
    { value: "fake", weight: 17 },
    { value: "oportunidad", weight: 35 },
  ],
};

const TRAGEDIA_SEVERIDAD_WEIGHTS = {
  critico: [
    { value: "fuerte", weight: 50 },
    { value: "media", weight: 35 },
    { value: "leve", weight: 15 },
  ],
  bajo: [
    { value: "fuerte", weight: 30 },
    { value: "media", weight: 45 },
    { value: "leve", weight: 25 },
  ],
  medio: [
    { value: "fuerte", weight: 15 },
    { value: "media", weight: 45 },
    { value: "leve", weight: 40 },
  ],
  alto: [
    { value: "fuerte", weight: 5 },
    { value: "media", weight: 30 },
    { value: "leve", weight: 65 },
  ],
};

function calcularSeveridadTragedia(card) {
  if (card?.severidad) return card.severidad;
  const opciones = Array.isArray(card?.opciones) ? card.opciones : [];
  let maxScore = 0;
  for (const op of opciones) {
    if (typeof op !== "object" || !op) continue;
    let score = 0;
    if (typeof op.dinero === "number" && op.dinero < 0) score += Math.abs(op.dinero) / 1000;
    if (typeof op.deuda === "number" && op.deuda > 0) score += op.deuda / 1000;
    if (typeof op.salud === "number" && op.salud < 0) score += Math.abs(op.salud) / 5;
    if (typeof op.bienestar === "number" && op.bienestar < 0) score += Math.abs(op.bienestar) / 5;
    if (score > maxScore) maxScore = score;
  }
  if (maxScore <= 3) return "leve";
  if (maxScore <= 7) return "media";
  return "fuerte";
}

function pickTragediaForTier(tier) {
  const sev = pickWeighted(TRAGEDIA_SEVERIDAD_WEIGHTS[tier]);
  const filtered = tragedyCards.filter((c) => calcularSeveridadTragedia(c) === sev);
  const pool = filtered.length ? filtered : tragedyCards;
  const card = rand(pool);
  return { card, sev };
}

let antiEspiralCount = 0;
function aplicarAntiEspiral(principal, mesPrev) {
  if (principal !== "tragedia") return principal;
  if (!mesPrev || (mesPrev.tragedias || 0) < 2) return principal;
  antiEspiralCount += 1;
  return Math.random() < 0.6 ? "oportunidad" : "normal";
}

function generarSecuenciaMes(bienestar, mesContext = {}) {
  const tier = getBienestarTier(bienestar);
  const numNormales = Math.random() < 0.5 ? 2 : 3;

  let principal = pickWeighted(EVENTO_PRINCIPAL_WEIGHTS[tier]);
  principal = aplicarAntiEspiral(principal, mesContext);
  const flex = pickWeighted(EVENTO_FLEX_WEIGHTS[tier]);
  const extra = Math.random() < 0.45 ? pickWeighted(EVENTO_FLEX_WEIGHTS[tier]) : null;

  const eventos = [principal, flex];
  if (extra) eventos.push(extra);

  let tragediaCount = 0;
  const eventosLimitados = eventos.map((e) => {
    if (e === "tragedia") {
      if (tragediaCount >= 2) return Math.random() < 0.5 ? "normal" : "fake";
      tragediaCount += 1;
    }
    return e;
  });

  return {
    numNormales,
    eventos: eventosLimitados,
    tier,
  };
}

function simular(bienestarFijo, meses = 100) {
  antiEspiralCount = 0;
  const counts = {
    normal: 0,
    oportunidad: 0,
    fake: 0,
    trag_leve: 0,
    trag_media: 0,
    trag_fuerte: 0,
    payday: meses,
  };
  const trDistrib = { 0: 0, 1: 0, 2: 0 };
  let totalCartas = 0;
  let mesPrev = { tragedias: 0 };

  for (let m = 0; m < meses; m++) {
    const r = generarSecuenciaMes(bienestarFijo, mesPrev);
    counts.normal += r.numNormales;
    totalCartas += r.numNormales + r.eventos.length + 1;
    let tragsThisMonth = 0;
    for (const e of r.eventos) {
      if (e === "normal") counts.normal += 1;
      else if (e === "oportunidad") counts.oportunidad += 1;
      else if (e === "fake") counts.fake += 1;
      else if (e === "tragedia") {
        const { sev } = pickTragediaForTier(r.tier);
        if (sev === "leve") counts.trag_leve += 1;
        else if (sev === "media") counts.trag_media += 1;
        else counts.trag_fuerte += 1;
        tragsThisMonth += 1;
      }
    }
    trDistrib[tragsThisMonth] = (trDistrib[tragsThisMonth] || 0) + 1;
    mesPrev = { tragedias: tragsThisMonth };
  }
  return {
    counts,
    cartasPorMes: (totalCartas / meses).toFixed(2),
    trDistrib,
    antiEspiral: antiEspiralCount,
  };
}

function report(label, bie, meses = 100) {
  const r = simular(bie, meses);
  const c = r.counts;
  const evtTotal = c.oportunidad + c.fake + c.trag_leve + c.trag_media + c.trag_fuerte;
  const tragTotal = c.trag_leve + c.trag_media + c.trag_fuerte;
  console.log(`\n=== ${label} (bienestar=${bie}, ${meses} meses) ===`);
  console.log(`Promedio cartas por mes: ${r.cartasPorMes}`);
  console.log(`Normales:           ${c.normal}`);
  console.log(`Oportunidades:      ${c.oportunidad}`);
  console.log(`Fake opportunities: ${c.fake}`);
  console.log(`Tragedias leves:    ${c.trag_leve}`);
  console.log(`Tragedias medias:   ${c.trag_media}`);
  console.log(`Tragedias fuertes:  ${c.trag_fuerte}`);
  console.log(`Total tragedias:    ${tragTotal} (${((tragTotal / evtTotal) * 100).toFixed(0)}% de eventos)`);
  console.log(`Paydays:            ${c.payday}`);
  console.log(`Meses con 0 trag:   ${r.trDistrib[0] || 0}`);
  console.log(`Meses con 1 trag:   ${r.trDistrib[1] || 0}`);
  console.log(`Meses con 2 trag:   ${r.trDistrib[2] || 0}`);
  console.log(`Anti-espiral activado: ${r.antiEspiral} veces`);
}

console.log("Cards disponibles:");
console.log("  Tragedias por severidad:");
const sevCount = { leve: 0, media: 0, fuerte: 0 };
for (const c of tragedyCards) sevCount[calcularSeveridadTragedia(c)] += 1;
console.log("    leve:", sevCount.leve, " media:", sevCount.media, " fuerte:", sevCount.fuerte);

// --- Validacion normalCards ---
console.log("  Cartas normales:");
const normTotal = normalCards.length;
let normConEfecto = 0;
let normSinEfecto = 0;
const rng = (key) => {
  let mn = Infinity, mx = -Infinity;
  for (const c of normalCards) {
    if (typeof c[key] === "number") {
      if (c[key] < mn) mn = c[key];
      if (c[key] > mx) mx = c[key];
    }
  }
  return { min: mn === Infinity ? 0 : mn, max: mx === -Infinity ? 0 : mx };
};
for (const c of normalCards) {
  const tiene =
    typeof c.dinero === "number" ||
    typeof c.salud === "number" ||
    typeof c.bienestar === "number" ||
    typeof c.deuda === "number";
  if (tiene) normConEfecto += 1;
  else normSinEfecto += 1;
}
console.log(`    total: ${normTotal}`);
console.log(`    con efecto: ${normConEfecto} (${((normConEfecto / normTotal) * 100).toFixed(0)}%)`);
console.log(`    sin efecto: ${normSinEfecto} (${((normSinEfecto / normTotal) * 100).toFixed(0)}%)`);
const rd = rng("dinero"), rs = rng("salud"), rb = rng("bienestar"), rde = rng("deuda");
console.log(`    rango dinero: ${rd.min} a ${rd.max}`);
console.log(`    rango salud: ${rs.min} a ${rs.max}`);
console.log(`    rango bienestar: ${rb.min} a ${rb.max}`);
console.log(`    rango deuda: ${rde.min} a ${rde.max}`);
const exagerados = normalCards.filter(
  (c) =>
    (typeof c.dinero === "number" && Math.abs(c.dinero) > 500) ||
    (typeof c.salud === "number" && Math.abs(c.salud) > 3) ||
    (typeof c.bienestar === "number" && Math.abs(c.bienestar) > 5) ||
    (typeof c.deuda === "number" && Math.abs(c.deuda) > 500)
);
console.log(`    efectos exagerados (fuera de spec): ${exagerados.length}`);
console.log("  Fakes con opcion bienestar positivo:");
const fakesConPositiva = fakeOpportunityCards.filter((c) =>
  (c.opciones || []).some((op) => typeof op?.bienestar === "number" && op.bienestar > 0)
);
console.log("    " + fakesConPositiva.length + " / " + fakeOpportunityCards.length);

report("BIENESTAR BAJO", 20, 100);
report("BIENESTAR MEDIO", 50, 100);
report("BIENESTAR ALTO", 85, 100);
