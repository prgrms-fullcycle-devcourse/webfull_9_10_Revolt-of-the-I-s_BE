import pool from '../config/db';

type ArchiveType = 'LINK' | 'NOTE' | 'PDF';

export const archiveRepository = {

  // 팀 + 타입으로 목록 조회
  findByTeamIdAndType: async (teamId: number, type: ArchiveType) => {
    
  },

  // 단건 조회
  findById: async (archiveId: number) => {},

  // 생성
  create: async (data: {
    team_id: number;
    type: ArchiveType;
    title: string;
    content: string;
  }) => {
    // TODO
  },

  // 수정
  update: async (archiveId: number, data: { title?: string; content?: string }) => {
    // TODO
  },

  // 삭제
  deleteById: async (archiveId: number) => {
    // TODO
  },

};