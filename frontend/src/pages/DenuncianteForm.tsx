import { useNavigate } from "react-router-dom";
import FormGroup from "../components/FormGroup";
import Button from "../components/Button";

export default function DenuncianteForm() {
  const navigate = useNavigate();

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, margin: "16px 0" }}>Datos de la persona denunciante</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/denuncia/detalles");
        }}
      >
        <FormGroup label="Nombre completo" htmlFor="denunciante_nombre">
          <input id="denunciante_nombre" type="text" placeholder="Ej. Ana Pérez" style={inputStyle} required />
        </FormGroup>

        <FormGroup label="RUT" htmlFor="denunciante_rut" hint="Ej. 12.345.678-9">
          <input id="denunciante_rut" type="text" placeholder="12.345.678-9" style={inputStyle} required />
        </FormGroup>

        <FormGroup label="Correo electrónico" htmlFor="denunciante_email">
          <input id="denunciante_email" type="email" placeholder="ana.perez@ejemplo.com" style={inputStyle} required />
        </FormGroup>

        <FormGroup label="Teléfono" htmlFor="denunciante_tel">
          <input id="denunciante_tel" type="tel" placeholder="+56 9 1234 5678" style={inputStyle} />
        </FormGroup>

        <FormGroup label="Campus / Sede" htmlFor="denunciante_sede">
          <select id="denunciante_sede" style={inputStyle}>
            <option>Concepción</option>
            <option>Chillán</option>
          </select>
        </FormGroup>

        <FormGroup label="Unidad / Carrera" htmlFor="denunciante_unidad">
          <input id="denunciante_unidad" type="text" placeholder="Ej. Ingeniería Civil Informática" style={inputStyle} />
        </FormGroup>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button variant="ghost" onClick={() => navigate("/denuncia/tipo")} type="button">Volver</Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
};
