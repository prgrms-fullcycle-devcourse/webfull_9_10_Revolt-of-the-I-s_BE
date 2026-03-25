// ID 유효성 검사
// teamId, taskId, commentId
export const isValidId = (id: string | string[] | undefined): boolean => {
  return !!id && !Array.isArray(id) && !isNaN(Number(id));
};

// 문자열 유효성 검사
// title, content
export const isValidString = (value: any): boolean => {
  return !!value && typeof value === "string" && value.trim() !== "";
};
