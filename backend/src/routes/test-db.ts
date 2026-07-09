import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("knowledge_items")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to connect to database",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supabase database connected successfully 🚀",
      rows: data.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;