// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

export async function addFeedbackUsingPost(
  body: API.FeedbackAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/chart-feedback/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteFeedbackUsingDelete(
  params: { id: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/chart-feedback/delete", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function updateFeedbackUsingPut(
  body: API.FeedbackUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/chart-feedback/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function getFeedbackUsingGet(
  params: { id: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseFeedback_>("/api/chart-feedback/get", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getFeedbackListPageUsingPost(
  body: API.FeedbackQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageFeedback_>("/api/chart-feedback/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function getMyFeedbackListUsingGet(
  params: { page?: number; size?: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageFeedback_>("/api/chart-feedback/list/my", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
