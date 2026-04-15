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
} from '../services/archive.service';
import { authMiddleware } from "../utils/middlewares/auth";
import { teamMemberMiddleware } from "../utils/middlewares/teamMember";

import { upload } from '../utils/helpers/s3';
 
const router: import("express").Router = express.Router();


// Meeting
router.get('/teams/:teamId/archives/meeting', authMiddleware, teamMemberMiddleware, getMeetingList);
router.post('/teams/:teamId/archives/meeting', authMiddleware, teamMemberMiddleware, createMeeting);
router.get('/archives/:archiveId/meeting/', authMiddleware, teamMemberMiddleware, getMeetingDetail);
router.patch('/archives/:archiveId/meeting/', authMiddleware, teamMemberMiddleware, updateMeeting);
router.delete('/archives/:archiveId/meeting/', authMiddleware, teamMemberMiddleware, deleteMeeting);

// Links
router.get('/teams/:teamId/archives/links', authMiddleware, teamMemberMiddleware, getLinkList);
router.post('/teams/:teamId/archives/links', authMiddleware, teamMemberMiddleware, createLink);
router.delete('/archives/:linkId/links/', authMiddleware, teamMemberMiddleware, deleteLink);

// Documents
router.get('/teams/:teamId/archives/documents', authMiddleware, teamMemberMiddleware, getDocumentList);
router.post('/teams/:teamId/archives/documents',authMiddleware, teamMemberMiddleware, upload.single('file'), createDocument);
router.delete('/archives/:docId/documents/', authMiddleware, teamMemberMiddleware, deleteDocument);

export default router;
