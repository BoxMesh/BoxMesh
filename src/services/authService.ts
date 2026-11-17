import { isAxiosError } from "axios";
import type { User } from "../types/auth";
import { t } from "../i18n";
import { stopDemo } from "./demo";
import { http, userMessage } from "./http";

const STORAGE_KEY = "boxmesh-session";

let session = load();

function load(): User | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const user = saved ? JSON.parse(saved) : null;
    // A session saved before roles existed has none: sign in again rather than hide the System section.
    return user?.role ? user : null;
  } catch {
    return null;
  }
}

export const getSession = () => session;

export async function logIn(email: string, password: string) {
  const { data: account } = await http
    .post<{ id: string; email: string; name?: string; role?: string }>("/log-in", {
      email,
      password,
    })
    .catch((error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401)
        throw new Error(t("Wrong email or password."));
      throw new Error(t("Sign-in failed. {reason}", { reason: userMessage(error) }));
    });
  const data: User = {
    email: account.email,
    // The person's name when the panel sends one; until then, the part of the email before the @.
    name: account.name?.trim() || account.email.split("@")[0],
    // Only "System" unlocks the System section; anything else, or no role at all, is a User.
    role: account.role === "System" ? "System" : "User",
  };
  store(data);
  return data;
}

function store(user: User) {
  session = user;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

/** The signed-in person edits their own name and password. A new password needs the current one. */
export async function updateAccount(input: { name?: string; currentPassword?: string; password?: string }) {
  const { data } = await http.patch<{ name?: string }>("/account", input);
  const name = data?.name?.trim();
  if (session && name) store({ ...session, name });
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
    throw new Error(t("Couldn't send the reset email. {reason}", { reason: userMessage(error) }));
  });
}
