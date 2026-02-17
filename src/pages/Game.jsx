import { useState, useEffect, useRef } from "react";
import personajes from "../data/personajes.json";
import TarjetaPersonaje from "../components/game/TarjetaPersonaje";
import { useGameStore } from "../store/gameStore";
import Cartera from "../components/game/Cartera";
import normalCards from "../data/normalCards.json";
import opportunityCards from "../data/opportunityCards.json";
import tragedyCards from "../data/tragedyCards.json";
import paydayCards from "../data/paydayCards.json";
import CardNormal from "../components/cards/CardNormal";
import CardOportunidad from "../components/cards/CardOportunidad";
import CardTragedia from "../components/cards/CardTragedia";
import CardPayDay from "../components/cards/CardPayDay";

// Utilidades
function getRandomPersonaje() {
  return personajes[Math.floor(Math.random() * personajes.length)];
}
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generarSecuenciaTurno() {
  const normales = [
    getRandomItem(normalCards),
    getRandomItem(normalCards),
    getRandomItem(normalCards),
  ];
  const oportunidad = getRandomItem(opportunityCards);
  const tragedia = getRandomItem(tragedyCards);
  const payday = getRandomItem(paydayCards);
  const primeras5 = [...normales, oportunidad, tragedia].sort(() => Math.random() - 0.5);
  return [...primeras5, payday];
}

export default function Game() {
  // TODOS LOS HOOKS, SIEMPRE, ARRIBA
  const [personaje, setPersonaje] = useState(getRandomPersonaje());
  const [intentos, setIntentos] = useState(1);
  const [confirmado, setConfirmado] = useState(false);
  const setValoresIniciales = useGameStore((s) => s.setValoresIniciales);

  // HOOKS DEL JUEGO
  const [turno, setTurno] = useState(1);
  const [tarjetas, setTarjetas] = useState(generarSecuenciaTurno());
  const [indice, setIndice] = useState(0);
  const [resumenTurno, setResumenTurno] = useState("");

  // HOOKS DE ESTADO GLOBAL
  const sueldo = useGameStore((s) => s.sueldo);
  const setDinero = useGameStore((s) => s.actualizarDinero);
  const setSalud = useGameStore((s) => s.actualizarSalud);
  const setDeuda = useGameStore((s) => s.actualizarDeuda);

  // --- Sumar sueldo SOLO una vez al inicio de cada mes ---
  const turnoAnterior = useRef(turno);
  useEffect(() => {
    if (confirmado && (turno === 1 || turno !== turnoAnterior.current)) {
      setDinero(sueldo); // suma sueldo mensual solo una vez
      turnoAnterior.current = turno;
    }
    // eslint-disable-next-line
  }, [turno, confirmado, sueldo]);

  // ---- ETAPA DE ELECCIÓN DE PERSONAJE ----
  if (!confirmado) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-center mt-8 mb-6">¡Te tocó este personaje!</h2>
        <TarjetaPersonaje personaje={personaje} />
        <div className="flex gap-4 justify-center mt-4">
          {/* Botón para elegir el personaje SIEMPRE visible */}
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setValoresIniciales(personaje);
              setConfirmado(true);
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
                const tercerPersonaje = getRandomPersonaje();
                setValoresIniciales(tercerPersonaje);
                setConfirmado(true);
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

  // ---- JUEGO NORMAL ----
  const handleSiguiente = () => {
    if (indice < tarjetas.length - 1) {
      setIndice(indice + 1);
    } else {
      setResumenTurno(
        `¡Terminaste el mes ${turno}! Prepárate para el siguiente turno.`
      );
      setTimeout(() => {
        setTurno(turno + 1);
        setTarjetas(generarSecuenciaTurno());
        setIndice(0);
        setResumenTurno("");
      }, 1600);
    }
  };

  // Handler de día de pago
  const handlePayDayOption = (op) => {
    // Si viene de pagarDeuda y el usuario eligió un monto:
    if (op.accion === "pagarDeuda" && op.montoPago) {
      setDinero(-op.montoPago); // Resta el monto pagado
      setDeuda(-op.montoPago);  // Resta el mismo monto de la deuda
    }
    // Si es una opción directa:
    else {
      if (op.dinero) setDinero(op.dinero);
      if (op.salud) setSalud(op.salud);
      if (op.deuda) setDeuda(op.deuda);
    }
    handleSiguiente();
  };

  // Handler para oportunidad y tragedia (puedes expandir lógica aquí)
  const handleOpcion = (op) => {
    handleSiguiente();
  };

  // Render de la carta actual
  let cartaComponent;
  if (resumenTurno) {
    cartaComponent = (
      <div className="text-center my-16 text-xl font-bold text-green-600">
        {resumenTurno}
      </div>
    );
  } else {
    const carta = tarjetas[indice];
    if (!carta) {
      return (
        <div className="text-center mt-10 text-xl text-red-700">
          No hay carta para mostrar.<br />
          Indice: {indice}, Total: {tarjetas.length}<br />
          ¿Quizá la tarjeta #{indice + 1} de este turno está mal formateada en el JSON?
        </div>
      );
    }

    if (carta.opciones && carta.texto.includes("Día de pago")) {
      cartaComponent = (
        <CardPayDay
          texto={carta.texto}
          opciones={carta.opciones}
          onOpcion={handlePayDayOption}
        />
      );
    } else if (
      carta.opciones &&
      (carta.texto.toLowerCase().includes("invertir") ||
        carta.texto.toLowerCase().includes("terreno") ||
        carta.texto.toLowerCase().includes("startup") ||
        carta.texto.toLowerCase().includes("app"))
    ) {
      cartaComponent = (
        <CardOportunidad
          texto={carta.texto}
          opciones={carta.opciones}
          onOpcion={handleOpcion}
        />
      );
    } else if (carta.opciones) {
      cartaComponent = (
        <CardTragedia
          texto={carta.texto}
          opciones={carta.opciones}
          onOpcion={handleOpcion}
        />
      );
    } else {
      cartaComponent = (
        <CardNormal texto={carta.texto} onSiguiente={handleSiguiente} />
      );
    }
  }

  return (
  <div className="min-h-screen p-4 space-y-4">
    <Cartera />
    <div className="text-sm opacity-70">Mes {turno}</div>
    {cartaComponent}
  </div>
);
}
