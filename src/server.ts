// 서버 설정과 외부 서비스 초기화 담당
import dotenv from "dotenv";
dotenv.config();

import app from "./app"
import pool from "./config/db";

import { Request, Response, NextFunction } from 'express';

const PORT = process.env.PORT

interface CustomError extends Error {
  status?: number;
}

// 서버 에러 모듈
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    console.error('--- ERROR 발생 ---');
    console.error(err.stack); 

    const statusCode = err.status || 500;
    const message = err.message || "서버 내부 에러가 발생했습니다.";

    res.status(statusCode).json({
        success: false,
        message: message
    });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("🔥 DB 연결 확인 완료");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("💥 DB 연결 실패:", err);
  }
}

start();
