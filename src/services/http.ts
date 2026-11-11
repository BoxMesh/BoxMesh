import axios, { isAxiosError, type AxiosError } from "axios";
import { t } from "../i18n";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 15_000,
  withCredentials: true,
});

function explain(error: AxiosError): string {
  if (error.code === "ECONNABORTED") return t("That took too long. Try again.");
  if (!error.response)
    return t("Can't reach the server. Check your connection, then try again.");
  const { status } = error.response;
  if (status === 401) return t("Your session has ended. Sign in again.");
  if (status === 403) return t("You don't have permission to do this.");
  if (status === 404) return t("That is no longer available.");
  if (status === 429)
    return t("Too many requests at once. Wait a moment, then try again.");
  if (status >= 500) return t("Try again in a moment.");
  return t("The request could not be completed.");
}

export function userMessage(error: unknown): string {
  return isAxiosError(error)
    ? explain(error)
    : t("Something went wrong. Try again.");
}

http.interceptors.response.use(
  (response) => {
    response.data = response.data?.data;
    return response;
  },
  (error: unknown) => {
    if (isAxiosError(error)) error.message = explain(error);
    return Promise.reject(error);
  },
);
