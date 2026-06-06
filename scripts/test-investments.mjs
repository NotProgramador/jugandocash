// Regresion de inversiones. Mirror del flujo de gameStore.
// Uso: node scripts/test-investments.mjs

function aplicarInversion({ costo, delta, dineroInicial = 10000, netoInicial = 0 }) {
  // Mirror de agendarInversion: descontar costo
  let dinero = dineroInicial - costo;
  // Mirror de tomarResultadosInversion: retorno = max(0, costo+delta)
  const retorno = Math.max(0, costo + delta);
  // Mirror de aplicarInvResults: dinero += retorno; stats.inversionesNeto += delta
  // Bug original: neto += delta (sin cap). Real: la perdida no puede exceder costo.
  // FIX: neto += max(delta, -costo)
  dinero += retorno;
  const netoUncapped = netoInicial + delta;
  const netoCapped = netoInicial + Math.max(delta, -costo);
  return { dineroFinal: dinero, retorno, netoUncapped, netoCapped };
}

const casos = [
  { label: "A", costo: 3000, delta: -750, retornoEsp: 2250, netoEsp: -750 },
  { label: "B", costo: 500,  delta: 20,   retornoEsp: 520,  netoEsp: 20 },
  { label: "C", costo: 1000, delta: 0,    retornoEsp: 1000, netoEsp: 0 },
  { label: "D", costo: 1000, delta: -2000, retornoEsp: 0,   netoEsp: -1000 }, // capeado
];

let fallas = 0;
for (const c of casos) {
  const r = aplicarInversion({ costo: c.costo, delta: c.delta });
  const retornoOk = r.retorno === c.retornoEsp;
  // Para A,B,C el cap no cambia. Para D, el cap fija real P&L a -1000.
  const netoOk = r.netoCapped === c.netoEsp;
  const status = retornoOk && netoOk ? "OK" : "FAIL";
  if (!retornoOk || !netoOk) fallas += 1;
  console.log(
    `Caso ${c.label}: costo=${c.costo} delta=${c.delta} | ` +
      `retorno=${r.retorno} (esperado ${c.retornoEsp}) ${retornoOk ? "✓" : "✗"} | ` +
      `neto_capped=${r.netoCapped} (esperado ${c.netoEsp}) ${netoOk ? "✓" : "✗"} | ` +
      `neto_uncapped=${r.netoUncapped} | ${status}`
  );
}

if (fallas === 0) {
  console.log("\nTODOS LOS CASOS PASAN con el fix (cap de neto a -costo).");
} else {
  console.log(`\nFALLARON ${fallas} casos.`);
  process.exit(1);
}
