import express from "express";
import catchAsync from "../utils/response";
import * as userService from "../services/userService";
import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../utils/auth";
import { UserStatus } from "../utils/validators"

const router: import("express").Router = express.Router();

class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// GET
router.get("/me", authMiddleware, catchAsync(async (req: any, res: Response) => {

    const user = req.user;

    return res.status(200).json({
      success: true,
      data: {
        uuid: user?.uuid,
        email: user?.email,
      },
      error: null,
    });
  })
);

// PATCH
router.patch("/me/status", authMiddleware, catchAsync(async(req: any, res: Response) => {
    const { status } = req.body;  
    const { email } = req.user; 

    const isValidStatus = Object.values(UserStatus).includes(status as UserStatus);

    if (!isValidStatus) {
        throw new AppError(400, `유효하지 않은 상태 값입니다. 허용되는 값: ${Object.values(UserStatus).join(', ')}`);
    }
    const result = await userService.status(email, status);

    if (!result) {
        throw new AppError(404, "해당 유저를 찾을 수 없습니다.");
    }

    return res.status(200).json({
        success: true,
        data: result,
        error: null,
    });
}));

export default router;
