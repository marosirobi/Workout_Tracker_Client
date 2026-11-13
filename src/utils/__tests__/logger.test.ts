import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { describeError, logger } from "@/utils/logger";

const config = {
  method: "post",
  url: "/auth/login",
  headers: new AxiosHeaders({ Authorization: "Bearer secret-token" }),
} as InternalAxiosRequestConfig;

const response = (status: number, data: unknown) =>
  ({ status, statusText: "", data, headers: {}, config }) as AxiosResponse;

describe("describeError", () => {
  test("axios error is shortened to method, url, status and server message", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined,
      response(401, { message: "Wrong email or password!" }));

    expect(describeError(error)).toBe("POST /auth/login -> 401 (Wrong email or password!)");
  });

  test("server error code is preferred over message", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined,
      response(409, { code: "EMAIL_TAKEN", message: "This email address is already taken." }));

    expect(describeError(error)).toBe("POST /auth/login -> 409 (EMAIL_TAKEN)");
  });

  test("network error has no status", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK", config);

    expect(describeError(error)).toBe("POST /auth/login -> no response (Network Error)");
  });

  test("never leaks the token", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response(500, {}));

    expect(describeError(error)).not.toContain("secret-token");
  });

  test.each([
    [new Error("boom"), "boom"],
    [{ code: "E_LOCATION", message: "gps off" }, "gps off"],
    ["plain text", "plain text"],
  ])("%p -> %s", (error, expected) => {
    expect(describeError(error)).toBe(expected);
  });
});

describe("logger", () => {
  afterEach(() => jest.restoreAllMocks());

  test("error writes level, message and short error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.error("Save failed", new Error("boom"));

    expect(spy).toHaveBeenCalledWith("[ERROR] Save failed: boom");
  });

  test("message without error", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    logger.warn("Session expired");

    expect(spy).toHaveBeenCalledWith("[WARN] Session expired");
  });
});
