import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./pages/Inicio";
import TipoDenuncia from "./pages/TipoDenuncia";
import DenuncianteForm from "./pages/DenuncianteForm";
import DetallesDenuncia from "./pages/DetallesDenuncia";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, padding: "16px" }}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/denuncia/tipo" element={<TipoDenuncia />} />
            <Route path="/denuncia/denunciante" element={<DenuncianteForm />} />
            <Route path="/denuncia/detalles" element={<DetallesDenuncia />} />
            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
