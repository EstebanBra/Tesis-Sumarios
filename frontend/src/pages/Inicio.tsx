import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <section style={{ display: "grid", placeItems: "center", padding: "48px 16px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Acceso al Sistema</div>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>Ingresa de forma segura para presentar tu denuncia</div>
        <Button onClick={() => navigate("/denuncia/tipo")}>Ingresar con ClaveÚnica</Button>
        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>Autenticación estatal segura (demo)</div>
      </div>
    </section>
  );
}
