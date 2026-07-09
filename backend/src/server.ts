import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("");
  console.log("==================================");
  console.log("🚀 MEMORA BACKEND STARTED");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("==================================");
  console.log("");
});

