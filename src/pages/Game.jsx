import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import personajes from "../data/personajes.json";
import normalCards from "../data/normalCards.json";
import opportunityCards from "../data/opportunityCards.json";
import tragedyCards from "../data/tragedyCards.json";
import paydayCards from "../data/paydayCards.json";

import TarjetaPersonaje from "../components/game/TarjetaPersonaje";
import Cartera from "../components/game/Cartera";

import CardNormal from "../components/cards/CardNormal";
import CardOportunidad from "../components/cards/CardOportunidad";
import CardTragedia from "../components/cards/CardTragedia";
import CardPayDay from "../components/cards/CardPayDay";
import CardPortafolioReview from "../components/cards/CardPortafolioReview";
import CardSaludEspecial from "../components/cards/CardSaludEspecial";

import ModalSimple from "../components/ui/ModalSimple";
import { useGameStore } from "../store/gameStore";

// Utilidades
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomPersonaje() {
  return personajes[Math.floor(Math.random() * personajes.length)];
}
function normCard(c) {
  if (typeof c === "string") return { texto: c };
  return c || { texto: "..." };
}
function wrap(kind, card) {
  return { ...card, __kind: kind };
}
function generarSecuenciaMes() {
  const normales = [
    wrap("normal", normCard(getRandomItem(normalCards))),
    wrap("normal", normCard(getRandomItem(normalCards))),
    wrap("normal", normCard(getRandomItem(normalCards))),
  ];

  const oportunidad = wrap("oportunidad", getRandomItem(opportunityCards));
  const tragedia = wrap("tragedia", getRandomItem(tragedyCards));
  const payday = wrap("payday", getRandomItem(paydayCards));

  const primeras = [...normales, oportunidad, tragedia].sort(() => Math.random() - 0.5);
  return [...primeras, payday];
}

export default function Game() {
  const navigate = useNavigate();

  // --- Selección personaje ---
  const [personaje, setPersonaje] = useState(getRandomPersonaje());
  const [intentos, setIntentos] = useState(1);
  const [confirmado, setConfirmado] = useState(false);

  // --- Juego ---
  const [turno, setTurno] = useState(1);
  const [maxMeses, setMaxMeses] = useState(24);
  const [tarjetas, setTarjetas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [resumenTurno, setResumenTurno] = useState("");

  // --- Overlays ---
  const [overlay, setOverlay] = useState(null); // null | checkpoint | gameover | finished
  const [endReason, setEndReason] = useState(""); // salud | dinero | tiempo | checkpoint_24

  // --- Store ---
  const setValoresIniciales = useGameStore((s) => s.setValoresIniciales);
  const reiniciarStore = useGameStore((s) => s.reiniciar);

  const sueldo = useGameStore((s) => s.sueldo);
  const setDinero = useGameStore((s) => s.actualizarDinero);
  const setSalud = useGameStore((s) => s.actualizarSalud);
  const setDeuda = useGameStore((s) => s.actualizarDeuda);
  const pagarDeuda = useGameStore((s) => s.pagarDeuda);

  const tomarResultadosInversion = useGameStore((s) => s.tomarResultadosInversion);
  const invResults = useGameStore((s) => s.invResults || s.__invResults || []);

  // refs
  const mesPagadoRef = useRef(null);
  const paydayProcesadoRef = useRef(null);

  const salud60Disparada = useRef(false);
  const salud20Disparada = useRef(false);

  // --- Cartas especiales de salud ---
  const CARD_SALUD_60 = {
    __kind: "salud",
    titulo: "60% — Te has descuidado",
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
        descripcion: "Te haces el fuerte… pero te pega.",
        cost: 0,
        saludDelta: -10,
      },
    ],
  };

  const CARD_SALUD_20 = {
    __kind: "salud",
    titulo: "20% — Urgencias",
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
        texto: "No todo se puede en la vida…",
        descripcion: "Azar: o no pasa nada o pierdes más salud.",
        cost: 0,
        randomHealth: [0, -10],
      },
    ],
  };

  const checkGameOver = () => {
    const { dinero, salud } = useGameStore.getState();
    if (salud <= 0) {
      setOverlay("gameover");
      setEndReason("salud");
      return true;
    }
    if (dinero <= 0) {
      setOverlay("gameover");
      setEndReason("dinero");
      return true;
    }
    return false;
  };

  // --- Pago de sueldo (una vez por mes) ---
  useEffect(() => {
    if (!confirmado) return;
    if (mesPagadoRef.current === turno) return;
    setDinero(sueldo);
    mesPagadoRef.current = turno;
    // eslint-disable-next-line
  }, [turno, confirmado, sueldo]);

  // Compat: si tu store viejo genera __invResults, lo convertimos a invResults
  const normalizarInvResultsLegacy = () => {
    const st = useGameStore.getState();
    if ((!st.invResults || st.invResults.length === 0) && Array.isArray(st.__invResults) && st.__invResults.length) {
      useGameStore.setState({ invResults: st.__invResults, __invResults: [] });
    }
  };

  const prependHealthIfNeeded = (deck) => {
    const { salud } = useGameStore.getState();

    if (salud <= 20 && !salud20Disparada.current) {
      salud20Disparada.current = true;
      return [CARD_SALUD_20, ...deck];
    }
    if (salud <= 60 && !salud60Disparada.current) {
      salud60Disparada.current = true;
      return [CARD_SALUD_60, ...deck];
    }
    return deck;
  };

  const prepararMes = (mes) => {
    tomarResultadosInversion(mes);
    normalizarInvResultsLegacy();

    const resultsNow = (useGameStore.getState().invResults || []);
    const base = generarSecuenciaMes();
    const deckBase = resultsNow.length
      ? [wrap("portfolio", { texto: "Revisión de portafolio" }), ...base]
      : base;

    const deck = prependHealthIfNeeded(deckBase);

    setTarjetas(deck);
    setIndice(0);
    setResumenTurno("");
    paydayProcesadoRef.current = null;
  };

  // preparar mes 1 al confirmar personaje
  useEffect(() => {
    if (!confirmado) return;
    prepararMes(1);
    // eslint-disable-next-line
  }, [confirmado]);

  // --- Cobro automático “pago mínimo” en Payday (si existe en store; si no, fallback) ---
  const cobrarPagoMinimoSafe = () => {
    const st = useGameStore.getState();

    if (typeof st.cobrarPagoMinimo === "function") {
      return st.cobrarPagoMinimo();
    }

    // fallback si tu store no lo tiene
    const deuda = Number(st.deuda || 0);
    if (deuda <= 0) return { ok: true, pagoMin: 0 };

    const minimo = Math.min(deuda, Math.max(Math.round(deuda * 0.05), 200));
    const dinero = Number(st.dinero || 0);

    if (dinero < minimo) return { ok: false, pagoMin: minimo };

    st.actualizarDinero(-minimo);
    st.actualizarDeuda(-minimo);
    return { ok: true, pagoMin: minimo };
  };

  const aplicarInteresSafe = (tasa) => {
    const st = useGameStore.getState();
    if (typeof st.aplicarInteres === "function") return st.aplicarInteres(tasa);

    const deuda = Number(st.deuda || 0);
    if (deuda <= 0) return 0;

    const nuevo = Math.round(deuda * (1 + Number(tasa || 0)));
    const delta = nuevo - deuda;
    st.actualizarDeuda(delta);
    return delta;
  };

  // efecto: cuando la carta actual es payday, cobra mínimo 1 sola vez por mes
  useEffect(() => {
    if (!confirmado) return;
    if (overlay) return;
    const carta = tarjetas[indice];
    if (!carta || carta.__kind !== "payday") return;

    if (paydayProcesadoRef.current === turno) return;
    paydayProcesadoRef.current = turno;

    const r = cobrarPagoMinimoSafe();
    if (!r.ok) {
      setOverlay("gameover");
      setEndReason("dinero");
    }
    // eslint-disable-next-line
  }, [confirmado, overlay, tarjetas, indice, turno]);

  // Inserta una carta al siguiente slot y mueve el índice a esa carta
  const insertarYAvanzar = (card) => {
    const currentIdx = indice;
    setTarjetas((prev) => {
      const next = [...prev];
      next.splice(currentIdx + 1, 0, card);
      return next;
    });
    setIndice(currentIdx + 1);
  };

  const maybeTriggerHealthNext = () => {
    const { salud } = useGameStore.getState();

    if (salud <= 20 && !salud20Disparada.current) {
      salud20Disparada.current = true;
      insertarYAvanzar(CARD_SALUD_20);
      return true;
    }

    if (salud <= 60 && !salud60Disparada.current) {
      salud60Disparada.current = true;
      insertarYAvanzar(CARD_SALUD_60);
      return true;
    }

    return false;
  };

  const cerrarMesYAvanzar = () => {
    setResumenTurno(`¡Terminaste el mes ${turno}!`);
    setTimeout(() => {
      if (overlay) return;

      if (turno === 24 && maxMeses === 24) {
        setOverlay("checkpoint");
        setEndReason("checkpoint_24");
        return;
      }

      if (turno >= maxMeses) {
        setOverlay("finished");
        setEndReason("tiempo");
        return;
      }

      const next = turno + 1;
      setTurno(next);
      prepararMes(next);
    }, 900);
  };

  const avanzarNormal = () => {
    if (overlay) return;

    if (indice < tarjetas.length - 1) {
      setIndice(indice + 1);
      return;
    }

    cerrarMesYAvanzar();
  };

  const avanzarConHealthCheck = () => {
    if (overlay) return;
    if (checkGameOver()) return;

    // si hay que disparar carta de salud, se inserta y AVANZA a ella
    if (maybeTriggerHealthNext()) return;

    // si no, avanza normal
    avanzarNormal();
  };

  // ---- Elección personaje ----
  if (!confirmado) {
    return (
      <div className="min-h-screen p-4">
        <h2 className="text-2xl font-bold text-center mt-8 mb-6">¡Te tocó este personaje!</h2>

        <TarjetaPersonaje personaje={personaje} />

        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              // reset flags salud
              salud60Disparada.current = false;
              salud20Disparada.current = false;

              setValoresIniciales(personaje);
              setConfirmado(true);

              // reset juego local
              setOverlay(null);
              setEndReason("");
              setTurno(1);
              setMaxMeses(24);
              setTarjetas([]);
              setIndice(0);
              setResumenTurno("");
              mesPagadoRef.current = null;
              paydayProcesadoRef.current = null;
            }}
          >
            Elegir este personaje
          </button>

          {intentos === 1 && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setPersonaje(getRandomPersonaje());
                setIntentos(2);
              }}
            >
              Volver a nacer, segunda oportunidad
            </button>
          )}

          {intentos === 2 && (
            <button
              className="bg-orange-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const tercero = getRandomPersonaje();

                salud60Disparada.current = false;
                salud20Disparada.current = false;

                setValoresIniciales(tercero);
                setConfirmado(true);

                setOverlay(null);
                setEndReason("");
                setTurno(1);
                setMaxMeses(24);
                setTarjetas([]);
                setIndice(0);
                setResumenTurno("");
                mesPagadoRef.current = null;
                paydayProcesadoRef.current = null;
              }}
            >
              La tercera ya no es opción, aquí te tocó nacer
            </button>
          )}
        </div>

        {intentos === 2 && (
          <p className="text-center mt-2 text-sm text-gray-500 italic">
            Si no te convence, ni modo, ¡ya no hay más oportunidades!
          </p>
        )}
      </div>
    );
  }

  // --- Handlers ---
  const handleOpcion = () => {
    if (overlay) return;
    avanzarConHealthCheck();
  };

  const handlePayDayOption = (op) => {
    if (overlay) return;

    let pagoExtra = false;

    if (op?.accion === "pagarDeuda" && op?.montoPago) {
      const pago = pagarDeuda(op.montoPago);
      if (pago > 0) pagoExtra = true;
    }

    // invertir/ahorrar (si existe en store)
    if (op?.accion === "invertir" && op?.montoInvertir) {
      const st = useGameStore.getState();
      if (typeof st.invertirAhorro === "function") {
        st.invertirAhorro(op.montoInvertir);
      } else {
        // fallback: solo descuenta dinero
        setDinero(-Number(op.montoInvertir || 0));
      }
    }

    // efectos directos (fiesta, no hacer nada, etc.)
    if (typeof op?.dinero === "number") setDinero(op.dinero);
    if (typeof op?.salud === "number") setSalud(op.salud);
    if (typeof op?.deuda === "number") {
      setDeuda(op.deuda);
      if (op.deuda < 0) pagoExtra = true;
    }

    // interés si sigue habiendo deuda
    const { deuda } = useGameStore.getState();
    if (Number(deuda || 0) > 0) aplicarInteresSafe(pagoExtra ? 0.02 : 0.03);

    avanzarConHealthCheck();
  };

  const cobrarCosto = (cost) => {
    const c = Number(cost || 0);
    if (c <= 0) return;

    const { dinero } = useGameStore.getState();
    if (dinero >= c) {
      setDinero(-c);
      return;
    }
    // si no alcanza: se va tu dinero y el resto se vuelve deuda (vida real)
    const faltante = c - dinero;
    if (dinero > 0) setDinero(-dinero);
    if (faltante > 0) setDeuda(faltante);
  };

  const setSaludTo = (target) => {
    const t = Number(target);
    if (!Number.isFinite(t)) return;
    const { salud } = useGameStore.getState();
    setSalud(t - salud); // convierte a delta
  };

  const handleSaludOption = (op) => {
    if (overlay) return;

    if (typeof op?.cost === "number") cobrarCosto(op.cost);

    if (typeof op?.saludTo === "number") setSaludTo(op.saludTo);
    if (typeof op?.saludDelta === "number") setSalud(op.saludDelta);

    if (Array.isArray(op?.randomHealth)) {
      const arr = op.randomHealth;
      const pick = arr[Math.floor(Math.random() * arr.length)];
      if (pick) setSalud(pick);
    }

    avanzarConHealthCheck();
  };

  // --- Render carta ---
  let cartaComponent = null;

  if (resumenTurno) {
    cartaComponent = (
      <div className="text-center my-16 text-xl font-bold text-green-600">{resumenTurno}</div>
    );
  } else {
    const carta = tarjetas[indice];

    if (!carta) {
      cartaComponent = (
        <div className="text-center mt-10 text-xl text-red-700">
          No hay carta para mostrar.<br />
          Indice: {indice}, Total: {tarjetas.length}
        </div>
      );
    } else if (carta.__kind === "salud") {
      cartaComponent = (
        <CardSaludEspecial
          titulo={carta.titulo}
          texto={carta.texto}
          opciones={carta.opciones}
          onOpcion={handleSaludOption}
        />
      );
    } else if (carta.__kind === "portfolio") {
      cartaComponent = <CardPortafolioReview onContinue={handleOpcion} />;
    } else if (carta.__kind === "payday") {
      cartaComponent = (
        <CardPayDay texto={carta.texto} opciones={carta.opciones} onOpcion={handlePayDayOption} />
      );
    } else if (carta.__kind === "oportunidad") {
      cartaComponent = (
        <CardOportunidad texto={carta.texto} opciones={carta.opciones} mesActual={turno} onOpcion={handleOpcion} />
      );
    } else if (carta.__kind === "tragedia") {
      cartaComponent = (
        <CardTragedia texto={carta.texto} opciones={carta.opciones} onOpcion={handleOpcion} />
      );
    } else {
      cartaComponent = <CardNormal texto={carta.texto} onSiguiente={avanzarNormal} />;
    }
  }

  // --- Acciones overlay ---
  const reiniciarTodo = () => {
    reiniciarStore();
    setOverlay(null);
    setEndReason("");
    setConfirmado(false);
    setPersonaje(getRandomPersonaje());
    setIntentos(1);
    setTurno(1);
    setMaxMeses(24);
    setTarjetas([]);
    setIndice(0);
    setResumenTurno("");
    mesPagadoRef.current = null;
    paydayProcesadoRef.current = null;

    salud60Disparada.current = false;
    salud20Disparada.current = false;
  };

  const irAResultados = () => {
    setOverlay(null);
    navigate("/resultados");
  };

  const aceptarAnioExtra = () => {
    setMaxMeses(36);
    setOverlay(null);
    setEndReason("");

    const next = turno + 1;
    setTurno(next);
    prepararMes(next);
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      <Cartera />
      <div className="text-sm opacity-70">
        Mes {turno} / {maxMeses}
        {invResults.length ? <span className="ml-2">• 🧾 resultados pendientes</span> : null}
      </div>

      {cartaComponent}

      <ModalSimple open={overlay === "checkpoint"} title="Fin parcial: 24 meses" onClose={() => {}}>
        <p className="opacity-80">
          Llegaste al mes 24. Puedes cerrar aquí con tu evaluación o jugar 12 meses más (más reto).
        </p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={irAResultados}>
            Ver resultados
          </button>
          <button className="p-3 rounded border" onClick={aceptarAnioExtra}>
            Jugar 12 meses más
          </button>
        </div>
      </ModalSimple>

      <ModalSimple open={overlay === "gameover"} title="Game Over" onClose={() => {}}>
        <p className="opacity-80">
          {endReason === "salud"
            ? "Perdiste por descuidar tu salud."
            : "Bancarrota: te quedaste sin dinero."}
        </p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={reiniciarTodo}>
            Reiniciar
          </button>
          <button className="p-3 rounded border" onClick={irAResultados}>
            Ir a resultados
          </button>
        </div>
      </ModalSimple>

      <ModalSimple open={overlay === "finished"} title="Fin del juego" onClose={() => {}}>
        <p className="opacity-80">Terminaste el periodo del juego. Es momento de ver tu resumen.</p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={irAResultados}>
            Ver resultados
          </button>
          <button className="p-3 rounded border" onClick={reiniciarTodo}>
            Reiniciar
          </button>
        </div>
      </ModalSimple>
    </div>
  );
}
