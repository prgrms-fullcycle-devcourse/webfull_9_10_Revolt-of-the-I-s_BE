// 서버 설정과 외부 서비스 초기화 담당
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import pool from "./config/db";

import { Request, Response, NextFunction } from "express";

const PORT = process.env.PORT;

interface CustomError extends Error {
  status?: number;
}

// 에러 핸들러
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("-------------------------------");
  console.log("메시지:", err.message);
  console.log("상태코드(statusCode):", err.statusCode);
  console.log("-------------------------------");

  const status = err.statusCode || err.status || 500;
  const message = err.message || "서버 내부 오류가 발생했습니다.";

  res.status(status).json({
    success: false,
    error: message,
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
