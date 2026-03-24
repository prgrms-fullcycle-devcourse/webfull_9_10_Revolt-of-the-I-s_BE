import { Router, Request, Response, NextFunction } from "express";
import catchAsync from "../utils/error";
import * as userService from "../services/userService";

const router: Router = Router();

interface ServiceError {
  statusCode: number;
  message: string;
}

// --- [회원가입] ---
router.post(
  "/signup",
  catchAsync(async (req: Request, res: Response) => {
    const userData = req.body;
    const result = await userService.signup(userData);

    if (typeof result === "string") {
      return res.status(201).json({
        success: true,
        data: {
          uuid: result,
        },
        error: null,
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
    });
  }),
);

// --- [로그인] ---
router.post(
  "/login",
  catchAsync(async (req: Request, res: Response) => {
    const result = await userService.login(req.body);

    if ("token" in result) {
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600000,
      });

      return res.status(200).json({
        success: true,
        error: null,
      });
    }

    const error = result as ServiceError;
    return res.status(error.statusCode || 401).json({
      success: false,
      error: error.message || "로그인 실패",
    });
  }),
);

// --- [로그아웃] ---
router.post(
  "/logout",
  catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      error: null,
    });
  }),
);

// --- [구글세션] ---
router.post(
  "/google",
  catchAsync(async (req: Request, res: Response) => {
    const { googleToken } = req.body;

    const result = await userService.googleLogin(googleToken);

    if ("token" in result) {
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        maxAge: 3600000,
      });
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ message: "구글 로그인 실패" });
  }),
);

export default router;
