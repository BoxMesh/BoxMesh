import { isAxiosError } from "axios";
import type { User } from "../types/auth";
import { stopDemo } from "./demo";
import { http, userMessage } from "./http";

const STORAGE_KEY = "boxmesh-session";

let session = load();

function load(): User | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const getSession = () => session;

export async function logIn(email: string, password: string) {
  const { data: account } = await http
    .post<{ id: string; email: string; name?: string }>("/log-in", {
      email,
      password,
    })
    .catch((error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401)
        throw new Error("Wrong email or password.");
      throw new Error(`Sign-in failed. ${userMessage(error)}`);
    });
  const data: User = {
    email: account.email,
    // The person's name when the panel sends one; until then, the part of the email before the @.
    name: account.name?.trim() || account.email.split("@")[0],
  };
  session = data;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
  return data;
}
export async function logOut() {
  await http.post("/log-out").catch(() => {});
  session = null;
  stopDemo();
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// shortcut: "/forgot-password" is assumed, the panel's reset route is not known yet; rename it once it is.
export async function requestPasswordReset(email: string) {
  await http.post("/forgot-password", { email }).catch((error: unknown) => {
    throw new Error(`Couldn't send the reset email. ${userMessage(error)}`);
  });
}
