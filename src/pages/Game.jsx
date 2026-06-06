import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import personajes from "../data/personajes.json";
import normalCards from "../data/normalCards.json";
import opportunityCards from "../data/opportunityCards.json";
import tragedyCards from "../data/tragedyCards.json";
import paydayCards from "../data/paydayCards.json";
import fakeOpportunityCards from "../data/fakeOpportunityCards.json";

import TarjetaPersonaje from "../components/game/TarjetaPersonaje";
import Cartera from "../components/game/Cartera";

import CardNormal from "../components/cards/CardNormal";
import CardOportunidad from "../components/cards/CardOportunidad";
import CardTragedia from "../components/cards/CardTragedia";
import CardPayDay from "../components/cards/CardPayDay";
import CardPortafolioReview from "../components/cards/CardPortafolioReview";
import CardSaludEspecial from "../components/cards/CardSaludEspecial";
import CardFakeOpportunity from "../components/cards/CardFakeOpportunity";

import ModalSimple from "../components/ui/ModalSimple";
import { useGameStore } from "../store/gameStore";

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function normCard(c) {
  if (typeof c === "string") return { texto: c };
  return c || { texto: "..." };
}
function wrap(kind, card) {
  return { ...card, __kind: kind };
}

// --- Lógica de generación mensual dinámica ---

function getBienestarTier(bienestar) {
  const b = Number(bienestar || 0);
  if (b <= 24) return "critico";
  if (b <= 49) return "bajo";
  if (b <= 74) return "medio";
  return "alto";
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

const EVENTO_PRINCIPAL_WEIGHTS = {
  // Ajustado: critico baja tragedia 55->50 y sube oportunidad 20->28 para dar
  // mas salidas al jugador atrapado en espiral negativa.
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
    if (typeof op.dinero === "number" && op.dinero < 0) {
      score += Math.abs(op.dinero) / 1000;
    }
    if (typeof op.deuda === "number" && op.deuda > 0) {
      score += op.deuda / 1000;
    }
    if (typeof op.salud === "number" && op.salud < 0) {
      score += Math.abs(op.salud) / 5;
    }
    if (typeof op.bienestar === "number" && op.bienestar < 0) {
      score += Math.abs(op.bienestar) / 5;
    }
    if (score > maxScore) maxScore = score;
  }
  if (maxScore <= 3) return "leve";
  if (maxScore <= 7) return "media";
  return "fuerte";
}

function pickTragediaForTier(tier) {
  const sev = pickWeighted(TRAGEDIA_SEVERIDAD_WEIGHTS[tier]);
  const filtered = tragedyCards.filter(
    (c) => calcularSeveridadTragedia(c) === sev
  );
  const pool = filtered.length > 0 ? filtered : tragedyCards;
  return rand(pool);
}

function eventoToCarta(type, tier) {
  if (type === "tragedia") return wrap("tragedia", pickTragediaForTier(tier));
  if (type === "fake") return wrap("fake", rand(fakeOpportunityCards));
  if (type === "oportunidad") return wrap("oportunidad", rand(opportunityCards));
  return wrap("normal", normCard(rand(normalCards)));
}

// Anti-espiral: si el mes anterior tuvo >=2 tragedias, el principal de este mes
// no debe ser tragedia. Si saliera tragedia, se convierte a oportunidad (60%) o normal (40%).
function aplicarAntiEspiral(principal, mesPrev) {
  if (principal !== "tragedia") return principal;
  if (!mesPrev || (mesPrev.tragedias || 0) < 2) return principal;
  return Math.random() < 0.6 ? "oportunidad" : "normal";
}

function generarSecuenciaMes(bienestar, mesPrev = {}) {
  const tier = getBienestarTier(bienestar);

  // 2 o 3 cartas normales (50/50)
  const numNormales = Math.random() < 0.5 ? 2 : 3;
  const normales = Array.from({ length: numNormales }, () =>
    wrap("normal", normCard(rand(normalCards)))
  );

  // Eventos: 1 principal + 1 flexible + (0 o 1 extra)
  let principal = pickWeighted(EVENTO_PRINCIPAL_WEIGHTS[tier]);
  principal = aplicarAntiEspiral(principal, mesPrev);
  const flex = pickWeighted(EVENTO_FLEX_WEIGHTS[tier]);
  const extra =
    Math.random() < 0.45 ? pickWeighted(EVENTO_FLEX_WEIGHTS[tier]) : null;

  const eventos = [principal, flex];
  if (extra) eventos.push(extra);

  // Limitar a máximo 2 tragedias por mes
  let tragediaCount = 0;
  const eventosLimitados = eventos.map((e) => {
    if (e === "tragedia") {
      if (tragediaCount >= 2) {
        return Math.random() < 0.5 ? "normal" : "fake";
      }
      tragediaCount += 1;
    }
    return e;
  });

  const cartasEvento = eventosLimitados.map((t) => eventoToCarta(t, tier));

  // Mezclar normales + eventos antes del payday
  const todas = [...normales, ...cartasEvento].sort(
    () => Math.random() - 0.5
  );

  const payday = wrap("payday", rand(paydayCards));
  return {
    deck: [...todas, payday],
    tragediasMes: tragediaCount,
  };
}

export default function Game() {
  const navigate = useNavigate();

  const [personaje, setPersonaje] = useState(rand(personajes));
  const [intentos, setIntentos] = useState(1);
  const [confirmado, setConfirmado] = useState(false);

  const [mes, setMes] = useState(1);
  const [maxMeses, setMaxMeses] = useState(24);
  const [tarjetas, setTarjetas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [resumen, setResumen] = useState("");

  const [overlay, setOverlay] = useState(null);
  const [endReason, setEndReason] = useState("");

  const setValoresIniciales = useGameStore((s) => s.setValoresIniciales);
  const reiniciar = useGameStore((s) => s.reiniciar);
  const setFinJuego = useGameStore((s) => s.setFinJuego);
  const setMesesObjetivo = useGameStore((s) => s.setMesesObjetivo);
  const pagarSueldoMensual = useGameStore((s) => s.pagarSueldoMensual);

  const sueldo = useGameStore((s) => s.sueldo);

  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const actualizarBienestar = useGameStore((s) => s.actualizarBienestar);

  const pagarDeuda = useGameStore((s) => s.pagarDeuda);
  const cobrarPagoMinimo = useGameStore((s) => s.cobrarPagoMinimo);
  const aplicarInteres = useGameStore((s) => s.aplicarInteres);

  const agendarInversion = useGameStore((s) => s.agendarInversion);

  const tomarResultadosInversion = useGameStore(
    (s) => s.tomarResultadosInversion
  );
  const invResults = useGameStore((s) => s.invResults || []);

  // Restore from persisted state if game was in progress
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const state = useGameStore.getState();
    if (
      state.meta?.personajeNombre &&
      !state.meta?.terminado &&
      state.sueldo > 0
    ) {
      setConfirmado(true);
      setMes(state.meta.mesActual || 1);
      setMaxMeses(state.meta.mesesObjetivo || 24);
    }
  }, []);

  const saludThresholdRef = useRef(60);
  const saludCooldownRef = useRef(false);
  // Anti-espiral: cuantas tragedias hubo en el mes anterior
  const tragediasMesPrevRef = useRef(0);

  const CARD_SALUD_60 = {
    __kind: "salud",
    titulo: "Te has descuidado",
    texto:
      "Vas bajando sin darte cuenta. Si no haces algo, tu energía (y tus decisiones) se van a ir al suelo.",
    opciones: [
      {
        texto: "Ir al médico y tomar vitaminas",
        descripcion: "Sube mucha salud, cuesta más.",
        cost: 2200,
        saludDelta: 30,
      },
      {
        texto: "Remedios caseros",
        descripcion: "Subes un poco, cuesta menos.",
        cost: 800,
        saludDelta: 15,
      },
      {
        texto: "Para morir nacimos",
        descripcion: "Te haces el fuerte... pero te pega.",
        cost: 0,
        saludDelta: -10,
      },
    ],
  };

  const CARD_SALUD_20 = {
    __kind: "salud",
    titulo: "Urgencias",
    texto:
      "Ya no es juego. Estás en zona roja. Decide rápido: si no te atiendes, te vas a cero.",
    opciones: [
      {
        texto: "Ir a urgencias",
        descripcion: "Caro, pero te estabiliza a 50% de salud.",
        cost: 4500,
        saludTo: 50,
      },
      {
        texto: "Farmacia local",
        descripcion: "Más barato, mejora poco.",
        cost: 1200,
        saludDelta: 12,
      },
      {
        texto: "No todo se puede en la vida...",
        descripcion: "Azar: o no pasa nada o pierdes más salud.",
        cost: 0,
        randomHealth: [0, -10],
      },
    ],
  };

  const nuevoUmbralSalud = () => 40 + Math.floor(Math.random() * 21);

  const checkGameOver = useCallback(() => {
    const { salud } = useGameStore.getState();
    if (salud <= 0) {
      setFinJuego("salud");
      setOverlay("gameover");
      setEndReason("salud");
      return true;
    }
    return false;
  }, [setFinJuego]);

  const checkBancarrota = useCallback(() => {
    const { dinero, deuda } = useGameStore.getState();
    if (dinero <= 0 && deuda > 0) {
      setFinJuego("dinero");
      setOverlay("gameover");
      setEndReason("dinero");
      return true;
    }
    return false;
  }, [setFinJuego]);

  useEffect(() => {
    if (!confirmado) return;
    // pagarSueldoMensual valida contra meta.ultimoMesSueldoPagado en el store
    // (persistido), así que aunque recargues no se duplica.
    pagarSueldoMensual(mes);
  }, [mes, confirmado, pagarSueldoMensual]);

  const insertarSiguienteCarta = (card) => {
    setTarjetas((prev) => {
      const next = [...prev];
      next.splice(indice + 1, 0, card);
      return next;
    });
  };

  const maybeQueueHealthCard = () => {
    const { salud } = useGameStore.getState();

    if (salud >= 65) {
      saludCooldownRef.current = false;
      saludThresholdRef.current = 60;
      return;
    }

    if (salud <= 20) {
      insertarSiguienteCarta(CARD_SALUD_20);
      return;
    }

    if (
      !saludCooldownRef.current &&
      salud <= saludThresholdRef.current &&
      salud >= 40
    ) {
      saludCooldownRef.current = true;
      saludThresholdRef.current = nuevoUmbralSalud();
      insertarSiguienteCarta(CARD_SALUD_60);
    }
  };

  const prependHealthIfNeeded = (deck) => {
    const { salud } = useGameStore.getState();

    if (salud >= 65) {
      saludCooldownRef.current = false;
      saludThresholdRef.current = 60;
    }

    if (salud <= 20) {
      return [CARD_SALUD_20, ...deck];
    }

    if (
      !saludCooldownRef.current &&
      salud <= saludThresholdRef.current &&
      salud >= 40
    ) {
      saludCooldownRef.current = true;
      saludThresholdRef.current = nuevoUmbralSalud();
      return [CARD_SALUD_60, ...deck];
    }

    return deck;
  };

  const prepararMes = (m) => {
    tomarResultadosInversion(m);

    const state = useGameStore.getState();
    const resultsNow = state.invResults || [];
    const bienestarActual = Number(state.bienestar || 0);
    const mesPrev = { tragedias: tragediasMesPrevRef.current || 0 };
    const { deck: base, tragediasMes } = generarSecuenciaMes(
      bienestarActual,
      mesPrev
    );
    tragediasMesPrevRef.current = tragediasMes;
    const deckBase = resultsNow.length
      ? [wrap("portfolio", { texto: "Revisión de portafolio" }), ...base]
      : base;

    setTarjetas(prependHealthIfNeeded(deckBase));
    setIndice(0);
    setResumen("");
  };

  useEffect(() => {
    if (!confirmado) return;
    prepararMes(mes);
    // eslint-disable-next-line
  }, [confirmado, mes]);

  const avanzarMes = () => {
    setResumen(`¡Terminaste el mes ${mes}!`);

    setTimeout(() => {
      setResumen("");

      if (mes === 24 && maxMeses === 24) {
        setOverlay("checkpoint");
        return;
      }

      if (mes >= maxMeses) {
        setFinJuego("tiempo");
        setOverlay("finished");
        setEndReason("tiempo");
        return;
      }

      setMes((v) => v + 1);
    }, 800);
  };

  const avanzarCarta = () => {
    if (overlay) return;

    if (indice < tarjetas.length - 1) {
      setIndice(indice + 1);
      return;
    }

    avanzarMes();
  };

  const cobrarCosto = (cost) => {
    const c = Number(cost || 0);
    if (c <= 0) return;

    const { dinero } = useGameStore.getState();
    if (dinero >= c) {
      actualizarDinero(-c);
      return;
    }
    const faltante = c - dinero;
    if (dinero > 0) actualizarDinero(-dinero);
    if (faltante > 0) actualizarDeuda(faltante);
  };

  const setSaludTo = (target) => {
    const t = Number(target);
    if (!Number.isFinite(t)) return;
    const { salud } = useGameStore.getState();
    actualizarSalud(t - salud);
  };

  const handleSaludOption = (op) => {
    if (overlay) return;

    if (typeof op?.cost === "number") cobrarCosto(op.cost);
    if (typeof op?.saludTo === "number") setSaludTo(op.saludTo);
    if (typeof op?.saludDelta === "number") actualizarSalud(op.saludDelta);
    if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);

    if (Array.isArray(op?.randomHealth)) {
      const pick =
        op.randomHealth[Math.floor(Math.random() * op.randomHealth.length)];
      if (pick) actualizarSalud(pick);
    }

    // Las opciones "Para morir nacimos" y "No todo se puede en la vida" estresan
    if (typeof op?.bienestar !== "number") {
      if (op?.saludDelta && op.saludDelta < 0) actualizarBienestar(-4);
      else if (op?.saludDelta && op.saludDelta > 0) actualizarBienestar(2);
    }

    if (checkGameOver()) return;
    if (checkBancarrota()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const handleOpcion = () => {
    if (overlay) return;
    if (checkGameOver()) return;
    if (checkBancarrota()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const handleNormalSiguiente = () => {
    if (overlay) return;
    const card = tarjetas[indice];
    if (card) {
      if (typeof card.dinero === "number") actualizarDinero(card.dinero);
      if (typeof card.salud === "number") actualizarSalud(card.salud);
      if (typeof card.bienestar === "number") actualizarBienestar(card.bienestar);
      if (typeof card.deuda === "number") actualizarDeuda(card.deuda);
    }
    if (checkGameOver()) return;
    if (checkBancarrota()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const agendarAhorroConservador = (monto) => {
    const m = Number(monto || 0);
    if (m <= 0) return;
    const { dinero } = useGameStore.getState();
    const capital = Math.min(m, dinero);
    if (capital <= 0) return;
    // Mínimo 2 meses para no aparecer inmediatamente en el siguiente PayDay
    agendarInversion({
      nombre: "Ahorro/inversión conservadora",
      costo: capital,
      resolveAt: Number(mes) + 2,
      outcomes: [
        { delta: Math.round(capital * 0.04), p: 0.45 },
        { delta: Math.round(capital * 0.02), p: 0.35 },
        { delta: 0, p: 0.15 },
        { delta: -Math.round(capital * 0.02), p: 0.05 },
      ],
    });
  };

  const handlePayDayOption = (op) => {
    if (overlay) return;

    let pagoExtra = false;

    // Pagar deuda con monto elegido en modal
    if (op?.accion === "pagarDeuda" && op?.montoPago) {
      const pago = pagarDeuda(op.montoPago);
      if (pago > 0) pagoExtra = true;
    }

    // Convertir acciones de inversión legacy a inversión real
    if (op?.accion === "invertir" || op?.accion === "invertirBajoRiesgo") {
      // Si la opción ya descontó dinero vía op.dinero, hay que evitar doble cobro:
      // calculamos el monto del op.inversiones[0].monto o op.montoInvertir y NO aplicamos op.dinero.
      let monto = 0;
      if (typeof op?.montoInvertir === "number") monto = op.montoInvertir;
      else if (Array.isArray(op?.inversiones) && op.inversiones[0]?.monto) {
        monto = Number(op.inversiones[0].monto);
      } else if (typeof op?.dinero === "number" && op.dinero < 0) {
        monto = Math.abs(op.dinero);
      } else {
        monto = 500;
      }
      agendarAhorroConservador(monto);
    } else {
      // Solo aplicar op.dinero si NO es acción de inversión
      // (en inversión, el costo ya se descontó en agendarInversion)
      if (typeof op?.dinero === "number") actualizarDinero(op.dinero);
    }

    if (typeof op?.salud === "number") actualizarSalud(op.salud);
    if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);
    if (typeof op?.deuda === "number") {
      actualizarDeuda(op.deuda);
      if (op.deuda < 0) pagoExtra = true;
    }

    // Bienestar implícito según acción (si la opción no trae bienestar explícito)
    if (typeof op?.bienestar !== "number") {
      if (op?.accion === "fiesta") actualizarBienestar(8);
      else if (op?.accion === "seguirNormal") actualizarBienestar(4);
      else if (op?.accion === "gastoInnecesario") actualizarBienestar(-3);
      else if (op?.accion === "pagarDeuda" && pagoExtra) actualizarBienestar(3);
    }

    // Cobrar pago mínimo de deuda
    cobrarPagoMinimo();

    // Interés mensual
    const { deuda: deudaActual, salud: saludActual } =
      useGameStore.getState();
    const esAnioExtra = mes >= 25;
    let tasa = pagoExtra ? 0.02 : 0.03;
    if (esAnioExtra) tasa += 0.01;

    if (deudaActual > 0) aplicarInteres(tasa);

    if (esAnioExtra && saludActual < 60 && Math.random() < 0.5) {
      actualizarSalud(-2);
    }

    if (checkGameOver()) return;
    if (checkBancarrota()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const goToResults = (motivo) => {
    if (motivo) setFinJuego(motivo);
    navigate("/resultados");
  };

  const resetAll = () => {
    reiniciar();
    setConfirmado(false);
    setPersonaje(rand(personajes));
    setIntentos(1);
    setMes(1);
    setMaxMeses(24);
    setTarjetas([]);
    setIndice(0);
    setResumen("");
    setOverlay(null);
    setEndReason("");
    saludThresholdRef.current = 60;
    saludCooldownRef.current = false;
    tragediasMesPrevRef.current = 0;
  };

  // --- Character selection ---
  if (!confirmado) {
    return (
      <div className="pt-6 pb-10">
        <div className="text-center mb-5">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
            Nueva partida
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-gray-900">
            Te tocó este personaje
          </h2>
        </div>

        <TarjetaPersonaje personaje={personaje} />

        <div className="flex flex-wrap gap-3 justify-center mt-5 max-w-xl mx-auto px-2">
          <button
            className="flex-1 min-w-[180px] px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition shadow-md"
            onClick={() => {
              saludThresholdRef.current = 60;
              saludCooldownRef.current = false;
              tragediasMesPrevRef.current = 0;

              setValoresIniciales(personaje);
              setConfirmado(true);
              setMes(1);
              setMaxMeses(24);
              setOverlay(null);
              setEndReason("");
            }}
          >
            Elegir este personaje
          </button>

          {intentos === 1 && (
            <button
              className="flex-1 min-w-[180px] px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
              onClick={() => {
                setPersonaje(rand(personajes));
                setIntentos(2);
              }}
            >
              Volver a nacer
            </button>
          )}

          {intentos === 2 && (
            <button
              className="flex-1 min-w-[180px] px-5 py-3 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition"
              onClick={() => {
                const tercero = rand(personajes);
                saludThresholdRef.current = 60;
                saludCooldownRef.current = false;
                tragediasMesPrevRef.current = 0;

                setValoresIniciales(tercero);
                setConfirmado(true);
                setMes(1);
                setMaxMeses(24);
                setOverlay(null);
                setEndReason("");
              }}
            >
              Aquí te tocó nacer
            </button>
          )}
        </div>

        {intentos === 2 && (
          <p className="text-center mt-3 text-xs text-gray-500 italic">
            Si no te convence, ni modo, ¡ya no hay más oportunidades!
          </p>
        )}
      </div>
    );
  }

  // --- Render current card ---
  let cartaComponent = null;
  const cartaActual = tarjetas[indice];

  if (resumen) {
    cartaComponent = (
      <div className="text-center my-12 text-xl font-bold text-green-600">
        {resumen}
      </div>
    );
  } else if (!cartaActual) {
    cartaComponent = (
      <div className="text-center mt-10 p-6 bg-white rounded-xl shadow">
        <p className="text-gray-500">Preparando cartas...</p>
      </div>
    );
  } else if (cartaActual.__kind === "salud") {
    cartaComponent = (
      <CardSaludEspecial
        titulo={cartaActual.titulo}
        texto={cartaActual.texto}
        opciones={cartaActual.opciones}
        onOpcion={handleSaludOption}
      />
    );
  } else if (cartaActual.__kind === "portfolio") {
    cartaComponent = <CardPortafolioReview onContinue={handleOpcion} />;
  } else if (cartaActual.__kind === "payday") {
    cartaComponent = (
      <CardPayDay
        texto={cartaActual.texto}
        opciones={cartaActual.opciones}
        onOpcion={handlePayDayOption}
      />
    );
  } else if (cartaActual.__kind === "oportunidad") {
    cartaComponent = (
      <CardOportunidad
        texto={cartaActual.texto}
        opciones={cartaActual.opciones}
        mesActual={mes}
        onOpcion={handleOpcion}
      />
    );
  } else if (cartaActual.__kind === "tragedia") {
    cartaComponent = (
      <CardTragedia
        texto={cartaActual.texto}
        opciones={cartaActual.opciones}
        severidad={cartaActual.severidad}
        onOpcion={handleOpcion}
      />
    );
  } else if (cartaActual.__kind === "fake") {
    cartaComponent = (
      <CardFakeOpportunity
        texto={cartaActual.texto}
        opciones={cartaActual.opciones}
        onOpcion={handleOpcion}
      />
    );
  } else {
    cartaComponent = (
      <CardNormal
        texto={cartaActual.texto}
        dinero={cartaActual.dinero}
        salud={cartaActual.salud}
        bienestar={cartaActual.bienestar}
        deuda={cartaActual.deuda}
        onSiguiente={handleNormalSiguiente}
      />
    );
  }

  return (
    <div className="pt-4 pb-10 space-y-3 max-w-2xl mx-auto">
      <Cartera mesActual={mes} />

      <div className="flex items-center justify-between text-sm px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
            Mes {mes} / {maxMeses}
          </span>
          {invResults.length > 0 && (
            <span className="text-xs text-amber-700">
              resultados de inversión pendientes
            </span>
          )}
        </div>
        <button
          className="text-xs text-gray-400 hover:text-rose-600 underline"
          onClick={resetAll}
        >
          Reiniciar partida
        </button>
      </div>

      {cartaComponent}

      {/* CHECKPOINT 24 */}
      <ModalSimple
        open={overlay === "checkpoint"}
        title="Fin parcial: 24 meses"
        onClose={() => {}}
      >
        <p className="opacity-80">
          Llegaste al mes 24. Puedes ver resultados o jugar 12 meses más (más
          reto).
        </p>
        <div className="mt-4 grid gap-2">
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={() => goToResults("checkpoint_24")}
          >
            Ver resultados
          </button>
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={() => {
              setMaxMeses(36);
              setMesesObjetivo(36);
              setOverlay(null);
              setEndReason("");
              setMes(25);
            }}
          >
            Jugar 12 meses más
          </button>
        </div>
      </ModalSimple>

      {/* GAMEOVER */}
      <ModalSimple
        open={overlay === "gameover"}
        title="Game Over"
        onClose={() => {}}
      >
        <p className="opacity-80">
          {endReason === "salud"
            ? "Perdiste por descuidar tu salud."
            : "Bancarrota: te quedaste sin dinero y con deuda."}
        </p>
        <div className="mt-4 grid gap-2">
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={() => navigate("/resultados")}
          >
            Ir a resultados
          </button>
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={resetAll}
          >
            Reiniciar
          </button>
        </div>
      </ModalSimple>

      {/* FIN */}
      <ModalSimple
        open={overlay === "finished"}
        title="Fin del juego"
        onClose={() => {}}
      >
        <p className="opacity-80">
          Terminaste el periodo del juego. Ve tu resumen.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={() => navigate("/resultados")}
          >
            Ver resultados
          </button>
          <button
            className="p-3 rounded-lg border hover:bg-gray-50 transition font-semibold"
            onClick={resetAll}
          >
            Reiniciar
          </button>
        </div>
      </ModalSimple>
    </div>
  );
}
