import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.API_PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
