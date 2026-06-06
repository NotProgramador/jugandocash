import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Results from "./pages/Results";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-gray-900">
        <Navbar />
        <main className="max-w-5xl mx-auto px-3 sm:px-4 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/juego" element={<Game />} />
            <Route path="/resultados" element={<Results />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;
