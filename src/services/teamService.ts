import { Request, Response } from 'express';
import catchAsync, { ERROR } from '../utils/error';

import { 
    findAllWithMembers,
    insertTeam,
    updateMemberPosition,
    findActiveMembers,
    removeTeam, 
    findTeamByName,
    findTeamByTeamId,
    findTeamMember,
    insertTeamMember
} from '../repositories/teamRepository';

// GET /teams - 팀 목록 전체 조회
const getAllTeams = catchAsync(async(req: Request, res: Response) => {
    // 우선 userId 임의로 받음
    const userId = req.body.userId;
    const rows = await findAllWithMembers(userId);

    const teamsMap = rows.reduce((acc: any, row: any) => {
        if(!acc[row.team_uuid]) { // 팀이 아직 맵이 없으면 바로 생성
            acc[row.team_uuid] = {
                uuid: row.team_uuid,
                name: row.team_name,
                owner_id: row.owner_id,
                isMember: row.is_member === 1,
                members: [] 
            };
        }
        // 팀이 이미 맵에 있으면 멤버 정보를 추가
        if(row.member_uuid) {
            acc[row.team_uuid].members.push({
                uuid: row.member_uuid,
                team_id: row.team_uuid,
                user_id: row.user_uuid,
                position: row.position,
                status: row.status,
                user: {
                    uuid: row.user_uuid,
                    email: row.email,
                    name: row.user_name,
                    phone: row.phone,
                    github_url: row.github_url,
                    profile_image: row.profile_image
                }
            });
        }
        return acc;
    }, {});
    res.status(200).json({ 
        success: true, 
        data: Object.values(teamsMap), 
        meta: null, 
        error: null 
    });
});
 
// POST /teams - 팀 생성
const createTeam = catchAsync(async (req: Request, res: Response) => {
    // 우선 owner_id 임의로 받음
    const {name, pin_password, owner_id} = req.body
    
    // name 중복 확인 
    const existing = await findTeamByName(name);
    if(existing){
        return res.status(409).json(ERROR.CONFLICT); 
    }

    const row = await insertTeam({
        name : name,
        pin_password : pin_password,
        owner_id : owner_id
    })

    await insertTeamMember({
        team_id: row.uuid,
        user_id: owner_id
    });

    res.status(201).json({
        success: true,
        data: row,
        meta : null,
        error: null
    })
});
 
// DELETE /teams/:teamId/members/me - 팀 탈퇴
const leaveTeam = catchAsync(async (req: Request, res: Response) => {

});

// DELETE /teams/:teamId - 팀 삭제
const deleteTeam = catchAsync(async (req: Request, res: Response) => {
    const teamId = parseInt(req.params.teamId as string);
    const existing = await findTeamByTeamId(teamId);
    //teamId 없을 때 
    if(!existing){
        return res.status(404).json(ERROR.NOT_FOUND);
    }
    await removeTeam(teamId);
    res.status(200).json({
        success: true,
        data: {
            message : "성공적으로 처리되었습니다."
        },
        meta: null,
        error: null
    })
});

// POST /teams/:teamId/members - 팀 가입 / 입장
const joinTeam = catchAsync(async (req: Request, res: Response) => {
    // 우선 userId 임의로 받음
    const userId = req.body.userId;
    const teamId = parseInt(req.params.teamId as string);
    const {password} = req.body;

    //teamId 없을 때
    const team = await findTeamByTeamId(teamId);
    if(!team){
        return res.status(404).json(ERROR.NOT_FOUND);
    }

    //가입된 팀인지 
    const member = await findTeamMember(teamId, userId);
    if(member) {
        return res.status(200).json({
                success: true,
                data: {
                    message : "성공적으로 처리되었습니다."
                },
                meta: null,
                error: null
            })
    }

    //가입하는데 비밀번호 입력을 안함 
    if(!password) {
        return res.status(403).json({                
            success: false,
            data: null,
            meta: null,
            error: "비밀번호가 필요합니다."
        })
    }

    if(team.pin_password !== password) {
        return res.status(403).json(ERROR.FORBIDDEN)
    }

    await insertTeamMember({
        team_id: teamId,
        user_id: userId
    });

    res.status(200).json({
        success: true,
        data: {
            message : "성공적으로 처리되었습니다."
        },
        meta: null,
        error: null
    })
});
 
// PATCH /teams/:teamId/members/me/position - 포지션 수정
const updatePosition = catchAsync(async (req: Request, res: Response) => {

});
 
// GET /teams/:teamId/members/active - 활동 중인 팀원 목록
const getActiveMembers = catchAsync(async (req: Request, res: Response) => {

});

export {
    getAllTeams,
    createTeam,
    leaveTeam,
    deleteTeam,
    joinTeam,
    updatePosition,
    getActiveMembers
}
