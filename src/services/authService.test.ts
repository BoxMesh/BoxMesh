import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";
import { getSession, logIn, logOut } from "./authService";
import { http } from "./http";

// Stands in for EdgePanel's auth endpoints: records the request and replies with this status and body.
let sent: InternalAxiosRequestConfig | undefined;
const reply =
  (status: number, body: unknown): AxiosAdapter =>
  async (config) => {
    sent = config;
    const response = {
      data: body,
      status,
      statusText: String(status),
      headers: {},
      config,
    };
    if (status >= 400)
      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        response,
      );
    return response;
  };

describe("authService", () => {
  it("signs in and out", async () => {
    http.defaults.adapter = reply(200, {
      data: { id: "7b1f", email: "ops@example.com" },
    });
    const user = await logIn("ops@example.com", "secret");
    expect(sent?.url).toBe("/log-in");
    // The JWT cookies only cross origins with credentials on (backend on its own domain).
    expect(sent?.withCredentials).toBe(true);
    expect(JSON.parse(sent?.data)).toEqual({
      email: "ops@example.com",
      password: "secret",
    });
    expect(user).toEqual({ email: "ops@example.com", name: "ops" });
    expect(getSession()).toEqual(user);
    await logOut();
    expect(sent?.url).toBe("/log-out");
    expect(getSession()).toBeNull();
  });

  it("shows the person's name when the panel sends one", async () => {
    http.defaults.adapter = reply(200, {
      data: { id: "7b1f", email: "ops@example.com", name: " Quang Huy " },
    });
    expect(await logIn("ops@example.com", "secret")).toEqual({
      email: "ops@example.com",
      name: "Quang Huy",
    });
    await logOut();
  });

  // EdgePanel owns the cookies, but an unreachable panel must not strand the person in a signed-in portal.
  it("signs out locally even when the panel can't be reached", async () => {
    http.defaults.adapter = reply(200, {
      data: { id: "7b1f", email: "ops@example.com" },
    });
    await logIn("ops@example.com", "secret");
    http.defaults.adapter = reply(502, { error: "Bad Gateway" });
    await logOut();
    expect(getSession()).toBeNull();
  });

  // A 502 from the proxy is still "you are not signed in" to the person at the keyboard.
  it("reports any other failure as a failed sign-in", async () => {
    http.defaults.adapter = reply(502, { error: "Bad Gateway" });
    await expect(logIn("ops@example.com", "secret")).rejects.toThrow(
      "Sign-in failed. Try again in a moment.",
    );
    expect(getSession()).toBeNull();
  });

  it("reports a wrong email or password", async () => {
    // EdgePanel answers a failed sign-in with a bare 401 and { data: "Unauthorized" }.
    http.defaults.adapter = reply(401, { data: "Unauthorized" });
    await expect(logIn("ops@example.com", "wrong")).rejects.toThrow(
      "Wrong email or password.",
    );
    expect(getSession()).toBeNull();
  });
});
