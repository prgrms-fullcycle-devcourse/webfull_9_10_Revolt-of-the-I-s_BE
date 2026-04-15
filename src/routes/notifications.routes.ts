// src/routes/notifications.ts
import express from "express";
import {
  getNotifications,
  getUnreadNotifications,
  readNotification,
  readAllNotifications,
} from "../services/notification.service";
import { authMiddleware } from "../utils/middlewares/auth";

const router: import("express").Router = express.Router();

// GET
router.get("/notifications/unread", authMiddleware, getUnreadNotifications);
router.get("/notifications", authMiddleware, getNotifications);

// PATCH
router.patch("/notifications/read-all", authMiddleware, readAllNotifications);
router.patch(
  "/notifications/:notificationId/read",
  authMiddleware,
  readNotification,
);

export default router;
