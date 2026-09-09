import { describe, expect, test } from "bun:test";
import { bumpSemVer, findExistingReleaseTag, publishMissingRelease, readReleaseVersion, releaseTagFor } from "../scripts/publish-release.mjs";

describe("plugin GitHub releases", () => {
  test("tags marketplace versions as vX.Y.Z", () => {
    expect(releaseTagFor(readReleaseVersion({ version: "0.4.0" }))).toBe("v0.4.0");
    expect(() => readReleaseVersion({ version: "v0.4.0" })).toThrow("SemVer");
  });

  test("bumps SemVer by kind", () => {
    expect(bumpSemVer("0.4.0", "patch")).toBe("0.4.1");
    expect(bumpSemVer("0.4.0", "minor")).toBe("0.5.0");
    expect(bumpSemVer("0.4.0", "major")).toBe("1.0.0");
  });

  test("does not create a Release when vX.Y.Z or X.Y.Z already exists", () => {
    const gh = (args) => ({
      status: args.includes("v0.4.0") ? 0 : 1,
      stdout: args.includes("v0.4.0") ? '{"tagName":"v0.4.0"}' : "",
      stderr: "",
    });
    expect(findExistingReleaseTag("0.4.0", gh)).toBe("v0.4.0");
    expect(publishMissingRelease({ version: "0.4.0", gh })).toEqual({ created: false, tag: "v0.4.0" });
  });

  test("creates vX.Y.Z with the installer asset names when missing", () => {
    const calls = [];
    const gh = (args) => {
      calls.push(args);
      return { status: args[0] === "release" && args[1] === "view" ? 1 : 0, stdout: "", stderr: "" };
    };
    expect(publishMissingRelease({ version: "0.5.0", notes: "notes", gh })).toEqual({ created: true, tag: "v0.5.0" });
    expect(calls.at(-1)).toEqual([
      "release", "create", "v0.5.0",
      "manifest.json", "main.js", "styles.css",
      "--title", "v0.5.0",
      "--notes", "notes",
    ]);
  });
});
