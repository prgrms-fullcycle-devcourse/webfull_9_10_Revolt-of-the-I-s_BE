import express from "express";
import authRouter from "./auth.routes";
import usersRouter from "./users.routes";
import teamsRouter from "./teams.routes";
import tasksRouter from "./tasks.routes";
import archivesRouter from "./archive.routes";
import notificationsRouter from "./notifications.routes";

const router: import("express").Router = express.Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/teams", teamsRouter);
router.use(tasksRouter);
router.use(archivesRouter);
router.use(notificationsRouter);

export default router;
