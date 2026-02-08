/**
 * Date Utilities for Custom Month Cycle
 * Default cycle: 6th of current month to 5th of next month
 */

/**
 * Get the custom month range based on a start day (default: 6th)
 * @param {Date} date - Reference date
 * @param {number} startDay - Day of month when cycle starts (default: 6)
 * @returns {{start: Date, end: Date, label: string}}
 */
export function getCustomMonthRange(date = new Date(), startDay = 6) {
  const d = new Date(date);
  const currentDay = d.getDate();
  
  let start, end;
  
  if (currentDay >= startDay) {
    // We're in the current cycle (e.g., Feb 6 - Mar 5)
    start = new Date(d.getFullYear(), d.getMonth(), startDay);
    end = new Date(d.getFullYear(), d.getMonth() + 1, startDay - 1);
  } else {
    // We're in the previous cycle (e.g., Jan 6 - Feb 5)
    start = new Date(d.getFullYear(), d.getMonth() - 1, startDay);
    end = new Date(d.getFullYear(), d.getMonth(), startDay - 1);
  }
  
  // Set time to start/end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Create label like "Feb 6 - Mar 5"
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const label = `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  
  return { start, end, label };
}

/**
 * Get the current custom month range
 * @param {number} startDay - Day of month when cycle starts (default: 6)
 * @returns {{start: Date, end: Date, label: string}}
 */
export function getCurrentCustomMonth(startDay = 6) {
  return getCustomMonthRange(new Date(), startDay);
}

/**
 * Get days remaining in current custom month cycle
 * @param {number} startDay - Day of month when cycle starts (default: 6)
 * @returns {number}
 */
export function getDaysLeftInCycle(startDay = 6) {
  const { end } = getCurrentCustomMonth(startDay);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get previous N custom month ranges for historical data
 * @param {number} n - Number of previous months
 * @param {number} startDay - Day of month when cycle starts (default: 6)
 * @returns {Array<{start: Date, end: Date, label: string}>}
 */
export function getPreviousCustomMonths(n = 3, startDay = 6) {
  const months = [];
  const { start: currentStart } = getCurrentCustomMonth(startDay);
  
  for (let i = 1; i <= n; i++) {
    const refDate = new Date(currentStart);
    refDate.setMonth(refDate.getMonth() - i);
    months.push(getCustomMonthRange(refDate, startDay));
  }
  
  return months;
}

/**
 * Check if a date falls within a custom month range
 * @param {Date} date - Date to check
 * @param {Date} start - Start of range
 * @param {Date} end - End of range
 * @returns {boolean}
 */
export function isDateInRange(date, start, end) {
  const d = new Date(date);
  return d >= start && d <= end;
}
