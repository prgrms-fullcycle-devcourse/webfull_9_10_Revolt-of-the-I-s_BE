import { Router } from 'express';

const router = Router();

// GET
router.get('/teams/:teamId/tasks', () => {});
router.get('/tasks/:taskId', () => {});
router.get('/tasks/:teamId/logs', () => {});

// POST
router.post('/teams/:teamId/tasks', () => {});
router.post('/tasks/:taskId/comments', () => {});

// PATCH
router.patch('/tasks/:taskId/status', () => {});
router.patch('/tasks/comments/:commentId', () => {});

// DELETE
router.delete('/tasks/:taskId', () => {});
router.delete('/tasks/comments/:commentId', () => {});

export default router;
