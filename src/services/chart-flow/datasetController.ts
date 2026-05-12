// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

export async function uploadDatasetUsingPost(
  params: API.uploadDatasetUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseLong_>("/api/dataset/upload", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

export async function listDatasetByPageUsingPost(
  body: API.DatasetQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageDataset_>("/api/dataset/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function listMyDatasetUsingGet(
  params: { page?: number; size?: number },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageDataset_>("/api/dataset/list/my", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}