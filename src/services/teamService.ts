import { Request, Response, NextFunction } from 'express';
import catchAsync, { ERROR } from '../utils/error';
import bcrypt from 'bcrypt'; 

import { 
    findAllWithMembers,
    insertTeam,
    updateMemberPosition,
    findActiveMembers,
    removeTeam, 
    deleteTeamMember,
    countTeamMembers,
    findTeamByName,
    findTeamByTeamId,
    findTeamMember,
    insertTeamMember
} from '../repositories/teamRepository';

// GET /teams - 팀 목록 전체 조회
export const getAllTeams = catchAsync(async(req: Request, res: Response) => {
    // 우선 userId 임의로 받음
    const userId = req.user!.uuid;
    const rows = await findAllWithMembers(userId);

    const teamsMap = rows.reduce((acc: any, row: any) => {
        if(!acc[row.team_id]) { // 팀이 아직 맵이 없으면 바로 생성
            acc[row.team_id] = {
                id: row.team_id,
                name: row.team_name,
                owner_id: row.owner_id,
                isMember: row.is_member === 1,
                members: [] 
            };
        }
        // 팀이 이미 맵에 있으면 멤버 정보를 추가
        if(row.member_id) {
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
export const createTeam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 우선 owner_id 임의로 받음
    const {name, pin_password} = req.body;
    const owner_id = req.user!.uuid;
    
    // 팀 이름 길이 검증 (2자 이상 30자 이하)
    if (!name || name.trim().length < 2 || name.trim().length > 30) {
        return res.status(400).json({
            success: false,
            data: null,
            meta: null,
            error: "팀 이름은 2자 이상 30자 이하로 입력해주세요."
        });
    }

    // name 중복 확인 
    const team = await findTeamByName(name);
    if(team){
        return res.status(409).json(ERROR.CONFLICT); 
    }

    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(pin_password)) {
        return res.status(400).json({ 
            success: false, 
            data: null,
            meta: null,
            error: "핀 번호는 6자리 숫자여야 합니다." 
        });
    }

    const hashedPin = await bcrypt.hash(pin_password, 10);

    const row = await insertTeam({
        name : name,
        pin_password : hashedPin,
        owner_id : owner_id
    })

    // TODO 트랜잭션 처리..(팀 생성 후 / 멤버 insert 전 오류경우 고려)

    await insertTeamMember({
        team_id: row.id,
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
export const leaveTeam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //임의로 userId
    const userId = req.user!.uuid;
    const teamId = parseInt(req.params.teamId as string);
    
    const team = await findTeamByTeamId(teamId);
    if(!team){
        return res.status(404).json(ERROR.NOT_FOUND);    
    }
    
    const member = await findTeamMember(teamId, userId);
    if(!member){
        return res.status(403).json(ERROR.FORBIDDEN)
    }

    
    await deleteTeamMember(teamId, userId);
    
    //아무도 안남았다면 팀 삭제 
    const memberCount = await countTeamMembers(teamId);
    if (memberCount === 0) {
        await removeTeam(teamId);
    }

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
export const joinTeam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 우선 userId 임의로 받음
    const userId = req.user!.uuid;
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
        return res.status(400).json({                
            success: false,
            data: null,
            meta: null,
            error: "비밀번호가 필요합니다."
        })
    }

    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(password)) {
        return res.status(400).json({ 
            success: false, 
            data: null,
            meta: null,
            error: "핀 번호는 6자리 숫자여야 합니다." 
        });
    }

    const isMatch = await bcrypt.compare(password, team.pin_password);

    if(!isMatch) {
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
export const updatePosition = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {position} = req.body;
    const userId = req.user!.uuid;
    const teamId = parseInt(req.params.teamId as string);

    if (!position || position.trim().length === 0) {
        return res.status(400).json({
            success: false,
            data: null,
            meta: null,
            error: "포지션을 입력해주세요."
        });
    }

    if (position.length > 20) {
        return res.status(400).json({
            success: false,
            data: null,
            meta: null,
            error: "포지션은 20자 이내로 입력해주세요."
        });
    }

    //teamId 없을 때
    const team = await findTeamByTeamId(teamId);
    if(!team){
        return res.status(404).json(ERROR.NOT_FOUND);
    }

    const member = await findTeamMember(teamId, userId);
    if(!member) {
        return res.status(403).json(ERROR.FORBIDDEN);
    }

    const updatedMember = await updateMemberPosition(teamId, userId, position.trim());

    res.status(200).json({
        success: true,
        data: {
            id: updatedMember.id,
            user_id: updatedMember.user_id,
            position: updatedMember.position
        },
        meta: null,
        error: null
    });
})
 
// GET /teams/:teamId/members/active - 활동 중인 팀원 목록
export const getActiveMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const teamId = parseInt(req.params.teamId as string);
    
    const team = await findTeamByTeamId(teamId);
    if(!team){
        return res.status(404).json(ERROR.NOT_FOUND);    
    }

    const rows = await findActiveMembers(teamId);

    const activeMembers = rows.map(row => ({
        id: row.id,
        team_id: row.team_id,
        user_id: row.user_id,
        position: row.position,
        status: row.status,
        user: {
            uuid: row.user_uuid,
            name: row.name,
            profile_image: row.profile_image
        }
    }));

    res.status(200).json({
        success: true,
        data: activeMembers,
        meta: null,
        error: null
    });
});
