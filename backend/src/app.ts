import express from "express";
import cors from "cors";

import healthRoute from "./routes/health.js";
import testDbRoute from "./routes/test-db.js"; 
import authRoute from "./routes/auth.js";
import knowledgeRoutes from "./routes/knowledge.js";
import aiTestRoute from "./routes/ai-test.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoute);
app.use("/api/test-db", testDbRoute);
app.use("/api/auth", authRoute);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/ai-test", aiTestRoute);
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to Memora Backend 🚀",
  });
});

export default app;