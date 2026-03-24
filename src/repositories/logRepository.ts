import pool from "../config/db";
import { TaskUserInfo } from "./taskRepository";

export interface InsertLogInput {
  teamId: number;
  userId: number;
  taskId: number;
  actionType: "CREATE" | "MOVE" | "DELETE" | "UPDATE";
  message: string;
}

export interface LogRow {
  uuid: number;
  team_id: number;
  user_id: number;
  task_id: number;
  action_type: string;
  message: string;
  created_at: Date;
  user: TaskUserInfo;
}

export const insertLog = async (input: InsertLogInput): Promise<void> => {
  const { teamId, userId, taskId, actionType, message } = input;

  await pool.query(
    `INSERT INTO logs (team_id, user_id, task_id, action_type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, userId, taskId, actionType, message],
  );
};

export const findLogsByTeam = async (teamId: number): Promise<LogRow[]> => {
  const result = await pool.query(
    `SELECT
      l.uuid, l.team_id, l.user_id, l.task_id,
      l.action_type, l.message, l.created_at,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
     FROM logs l
     JOIN users u ON l.user_id = u.uuid
     WHERE l.team_id = $1
     ORDER BY l.created_at DESC`,
    [teamId],
  );
  return result.rows;
};
