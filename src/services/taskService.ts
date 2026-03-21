import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes"; // status code 모듈
import { findTasksByTeam } from "../repositories/taskRepository";

interface TaskQuantity {
  Todo: number;
  Doing: number;
  Done: number;
  Checked: number;
}

const getTeamTasksData = async (teamId: number) => {
  const tasks = await findTasksByTeam(teamId);

  const taskQuantity = tasks.reduce(
    (acc, task) => {
      const status = task.status as keyof TaskQuantity;
      acc[status]++;
      return acc;
    },
    { Todo: 0, Doing: 0, Done: 0, Checked: 0 } as TaskQuantity,
  );

  return { taskQuantity, tasks };
};

// 팀별 전체 테스크 조회
const getTasksByTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    if (!teamId || isNaN(Number(teamId))) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, error: "유효하지 않은 teamId입니다." });
    }

    const data = await getTeamTasksData(Number(teamId));

    res.status(StatusCodes.OK).json({
      success: true,
      data,
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error("테스크 조회 오류: ", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
};

// 테스크 생성
const createTask = (req: Request, res: Response) => {};

// 테스크 상세 조회
const getTaskDetail = (req: Request, res: Response) => {};

// 테스크 삭제
const deleteTask = (req: Request, res: Response) => {};

// 테스크 상태 변경
const updateTaskStatus = (req: Request, res: Response) => {};

// 뎃글 작성
const createComment = (req: Request, res: Response) => {};

// 댓글 수정
const updateComment = (req: Request, res: Response) => {};

// 댓글 삭제
const deleteComment = (req: Request, res: Response) => {};

// 팀 활동 로그 조회
const getTeamLogs = (req: Request, res: Response) => {};

export {
  getTeamTasksData,
  getTasksByTeam,
  createTask,
  getTaskDetail,
  deleteTask,
  updateTaskStatus,
  createComment,
  updateComment,
  deleteComment,
  getTeamLogs,
};
