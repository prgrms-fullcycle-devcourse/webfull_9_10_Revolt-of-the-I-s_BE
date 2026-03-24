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

const router: import("express").Router = express.Router();

// GET
router.get("/teams/:teamId/tasks", getTasksByTeam);
router.get("/tasks/:taskId", getTaskDetail);
router.get("/tasks/:teamId/logs", getTeamLogs);

// POST
router.post("/teams/:teamId/tasks", createTask);
router.post("/tasks/:taskId/comments", createComment);

// PATCH
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.patch("/tasks/comments/:commentId", updateComment);

// DELETE
router.delete("/tasks/:taskId", deleteTask);
router.delete("/tasks/comments/:commentId", deleteComment);

export default router;
