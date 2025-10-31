import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CardOption from "../components/CardOption";
import Button from "../components/Button";

export default function TipoDenuncia() {
  const [opt, setOpt] = useState<"victima" | "testigo" | "grupo" | null>(null);
  const navigate = useNavigate();

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, margin: "16px 0" }}>¿Quién presenta la denuncia?</h1>

      <CardOption
        title="Yo soy la víctima"
        subtitle="Estoy denunciando hechos que me afectaron directamente."
        selected={opt === "victima"}
        onClick={() => setOpt("victima")}
      />
      <CardOption
        title="Yo soy testigo"
        subtitle="Estoy denunciando por otra persona que fue afectada."
        selected={opt === "testigo"}
        onClick={() => setOpt("testigo")}
      />
      <CardOption
        title="Denuncia en grupo"
        subtitle="Somos varias personas presentando esta denuncia."
        selected={opt === "grupo"}
        onClick={() => setOpt("grupo")}
      />

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button variant="ghost" onClick={() => navigate("/")}>Volver</Button>
        <Button
          onClick={() => {
            // Para el demo seguimos el caso "soy víctima":
            navigate("/denuncia/denunciante");
          }}
          disabled={!opt}
          title={!opt ? "Selecciona una opción" : ""}
        >
          Continuar
        </Button>
      </div>
    </section>
  );
}
