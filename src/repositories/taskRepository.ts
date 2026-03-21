import pool from "../config/db";

export interface TaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: number;
  worker_id: number | null;
  created_at: Date;
  comment_count: number;
}

export const findTasksByTeam = async (teamId: number): Promise<TaskRow[]> => {
  const query = `
    SELECT
      t.id,
      t.task_number,
      t.team_id,
      t.title,
      t.content,
      t.status,
      t.requester_id,
      t.worker_id,
      t.created_at,
      COALESCE(COUNT(c.uuid), 0)::INT AS comment_count
    FROM tasks t
    LEFT JOIN comments c ON t.id = c.task_id
    WHERE t.team_id = $1
    GROUP BY t.id, t.task_number, t.team_id, t.title, t.content,
             t.status, t.requester_id, t.worker_id, t.created_at
    ORDER BY t.created_at DESC
  `;

  const result = await pool.query<TaskRow>(query, [teamId]);
  return result.rows;
};
