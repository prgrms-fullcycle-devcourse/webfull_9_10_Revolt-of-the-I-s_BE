import { Request, Response } from "express";
import catchAsync, { SUCCESS, ERROR } from "../utils/response";
import { StatusCodes } from "http-status-codes";
import { findTeamMember } from "../repositories/teamRepository";
import { deleteFileFromS3 } from "../utils/s3";
import * as v from "../utils/validators";
import {
  findByTeamIdAndType,
  findById,
  create,
  update,
  deleteById,
} from "../repositories/archiveRepository";

// 에러 응답 형식
const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    meta: null,
    error: message,
  });
};

// =========== 회의록 ===========

//회의록 목록 조회
export const getMeetingList = catchAsync(
  async (req: Request, res: Response) => {
    const teamId = req.verifiedTeamId!;

    const list = await findByTeamIdAndType(teamId, "NOTE");
    res.status(StatusCodes.OK).json(SUCCESS(list));
  },
);

//회의록 작성
export const createMeeting = catchAsync(async (req: Request, res: Response) => {
  const { title, content } = req.body;

  const teamId = req.verifiedTeamId!;

  if (!v.isValidArchiveTitle(title)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "제목은 1~100자 사이로 입력해주세요.",
    );
  }
  if (!v.isValidArchiveContent(content)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "회의록 본문을 입력해주세요.",
    );
  }

  const newMeeting = await create({
    team_id: teamId,
    type: "NOTE",
    title: title.trim(),
    content: content.trim(),
  });
  res.status(StatusCodes.CREATED).json(SUCCESS(newMeeting));
});

// 회의록 상세 조회
export const getMeetingDetail = catchAsync(
  async (req: Request, res: Response) => {
    const archiveId = parseInt(req.params.archiveId as string);
    const archive = await findById(archiveId);

    if (!archive || archive.type !== "NOTE") {
      return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json(SUCCESS(archive));
  },
);

// 회의록 수정
export const updateMeeting = catchAsync(async (req: Request, res: Response) => {
  const archiveId = parseInt(req.params.archiveId as string);
  const { title, content } = req.body;

  const archive = await findById(archiveId);
  if (!archive || archive.type !== "NOTE") {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  if (title && !v.isValidArchiveTitle(title)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "제목은 1~100자 사이여야 합니다.",
    );
  }

  const updated = await update(archiveId, {
    title: title?.trim(),
    content: content?.trim(),
  });

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 회의록 삭제
export const deleteMeeting = catchAsync(async (req: Request, res: Response) => {
  const archiveId = parseInt(req.params.archiveId as string);

  const archive = await findById(archiveId);
  if (!archive || archive.type !== "NOTE") {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  await deleteById(archiveId);

  res
    .status(StatusCodes.OK)
    .json(SUCCESS({ message: "성공적으로 삭제되었습니다." }));
});

// =========== 퀵링크 ===========

// 링크 목록 조회
export const getLinkList = catchAsync(async (req: Request, res: Response) => {
  const teamId = req.verifiedTeamId!;

  const list = await findByTeamIdAndType(teamId, "LINK");
  res.status(StatusCodes.OK).json(SUCCESS(list));
});

// 링크 생성
export const createLink = catchAsync(async (req: Request, res: Response) => {
  const { title, content } = req.body;

  const teamId = req.verifiedTeamId!;

  if (!v.isValidArchiveTitle(title)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "링크 이름은 1~100자 사이여야 합니다.",
    );
  }
  if (!v.isValidUrl(content)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "올바른 URL 형식을 입력해주세요.",
    );
  }

  const newLink = await create({
    team_id: teamId,
    type: "LINK",
    title: title.trim(),
    content: content.trim(),
  });
  res.status(StatusCodes.CREATED).json(SUCCESS(newLink));
});

// 링크 삭제
export const deleteLink = catchAsync(async (req: Request, res: Response) => {
  const linkId = parseInt(req.params.linkId as string);
  const archive = await findById(linkId);

  if (!archive || archive.type !== "LINK") {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  await deleteById(linkId);
  res
    .status(StatusCodes.OK)
    .json(SUCCESS({ message: "링크가 삭제되었습니다." }));
});

// =========== 문서 ===========

// 문서 목록 조회
export const getDocumentList = catchAsync(
  async (req: Request, res: Response) => {
    const teamId = req.verifiedTeamId!;

    const list = await findByTeamIdAndType(teamId, "PDF");
    res.status(StatusCodes.OK).json(SUCCESS(list));
  },
);

// 문서 생성
export const createDocument = catchAsync(
  async (req: Request, res: Response) => {
    const teamId = req.verifiedTeamId!;

    if (!req.file)
      return sendError(
        res,
        StatusCodes.BAD_REQUEST,
        "업로드된 파일이 없습니다.",
      );

    const fileUrl = (req.file as any).location;
    const fileName = req.body.title || req.file.originalname;

    const newDoc = await create({
      team_id: teamId,
      type: "PDF",
      title: fileName,
      content: fileUrl,
    });

    res.status(StatusCodes.CREATED).json(SUCCESS(newDoc));
  },
);

// 문서 삭제
export const deleteDocument = catchAsync(
  async (req: Request, res: Response) => {
    const archiveId = parseInt(req.params.docId as string);
    const archive = await findById(archiveId);

    if (!archive)
      return sendError(
        res,
        StatusCodes.NOT_FOUND,
        "해당 문서를 찾을 수 없습니다.",
      );

    // S3 버킷 내 삭제
    if (archive.type === "PDF" && archive.content) {
      await deleteFileFromS3(archive.content);
    }

    await deleteById(archiveId);
    res
      .status(StatusCodes.OK)
      .json(SUCCESS({ message: "성공적으로 삭제되었습니다." }));
  },
);
