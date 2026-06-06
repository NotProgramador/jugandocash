import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

function mxn(n) {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function evaluarNivel({
  dinero,
  deuda,
  salud,
  bienestar,
  sueldo,
  suenosCumplidos,
  suenosTotal,
  deudaInicial,
  dineroInicial,
  stats,
  finMotivo,
}) {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const healthScore = clamp(Number(salud || 0) / 100, 0, 1);
  const wellbeingScore = clamp(Number(bienestar || 0) / 100, 0, 1);

  const targetMoney =
    sueldo > 0 ? sueldo * 3 : Math.max(1, Number(dineroInicial || 0) * 1.5);
  const moneyScore = clamp(Number(dinero || 0) / targetMoney, 0, 1);

  const dreamsScore =
    suenosTotal > 0 ? clamp(suenosCumplidos / suenosTotal, 0, 1) : 0;

  const invCount = Number(stats?.inversionesCount || 0);
  const invNeto = Number(stats?.inversionesNeto || 0); // ganancia/pérdida real
  // Premia solo inversiones rentables. Recuperar capital no suma.
  const invParticipacion = clamp(invCount / 6, 0, 1);
  const invNetoNorm = clamp(invNeto / Math.max(1, sueldo || 1), -1, 1);
  const invNetoScore = (invNetoNorm + 1) / 2; // 0..1
  // Si neto <= 0, la participación ya no premia tanto:
  const investScore =
    invNeto > 0
      ? clamp(invParticipacion * 0.4 + invNetoScore * 0.6, 0, 1)
      : clamp(invNetoScore, 0, 1);

  const di = Math.max(1, Number(deudaInicial || 0));
  const debtScore =
    Number(deuda || 0) <= 0
      ? 1
      : clamp((di - Number(deuda || 0)) / di, 0, 1);

  // Pesos: salud 35 + dinero 22 + sueños 18 + inversión 10 + deuda 5 + bienestar 10 = 100
  const puntos =
    healthScore * 35 +
    moneyScore * 22 +
    dreamsScore * 18 +
    investScore * 10 +
    debtScore * 5 +
    wellbeingScore * 10;

  const ahorroOk = moneyScore >= 1;

  const topSecret =
    Number(deuda || 0) === 0 &&
    Number(salud || 0) === 100 &&
    Number(bienestar || 0) >= 80 &&
    suenosCumplidos >= 3 &&
    ahorroOk &&
    invNeto >= 0;

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

  const s = Number(salud || 0);
  if (s < 35 && nivel > 2) nivel = 2;
  else if (s < 45 && nivel > 3) nivel = 3;
  else if (s < 60 && nivel > 4) nivel = 4;

  const nivelTitulos = {
    5: [
      "Camino a la libertad financiera",
      "Estás jugando con estructura: salud cuidada, dinero con intención, sueños con dirección.",
    ],
    4: [
      "Vivir no está tan difícil",
      "Buen control. Todavía hay puntos ciegos, pero ya tienes un sistema.",
    ],
    3: [
      "Nada mal",
      "Se nota el progreso. Con dos ajustes (salud/deuda/sueños) te disparas.",
    ],
    2: [
      "La vida fue difícil",
      "Se sintió pesado. No es el fin: es información para mejorar tu estrategia.",
    ],
    1: [
      "Sobreviviste",
      "Agarraste el volante como pudiste. Sobrevivir también cuenta, pero aquí toca ajustar.",
    ],
  };

  const [t, d] = nivelTitulos[nivel] || nivelTitulos[1];
  titulo = t;
  descripcion = d;

  if (moneyScore >= 0.9 && s < 45) {
    descripcion += " Ojo: hiciste dinero, pero te estás rompiendo por dentro.";
  }

  const b = Number(bienestar || 0);
  if (b < 25) {
    descripcion += " Tu bienestar está en mínimos: estás quemado.";
  } else if (b >= 80) {
    descripcion += " Y lo más valioso: vives bien, no solo sobrevives.";
  }

  // --- Narrativa con prioridad (cap 4) ---
  const deudaActual = Number(deuda || 0);
  const candidatas = [];

  // P1: motivo de fin domina
  if (finMotivo === "salud" || s <= 0) {
    candidatas.push({
      p: 100,
      t: "Tu cuerpo dijo basta antes que tu cartera. La salud es el activo más caro de reponer.",
    });
  } else if (finMotivo === "dinero" || (Number(dinero || 0) <= 0 && deudaActual > 0)) {
    candidatas.push({
      p: 100,
      t: "Te quedaste sin liquidez con la deuda viva. El primer error fue dejar que los intereses jugaran de local.",
    });
  }

  // P2: estados criticos finales (no contradictorios con P1)
  if (finMotivo !== "salud" && s > 0 && s < 25) {
    candidatas.push({ p: 80, t: "Tu salud quedó en zona roja: cualquier mes más y se cae el castillo." });
  }
  if (finMotivo !== "dinero" && deudaActual >= di * 1.5) {
    candidatas.push({ p: 78, t: "La deuda creció más rápido que tu margen: estás trabajando para los intereses." });
  }

  // P3: suenos cumplidos
  if (suenosCumplidos >= 3) {
    candidatas.push({ p: 70, t: "No solo sobreviviste: construiste algo y tachaste sueños." });
  } else if (suenosCumplidos >= 1 && deudaActual <= di) {
    candidatas.push({ p: 60, t: "Cumpliste sueños sin que la deuda se desbordara. Eso es disciplina." });
  }

  // P4: bienestar extremo
  if (b >= 85 && s >= 70) {
    candidatas.push({ p: 55, t: "Mantuviste la cabeza fría: prudencia con resultados." });
  } else if (b < 25 && finMotivo !== "salud") {
    candidatas.push({ p: 55, t: "Tu bienestar quedó quemado: el dinero no alcanzó para reponer la paz mental." });
  }

  // P5: inversiones
  if (invCount >= 4 && invNeto > 0) {
    candidatas.push({ p: 45, t: "Tu portafolio sí trabajó, no como tu compa del proyecto en equipo." });
  } else if (invCount >= 3 && invNeto < 0) {
    candidatas.push({ p: 42, t: "Probaste el mercado y te ensenó humildad: la mayoría de las apuestas no devolvieron." });
  }

  // P6: cierres humoristicos contextuales
  if (!candidatas.some((c) => c.p >= 80)) {
    if (moneyScore >= 0.8 && b < 35) {
      candidatas.push({ p: 35, t: "Ganaste dinero, pero tu paz mental quedó en modo licuadora." });
    } else if (moneyScore < 0.4 && b >= 70) {
      candidatas.push({ p: 35, t: "No eres millonario, pero duermes como bebé sin notificaciones del banco." });
    }
  }

  const narrativa = candidatas
    .sort((a, b) => b.p - a.p)
    .slice(0, 4)
    .map((c) => c.t);

  return {
    nivel,
    titulo,
    descripcion,
    narrativa,
    topSecret,
    puntos: Math.round(puntos),
    ahorroOk,
  };
}

export default function Results() {
  const navigate = useNavigate();

  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const bienestar = useGameStore((s) => s.bienestar);
  const sueldo = useGameStore((s) => s.sueldo);
  const suenos = useGameStore((s) => s.sueños || []);
  const baseline = useGameStore((s) => s.baseline);
  const meta = useGameStore((s) => s.meta);
  const stats = useGameStore((s) => s.stats);
  const reiniciar = useGameStore((s) => s.reiniciar);

  const partidaIniciada =
    meta?.personajeNombre || meta?.terminado || sueldo > 0;

  const suenosCumplidos = useMemo(
    () => suenos.filter((x) => x?.cumplido).length,
    [suenos]
  );
  const suenosTotal = suenos.length;

  const finMotivo = meta?.finMotivo;

  const evaluacion = useMemo(
    () =>
      evaluarNivel({
        dinero,
        deuda,
        salud,
        bienestar,
        sueldo,
        suenosCumplidos,
        suenosTotal,
        deudaInicial: baseline?.deudaInicial ?? 0,
        dineroInicial: baseline?.dineroInicial ?? 0,
        stats,
        finMotivo: meta?.finMotivo,
      }),
    [dinero, deuda, salud, bienestar, sueldo, suenosCumplidos, suenosTotal, baseline, stats, meta]
  );

  const motivo = useMemo(() => {
    if (finMotivo === "salud")
      return "Perdiste por salud: te quedaste sin vida.";
    if (finMotivo === "dinero")
      return "Bancarrota: te quedaste sin dinero.";
    if (finMotivo === "tiempo")
      return "Terminaste el periodo del juego.";
    if (finMotivo === "checkpoint_24")
      return "Cerraste en el mes 24.";
    if (salud <= 0) return "Perdiste por salud: te quedaste sin vida.";
    if (dinero <= 0 && deuda > 0) return "Bancarrota: te quedaste sin dinero.";
    return "Resumen de tu partida.";
  }, [finMotivo, salud, dinero, deuda]);

  const resetAndPlay = () => {
    reiniciar();
    navigate("/juego");
  };

  if (!partidaIniciada) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Sin partida iniciada</h2>
          <p className="text-gray-600 mb-6">
            Todavía no has jugado una partida. ¡Empieza una para ver tus
            resultados!
          </p>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => navigate("/juego")}
          >
            Ir a jugar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold">Resultados</h2>
          {meta?.personajeNombre && (
            <p className="text-sm text-gray-500">
              Personaje: {meta.personajeNombre} — Mes{" "}
              {meta?.mesActual || "?"} / {meta?.mesesObjetivo || 24}
            </p>
          )}
          <p className="opacity-70 mt-1">{motivo}</p>

          <div className="grid sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Dinero final</div>
              <div className="text-lg font-bold text-green-700">
                {mxn(dinero)}
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Deuda final</div>
              <div className="text-lg font-bold text-red-700">
                {mxn(deuda)}
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Salud</div>
              <div className="text-lg font-bold text-blue-700">
                {Math.round(salud)}%
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Bienestar</div>
              <div className="text-lg font-bold text-emerald-700">
                {Math.round(bienestar)}%
              </div>
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
                Puntos:{" "}
                <span className="font-bold">{evaluacion.puntos}</span>
              </div>
            </div>
            <p className="mt-2 opacity-80">{evaluacion.descripcion}</p>

            {Array.isArray(evaluacion.narrativa) &&
              evaluacion.narrativa.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm opacity-80 list-disc pl-5">
                  {evaluacion.narrativa.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}

            {evaluacion.topSecret && (
              <div className="mt-4 p-4 rounded-lg border bg-black text-white">
                <div className="font-extrabold">
                  TOP SECRET: Libertad financiera
                </div>
                <p className="text-sm opacity-80 mt-1">
                  Deuda en cero, salud al 100, 3+ sueños cumplidos y un ahorro
                  sólido. Esto ya no es suerte: es diseño de vida.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">Sueños</h3>
          <p className="opacity-70 text-sm">
            Cumplidos:{" "}
            <span className="font-bold">{suenosCumplidos}</span> /{" "}
            {suenosTotal}
          </p>

          {suenosTotal === 0 ? (
            <p className="mt-3 text-gray-400 text-sm">
              Este personaje no tenía sueños asignados.
            </p>
          ) : (
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {suenos.map((s, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    s?.cumplido
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`font-semibold ${
                      s?.cumplido ? "line-through text-green-600" : ""
                    }`}
                  >
                    {s?.nombre}
                  </div>
                  <div className="text-sm opacity-70">
                    Costo: {mxn(s?.costo)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">
            Lo que este juego enseña (en corto)
          </h3>
          <ul className="list-disc pl-5 mt-2 space-y-1 opacity-85">
            <li>
              <b>Cumplir sueños</b> da sentido. Si todo es "pagar", te apagas.
            </li>
            <li>
              <b>La deuda</b> estresa y frena oportunidades: pagas intereses y
              pierdes margen.
            </li>
            <li>
              <b>La salud</b> es la base: de nada sirve el dinero si no puedes
              vivirlo.
            </li>
            <li>
              <b>El dinero</b> es el juego de la vida: aprenderlo no es lujo, es
              supervivencia.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold">Estadísticas</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Pagos a deuda</div>
              <div className="font-bold">
                {mxn(stats?.pagosDeudaTotal)}{" "}
                <span className="opacity-70 text-sm">
                  ({stats?.pagosDeudaCount || 0} veces)
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Pago mínimo total</div>
              <div className="font-bold">
                {mxn(stats?.pagosMinimoTotal)}{" "}
                <span className="opacity-70 text-sm">
                  ({stats?.pagosMinimoCount || 0} meses)
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Interés acumulado</div>
              <div className="font-bold">{mxn(stats?.interesTotal)}</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Inversiones</div>
              <div className="font-bold">
                {stats?.inversionesCount || 0}{" "}
                <span className="opacity-70 text-sm">
                  — invertido {mxn(stats?.inversionesTotalInvertido)} — neto{" "}
                  {mxn(stats?.inversionesNeto)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs opacity-70">Salud ganada / perdida</div>
              <div className="font-bold">
                +{Math.round(stats?.saludGanada || 0)} / -
                {Math.round(stats?.saludPerdida || 0)}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border">
            <div className="font-semibold">Checklist</div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
              <div>{salud > 0 ? "✅" : "❌"} Salud &gt; 0</div>
              <div>{dinero > 0 ? "✅" : "❌"} Dinero &gt; 0</div>
              <div>{deuda === 0 ? "✅" : "❌"} Deuda = 0</div>
              <div>
                {suenosCumplidos > 0 ? "✅" : "❌"} Sueños:{" "}
                {suenosCumplidos} / {suenosTotal}
              </div>
              <div>
                {evaluacion.ahorroOk ? "✅" : "❌"} Ahorro sólido
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pb-10">
          <button
            className="px-5 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
            onClick={() => navigate("/")}
          >
            Ir al inicio
          </button>
          <button
            className="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={resetAndPlay}
          >
            Jugar otra vez
          </button>
        </div>
      </div>
    </div>
  );
}
