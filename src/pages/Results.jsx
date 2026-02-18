import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

function mxn(n) {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function evaluarNivel({
  dinero,
  deuda,
  salud,
  sueldo,
  suenosCumplidos,
  suenosTotal,
  deudaInicial,
  dineroInicial,
  stats, // <- NUEVO
}) {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // --- Scores 0..1 (prioridad: salud > dinero > sueños > inversión > deuda) ---
  const healthScore = clamp(Number(salud || 0) / 100, 0, 1);

  // Dinero: objetivo = 3x sueldo (si no hay sueldo, usa 1.5x dinero inicial)
  const targetMoney = sueldo > 0 ? sueldo * 3 : Math.max(1, Number(dineroInicial || 0) * 1.5);
  const moneyScore = clamp(Number(dinero || 0) / targetMoney, 0, 1);

  const dreamsScore =
    suenosTotal > 0 ? clamp(suenosCumplidos / suenosTotal, 0, 1) : 0;

  // Inversión: mezcla “participación” + “resultado neto”
  const invCount = Number(stats?.inversionesCount || 0);
  const invNeto = Number(stats?.inversionesNeto || 0);
  const invParticipacion = clamp(invCount / 6, 0, 1); // ~6 inversiones esperables en 24m
  const invNetoNorm = clamp(invNeto / Math.max(1, sueldo || 1), -1, 1); // -1..1
  const invNetoScore = (invNetoNorm + 1) / 2; // 0..1
  const investScore = clamp(invParticipacion * 0.5 + invNetoScore * 0.5, 0, 1);

  // Deuda: deuda 0 = perfecto; si bajó vs inicial, sube score
  const di = Math.max(1, Number(deudaInicial || 0));
  const debtScore =
    Number(deuda || 0) <= 0 ? 1 : clamp((di - Number(deuda || 0)) / di, 0, 1);

  // --- Pesos (100 pts) ---
  // Salud primero, dinero segundo, luego sueños, inversión, deuda
  const puntos =
    healthScore * 40 +
    moneyScore * 25 +
    dreamsScore * 20 +
    investScore * 10 +
    debtScore * 5;

  // Ahorro sólido (mantengo tu lógica, pero alineada al dineroScore)
  const ahorroOk = moneyScore >= 1; // equivale a cumplir 3x sueldo (o 1.5x inicial si no hay sueldo)

  // TOP SECRET: más exigente (salud perfecta + deuda 0 + 3 sueños + ahorro sólido + inversión neta >= 0)
  const topSecret =
    Number(deuda || 0) === 0 &&
    Number(salud || 0) === 100 &&
    suenosCumplidos >= 3 &&
    ahorroOk &&
    invNeto >= 0;

  // --- Nivel por puntos ---
  let nivel = 1;
  let titulo = "Sobreviviste";
  let descripcion =
    "Agarraste el volante como pudiste. Sobrevivir también cuenta, pero aquí toca ajustar.";

  if (puntos >= 80) {
    nivel = 5;
    titulo = "Camino a la libertad financiera";
    descripcion =
      "Estás jugando con estructura: salud cuidada, dinero con intención, sueños con dirección.";
  } else if (puntos >= 65) {
    nivel = 4;
    titulo = "Vivir no está tan difícil";
    descripcion =
      "Buen control. Todavía hay puntos ciegos, pero ya tienes un sistema.";
  } else if (puntos >= 50) {
    nivel = 3;
    titulo = "Nada mal";
    descripcion =
      "Se nota el progreso. Con dos ajustes (salud/deuda/sueños) te disparas.";
  } else if (puntos >= 35) {
    nivel = 2;
    titulo = "La vida fue difícil";
    descripcion =
      "Se sintió pesado. No es el fin: es información para mejorar tu estrategia.";
  }

  // --- CANDADOS por salud (clave) ---
  const s = Number(salud || 0);
  if (s < 35) {
    // salud en modo peligro: máximo nivel 2
    if (nivel > 2) nivel = 2;
  } else if (s < 45) {
    // salud baja: máximo nivel 3
    if (nivel > 3) nivel = 3;
  } else if (s < 60) {
    // salud media-baja: NO permite nivel 5
    if (nivel > 4) nivel = 4;
  }

  // Reaplica títulos/desc después de candados (para que coincida)
  if (nivel === 5) {
    titulo = "Camino a la libertad financiera";
    descripcion =
      "Estás jugando con estructura: salud cuidada, dinero con intención, sueños con dirección.";
  }
  if (nivel === 4) {
    titulo = "Vivir no está tan difícil";
    descripcion =
      "Buen control. Todavía hay puntos ciegos, pero ya tienes un sistema.";
  }
  if (nivel === 3) {
    titulo = "Nada mal";
    descripcion =
      "Se nota el progreso. Con dos ajustes (salud/deuda/sueños) te disparas.";
  }
  if (nivel === 2) {
    titulo = "La vida fue difícil";
    descripcion =
      "Se sintió pesado. No es el fin: es información para mejorar tu estrategia.";
  }
  if (nivel === 1) {
    titulo = "Sobreviviste";
    descripcion =
      "Agarraste el volante como pudiste. Sobrevivir también cuenta, pero aquí toca ajustar.";
  }

  // Mensaje extra si hay dinero alto pero salud baja (tu caso exacto)
  if (moneyScore >= 0.9 && s < 45) {
    descripcion += " Ojo: hiciste dinero, pero te estás rompiendo por dentro.";
  }

  return { nivel, titulo, descripcion, topSecret, puntos: Math.round(puntos), ahorroOk };
}


export default function Results() {
  const navigate = useNavigate();

  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const sueldo = useGameStore((s) => s.sueldo);
  const suenos = useGameStore((s) => s.sueños || []);
  const baseline = useGameStore((s) => s.baseline);
  const meta = useGameStore((s) => s.meta);
  const stats = useGameStore((s) => s.stats);
  const reiniciar = useGameStore((s) => s.reiniciar);

  const suenosCumplidos = useMemo(
    () => suenos.filter((x) => x?.cumplido).length,
    [suenos]
  );

  const suenosTotal = suenos.length;

  const perdidaPorSalud = salud <= 0 || meta?.finMotivo === "salud";
  const perdidaPorDinero = dinero <= 0 || meta?.finMotivo === "dinero";

  const evaluacion = useMemo(
    () =>
      evaluarNivel({
        dinero,
        deuda,
        salud,
        sueldo,
        suenosCumplidos,
        suenosTotal,
        deudaInicial: baseline?.deudaInicial ?? 0,
        dineroInicial: baseline?.dineroInicial ?? 0,
        stats,
      }),
    [dinero, deuda, salud, sueldo, suenosCumplidos, suenosTotal, baseline]
  );

  const motivo = useMemo(() => {
    if (perdidaPorSalud) return "Perdiste por salud: te quedaste sin vida.";
    if (perdidaPorDinero) return "Bancarrota: te quedaste sin dinero.";
    if (meta?.finMotivo === "tiempo") return "Terminaste el periodo del juego.";
    if (meta?.finMotivo === "checkpoint_24") return "Cerraste en el mes 24.";
    return "Resumen de tu partida.";
  }, [perdidaPorSalud, perdidaPorDinero, meta]);

  const resetAndPlay = () => {
    reiniciar();
    navigate("/juego");
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold">Resultados</h2>
          <p className="opacity-70 mt-1">{motivo}</p>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Dinero final</div>
              <div className="text-lg font-bold">{mxn(dinero)}</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Deuda final</div>
              <div className="text-lg font-bold">{mxn(deuda)}</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Salud</div>
              <div className="text-lg font-bold">{Math.round(salud)}%</div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs opacity-70">Nivel</div>
                <div className="text-xl font-extrabold">
                  {evaluacion.nivel}. {evaluacion.titulo}
                </div>
              </div>
              <div className="text-sm opacity-70">
                Puntos: <span className="font-bold">{evaluacion.puntos}</span>
              </div>
            </div>
            <p className="mt-2 opacity-80">{evaluacion.descripcion}</p>

            {evaluacion.topSecret ? (
              <div className="mt-4 p-4 rounded-lg border bg-black text-white">
                <div className="font-extrabold">TOP SECRET: Libertad financiera</div>
                <p className="text-sm opacity-80 mt-1">
                  Deuda en cero, salud al 100, 3 sueños cumplidos y un ahorro sólido.
                  Esto ya no es suerte: es diseño de vida.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">Sueños</h3>
          <p className="opacity-70 text-sm">
            Cumplidos: <span className="font-bold">{suenosCumplidos}</span> / {suenosTotal}
          </p>

          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {(suenos || []).map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded border ${
                  s?.cumplido ? "opacity-70 line-through" : ""
                }`}
              >
                <div className="font-semibold">{s?.nombre}</div>
                <div className="text-sm opacity-70">Costo: {mxn(s?.costo)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">Lo que este juego enseña (en corto)</h3>
          <ul className="list-disc pl-5 mt-2 space-y-1 opacity-85">
            <li><b>Cumplir sueños</b> da sentido. Si todo es “pagar”, te apagas.</li>
            <li><b>La deuda</b> estresa y frena oportunidades: pagas intereses y pierdes margen.</li>
            <li><b>La salud</b> es la base: de nada sirve el dinero si no puedes vivirlo.</li>
            <li><b>El dinero</b> es el juego de la vida: aprenderlo no es lujo, es supervivencia.</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">Estadísticas (para tu espejo)</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Pagos a deuda</div>
              <div className="font-bold">
                {mxn(stats?.pagosDeudaTotal)}{" "}
                <span className="opacity-70 text-sm">({stats?.pagosDeudaCount} veces)</span>
              </div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Pago mínimo total</div>
              <div className="font-bold">
                {mxn(stats?.pagosMinimoTotal)}{" "}
                <span className="opacity-70 text-sm">({stats?.pagosMinimoCount} meses)</span>
              </div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Interés acumulado</div>
              <div className="font-bold">{mxn(stats?.interesTotal)}</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Inversiones</div>
              <div className="font-bold">
                {stats?.inversionesCount}{" "}
                <span className="opacity-70 text-sm">
                  • invertido {mxn(stats?.inversionesTotalInvertido)} • neto {mxn(stats?.inversionesNeto)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Salud ganada / perdida</div>
              <div className="font-bold">
                +{Math.round(stats?.saludGanada || 0)} / -{Math.round(stats?.saludPerdida || 0)}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded border">
            <div className="font-semibold">Checklist</div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
              <div>✅ Salud &gt; 0: {salud > 0 ? "sí" : "no"}</div>
              <div>✅ Dinero &gt; 0: {dinero > 0 ? "sí" : "no"}</div>
              <div>✅ Deuda = 0: {deuda === 0 ? "sí" : "no"}</div>
              <div>✅ Sueños: {suenosCumplidos} / {suenosTotal}</div>
              <div>✅ Ahorro sólido: {evaluacion.ahorroOk ? "sí" : "aún no"}</div>
              <div>🧭 Objetivo: aprender y ajustar</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pb-10">
          <button className="px-4 py-2 rounded border" onClick={() => navigate("/")}>
            Ir al inicio
          </button>
          <button className="px-4 py-2 rounded border" onClick={resetAndPlay}>
            Jugar otra vez
          </button>
        </div>
      </div>
    </div>
  );
}
