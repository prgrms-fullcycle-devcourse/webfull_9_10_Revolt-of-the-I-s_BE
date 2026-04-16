import pool from '../config/db';

type ArchiveType = 'LINK' | 'NOTE' | 'PDF';


// 팀 + 타입별으로 목록 조회
export const findByTeamIdAndType = async (teamId: number, type: ArchiveType) => {
    const sql =`
      SELECT id, team_id, type, title, content, created_at
      FROM archives
      WHERE team_id = $1 AND type = $2
      ORDER BY created_at DESC;
    `
    const result = await pool.query(sql, [teamId, type]);
    return result.rows
};

// 단건 조회
export const findById = async (archiveId: number) => {
    const sql = `SELECT * FROM archives WHERE id = $1;`;
    const result = await pool.query(sql, [archiveId]);
    return result.rows[0];
}

// 생성
export const create = async (data: {
    team_id: number;
    type: ArchiveType;
    title: string;
    content: string;
}) => {
    const sql = `
      INSERT INTO archives (team_id, type, title, content) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, team_id, type, title, content, created_at;
    `;
    const result = await pool.query(sql, [data.team_id, data.type, data.title, data.content]);
    return result.rows[0];
}

// 수정
export const update = async (archiveId: number, data: { title?: string; content?: string; version: number }) => {
    const sql = `
        UPDATE archives 
        SET title = COALESCE($1, title), 
            content = COALESCE($2, content),
            version = version + 1
        WHERE id = $3 AND version = $4
        RETURNING id, team_id, type, title, content, created_at, version;
    `;
    const result = await pool.query(sql, [data.title, data.content, archiveId, data.version]);
    return result.rows[0];
}

// 회의록 삭제 (버전포함)
export const deleteMeetingById = async (archiveId: number, version: number) => {
  const sql = `DELETE FROM archives WHERE id = $1 AND version = $2 RETURNING id;`;
  const result = await pool.query(sql, [archiveId, version]);
  return result.rows[0];
}

// 문서, 링크 삭제 
export const deleteById = async (archiveId: number) => {
  const sql = `DELETE FROM archives WHERE id = $1;`;
  return await pool.query(sql, [archiveId]);
}

