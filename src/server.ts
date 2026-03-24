// 서버 설정과 외부 서비스 초기화 담당
import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import app from "./app"
import "./config/db"
// import "./config/pusher"
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

app.listen(PORT, () => {
  console.log(`
  ################################################
  🛡️  Server listening on port: ${PORT}
  ################################################
  `)
})
