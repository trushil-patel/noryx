import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { generateKnowledgeMetadata } from "../services/knowledge-ai.js";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

const router = Router();

function detectPlatform(url: string) {
  const value = url.toLowerCase();

  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  if (value.includes("reddit.com")) return "reddit";
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("twitter.com") || value.includes("x.com")) return "twitter";
  if (value.includes("medium.com") || value.includes("substack.com")) return "blog";

  return "article";
}

router.get("/", authenticate, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const { data, error } = await supabaseAdmin
      .from("knowledge_items")
      .select(
        `
        id,
        user_id,
        original_url,
        platform,
        title,
        summary,
        key_takeaways,
        why_it_matters,
        status,
        source_type,
        created_at,
        updated_at,
        knowledge_tags (
          id,
          tag
        )
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch knowledge items error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch knowledge items",
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    return res.status(200).json({
      success: true,
      items: data ?? [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    let normalizedUrl: string;

    try {
      normalizedUrl = new URL(url).toString();
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    const platform = detectPlatform(normalizedUrl);

    const { data, error } = await supabaseAdmin
      .from("knowledge_items")
      .insert({
        user_id: user.id,
        original_url: normalizedUrl,
        platform,
        title: "Processing...",
        summary: null,
        why_it_matters: null,
        status: "processing",
        source_type: "link",
      })
      .select(
        `
        id,
        user_id,
        original_url,
        platform,
        title,
        summary,
        why_it_matters,
        status,
        source_type,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
  console.error("Create knowledge item error:", error);

  return res.status(500).json({
    success: false,
    message: "Failed to create knowledge item",
    error: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

    try {
  const metadata = await generateKnowledgeMetadata(normalizedUrl);

  const { data: updatedItem, error: updateError } = await supabaseAdmin
    .from("knowledge_items")
    .update({
      title: metadata.title,
      summary: metadata.summary,
      key_takeaways: metadata.key_takeaways,
      why_it_matters: metadata.why_it_matters,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .select(
      `
      id,
      user_id,
      original_url,
      platform,
      title,
      summary,
      key_takeaways,
      why_it_matters,
      status,
      source_type,
      created_at,
      updated_at
    `
    )
    .single();

  if (updateError) {
    console.error("AI metadata update error:", updateError);

    return res.status(201).json({
      success: true,
      item: data,
      warning: "Item saved, but AI metadata update failed",
    });
  }

  if (metadata.tags.length > 0) {
    const tagRows = metadata.tags.map((tag) => ({
      knowledge_item_id: data.id,
      tag,
    }));

    const { error: tagsError } = await supabaseAdmin
      .from("knowledge_tags")
      .insert(tagRows);

    if (tagsError) {
      console.error("Knowledge tags insert error:", tagsError);
    }
  }

  return res.status(201).json({
    success: true,
    item: updatedItem,
  });
} catch (aiError) {
  console.error("AI processing error:", aiError);

  return res.status(201).json({
    success: true,
    item: data,
    warning: "Item saved, but AI processing failed",
  });
}
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;