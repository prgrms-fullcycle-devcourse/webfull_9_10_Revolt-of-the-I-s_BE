import express from "express";
import {
  getTasksByTeam,
  createTask,
  getTaskDetail,
  deleteTask,
  updateTaskStatus,
  createComment,
  updateComment,
  deleteComment,
  getTeamLogs,
} from "../services/taskService";
import { authMiddleware } from "../utils/auth";

const router: import("express").Router = express.Router();

// GET
router.get("/teams/:teamId/tasks", authMiddleware, getTasksByTeam);
router.get("/tasks/:teamId/logs", authMiddleware, getTeamLogs);
router.get("/tasks/:taskId", authMiddleware, getTaskDetail);

// POST
router.post("/teams/:teamId/tasks", authMiddleware, createTask);
router.post("/tasks/:taskId/comments", authMiddleware, createComment);

// PATCH
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.patch("/tasks/comments/:commentId", authMiddleware, updateComment);

// DELETE
router.delete("/tasks/:taskId", authMiddleware, deleteTask);
router.delete("/tasks/comments/:commentId", authMiddleware, deleteComment);

export default router;
