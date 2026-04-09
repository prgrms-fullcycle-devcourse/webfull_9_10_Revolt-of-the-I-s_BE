import pool from "../config/db";

export type NotificationType =
  | "NEW_TASK"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "STATUS_CHANGED"
  | "NEW_COMMENT";

export interface NotificationRow {
  id: number;
  user_id: string;
  team_id: number;
  task_id: number | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface InsertNotificationInput {
  userId: string;
  teamId: number;
  taskId: number | null;
  type: NotificationType;
  message: string;
}

// 알림 저장
export const insertNotification = async (
  input: InsertNotificationInput,
): Promise<void> => {
  const { userId, teamId, taskId, type, message } = input;
  await pool.query(
    `INSERT INTO notifications (user_id, team_id, task_id, type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, teamId, taskId, type, message],
  );
};

// 내 알림 전체 조회
export const findNotificationsByUser = async (
  userId: string,
): Promise<NotificationRow[]> => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

// 읽지 않은 알림만 조회
export const findUnreadNotifications = async (
  userId: string,
): Promise<NotificationRow[]> => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 AND is_read = false
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

// 알림 읽음 처리
export const markNotificationAsRead = async (
  notificationId: number,
  userId: string,
): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId],
  );
  return result.rows.length > 0;
};

// 전체 읽음 처리
export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<void> => {
  await pool.query(
    `UPDATE notifications SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
};

// 읽지 않은 알림 개수
export const countUnreadNotifications = async (
  userId: string,
): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return parseInt(result.rows[0].count, 10);
};
