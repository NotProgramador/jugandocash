import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Game from './pages/Game';
import Results from './pages/Results';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/juego" element={<Game />} />
        <Route path="/resultados" element={<Results />} />
      </Routes>
    </Router>
  );
}
export default App;
