export const ERROR = {
  UNAUTHORIZED: {
    success: false,
    data: null,
    meta: null,
    error: "인증 토큰이 없거나 유효하지 않습니다"
  },
  FORBIDDEN: {
    success: false,
    data: null,
    meta: null,    
    message: "해당 작업에 대한 권한이 없습니다",
  },
  NOT_FOUND: {
    success: false,
    data: null,
    meta: null,
    message: "요청한 리소스를 찾을 수 없습니다",
  },
  CONFLICT: {
    success: false,
    data: null,
    meta: null,
    message: "이미 존재하는 리소스입니다",
  },
  ErrorResponse: {
    success: false,
    data: null,
    meta: null,
    message: "오류가 발생했습니다",
  }
};