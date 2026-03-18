import { Router } from 'express';

const router = Router();

// GET
router.get('/', () => {});
router.get('/:teamId/members/active', () => {});

// POST
router.post('/', () => {});
router.post('/:teamId/members', () => {});

// PATCH
router.patch('/:teamId/members/me/position', () => {});

// DELETE
router.delete('/:teamId', () => {});
router.delete('/:teamId/members/me', () => {});

export default router;
