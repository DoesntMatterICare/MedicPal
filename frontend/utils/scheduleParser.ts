export function parseSchedule(input?: string | null): string[] {
  const value = (input || "").toLowerCase();
  if (/thrice|3\s*times|three\s*times/.test(value)) return ["08:00", "14:00", "20:00"];
  if (/twice|2\s*times|\bbd\b/.test(value)) return ["09:00", "21:00"];
  const times: string[] = [];
  if (/morning|breakfast/.test(value)) times.push("08:00");
  if (/afternoon|lunch/.test(value)) times.push("14:00");
  if (/night|bedtime|dinner/.test(value)) times.push("21:00");
  return times.length ? [...new Set(times)] : ["09:00"];
}

export function displayTime(time: string) {
  const [hourValue, minute] = time.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}