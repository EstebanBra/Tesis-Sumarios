import { useEffect, useState } from "react";
import { apiGet } from "./services/api";

interface PingResponse {
  message: string;
}

function App() {
  const [data, setData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PingResponse>("/api/ping")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!data) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Frontend TypeScript + Backend JS</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
