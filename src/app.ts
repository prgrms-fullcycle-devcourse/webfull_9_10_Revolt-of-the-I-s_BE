import express, { Request, Response } from "express";
import { setupSwagger } from "./utils/swagger";
import apiRouter from "./routes/route";

const app: import("express").Express = express();

app.use(express.json());
setupSwagger(app);
app.use(apiRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("🚀 i-Station API Server is Running with pnpm!");
});

export default app;
