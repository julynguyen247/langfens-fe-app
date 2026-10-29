/** All writers in this tab share a queue per attempt, including final submit. */
const pending = new Map<string, Promise<unknown>>();

export function enqueueAttemptSave<T>(attemptId: string, save: () => Promise<T>): Promise<T> {
  const previous = pending.get(attemptId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(save);
  pending.set(attemptId, next);
  // Handle both branches without creating an unhandled rejecting finally promise.
  const release = () => { if (pending.get(attemptId) === next) pending.delete(attemptId); };
  void next.then(release, release);
  return next;
}
