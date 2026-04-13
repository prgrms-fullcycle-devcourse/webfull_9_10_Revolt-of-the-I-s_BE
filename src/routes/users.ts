import express from "express";
import catchAsync, { AppError } from "../utils/response";
import * as userService from "../services/userService";
import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../utils/auth";
import { UserStatus } from "../utils/validators"
import { upload } from "../utils/s3";

const router: import("express").Router = express.Router();

// GET
router.get("/me", authMiddleware, catchAsync(async (req: any, res: Response) => {

    const user = req.user;

    return res.status(200).json({
      success: true,
      data: {
        uuid: user?.uuid,
        email: user?.email,
        name: user?.name,
      },
      error: null,
    });
  })
);

// PATCH
router.patch("/me/status", authMiddleware, catchAsync(async(req: any, res: Response) => {
    const { status, teamId } = req.body;  
    const { uuid } = req.user;

    const isValidStatus = Object.values(UserStatus).includes(status as UserStatus);

    if (!isValidStatus) {
        throw new AppError(400, `유효하지 않은 상태 값입니다.`);
    }
    const result = await userService.status(uuid, teamId, status);

    if (!result) {
        throw new AppError(404, "해당 유저를 찾을 수 없습니다.");
    }

    return res.status(200).json({
        success: true,
        data: result,
        error: null,
    });
}));

// 프로필 이미지 수정
router.patch("/profile/image",
    authMiddleware,
    upload.single('profileImage'), 
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  
        const user = req.user; 
        const file = req.file;

        const result = await userService.updateProfileImage(user!.uuid, file);

        return res.status(200).json(result);
    })
);

export default router;
