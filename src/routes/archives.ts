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
 
const router: import("express").Router = express.Router();

// Meeting
router.get('/teams/:teamId/archives/meeting', getMeetingList);
router.post('/teams/:teamId/archives/meeting', createMeeting);
router.get('/archives/meeting/:archiveId', getMeetingDetail);
router.patch('/archives/meeting/:archiveId', updateMeeting);
router.delete('/archives/meeting/:archiveId', deleteMeeting);

// Links
router.get('/teams/:teamId/archives/links', getLinkList);
router.post('/teams/:teamId/archives/links', createLink);
router.delete('/archives/links/:linkId', deleteLink);

// Documents
router.get('/teams/:teamId/archives/documents', getDocumentList);
router.post('/teams/:teamId/archives/documents', createDocument);
router.delete('/archives/documents/:docId', deleteDocument);

export default router;
