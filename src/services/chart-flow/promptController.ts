// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

export async function addPromptUsingPost(
  body: API.PromptAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/prompt/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function updatePromptUsingPut(
  body: API.PromptUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/prompt/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function deletePromptUsingDelete(
  params: { id: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/prompt/delete", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getMyPromptListUsingGet(
  params: { page?: number; size?: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePrompt_>("/api/prompt/list/my", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getPromptListPageUsingPost(
  body: API.PromptQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePrompt_>("/api/prompt/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}