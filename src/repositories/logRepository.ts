import pool from "../config/db";
import { PoolClient } from "pg";
import { TaskUserInfo } from "./taskRepository";

export interface InsertLogInput {
  teamId: number;
  userId: string;
  taskId: number;
  actionType: "CREATE" | "MOVE" | "DELETE" | "UPDATE";
  message: string;
}

export interface LogRow {
  id: number;
  team_id: number;
  user_id: string;
  task_id: number;
  action_type: string;
  message: string;
  created_at: Date;
  user: TaskUserInfo;
}

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 로그 저장할 때 사용
// =============================================
export const insertLog = async (input: InsertLogInput): Promise<void> => {
  const { teamId, userId, taskId, actionType, message } = input;

  await pool.query(
    `INSERT INTO logs (team_id, user_id, task_id, action_type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, userId, taskId, actionType, message],
  );
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// task 생성/수정/삭제/상태변경과 함께 묶어서 처리할 때 사용
// 중간에 실패하면 전체 ROLLBACK됨
// =============================================
export const insertLogWithClient = async (
  client: PoolClient,
  input: InsertLogInput,
): Promise<void> => {
  const { teamId, userId, taskId, actionType, message } = input;

  await client.query(
    `INSERT INTO logs (team_id, user_id, task_id, action_type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, userId, taskId, actionType, message],
  );
};

export const findLogsByTeam = async (
  teamId: number,
  userId?: string,
): Promise<LogRow[]> => {
  const result = await pool.query(
    `SELECT
      l.id, l.team_id, l.user_id, l.task_id,
      l.action_type, l.message, l.created_at,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
     FROM logs l
     JOIN users u ON l.user_id = u.uuid
     WHERE l.team_id = $1
     ${userId ? "AND l.user_id = $2" : ""}
     ORDER BY l.created_at DESC`,
    userId ? [teamId, userId] : [teamId],
  );
  return result.rows;
};
