// ─── Intelligent Date Extraction from Campaign File Names ───────────────────

export interface DetectedDateInfo {
  key: string;       // Normalized sorting/lookup key e.g. "10-04" or "2026-10-04"
  label: string;     // Clean human display label e.g. "Oct 4"
  day: number;       // Day number e.g. 4
  month: string;     // Month code e.g. "OCT"
  monthNum: number;  // 1-12
  year?: number;     // e.g. 2026
  sortKey: number;   // Numeric sort key for chronological ordering
}

const MONTH_MAP: Record<string, { num: number; name: string }> = {
  JAN: { num: 1, name: 'Jan' },
  JANUARY: { num: 1, name: 'Jan' },
  FEB: { num: 2, name: 'Feb' },
  FEBRUARY: { num: 2, name: 'Feb' },
  MAR: { num: 3, name: 'Mar' },
  MARCH: { num: 3, name: 'Mar' },
  APR: { num: 4, name: 'Apr' },
  APRIL: { num: 4, name: 'Apr' },
  MAY: { num: 5, name: 'May' },
  JUN: { num: 6, name: 'Jun' },
  JUNE: { num: 6, name: 'Jun' },
  JUL: { num: 7, name: 'Jul' },
  JULY: { num: 7, name: 'Jul' },
  AUG: { num: 8, name: 'Aug' },
  AUGUST: { num: 8, name: 'Aug' },
  SEP: { num: 9, name: 'Sep' },
  SEPT: { num: 9, name: 'Sep' },
  SEPTEMBER: { num: 9, name: 'Sep' },
  OCT: { num: 10, name: 'Oct' },
  OCTOBER: { num: 10, name: 'Oct' },
  NOV: { num: 11, name: 'Nov' },
  NOVEMBER: { num: 11, name: 'Nov' },
  DEC: { num: 12, name: 'Dec' },
  DECEMBER: { num: 12, name: 'Dec' },
};

/**
 * Scans a list of sibling file names to detect the dominant month in the batch.
 * Example: if files contain "4 OCT" or "9 OCT", returns "OCT".
 */
export function detectBatchContextMonth(fileNames: string[]): string {
  const monthCounts: Record<string, number> = {};

  const monthRegex = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b/gi;

  fileNames.forEach(fn => {
    const matches = fn.toUpperCase().match(monthRegex);
    if (matches) {
      matches.forEach(m => {
        const standard = m.slice(0, 3);
        monthCounts[standard] = (monthCounts[standard] || 0) + 1;
      });
    }
  });

  let dominantMonth = 'OCT';
  let maxCount = 0;
  for (const [m, count] of Object.entries(monthCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantMonth = m;
    }
  }

  // Fallback to current system month if no files mention a month
  if (maxCount === 0) {
    const now = new Date();
    const currentMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    dominantMonth = currentMonths[now.getMonth()];
  }

  return dominantMonth;
}

/**
 * Extracts date information from a single campaign file name.
 * Handles patterns such as:
 * - "GZ CAMPS 4 OCT 1" -> Oct 4
 * - "CM AD CAMPS 9 OCT" -> Oct 9
 * - "GZ 3RD", "RGR 3RD", "branded 3rd" -> Oct 3 (using context month)
 * - "CAMPAIGNS 10/04/2026" or "10-04" -> Oct 4
 */
export function detectDateFromFileName(
  fileName: string,
  contextMonth: string = 'OCT'
): DetectedDateInfo {
  const clean = fileName.replace(/\.csv$/i, '').toUpperCase().trim();

  const standardCtxMonth = contextMonth.slice(0, 3).toUpperCase();
  const ctxMonthData = MONTH_MAP[standardCtxMonth] || { num: 10, name: 'Oct' };

  // 1. Pattern: Day followed by Month (e.g., "4 OCT", "04 OCT", "4TH OCT", "9 OCT 1", "5OCT")
  // Notice we avoid matching the trailing copy number (like "1" in "4 OCT 1") by ensuring day comes before month
  const dayMonthMatch = clean.match(
    /(?:^|[\s_/-])(\d{1,2})(?:ST|ND|RD|TH)?[\s_/-]*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)(?:[\s_/-]|$)/i
  );
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].slice(0, 3).toUpperCase();
    const mData = MONTH_MAP[mStr] || ctxMonthData;
    const sortKey = mData.num * 100 + day;
    return {
      key: `${String(mData.num).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: `${mData.name} ${day}`,
      day,
      month: mStr,
      monthNum: mData.num,
      sortKey,
    };
  }

  // 2. Pattern: Month followed by Day (e.g., "OCT 4", "OCTOBER 9", "OCT-04", "OCT5")
  const monthDayMatch = clean.match(
    /(?:^|[\s_/-])(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)[\s_/-]*(\d{1,2})(?:ST|ND|RD|TH)?(?:[\s_/-]|$)/i
  );
  if (monthDayMatch) {
    const day = parseInt(monthDayMatch[2], 10);
    const mStr = monthDayMatch[1].slice(0, 3).toUpperCase();
    const mData = MONTH_MAP[mStr] || ctxMonthData;
    const sortKey = mData.num * 100 + day;
    return {
      key: `${String(mData.num).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: `${mData.name} ${day}`,
      day,
      month: mStr,
      monthNum: mData.num,
      sortKey,
    };
  }

  // 3. Pattern: Ordinal day (e.g., "3RD", "1ST", "2ND", "4TH", "9TH", "21ST")
  // Very common in files like "GZ 3RD", "RGR 3RD", "branded 3rd"
  const ordinalMatch = clean.match(/(?:^|[\s_/-])(\d{1,2})(ST|ND|RD|TH)(?:[\s_/-]|$)/i);
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1], 10);
    const sortKey = ctxMonthData.num * 100 + day;
    return {
      key: `${String(ctxMonthData.num).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: `${ctxMonthData.name} ${day}`,
      day,
      month: standardCtxMonth,
      monthNum: ctxMonthData.num,
      sortKey,
    };
  }

  // 4. Pattern: Standard numeric ISO date (e.g. 2026-10-04, 2026/10/04)
  const isoMatch = clean.match(/\b(20\d\d)[-_/](\d{1,2})[-_/](\d{1,2})\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const mKeys = Object.keys(MONTH_MAP);
    const found = mKeys.find(k => MONTH_MAP[k].num === month) || 'OCT';
    const mName = MONTH_MAP[found].name;
    return {
      key: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: `${mName} ${day}`,
      day,
      month: found.slice(0, 3),
      monthNum: month,
      year,
      sortKey: month * 100 + day,
    };
  }

  // 5. Pattern: US numeric date (e.g. 10-04, 10/04, 10_04)
  const numMatch = clean.match(/\b(\d{1,2})[-_/](\d{1,2})\b/);
  if (numMatch) {
    let m = parseInt(numMatch[1], 10);
    let d = parseInt(numMatch[2], 10);
    if (m > 12 && d <= 12) {
      // Swapped format (day-month)
      const tmp = m;
      m = d;
      d = tmp;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const mKeys = Object.keys(MONTH_MAP);
      const found = mKeys.find(k => MONTH_MAP[k].num === m) || 'OCT';
      const mName = MONTH_MAP[found].name;
      return {
        key: `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        label: `${mName} ${d}`,
        day: d,
        month: found.slice(0, 3),
        monthNum: m,
        sortKey: m * 100 + d,
      };
    }
  }

  // Fallback: Default to clean filename as date key
  return {
    key: `OTHER-${clean.slice(0, 8)}`,
    label: clean.slice(0, 12),
    day: 1,
    month: standardCtxMonth,
    monthNum: ctxMonthData.num,
    sortKey: 9999,
  };
}
