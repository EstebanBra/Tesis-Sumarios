import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173", 
}));

app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong desde backend JS 🚀" });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
