import express from 'express';
import {
  getAllTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  updatePosition,
  getActiveMembers,
} from '../services/teamService';
import { authMiddleware } from "../utils/auth";
import { teamMemberMiddleware } from "../utils/teamMember";
 
const router: import("express").Router = express.Router();

router.use(authMiddleware);

// GET
// 팀 목록 전체 조회 
router.get('/', teamMemberMiddleware, getAllTeams);

// 홣동 중인 팀원 목록
router.get('/:teamId/members/active', teamMemberMiddleware, getActiveMembers);

// POST
// 팀 생성
router.post('/', teamMemberMiddleware, createTeam);

// 팀 가입/입장
router.post('/:teamId/members', teamMemberMiddleware, joinTeam);

// PATCH
// 팀내 포지션 수정 
router.patch('/:teamId/members/me/position', teamMemberMiddleware, updatePosition);

// 팀 탈퇴
router.delete('/:teamId/members/me', teamMemberMiddleware, leaveTeam);

export default router;
