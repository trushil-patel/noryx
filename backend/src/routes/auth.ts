import { Router, Request, Response } from "express";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/me",
  authenticate,
  (req: Request, res: Response) => {
    return res.json({
      success: true,
      user: (req as AuthenticatedRequest).user,
    });
  }
);

export default router;