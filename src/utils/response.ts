import { Request, Response, NextFunction, RequestHandler } from "express";

const catchAsync = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// 성공 응답
export const SUCCESS = (data: any = null) => ({
  success: true,
  data,
  meta: null,
  error: null,
});

// task 상태값 동적 에러
export const INVALID_STATUS_ERROR = (message: string) => ({
  success: false,
  data: null,
  meta: null,
  error: message,
});

// 에러 응답
export const ERROR = {
  UNAUTHORIZED: {
    success: false,
    data: null,
    meta: null,
    error: "인증 토큰이 없거나 유효하지 않습니다",
  },
  FORBIDDEN: {
    success: false,
    data: null,
    meta: null,
    error: "해당 작업에 대한 권한이 없습니다",
  },
  NOT_FOUND: {
    success: false,
    data: null,
    meta: null,
    error: "요청한 리소스를 찾을 수 없습니다",
  },
  CONFLICT: {
    success: false,
    data: null,
    meta: null,
    error: "이미 존재하는 리소스입니다",
  },
  ErrorResponse: {
    success: false,
    data: null,
    meta: null,
    error: "오류가 발생했습니다",
  },
  BAD_REQUEST: {
    success: false,
    data: null,
    meta: null,
    error: "오류가 발생했습니다",
  },
  INTERNAL_SERVER_ERROR: {
    success: false,
    data: null,
    meta: null,
    error: "서버 오류가 발생했습니다.",
  },
  INVALID_ID: {
    success: false,
    data: null,
    meta: null,
    error: "유효하지 않은 ID입니다.",
  },
};

export default catchAsync;
