import express from 'express';
import {
  getMeetingList,
  createMeeting,
  getMeetingDetail,
  updateMeeting,
  deleteMeeting,
  getLinkList,
  createLink,
  deleteLink,
  getDocumentList,
  createDocument,
  deleteDocument,
} from '../services/archiveService';
import { authMiddleware } from "../utils/auth";
import { upload } from '../utils/s3';
 
const router: import("express").Router = express.Router();


// Meeting
router.get('/teams/:teamId/archives/meeting', authMiddleware, getMeetingList);
router.post('/teams/:teamId/archives/meeting', authMiddleware, createMeeting);
router.get('/archives/:archiveId/meeting/', authMiddleware, getMeetingDetail);
router.patch('/archives/:archiveId/meeting/', authMiddleware, updateMeeting);
router.delete('/archives/:archiveId/meeting/', authMiddleware, deleteMeeting);

// Links
router.get('/teams/:teamId/archives/links', authMiddleware, getLinkList);
router.post('/teams/:teamId/archives/links', authMiddleware, createLink);
router.delete('/archives/:linkId/links/', authMiddleware, deleteLink);

// Documents
router.get('/teams/:teamId/archives/documents', authMiddleware, getDocumentList);
router.post('/teams/:teamId/archives/documents',authMiddleware, upload.single('file'), createDocument);
router.delete('/archives/:docId/documents/', authMiddleware, deleteDocument);

export default router;
