import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function DetallesDenuncia() {
  const navigate = useNavigate();

  const [testigos, setTestigos] = useState([{ nombre: "", contacto: "" }]);
  const [archivos, setArchivos] = useState<File[]>([]);

  const agregarTestigo = () => {
    setTestigos([...testigos, { nombre: "", contacto: "" }]);
  };

  const handleChangeTestigo = (i: number, campo: "nombre" | "contacto", valor: string) => {
    const copia = [...testigos];
    copia[i][campo] = valor;
    setTestigos(copia);
  };

  const handleArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✅ Denuncia enviada (demo)");
    navigate("/");
  };

  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Detalles de la denuncia</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Persona denunciada */}
        <section style={section}>
          <h2 style={subtitle}>Persona denunciada</h2>
          <Input label="Nombre (si lo conoce)" placeholder="Ej. Juan Soto" />
          <Input label="Unidad / Carrera" placeholder="Ej. Dirección X o Carrera Y" />
          <Input label="Correo (opcional)" placeholder="juan.soto@ejemplo.com" />
        </section>

        {/* Clasificación */}
        <section style={section}>
          <h2 style={subtitle}>Clasificación</h2>

          <label style={labelStyle}>Tipo de denunciado</label>
          <select style={selectStyle}>
            <option>Estudiante</option>
            <option>Académico</option>
            <option>Funcionario</option>
          </select>

          <label style={labelStyle}>Ámbito normativo (referencial)</label>
          <select style={selectStyle}>
            <option>DIRGEGEN (Acoso sexual / violencia de género)</option>
            <option>Convivencia Estudiantil</option>
            <option>Estatuto Administrativo</option>
          </select>
        </section>

        {/* Relato */}
        <section style={section}>
          <h2 style={subtitle}>Relato de los hechos</h2>
          <textarea
            placeholder="Describa detalladamente los hechos..."
            rows={6}
            style={textareaStyle}
          />
        </section>

        {/* Testigos */}
        <section style={section}>
          <h2 style={subtitle}>Testigos (Opcional)</h2>
          {testigos.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Nombre completo"
                value={t.nombre}
                onChange={(e) => handleChangeTestigo(i, "nombre", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                placeholder="Teléfono o correo"
                value={t.contacto}
                onChange={(e) => handleChangeTestigo(i, "contacto", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          ))}
          <button type="button" onClick={agregarTestigo} style={addBtn}>
            + Agregar testigo
          </button>
        </section>

        {/* Evidencias */}
        <section style={section}>
          <h2 style={subtitle}>Evidencias (Opcional)</h2>

          <div style={dropzone}>
            <p>Arrastra archivos aquí o haz clic para seleccionar</p>
            <small>
              Formatos permitidos: PDF, JPG, PNG, EML, MSG<br />
              Máximo 10 MB por archivo, 50 MB total
            </small>

            <label htmlFor="evidencias">
              <Button type="button" style={{ marginTop: 12 }}>
                Seleccionar archivos
              </Button>
            </label>

            <input
              id="evidencias"
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleArchivos}
            />

            {archivos.length > 0 && (
              <ul style={{ marginTop: 12, textAlign: "left" }}>
                {archivos.map((a, i) => (
                  <li key={i}>{a.name}</li>
                ))}
              </ul>
            )}
          </div>
        </section>


        {/* Resumen */}
        <section style={section}>
          <h2 style={subtitle}>Resumen y Enrutamiento</h2>
          <div style={resumen}>
            Esta denuncia se enviará a:{" "}
            <strong>Vicerrectoría (Convivencia Estudiantil)</strong>
          </div>
        </section>

        {/* Botones */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            style={{ background: "#f3f4f6", color: "#111827" }}
          >
            ← Volver
          </Button>
          <Button type="submit">📨 Enviar denuncia</Button>
        </div>
      </form>
    </div>
  );
}

/* === COMPONENTE INPUT REUTILIZABLE === */
function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>{label}</label>
      <input type="text" placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

/* === ESTILOS === */
const section: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
};

const subtitle: React.CSSProperties = {
  marginBottom: 12,
  fontSize: 18,
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  marginTop: 8,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "10px 12px",
  width: "100%",
  fontSize: 15,
};

const selectStyle: React.CSSProperties = { ...inputStyle, width: "100%" };

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  width: "100%",
  resize: "vertical",
};

const addBtn: React.CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: 14,
};

const dropzone: React.CSSProperties = {
  border: "2px dashed #d1d5db",
  borderRadius: 8,
  padding: 20,
  textAlign: "center",
  background: "#fafafa",
};

const checkStyle: React.CSSProperties = {
  display: "block",
  marginTop: 8,
  fontSize: 15,
};

const resumen: React.CSSProperties = {
  background: "#f3f4f6",
  borderRadius: 6,
  padding: 12,
  fontSize: 15,
};
