import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDateTime, formatDuration, formatRelativeTime } from "./formatters";

describe("formatDate", () => {
  it('should format a valid date string as "Month Day, Year"', () => {
    const result = formatDate("2024-02-23");
    expect(result).toBe("Feb 23, 2024");
  });

  it('should return "-" for null input', () => {
    const result = formatDate(null);
    expect(result).toBe("-");
  });

  it('should return "-" for invalid date string', () => {
    const result = formatDate("invalid-date");
    expect(result).toBe("-");
  });

  it("should handle empty string input", () => {
    const result = formatDate("");
    expect(result).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("should format a valid ISO datetime string with AM/PM", () => {
    const result = formatDateTime("2024-02-23T10:30:00.000Z");
    expect(result).toBe("Feb 23, 2024 10:30 AM");
  });

  it("should handle PM time correctly", () => {
    const result = formatDateTime("2024-02-23T18:45:00.000Z");
    expect(result).toBe("Feb 23, 2024 6:45 PM");
  });

  it('should return "TBD" for null input', () => {
    const result = formatDateTime(null);
    expect(result).toBe("TBD");
  });

  it('should return "TBD" for invalid ISO string', () => {
    const result = formatDateTime("invalid-iso-string");
    expect(result).toBe("TBD");
  });

  it("should handle empty string input", () => {
    const result = formatDateTime("");
    expect(result).toBe("TBD");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should format a past time as relative time", () => {
    // Set current time to Feb 24, 2024
    const now = new Date("2024-02-24T10:00:00.000Z");
    vi.setSystemTime(now);

    const result = formatRelativeTime("2024-02-23T10:00:00.000Z");
    expect(result).toBe("1 day ago");
  });

  it('should format a future time with "ago" suffix', () => {
    // Set current time to Feb 22, 2024
    const now = new Date("2024-02-22T10:00:00.000Z");
    vi.setSystemTime(now);

    const result = formatRelativeTime("2024-02-23T10:00:00.000Z");
    expect(result).toBe("1 day ago");
  });

  it('should return "just now" for invalid date', () => {
    const result = formatRelativeTime("invalid-date");
    expect(result).toBe("just now");
  });

  it("should handle empty string input", () => {
    const result = formatRelativeTime("");
    expect(result).toBe("just now");
  });

  it("should format minutes ago correctly", () => {
    // Set current time to Feb 23, 2024 10:30:00Z
    const now = new Date("2024-02-23T10:30:00.000Z");
    vi.setSystemTime(now);

    const result = formatRelativeTime("2024-02-23T10:00:00.000Z");
    expect(result).toBe("30 minutes ago");
  });

  it('should format seconds ago as "just now"', () => {
    // Set current time to Feb 23, 2024 10:00:30Z
    const now = new Date("2024-02-23T10:00:30.000Z");
    vi.setSystemTime(now);

    const result = formatRelativeTime("2024-02-23T10:00:00.000Z");
    expect(result).toBe("just now");
  });
});

describe("formatDuration", () => {
  it('should format minutes as "Xm"', () => {
    expect(formatDuration(30)).toBe("30m");
    expect(formatDuration(45)).toBe("45m");
  });

  it('should format hours and minutes as "Xh Ym"', () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(150)).toBe("2h 30m");
    expect(formatDuration(120)).toBe("2h 0m");
  });

  it("should handle full hours correctly", () => {
    expect(formatDuration(60)).toBe("1h 0m");
    expect(formatDuration(180)).toBe("3h 0m");
  });

  it('should return "--" for null input', () => {
    const result = formatDuration(null);
    expect(result).toBe("--");
  });

  it("should handle zero minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("should handle very large durations", () => {
    expect(formatDuration(1440)).toBe("24h 0m"); // 24 hours
    expect(formatDuration(1500)).toBe("25h 0m"); // 25 hours
  });
});
