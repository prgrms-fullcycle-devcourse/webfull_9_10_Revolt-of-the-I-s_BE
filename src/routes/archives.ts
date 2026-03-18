import { Router } from 'express';

const router = Router();

// Meeting
router.get('/teams/:teamId/archives/meeting', () => {});
router.post('/teams/:teamId/archives/meeting', () => {});
router.get('/archives/meeting/:archiveId', () => {});
router.patch('/archives/meeting/:archiveId', () => {});
router.delete('/archives/meeting/:archiveId', () => {});

// Links
router.get('/teams/:teamId/archives/links', () => {});
router.post('/teams/:teamId/archives/links', () => {});
router.delete('/archives/links/:linkId', () => {});

// Documents
router.get('/teams/:teamId/archives/documents', () => {});
router.post('/teams/:teamId/archives/documents', () => {});
router.delete('/archives/documents/:docId', () => {});

export default router;
