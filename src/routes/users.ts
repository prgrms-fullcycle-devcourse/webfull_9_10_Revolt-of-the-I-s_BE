import express from "express";
import catchAsync from "../utils/response";
import * as userService from "../services/userService";
import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../utils/auth";

const router: import("express").Router = express.Router();

// GET
router.get("/me", authMiddleware, catchAsync(async (req: any, res: Response) => {

    const user = req.user;

    return res.status(200).json({
      success: true,
      data: {
        uuid: user?.uuid,
        email: user?.email,
      },
      error: null,
    });
  })
);

// PATCH
router.patch("/me/status", catchAsync(async() => {

    })
);

export default router;
