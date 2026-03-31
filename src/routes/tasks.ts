import express from "express";
import {
  getTasksByTeam,
  createTask,
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
} from "../services/taskService";
import { authMiddleware } from "../utils/auth";
import { teamMemberMiddleware } from "../utils/teamMember";

const router: import("express").Router = express.Router();

router.use(authMiddleware);

// GET
router.get("/teams/:teamId/tasks", getTasksByTeam);
router.get("/tasks/:teamId/logs", getTeamLogs);
router.get("/tasks/:taskId", teamMemberMiddleware, getTaskDetail);

// POST
router.post("/teams/:teamId/tasks", createTask);
router.post("/tasks/:taskId/comments", teamMemberMiddleware, createComment);
router.post("/tasks/:taskId/accept", teamMemberMiddleware, acceptTask);
router.post("/tasks/:taskId/submit", teamMemberMiddleware, submitTask);
router.post("/tasks/:taskId/confirm", teamMemberMiddleware, confirmTask);
router.post("/tasks/:taskId/reject", teamMemberMiddleware, rejectTask);

// PATCH
router.patch("/tasks/comments/:commentId", teamMemberMiddleware, updateComment);

// DELETE
router.delete(
  "/tasks/comments/:commentId",
  teamMemberMiddleware,
  deleteComment,
);
router.delete("/tasks/:taskId", teamMemberMiddleware, deleteTask);

export default router;
