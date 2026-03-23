import { Request, Response } from 'express';
import { teamRepository } from '../repositories/teamRepository';

// GET /teams - 팀 목록 전체 조회
const getAllTeams = async (req: Request, res: Response) => {};
 
// POST /teams - 팀 생성
const createTeam = async (req: Request, res: Response) => {};
 
// DELETE /teams/:teamId/members/me - 팀 탈퇴
const leaveTeam = async (req: Request, res: Response) => {};

// DELETE /teams/:teamId - 팀 삭제
const deleteTeam = async (req: Request, res: Response) => {};
 
// POST /teams/:teamId/members - 팀 가입 / 입장
const joinTeam = async (req: Request, res: Response) => {};
 
// PATCH /teams/:teamId/members/me/position - 포지션 수정
const updatePosition = async (req: Request, res: Response) => {};
 
// GET /teams/:teamId/members/active - 활동 중인 팀원 목록
const getActiveMembers = async (req: Request, res: Response) => {};

export {
    getAllTeams,
    createTeam,
    leaveTeam,
    deleteTeam,
    joinTeam,
    updatePosition,
    getActiveMembers
}
