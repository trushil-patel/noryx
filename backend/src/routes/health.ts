import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Memora Backend",
    status: "Healthy",
  });
});

export default router;