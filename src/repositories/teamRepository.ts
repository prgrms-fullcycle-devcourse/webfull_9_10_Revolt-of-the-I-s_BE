import pool from '../config/db';

export const teamRepository = {
    //팀 목록 전체 조회 (팀 목록 포함)
    findAllWithMembers: async () => {
    },

    // 팀 생성
    createTeam: async (data: {
        name: string;
        pin_password: string;
        owner_id: number;
    }) => {
    },
    
    // 포지션 수정
    updateMemberPosition: async (teamId: number, userId: number, position: string) => {
    },
    
    // 활동 중인 멤버 조회 
    findActiveMembers: async (teamId: number) => {
    },

    // 팀 삭제
    deleteTeam: async (teamId: number) => {
    }

}