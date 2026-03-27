import express, { Request, Response, Express } from "express";
import cors from "cors";
import { setupSwagger } from "./utils/swagger";
import apiRouter from "./routes/route";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173", // 로컬 프론트엔드 개발 주소
      "https://i-station.onrender.com", // 백엔드 배포 주소
      "https://webfull-9-10-revolt-of-the-i-s-fe-e.vercel.app/", // 프론트 vercel
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(apiRouter);
setupSwagger(app);

app.get("/", (req: Request, res: Response) => {
  res.send("🚀 i-Station API Server is Running!");
});

export default app;
