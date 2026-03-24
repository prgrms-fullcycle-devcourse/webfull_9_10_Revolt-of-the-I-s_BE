// 미들웨어와 라우팅을 하는 공간
import express, { Request, Response, Express } from "express";
import { setupSwagger } from "./utils/swagger";
import apiRouter from "./routes/route";

const app: Express = express();

app.use(express.json());
app.use(apiRouter);
setupSwagger(app);

app.get("/", (req: Request, res: Response) => {
  res.send("🚀 i-Station API Server is Running!");
});

export default app;