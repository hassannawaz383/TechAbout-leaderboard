export const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
export function weekStart(d) {
  const x = new Date(dayKey(d) + 'T00:00:00Z');
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // Monday
  return x.toISOString().slice(0, 10);
}
export function pointsFor(typeId, types, qty = 1) {
  const t = types.find((t) => t.id === typeId);
  if (!t) throw new Error('Unknown task type');
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error('Quantity must be an integer from 1 to 50');
  return t.points * qty;
}
export function canAward(actor, target) {
  if (!actor || !target || target.role !== 'member') return false;
  return actor.role === 'admin' || (actor.role === 'lead' && actor.team === target.team);
}
export function buildLeaderboard({ users, awards, attendance = [], period = 'daily', date, team }) {
  const inP = (d) => (period === 'weekly' ? weekStart(d) === weekStart(date) : d === dayKey(date));
  const rows = users
    .filter((u) => u.role === 'member' && (!team || u.team === team))
    .map((u) => {
      const mine = awards.filter((a) => a.userId === u.id && inP(dayKey(a.at)));
      return {
        user: u,
        points: mine.reduce((s, a) => s + a.points, 0),
        tasks: mine.reduce((s, a) => s + a.qty, 0),
        daysPresent: attendance.filter((x) => x.userId === u.id && x.present && inP(x.date)).length,
      };
    })
    .sort((a, b) => b.points - a.points || b.tasks - a.tasks || a.user.name.localeCompare(b.user.name));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.points !== rows[i - 1].points || r.tasks !== rows[i - 1].tasks) rank = i + 1;
    return { ...r, rank };
  });
}
