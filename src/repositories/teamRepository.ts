import pool from '../config/db';

//팀 목록 전체 조회 (팀 목록 포함)
const findAllWithMembers = async (currentUserId: number) => {
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

// 팀 생성
const insertTeam = async (data: {
    name: string;
    pin_password: string;
    owner_id: string;
}) => {
    const sql = `
        INSERT INTO teams (name, pin_password, owner_id) VALUES($1, $2, $3) RETURNING *;
    `;
    const result = await pool.query(sql, [data.name, data.pin_password, data.owner_id]);
    return result.rows[0];
}

// 포지션 수정
const updateMemberPosition = async (teamId: number, userId: number, position: string) => {
}

// 활동 중인 멤버 조회 
const findActiveMembers = async (teamId: number) => {
}

// 팀 삭제
const removeTeam = async (teamId: number) => {
    const sql = `
        DELETE FROM teams WHERE id = $1
    `
    return await pool.query(sql, [teamId]);
}

// 팀에 멤버 추가 
const insertTeamMember = async ({team_id, user_id, position = "팀원", status="업무 중"}: {team_id: number; user_id: string; position?: string; status?: string;}) => {
    const sql = `INSERT INTO team_member (team_id, user_id, position, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`;

    const result = await pool.query(sql, [team_id, user_id, position, status]);
    return result.rows[0];
}

// 팀이름으로 검색 - 없으면 undefined
const findTeamByName = async (name: string) => {
    const sql = `SELECT * FROM teams WHERE name = $1;`;

    const result = await pool.query(sql, [name]);
    return result.rows[0]; //없으면 undefined
}

// 팀id로 검색 - 없으면 undefined
const findTeamByTeamId = async (teamId: number) => {
    const sql = `SELECT * FROM teams WHERE id = $1;`;

    const result = await pool.query(sql, [teamId]);
    return result.rows[0]; //없으면 undefined
}

// 가입되어있는 팀인지 확인
const findTeamMember = async (teamId: number, userId: string) => {
    const sql = `SELECT * FROM team_member WHERE team_id = $1 AND user_id = $2;`;

    const result = await pool.query(sql, [teamId, userId]);
    return result.rows[0];
}


export {
    findAllWithMembers,
    insertTeam,
    updateMemberPosition,
    findActiveMembers,
    removeTeam,

    findTeamByName,
    findTeamByTeamId,
    findTeamMember,
    insertTeamMember
}