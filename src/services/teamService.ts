import { Request, Response, NextFunction } from "express";
import catchAsync, { ERROR, SUCCESS, AppError } from "../utils/response";
import bcrypt from "bcrypt";
import * as v from "../utils/validators";
import { StatusCodes } from "http-status-codes";
import { createTeamWithMember, leaveTeamTransaction } from "./dbService";
import {
  findAllWithMembers,
  updateMemberPosition,
  findActiveMembers,
  findTeamByName,
  findTeamByTeamId,
  findTeamMember,
  insertTeamMember,
  findMembersByTeamId,
} from "../repositories/teamRepository";

// GET /teams - 팀 목록 전체 조회
export const getAllTeams = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.uuid;
  const rows = await findAllWithMembers(userId);

  const teamsMap = rows.reduce((acc: any, row: any) => {
    if (!acc[row.team_id]) {
      // 팀이 아직 맵이 없으면 바로 생성
      acc[row.team_id] = {
        id: row.team_id,
        name: row.team_name,
        owner_id: row.owner_id,
        isMember: row.is_member === 1,
        members: [],
      };
    }
    // 팀이 이미 맵에 있으면 멤버 정보를 추가
    if (row.member_id) {
      acc[row.team_id].members.push({
        id: row.member_id,
        team_id: row.team_id,
        user_id: row.user_uuid,
        position: row.position,
        status: row.status,
        user: {
          uuid: row.user_uuid,
          email: row.email,
          name: row.user_name,
          phone: row.phone,
          github_url: row.github_url,
          profile_image: row.profile_image,
        },
      });
    }
    return acc;
  }, {});
  res.status(StatusCodes.OK).json(SUCCESS(Object.values(teamsMap)));
});

// GET /teams/:teamId/members - 특정 팀 멤버 목록 조회
export const getTeamMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teamId = req.verifiedTeamId!;
    const rows = await findMembersByTeamId(teamId);

    const members = rows.map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
      status: row.status,
      email: row.email,
      phone: row.phone,
      github_url: row.github_url,
      profile_image: row.profile_image,
    }));

    res.status(StatusCodes.OK).json(SUCCESS(members));
  }
);


// POST /teams - 팀 생성
export const createTeam = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, pin_password } = req.body;
    const owner_id = req.user!.uuid;

    // 유효성 검사
    if (!v.isValidTeamName(name)) {
      throw new AppError(400, "팀 이름은 2자 이상 30자 이하로 입력해주세요.");
    }
    if (!v.isValidPin(pin_password)) {
      throw new AppError(400, "핀 번호는 6자리 숫자여야 합니다.");
    }
    // name 중복 확인
    const team = await findTeamByName(name);
    if (team) {
      return res.status(StatusCodes.CONFLICT).json(ERROR.CONFLICT);
    }

    const hashedPin = await bcrypt.hash(pin_password, 10);

    const row = await createTeamWithMember({ name, pin_password: hashedPin, owner_id });

    res.status(StatusCodes.CREATED).json(SUCCESS(row));
  },
);

// DELETE /teams/:teamId/members/me - 팀 탈퇴
export const leaveTeam = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.uuid;
    const teamId = req.verifiedTeamId!;

    await leaveTeamTransaction(teamId, userId);
    
    res.status(200).json(SUCCESS({ message: "성공적으로 처리되었습니다." }));
  },
);

// POST /teams/:teamId/members - 팀 가입 / 입장
export const joinTeam = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.uuid;
    const teamId = parseInt(req.params.teamId as string);
    const { password } = req.body;

    if (!v.isValidId(req.params.teamId)) {
      return res.status(StatusCodes.BAD_REQUEST).json(ERROR.BAD_REQUEST);
    }
    //teamId 없을 때
    const team = await findTeamByTeamId(teamId);
    if (!team) return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);

    // 신규 가입 시 PIN 번호 검증
    if (!v.isValidPin(password)) {
      throw new AppError(400, "올바른 6자리 핀 번호를 입력해주세요.");
    }

    const isMatch = await bcrypt.compare(password, team.pin_password);

    if (!isMatch) {
      return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
    }

    const member = await findTeamMember(teamId, userId);
    if(!member) {
      await insertTeamMember({
        team_id: teamId,
        user_id: userId,
      });
    }
  
    res
      .status(StatusCodes.CREATED)
      .json(SUCCESS({ message: "성공적으로 처리되었습니다." }));
  },
);

// PATCH /teams/:teamId/members/me/position - 포지션 수정
export const updatePosition = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { position } = req.body;
    const userId = req.user!.uuid;
    const teamId = req.verifiedTeamId!;

    if (!v.isValidPosition(position)) {
      throw new AppError(400, "포지션은 1~20자 이내로 입력해주세요.");
    }

    const updatedMember = await updateMemberPosition(
      teamId,
      userId,
      position.trim(),
    );

    res.status(StatusCodes.CREATED).json(
      SUCCESS({
        id: updatedMember.id,
        user_id: updatedMember.user_id,
        position: updatedMember.position,
      }),
    );
  },
);

// GET /teams/:teamId/members/active - 활동 중인 팀원 목록
export const getActiveMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!v.isValidId(req.params.teamId))
      return res.status(400).json(ERROR.BAD_REQUEST);
    const teamId = req.verifiedTeamId!;

    const rows = await findActiveMembers(teamId);

    const activeMembers = rows.map((row) => ({
      id: row.id,
      team_id: row.team_id,
      user_id: row.user_id,
      position: row.position,
      status: row.status,
      user: {
        uuid: row.user_uuid,
        name: row.name,
        profile_image: row.profile_image,
      },
    }));

    res.status(StatusCodes.CREATED).json(SUCCESS(activeMembers));
  },
);
