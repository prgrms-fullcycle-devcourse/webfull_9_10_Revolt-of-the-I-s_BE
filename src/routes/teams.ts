import express from 'express';
import {
  getAllTeams,
  createTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  updatePosition,
  getActiveMembers,
} from '../services/teamService';
 
const router: import("express").Router = express.Router();

// GET
// 팀 목록 전체 조회 
router.get('/', getAllTeams);

// 홣동 중인 팀원 목록
router.get('/:teamId/members/active', getActiveMembers);

// POST
// 팀 생성
router.post('/', createTeam);

// 팀 가입/입장
router.post('/:teamId/members', joinTeam);

// PATCH
// 팀내 포지션 수정 
router.patch('/:teamId/members/me/position', updatePosition);

// DELETE
// 팀 삭제
router.delete('/:teamId', deleteTeam);

// 팀 탈퇴
router.delete('/:teamId/members/me', leaveTeam);

export default router;
