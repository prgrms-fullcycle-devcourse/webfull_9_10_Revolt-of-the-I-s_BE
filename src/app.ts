// 미들웨어와 라우팅을 하는 공간
import express, { Request, Response, Express } from "express";
import { setupSwagger } from "./utils/swagger";
import apiRouter from "./routes/route";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(cookieParser());
app.use(express.json());
app.use(apiRouter);
setupSwagger(app);

app.get("/", (req: Request, res: Response) => {
  res.send("🚀 i-Station API Server is Running!");
});

export default app;
