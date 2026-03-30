import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import {
  findTeamMember,
  findTeamByTeamId,
} from "../repositories/teamRepository";
import { ERROR } from "../utils/response";
import catchAsync from "../utils/response";
import pool from "../config/db";

export const teamMemberMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.uuid;
    const { taskId, commentId, archiveId, linkId, docId } = req.params;

    // 파라미터에 teamId가 있다면 미리 담아둠
    let teamId: any = req.params.teamId;

    if (taskId) {
      const taskResult = await pool.query(
        `SELECT id, task_number, team_id, status, requester_id, worker_id 
          FROM tasks WHERE id = $1`,
        [taskId],
      );
      if (taskResult.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
      }
      teamId = taskResult.rows[0].team_id;
      req.taskInfo = taskResult.rows[0];
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
    } else if (archiveId || linkId || docId) {
      const id = archiveId || docId || linkId;
      const result = await pool.query(
        `SELECT team_id FROM archives WHERE id = $1`,
        [id],
      );
      if (result.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
      }
      teamId = result.rows[0].team_id;
    } else if (!teamId) {
      return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
    }

    const team = await findTeamByTeamId(teamId);
    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
    }

    const member = await findTeamMember(teamId, userId);
    if (!member) {
      return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
    }

    req.verifiedTeamId = teamId;

    next();
  },
);
