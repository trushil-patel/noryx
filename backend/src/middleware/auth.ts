import { Request, Response, NextFunction } from "express";
import { supabaseAuth } from "../config/supabase.js";
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
  };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is missing",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing",
      });
    }

    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}