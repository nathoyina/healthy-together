export type FriendLeaderInput = {
  userId: string;
  username: string | null;
  displayName: string | null;
  checkIns: number;
  isYou: boolean;
};

export type FriendLeaderRow = FriendLeaderInput & { rank: number };

/** Ranks all goal participants by total check-ins. Competition ranking for ties (1,1,3). */
export function buildFriendLeaderboardRows(
  viewerId: string,
  participantIds: string[],
  entries: { user_id: string; value: number }[],
  profiles: Map<string, { username: string | null; display_name: string | null }>,
): FriendLeaderRow[] {
  const ids = new Set<string>([viewerId, ...participantIds]);

  const totals = new Map<string, number>();
  for (const uid of ids) totals.set(uid, 0);
  for (const e of entries) {
    if (!ids.has(e.user_id)) continue;
    totals.set(e.user_id, (totals.get(e.user_id) ?? 0) + e.value);
  }

  const inputs: FriendLeaderInput[] = [...ids].map((userId) => ({
    userId,
    username: profiles.get(userId)?.username ?? null,
    displayName: profiles.get(userId)?.display_name ?? null,
    checkIns: totals.get(userId) ?? 0,
    isYou: userId === viewerId,
  }));

  inputs.sort((a, b) => {
    if (b.checkIns !== a.checkIns) return b.checkIns - a.checkIns;
    const an = (a.username ?? a.displayName ?? a.userId).toLowerCase();
    const bn = (b.username ?? b.displayName ?? b.userId).toLowerCase();
    return an.localeCompare(bn);
  });

  let rank = 0;
  return inputs.map((r, i) => {
    if (i === 0 || r.checkIns < inputs[i - 1]!.checkIns) {
      rank = i + 1;
    }
    return { rank, ...r };
  });
}

export function displayNameForLeader(r: FriendLeaderInput): string {
  if (r.username) return `@${r.username}`;
  if (r.displayName) return r.displayName;
  return r.isYou ? "You" : "Colleague";
}
