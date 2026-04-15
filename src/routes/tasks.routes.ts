import express from "express";
import {
  getTasksByTeam,
  createTask,
  updateTask,
  getTaskDetail,
  deleteTask,
  createComment,
  updateComment,
  deleteComment,
  getTeamLogs,
  acceptTask,
  submitTask,
  confirmTask,
  rejectTask,
} from "../services/task.service";
import { authMiddleware } from "../utils/middlewares/auth";
import { teamMemberMiddleware } from "../utils/middlewares/teamMember";

const router: import("express").Router = express.Router();

// GET
router.get("/teams/:teamId/tasks", authMiddleware, getTasksByTeam);
router.get("/tasks/:teamId/logs", authMiddleware, getTeamLogs);
router.get(
  "/tasks/:taskId",
  authMiddleware,
  teamMemberMiddleware,
  getTaskDetail,
);

// POST
router.post("/teams/:teamId/tasks", authMiddleware, createTask);
router.post(
  "/tasks/:taskId/comments",
  authMiddleware,
  teamMemberMiddleware,
  createComment,
);
router.post(
  "/tasks/:taskId/accept",
  authMiddleware,
  teamMemberMiddleware,
  acceptTask,
);
router.post(
  "/tasks/:taskId/submit",
  authMiddleware,
  teamMemberMiddleware,
  submitTask,
);
router.post(
  "/tasks/:taskId/confirm",
  authMiddleware,
  teamMemberMiddleware,
  confirmTask,
);
router.post(
  "/tasks/:taskId/reject",
  authMiddleware,
  teamMemberMiddleware,
  rejectTask,
);

// PATCH
router.patch(
  "/tasks/comments/:commentId",
  authMiddleware,
  teamMemberMiddleware,
  updateComment,
);
router.patch(
  "/tasks/:taskId",
  authMiddleware,
  teamMemberMiddleware,
  updateTask,
);

// DELETE
router.delete(
  "/tasks/comments/:commentId",
  authMiddleware,
  teamMemberMiddleware,
  deleteComment,
);
router.delete(
  "/tasks/:taskId",
  authMiddleware,
  teamMemberMiddleware,
  deleteTask,
);

export default router;
