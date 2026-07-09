import { Router } from "express";
import { testGeminiConnection } from "../services/gemini.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await testGeminiConnection();

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gemini test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;