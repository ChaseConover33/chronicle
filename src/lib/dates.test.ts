import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  diffDays,
  isYmd,
  monthRange,
  previousMonthRange,
  previousWeekRange,
  previousYearRange,
  weekRange,
  yearRange,
} from "./dates";

describe("isYmd", () => {
  it("accepts well-formed dates", () => {
    assert.equal(isYmd("2026-04-25"), true);
  });
  it("rejects malformed strings", () => {
    assert.equal(isYmd("2026-4-25"), false);
    assert.equal(isYmd("not-a-date"), false);
    assert.equal(isYmd(""), false);
    assert.equal(isYmd("2026/04/25"), false);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    assert.equal(addDays("2026-04-25", 3), "2026-04-28");
  });
  it("subtracts when given negative days", () => {
    assert.equal(addDays("2026-04-25", -25), "2026-03-31");
  });
  it("crosses month boundaries", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  });
  it("crosses year boundaries", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  });
  it("handles leap year Feb 29", () => {
    // 2024 was a leap year; 2026 is not.
    assert.equal(addDays("2024-02-28", 1), "2024-02-29");
    assert.equal(addDays("2024-02-29", 1), "2024-03-01");
    assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  });
});

describe("diffDays", () => {
  it("returns positive when a > b", () => {
    assert.equal(diffDays("2026-04-30", "2026-04-25"), 5);
  });
  it("returns negative when a < b", () => {
    assert.equal(diffDays("2026-04-25", "2026-04-30"), -5);
  });
  it("returns 0 for the same date", () => {
    assert.equal(diffDays("2026-04-25", "2026-04-25"), 0);
  });
});

describe("weekRange", () => {
  it("returns Mon-Sun for a Wednesday", () => {
    // 2026-04-22 is a Wednesday.
    assert.deepEqual(weekRange("2026-04-22"), {
      from: "2026-04-20",
      to: "2026-04-26",
    });
  });
  it("returns Mon-Sun when given the Monday itself", () => {
    assert.deepEqual(weekRange("2026-04-20"), {
      from: "2026-04-20",
      to: "2026-04-26",
    });
  });
  it("returns Mon-Sun when given the Sunday", () => {
    assert.deepEqual(weekRange("2026-04-26"), {
      from: "2026-04-20",
      to: "2026-04-26",
    });
  });
  it("crosses month boundaries cleanly", () => {
    // 2026-05-01 is a Friday.
    assert.deepEqual(weekRange("2026-05-01"), {
      from: "2026-04-27",
      to: "2026-05-03",
    });
  });
  it("crosses year boundaries cleanly", () => {
    // 2026-01-01 is a Thursday.
    assert.deepEqual(weekRange("2026-01-01"), {
      from: "2025-12-29",
      to: "2026-01-04",
    });
  });
});

describe("monthRange", () => {
  it("returns first to last day of the month", () => {
    assert.deepEqual(monthRange("2026-04-15"), {
      from: "2026-04-01",
      to: "2026-04-30",
    });
  });
  it("handles 31-day months", () => {
    assert.deepEqual(monthRange("2026-01-15"), {
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });
  it("handles February in a non-leap year", () => {
    assert.deepEqual(monthRange("2026-02-10"), {
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
  it("handles February in a leap year", () => {
    assert.deepEqual(monthRange("2024-02-10"), {
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });
});

describe("yearRange", () => {
  it("returns Jan 1 to Dec 31", () => {
    assert.deepEqual(yearRange("2026-04-25"), {
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });
});

describe("previousWeekRange", () => {
  it("returns the week before the one containing the given date", () => {
    assert.deepEqual(previousWeekRange("2026-04-22"), {
      from: "2026-04-13",
      to: "2026-04-19",
    });
  });
});

describe("previousMonthRange", () => {
  it("returns the calendar month before the given date", () => {
    assert.deepEqual(previousMonthRange("2026-04-15"), {
      from: "2026-03-01",
      to: "2026-03-31",
    });
  });
  it("rolls back over year boundary", () => {
    assert.deepEqual(previousMonthRange("2026-01-15"), {
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });
});

describe("previousYearRange", () => {
  it("returns the calendar year before the given date", () => {
    assert.deepEqual(previousYearRange("2026-04-15"), {
      from: "2025-01-01",
      to: "2025-12-31",
    });
  });
});
