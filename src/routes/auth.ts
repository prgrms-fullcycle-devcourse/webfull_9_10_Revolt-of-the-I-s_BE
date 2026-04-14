import { Router, Request, Response, NextFunction } from "express";
import catchAsync, { AppError } from "../utils/response";
import * as userService from "../services/userService";
import { z } from 'zod';
import { validate } from "../utils/validators";
import { upload } from "../utils/s3";
import { authMiddleware } from "../utils/auth";

const router: Router = Router();

const signupSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  name: z.string().min(1, "이름은 필수입니다."),
  phone: z.string().min(10, "전화번호 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.")
    .regex(/[a-zA-Z]/, "영문자가 포함되어야 합니다.")
    .regex(/[0-9]/, "숫자가 포함되어야 합니다."),
});

// --- [회원가입] ---
router.post("/signup",
  upload.single('profileImage'),
  validate(signupSchema),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => { 
    const userData = req.body;
    const file = req.file

    const result = await userService.signup(userData, file);


    if (typeof result === "string") {
      return res.status(201).json({
        success: true,
        data: {
          uuid: result,
        },
        error: null,
      });
    }
    throw new AppError(500, "예기치 못한 오류가 발생했습니다.");
  }), 
);

// --- [로그인] ---
router.post("/login", catchAsync(async (req: Request, res: Response) => {
    const result = await userService.login(req.body);

    if ("token" in result) {
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 3600000,
      });

      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: {
            uuid: result.user.uuid,
            email: result.user.email,
            name: result.user.name,
            profile_image: result.user.profile_image,
          },
          meta: null,
        },
        error: null,
      });
    }

    throw new AppError(401, "오류가 발생했습니다.");
  }),
);

// --- [로그아웃] ---
router.post("/logout", catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.accessToken
    if (!token) {
        throw new AppError(400, "인증 정보가 없습니다.");
    }
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      error: null,
    });
  }),
);

// --- [구글세션] ---
router.post("/google", catchAsync(async (req: Request, res: Response) => {
    const { googleToken } = req.body;

    const result = await userService.googleLogin(googleToken);

    if (!result.isNewUser) {
            res.cookie("accessToken", result.token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 3600000,
            });
            return res.status(200).json({
                success: true,
                isNewUser: false,
                data: {
                    token: result.token,
                    user: result.user
                }
            });
        }
    return res.status(200).json({
        success: true,
        isNewUser: true,
        data: {
            user: result.user 
        }
    });
  })
);

// --- [구글 회원가입] ---
router.post("/google/signup", 
  upload.single('profileImage'),
  catchAsync(async (req: Request, res: Response) => {
    const userData = req.body;
    const file = req.file;

    const result = await userService.googleSignup(userData, file);

    res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 3600000,
    });

    return res.status(201).json({
        success: true,
        data: result
    });
}));

export default router;

