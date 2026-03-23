import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes"; // status code 모듈
import {
  findTasksByTeam,
  findTaskById,
  insertTask,
} from "../repositories/taskRepository";

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
const createTask = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { title, content, worker_id } = req.body;

    if (
      !teamId ||
      isNaN(Number(teamId)) ||
      !title ||
      typeof title !== "string" ||
      title.trim() === "" ||
      !content ||
      typeof content !== "string" ||
      content.trim() === ""
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        data: null,
        meta: null,
        error: "오류가 발생했습니다.",
      });
    }

    // ⚠️ req.user.id (JWT 미들웨어 붙으면 교체) 예정
    const requesterId = 1;

    const task = await insertTask({
      teamId: Number(teamId),
      title: title.trim(),
      content: content.trim(),
      requesterId,
      workerId: worker_id ? Number(worker_id) : null,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: task,
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error("테스크 생성 오류: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: null,
      meta: null,
      error: "서버 오류가 발생했습니다.",
    });
  }
};

// 테스크 상세 조회
const getTaskDetail = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId || isNaN(Number(taskId))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        data: null,
        meta: null,
        error: "유효하지 않은 taskId입니다.",
      });
    }

    const task = await findTaskById(Number(taskId));

    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        data: null,
        meta: null,
        error: "요청한 리소스를 찾을 수 없습니다",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: task,
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error("테스크 상세 조회 오류: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: null,
      meta: null,
      error: "서버 오류가 발생했습니다.",
    });
  }
};

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
