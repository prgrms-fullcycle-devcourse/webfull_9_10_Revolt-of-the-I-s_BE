import { PoolClient } from 'pg';
import pool from '../config/db';

//팀 목록 전체 조회 (팀 멤버 목록 포함) 
export const findAllWithMembers = async (currentUserId: string) => {
    const sql = `
        SELECT 
            t.id AS team_id, 
            t.name AS team_name, 
            t.owner_id,
            -- 현재 로그인한 유저가 이 팀의 멤버인지 확인 (1이면 true, 0이면 false)
            MAX(CASE WHEN tm.user_id = $1 THEN 1 ELSE 0 END) OVER(PARTITION BY t.id) as is_member,
            tm.id AS member_id, 
            tm.position, 
            tm.status,
            u.uuid AS user_uuid, u.email, u.name AS user_name, u.phone, u.github_url, u.profile_image
        FROM teams t
        LEFT JOIN team_member tm ON t.id = tm.team_id
        LEFT JOIN users u ON tm.user_id = u.uuid;
    `;
    const result = await pool.query(sql, [currentUserId]);
    return result.rows;
}

//팀 목록 전체 조회 (팀 멤버 프로필이미지 포함)
export const findAllWithProfile = async (currentUserId: string) => {
    const sql = `
        SELECT 
            t.id AS team_id, 
            t.name AS team_name,
            MAX(CASE WHEN tm.user_id = $1 THEN 1 ELSE 0 END) OVER(PARTITION BY t.id) as is_member,
            COUNT(tm.id) OVER(PARTITION BY t.id) AS member_count,
            ARRAY_AGG(u.profile_image) OVER(
                PARTITION BY t.id 
                ORDER BY tm.id 
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS preview_images
        FROM teams t
        LEFT JOIN team_member tm ON t.id = tm.team_id
        LEFT JOIN users u ON tm.user_id = u.uuid;
    `;
    const result = await pool.query(sql, [currentUserId]);
    return result.rows;
}

// 특정 팀 멤버 목록 조회 
export const findMembersByTeamId = async (teamId: number) => {
    const sql = `
        SELECT 
            tm.id,
            u.name,
            tm.position,
            tm.status,
            u.email,
            u.phone,
            u.github_url,
            u.profile_image
        FROM team_member tm
        JOIN users u ON tm.user_id = u.uuid
        WHERE tm.team_id = $1
        ORDER BY tm.id;
    `;
    const result = await pool.query(sql, [teamId]);
    return result.rows;
}

// 팀 생성
export const insertTeamWithClient = async (
  client: PoolClient,
  data: { name: string; pin_password: string; owner_id: string }
) => {
  const result = await client.query(
    `INSERT INTO teams (name, pin_password, owner_id) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.pin_password, data.owner_id]
  );
  return result.rows[0];
};

// 팀멤버 추가 (트랜잭션 처리용)
export const insertTeamMemberWithClient = async (
  client: PoolClient,
  data: { team_id: number; user_id: string }
) => {
  await client.query(
    `INSERT INTO team_member (team_id, user_id, position, status) VALUES ($1, $2, $3, $4)`,
    [data.team_id, data.user_id, '팀원', '업무 중']
  );
};

// 팀멤버 추가
export const insertTeamMember = async ({team_id, user_id, position = "팀원", status="업무 중"}: {team_id: number; user_id: string; position?: string; status?: string;}) => {
    const sql = `INSERT INTO team_member (team_id, user_id, position, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`;

    const result = await pool.query(sql, [team_id, user_id, position, status]);
    return result.rows[0];
}



// 포지션 수정
export const updateMemberPosition = async (teamId: number, userId: string, position: string) => {
    const sql = `
            UPDATE team_member 
            SET position = $3 
            WHERE team_id = $1 AND user_id = $2 
            RETURNING *;
        `;
        const result = await pool.query(sql, [teamId, userId, position]);
        return result.rows[0];
}

// 활동 중인 멤버 조회 
export const findActiveMembers = async (teamId: number) => {
    const sql = `
            SELECT tm.id, tm.team_id, tm.user_id, tm.position, tm.status,
                u.uuid AS user_uuid, u.name, u.profile_image
            FROM team_member tm
            JOIN users u ON tm.user_id = u.uuid
            WHERE tm.team_id = $1 AND tm.status != '자리 비움';
        `;
    const result = await pool.query(sql, [teamId]);
        
    return result.rows;
}


// 팀이름으로 검색 - 없으면 undefined
export const findTeamByName = async (name: string) => {
    const sql = `SELECT * FROM teams WHERE name = $1;`;

    const result = await pool.query(sql, [name]);
    return result.rows[0]; //없으면 undefined
}

// 팀 멤버 삭제
export const deleteTeamMemberWithClient = async (
  client: PoolClient,
  teamId: number,
  userId: string
) => {
  await client.query(
    `DELETE FROM team_member WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
};

// 멤버 수 조회
export const countTeamMembersWithClient = async (
  client: PoolClient,
  teamId: number
) => {
  const result = await client.query(
    `SELECT COUNT(*) as count FROM team_member WHERE team_id = $1`,
    [teamId]
  );
  return parseInt(result.rows[0].count, 10);
};

// 팀 삭제
export const removeTeamWithClient = async (
  client: PoolClient,
  teamId: number
) => {
  await client.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
};

// 팀id로 검색 - 없으면 undefined
export const findTeamByTeamId = async (teamId: number) => {
    const sql = `SELECT * FROM teams WHERE id = $1;`;

    const result = await pool.query(sql, [teamId]);
    return result.rows[0]; //없으면 undefined
}

// 가입되어있는 팀인지 확인
export const findTeamMember = async (teamId: number, userId: string) => {
    const sql = `SELECT * FROM team_member WHERE team_id = $1 AND user_id = $2;`;

    const result = await pool.query(sql, [teamId, userId]);
    return result.rows[0];
}


