export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseResetTime(timeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = (timeStr || "00:00").split(":");
  const hour = Math.max(0, Math.min(23, parseInt(hourStr, 10) || 0));
  const minute = Math.max(0, Math.min(59, parseInt(minuteStr, 10) || 0));
  return { hour, minute };
}

export function getResetDateKey(date = new Date(), resetTime = "00:00"): string {
  const { hour, minute } = parseResetTime(resetTime);
  const adjusted = new Date(date);
  if (date.getHours() < hour || (date.getHours() === hour && date.getMinutes() < minute)) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return getLocalDateString(adjusted);
}
