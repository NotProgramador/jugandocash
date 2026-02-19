import { useEffect, useMemo, useRef, useState } from "react";
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

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function normCard(c) {
  if (typeof c === "string") return { texto: c };
  return c || { texto: "..." };
}
function wrap(kind, card) {
  return { ...card, __kind: kind };
}

function generarSecuenciaMes() {
  const normales = [
    wrap("normal", normCard(rand(normalCards))),
    wrap("normal", normCard(rand(normalCards))),
    wrap("normal", normCard(rand(normalCards))),
  ];

  const oportunidad = wrap("oportunidad", rand(opportunityCards));
  const tragedia = wrap("tragedia", rand(tragedyCards));
  const payday = wrap("payday", rand(paydayCards));

  const primeras = [...normales, oportunidad, tragedia].sort(() => Math.random() - 0.5);
  return [...primeras, payday];
}

export default function Game() {
  const navigate = useNavigate();

  // --- Selección personaje ---
  const [personaje, setPersonaje] = useState(rand(personajes));
  const [intentos, setIntentos] = useState(1);
  const [confirmado, setConfirmado] = useState(false);

  // --- Juego ---
  const [mes, setMes] = useState(1);
  const [maxMeses, setMaxMeses] = useState(24);
  const [tarjetas, setTarjetas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [resumen, setResumen] = useState("");

  // Overlays
  const [overlay, setOverlay] = useState(null); // checkpoint | gameover | finished
  const [endReason, setEndReason] = useState("");

  // Store
  const setValoresIniciales = useGameStore((s) => s.setValoresIniciales);
  const reiniciar = useGameStore((s) => s.reiniciar);

  const sueldo = useGameStore((s) => s.sueldo);

  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);

  const pagarDeuda = useGameStore((s) => s.pagarDeuda);
  const aplicarInteres = useGameStore((s) => s.aplicarInteres);

  const invertirAhorro = useGameStore((s) => s.invertirAhorro);
  const agregarInversiones = useGameStore((s) => s.agregarInversiones);

  const tomarResultadosInversion = useGameStore((s) => s.tomarResultadosInversion);
  const invResults = useGameStore((s) => s.invResults || []);

  const mesPagadoRef = useRef(null);

  // --- Cartas especiales de salud (repetibles con umbral dinámico) ---
  const saludThresholdRef = useRef(60); // 60 inicial, luego 40–60 al azar
  const saludCooldownRef = useRef(false);

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

  const nuevoUmbralSalud = () => 40 + Math.floor(Math.random() * 21); // 40..60

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

  // Pagar sueldo 1 vez por mes
  useEffect(() => {
    if (!confirmado) return;
    if (mesPagadoRef.current === mes) return;
    actualizarDinero(sueldo);
    mesPagadoRef.current = mes;
    // eslint-disable-next-line
  }, [mes, confirmado, sueldo]);

  const insertarSiguienteCarta = (card) => {
    setTarjetas((prev) => {
      const next = [...prev];
      next.splice(indice + 1, 0, card);
      return next;
    });
  };

  const maybeQueueHealthCard = () => {
    const { salud } = useGameStore.getState();

    // Si recuperas, permitimos que vuelva a disparar más adelante
    if (salud >= 65) {
      saludCooldownRef.current = false;
      saludThresholdRef.current = 60;
      return;
    }

    // Urgencias: siempre manda (se puede repetir)
    if (salud <= 20) {
      insertarSiguienteCarta(CARD_SALUD_20);
      return;
    }

    // Descuido: umbral dinámico (primera vez 60, luego 40–60 al azar)
    if (!saludCooldownRef.current && salud <= saludThresholdRef.current && salud >= 40) {
      saludCooldownRef.current = true;
      saludThresholdRef.current = nuevoUmbralSalud();
      insertarSiguienteCarta(CARD_SALUD_60);
    }
  };

  const prependHealthIfNeeded = (deck) => {
    const { salud } = useGameStore.getState();

    // Reset si recuperaste
    if (salud >= 65) {
      saludCooldownRef.current = false;
      saludThresholdRef.current = 60;
    }

    // Urgencias primero (repetible)
    if (salud <= 20) {
      return [CARD_SALUD_20, ...deck];
    }

    // Descuido: solo si estás entre 40 y el umbral, y no estás en cooldown
    if (!saludCooldownRef.current && salud <= saludThresholdRef.current && salud >= 40) {
      saludCooldownRef.current = true;
      saludThresholdRef.current = nuevoUmbralSalud();
      return [CARD_SALUD_60, ...deck];
    }

    return deck;
  };

  // Preparar mes: resultados inversión + secuencia
  const prepararMes = (m) => {
    tomarResultadosInversion(m);

    const resultsNow = (useGameStore.getState().invResults || []);
    const base = generarSecuenciaMes();
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
        setEndReason("checkpoint_24");
        return;
      }

      if (mes >= maxMeses) {
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
    // si no alcanza: se va todo tu dinero y lo restante se vuelve deuda
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

    if (Array.isArray(op?.randomHealth)) {
      const pick = op.randomHealth[Math.floor(Math.random() * op.randomHealth.length)];
      if (pick) actualizarSalud(pick);
    }

    if (checkGameOver()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const handleOpcion = () => {
    if (overlay) return;
    if (checkGameOver()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  const handlePayDayOption = (op) => {
    if (overlay) return;

    let pagoExtra = false;

    if (op?.accion === "pagarDeuda" && op?.montoPago) {
      const pago = pagarDeuda(op.montoPago);
      if (pago > 0) pagoExtra = true;
    }

    if (op?.accion === "invertir" && op?.montoInvertir) {
      invertirAhorro(op.montoInvertir);
    }

    if (typeof op?.dinero === "number") actualizarDinero(op.dinero);
    if (typeof op?.salud === "number") actualizarSalud(op.salud);
    if (typeof op?.deuda === "number") {
      actualizarDeuda(op.deuda);
      if (op.deuda < 0) pagoExtra = true;
    }

    if (Array.isArray(op?.inversiones)) agregarInversiones(op.inversiones);

    // interés mensual (si sigue habiendo deuda) + dificultad año extra
    const { deuda, salud: saludActual } = useGameStore.getState();
    const esAnioExtra = mes >= 25;
    let tasa = pagoExtra ? 0.02 : 0.03;
    if (esAnioExtra) tasa += 0.01; // +1% en meses 25-36

    if (deuda > 0) aplicarInteres(tasa);

    // Presión extra por salud en año extra (fatiga leve, no siempre)
    if (esAnioExtra && saludActual < 60 && Math.random() < 0.5) {
      actualizarSalud(-2);
    }

    if (checkGameOver()) return;
    maybeQueueHealthCard();
    avanzarCarta();
  };

  // --- Selección personaje ---
  if (!confirmado) {
    return (
      <div className="min-h-screen p-4">
        <h2 className="text-2xl font-bold text-center mt-8 mb-6">¡Te tocó este personaje!</h2>

        <TarjetaPersonaje personaje={personaje} />

        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              saludThresholdRef.current = 60;
              saludCooldownRef.current = false;

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
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setPersonaje(rand(personajes));
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
                const tercero = rand(personajes);

                saludThresholdRef.current = 60;
                saludCooldownRef.current = false;

                setValoresIniciales(tercero);
                setConfirmado(true);
                setMes(1);
                setMaxMeses(24);
                setOverlay(null);
                setEndReason("");
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

  // Render carta actual
  let cartaComponent = null;
  const cartaActual = tarjetas[indice];

  if (resumen) {
    cartaComponent = (
      <div className="text-center my-16 text-xl font-bold text-green-600">{resumen}</div>
    );
  } else if (!cartaActual) {
    cartaComponent = (
      <div className="text-center mt-10 text-xl text-red-700">
        No hay carta para mostrar. Índice: {indice} / {tarjetas.length}
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
      <CardPayDay texto={cartaActual.texto} opciones={cartaActual.opciones} onOpcion={handlePayDayOption} />
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
      <CardTragedia texto={cartaActual.texto} opciones={cartaActual.opciones} onOpcion={handleOpcion} />
    );
  } else {
    cartaComponent = <CardNormal texto={cartaActual.texto} onSiguiente={avanzarCarta} />;
  }

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
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      <Cartera mesActual={mes} />

      <div className="text-sm opacity-70">
        Mes {mes} / {maxMeses}{" "}
        {invResults.length ? <span className="ml-2">• 🧾 resultados pendientes</span> : null}
      </div>

      {cartaComponent}

      {/* CHECKPOINT 24 */}
      <ModalSimple open={overlay === "checkpoint"} title="Fin parcial: 24 meses" onClose={() => {}}>
        <p className="opacity-80">
          Llegaste al mes 24. Puedes ver resultados o jugar 12 meses más (más reto).
        </p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={() => navigate("/resultados")}>
            Ver resultados
          </button>
          <button
            className="p-3 rounded border"
            onClick={() => {
              setMaxMeses(36);
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
      <ModalSimple open={overlay === "gameover"} title="Game Over" onClose={() => {}}>
        <p className="opacity-80">
          {endReason === "salud"
            ? "Perdiste por descuidar tu salud."
            : "Bancarrota: te quedaste sin dinero."}
        </p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={() => navigate("/resultados")}>
            Ir a resultados
          </button>
          <button className="p-3 rounded border" onClick={resetAll}>
            Reiniciar
          </button>
        </div>
      </ModalSimple>

      {/* FIN */}
      <ModalSimple open={overlay === "finished"} title="Fin del juego" onClose={() => {}}>
        <p className="opacity-80">Terminaste el periodo del juego. Ve tu resumen.</p>
        <div className="mt-4 grid gap-2">
          <button className="p-3 rounded border" onClick={() => navigate("/resultados")}>
            Ver resultados
          </button>
          <button className="p-3 rounded border" onClick={resetAll}>
            Reiniciar
          </button>
        </div>
      </ModalSimple>
    </div>
  );
}
