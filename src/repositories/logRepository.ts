import pool from "../config/db";

export interface InsertLogInput {
  teamId: number;
  userId: number;
  taskId: number;
  actionType: "CREATE" | "MOVE" | "DELETE" | "UPDATE";
  message: string;
}

export const insertLog = async (input: InsertLogInput): Promise<void> => {
  const { teamId, userId, taskId, actionType, message } = input;

  await pool.query(
    `INSERT INTO logs (team_id, user_id, task_id, action_type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, userId, taskId, actionType, message],
  );
};
