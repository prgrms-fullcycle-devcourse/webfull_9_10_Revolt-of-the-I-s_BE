import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { StatusCodes } from "http-status-codes";
import { ERROR } from "../constants/response";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uuid: string;
        email: string;
        name: string;
        profileImage?: string;

      };
      verifiedTeamId?: number;
      taskInfo?: {
        id: number;
        task_number: number;
        team_id: number;
        status: "Todo" | "Doing" | "Done" | "Checked";
        requester_id: string;
        worker_id: string | null;
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
    return res.status(StatusCodes.UNAUTHORIZED).json(ERROR.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      uuid: string;
      id?: string;
      email: string;
      name: string;
      profileImage?: string;
    };
    req.user = {
      uuid: decoded.uuid ?? decoded.id!,
      email: decoded.email,
      name: decoded.name,
      profileImage: decoded.profileImage!
    };
    next();
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json(ERROR.UNAUTHORIZED);
  }
};
