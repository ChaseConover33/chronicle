import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatEntryTitle,
  formatGeneratedDate,
  isSummaryType,
} from "./entry-title";

describe("formatEntryTitle", () => {
  it("returns the raw date for daily entries", () => {
    assert.equal(
      formatEntryTitle({ type: "daily", date: "2026-04-25" }),
      "2026-04-25",
    );
  });

  it("returns the raw date for retrospective entries", () => {
    assert.equal(
      formatEntryTitle({ type: "retrospective", date: "2026-04-25" }),
      "2026-04-25",
    );
  });

  it("formats a weekly summary as 'Week of Month D–D, YYYY' when same month", () => {
    // entry.date = Sunday end-of-week (2026-04-26). Week: 2026-04-20 (Mon) → 2026-04-26 (Sun).
    assert.equal(
      formatEntryTitle({ type: "weekly", date: "2026-04-26" }),
      "Week of April 20–26, 2026",
    );
  });

  it("formats a weekly summary that crosses a month boundary", () => {
    // 2026-05-03 is a Sunday. Week: 2026-04-27 → 2026-05-03.
    assert.equal(
      formatEntryTitle({ type: "weekly", date: "2026-05-03" }),
      "Week of April 27 – May 3, 2026",
    );
  });

  it("formats a weekly summary that crosses a year boundary", () => {
    // 2026-01-04 is a Sunday. Week: 2025-12-29 → 2026-01-04.
    assert.equal(
      formatEntryTitle({ type: "weekly", date: "2026-01-04" }),
      "Week of December 29, 2025 – January 4, 2026",
    );
  });

  it("formats a monthly summary as 'Month YYYY'", () => {
    assert.equal(
      formatEntryTitle({ type: "monthly", date: "2026-04-30" }),
      "April 2026",
    );
  });

  it("formats monthly with the right month even when date is mid-month", () => {
    assert.equal(
      formatEntryTitle({ type: "monthly", date: "2026-04-15" }),
      "April 2026",
    );
  });

  it("formats a yearly summary as just the year", () => {
    assert.equal(
      formatEntryTitle({ type: "yearly", date: "2026-12-31" }),
      "2026",
    );
  });

  it("formats a decade summary as the decade start with 's'", () => {
    assert.equal(
      formatEntryTitle({ type: "decade", date: "2027-06-15" }),
      "2020s",
    );
    assert.equal(
      formatEntryTitle({ type: "decade", date: "2030-01-01" }),
      "2030s",
    );
  });
});

describe("isSummaryType", () => {
  it("identifies summary types", () => {
    assert.equal(isSummaryType("weekly"), true);
    assert.equal(isSummaryType("monthly"), true);
    assert.equal(isSummaryType("yearly"), true);
    assert.equal(isSummaryType("decade"), true);
  });
  it("excludes non-summary types", () => {
    assert.equal(isSummaryType("daily"), false);
    assert.equal(isSummaryType("retrospective"), false);
  });
});

describe("formatGeneratedDate", () => {
  it("formats SQLite-style timestamps as 'Month D, YYYY'", () => {
    assert.equal(formatGeneratedDate("2026-04-26 07:34:46"), "April 26, 2026");
  });
  it("handles plain YYYY-MM-DD too", () => {
    assert.equal(formatGeneratedDate("2026-12-31"), "December 31, 2026");
  });
  it("falls back to the input when it can't parse", () => {
    assert.equal(formatGeneratedDate("not-a-date"), "not-a-date");
  });
});
