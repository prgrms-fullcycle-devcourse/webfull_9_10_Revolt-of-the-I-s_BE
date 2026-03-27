import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { findTeamMember } from "../repositories/teamRepository";
import { ERROR } from "../utils/response";
import catchAsync from "../utils/response";
import pool from "../config/db";

export const teamMemberMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.uuid;
  const taskId = req.params.taskId;
  const commentId = req.params.commentId;

  let teamId: number;

  if (taskId) {
    const taskResult = await pool.query(
      `SELECT team_id FROM tasks WHERE id = $1`,
      [taskId],
    );
    if (taskResult.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
    }
    teamId = taskResult.rows[0].team_id;
  } else if (commentId) {
    const commentResult = await pool.query(
      `SELECT t.team_id FROM comments c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1`,
      [commentId],
    );
    if (commentResult.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
    }
    teamId = commentResult.rows[0].team_id;
  } else {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const member = await findTeamMember(teamId, userId);
  if (!member) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  next();
};
