import type { AppType } from "@tascal/api/app-type";
import type { InferRequestType, InferResponseType, hc } from "hono/client";

type ApiClient = ReturnType<typeof hc<AppType>>;

export type Task = InferResponseType<
  ApiClient["api"]["tasks"]["range"]["$get"],
  200
>[number];
export type TaskCreateInput = InferRequestType<
  ApiClient["api"]["tasks"]["$post"]
>["json"];
export type TaskUpdateInput = InferRequestType<
  ApiClient["api"]["tasks"][":id"]["$patch"]
>["json"];

export type Category = InferResponseType<
  ApiClient["api"]["categories"]["$get"],
  200
>[number];
export type CategoryColor = Category["color"];
export type CategoryCreateInput = InferRequestType<
  ApiClient["api"]["categories"]["$post"]
>["json"];
export type CategoryUpdateInput = InferRequestType<
  ApiClient["api"]["categories"][":id"]["$patch"]
>["json"];
