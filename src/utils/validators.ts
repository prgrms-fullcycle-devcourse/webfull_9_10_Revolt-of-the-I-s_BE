import { Request, Response, NextFunction } from "express";

// ID 유효성 검사
// teamId, taskId, commentId
export const isValidId = (id: string | string[] | undefined): boolean => {
  return !!id && !Array.isArray(id) && !isNaN(Number(id));
};

// 문자열 유효성 검사
// title, content
export const isValidString = (value: any): boolean => {
  return !!value && typeof value === "string" && value.trim() !== "";
};

// 회원가입 유효성 검사
export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};