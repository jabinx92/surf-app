export function formatSessionDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSessionTime(value?: string | null) {
  if (!value) return "Time not selected";
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const time = new Date(2000, 0, 1, hour, minute);
  return time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
