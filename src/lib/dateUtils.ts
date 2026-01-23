export function isEventExpired(eventDate: string | null): boolean {
  if (!eventDate) {
    return false;
  }

  const now = new Date();
  const event = new Date(eventDate);

  const oneDayInMs = 24 * 60 * 60 * 1000;
  const timeDiff = now.getTime() - event.getTime();

  return timeDiff > oneDayInMs;
}
