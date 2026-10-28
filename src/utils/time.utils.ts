import moment from 'moment';

/**
 * Converts a date input to a Unix timestamp in milliseconds.
 * @param date - The date input (Date object, string, or moment object).
 * @returns Unix timestamp in milliseconds.
 */
export const toUnixTimestamp = (date: moment.MomentInput): number => {
  return moment(date).valueOf();
};

/**
 * Formats a Unix timestamp (milliseconds) into a human-readable string.
 * @param timestamp - Unix timestamp in milliseconds.
 * @param format - The desired output format (default: 'MMM D, YYYY • h:mm A').
 * @returns Formatted date string.
 */
export const formatTimestamp = (
  timestamp: string | number | undefined,
  format: string = 'MMM D, YYYY • h:mm A',
): string => {
  if (!timestamp) return '';
  // If it's a string that looks like a number, convert it
  const ts =
    typeof timestamp === 'string' && !isNaN(Number(timestamp))
      ? Number(timestamp)
      : timestamp;
  return moment(ts).format(format);
};

/**
 * Combines a date from one Date object and a time from another into a single Unix timestamp.
 * @param date - Date object for the day.
 * @param time - Date object for the time.
 * @returns Unix timestamp in milliseconds.
 */
export const getCombinedUnixTimestamp = (date: Date, time: Date): number => {
  return moment(date)
    .set({
      hour: moment(time).get('hour'),
      minute: moment(time).get('minute'),
      second: 0,
      millisecond: 0,
    })
    .valueOf();
};

/**
 * Checks if a timestamp is within a certain window relative to now.
 * @param timestamp - Unix timestamp in milliseconds.
 * @param windowMinutes - Window in minutes.
 * @returns Boolean indicating if it's within the window.
 */
export const isWithinWindow = (
  timestamp: number | string | undefined,
  windowMinutes: number = 15,
): boolean => {
  if (!timestamp) return false;
  const now = moment().valueOf();
  const ts =
    typeof timestamp === 'string' && !isNaN(Number(timestamp))
      ? Number(timestamp)
      : Number(timestamp);
  const diffInMinutes = Math.abs(moment(ts).diff(moment(now), 'minutes'));
  return diffInMinutes <= windowMinutes;
};
