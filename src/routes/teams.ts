import express from 'express';
import {
  getAllTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  updatePosition,
  getActiveMembers,
  getTeamMembers,
} from '../services/teamService';
import { authMiddleware } from "../utils/auth";
import { teamMemberMiddleware } from "../utils/teamMember";
 
const router: import("express").Router = express.Router();

router.use(authMiddleware);

// GET
router.get('/', getAllTeams);
router.get('/:teamId/members', teamMemberMiddleware, getTeamMembers);
router.get('/:teamId/members/active', teamMemberMiddleware, getActiveMembers);

// POST
router.post('/', createTeam);
router.post('/:teamId/members/join', joinTeam);

// PATCH
router.patch('/:teamId/members/me/position', teamMemberMiddleware, updatePosition);

// DELETE
router.delete('/:teamId/members/me', teamMemberMiddleware, leaveTeam);

export default router;
