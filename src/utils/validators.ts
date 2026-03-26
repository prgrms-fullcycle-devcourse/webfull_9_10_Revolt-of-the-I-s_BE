import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from 'zod';

export enum UserStatus {
  ACTIVE = '업무 중',
  REST = '휴식 중',  
  AWAY = '자리비움'
}

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
      if (error instanceof ZodError) {
       
        const errorMessage = error.issues
          .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');

        const customError: any = new Error(errorMessage);
        customError.statusCode = 400;
        
        return next(customError);
      }
      next(error);
    }
  };
};
// 팀 이름 유효성 검사 (2자 ~ 30자)
export const isValidTeamName = (name: any): boolean => {
  if (!isValidString(name)) return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 30; 
};

// PIN 번호 유효성 검사 (숫자 6자리)
export const isValidPin = (pin: any): boolean => {
  if (!isValidString(pin)) return false;
  const pinRegex = /^\d{6}$/; 
  return pinRegex.test(pin);
};

// 포지션 유효성 검사 (최대 20자)
export const isValidPosition = (position: any): boolean => {
  if (!isValidString(position)) return false;
  return position.trim().length <= 20; 
};