
/**
 * Returns the start of the current local day as a Date object.
 * This ensures consistency across different services.
 */
export function getStartOfLocalDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
}

/**
 * Returns a YYYY-MM-DD string representation of the local date.
 * Useful for string-based daily reset comparisons.
 */
export function getLocalDateString(date: Date = new Date()): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}
