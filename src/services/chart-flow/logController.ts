// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

export async function getTaskLogsUsingGet(
  params: API.TaskLogQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageTaskLog_>("/api/log/task", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getModelLogsUsingGet(
  params: API.ModelLogQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageModelLog_>("/api/log/model", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}