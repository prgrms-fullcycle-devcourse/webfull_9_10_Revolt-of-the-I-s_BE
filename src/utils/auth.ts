import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uuid: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      meta: null,
      error: "인증 토큰이 없거나 유효하지 않습니다",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      uuid: string;
      id?: string;
      email: string;
    };
    req.user = {
      uuid: decoded.uuid ?? decoded.id!,
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: null,
      meta: null,
      error: "인증 토큰이 없거나 유효하지 않습니다",
    });
  }
};
