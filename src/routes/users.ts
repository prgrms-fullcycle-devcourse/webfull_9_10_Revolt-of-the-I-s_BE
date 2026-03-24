import express from "express";

const router: import("express").Router = express.Router();

// GET
router.get("/me", () => {});

// PATCH
router.patch("/me/status", () => {});

export default router;
