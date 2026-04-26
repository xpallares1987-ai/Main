import { describe, it, expect } from "vitest";
import { ensureExtension, safeTrim, getFileNameFromPath } from "./helpers";

describe("Helpers", () => {
  describe("safeTrim", () => {
    it("should trim strings", () => {
      expect(safeTrim("  test  ")).toBe("test");
    });

    it("should return fallback for non-strings", () => {
      expect(safeTrim(null, "fallback")).toBe("fallback");
      expect(safeTrim(undefined, "fallback")).toBe("fallback");
    });

    it("should return fallback for empty strings", () => {
      expect(safeTrim("", "fallback")).toBe("fallback");
      expect(safeTrim("   ", "fallback")).toBe("fallback");
    });
  });

  describe("ensureExtension", () => {
    it("should add extension if missing", () => {
      expect(ensureExtension("diagram", ".bpmn")).toBe("diagram.bpmn");
    });

    it("should not duplicate extension", () => {
      expect(ensureExtension("diagram.bpmn", ".bpmn")).toBe("diagram.bpmn");
    });

    it("should handle case insensitivity", () => {
      expect(ensureExtension("diagram.BPMN", ".bpmn")).toBe("diagram.BPMN");
    });
  });

  describe("getFileNameFromPath", () => {
    it("should extract filename from unix paths", () => {
      expect(getFileNameFromPath("/path/to/file.xml")).toBe("file.xml");
    });

    it("should extract filename from windows paths", () => {
      expect(getFileNameFromPath("C:\\path\\to\\file.xml")).toBe("file.xml");
    });
  });
});
