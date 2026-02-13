import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it("returns /game for null or empty", () => {
    expect(getSafeRedirect(null)).toBe("/game");
    expect(getSafeRedirect("")).toBe("/game");
  });

  it("allows whitelisted paths", () => {
    expect(getSafeRedirect("/")).toBe("/");
    expect(getSafeRedirect("/game")).toBe("/game");
    expect(getSafeRedirect("/leaderboard")).toBe("/leaderboard");
    expect(getSafeRedirect("/stats")).toBe("/stats");
    expect(getSafeRedirect("/how-to-play")).toBe("/how-to-play");
  });

  it("rejects open redirect attempts", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/game");
    expect(getSafeRedirect("https://evil.com")).toBe("/game");
    expect(getSafeRedirect("/game//evil.com")).toBe("/game");
  });

  it("rejects non-whitelisted paths", () => {
    expect(getSafeRedirect("/admin")).toBe("/game");
    expect(getSafeRedirect("/auth/login")).toBe("/game");
  });

  it("strips query and hash, validates pathname only", () => {
    expect(getSafeRedirect("/game?demo=1")).toBe("/game");
    expect(getSafeRedirect("/stats#section")).toBe("/stats");
  });
});
