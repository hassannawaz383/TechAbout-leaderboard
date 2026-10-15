import { describe, it, expect } from 'vitest';
import { pointsFor, weekStart, canAward, buildLeaderboard } from '../lib/scoring';
const types = [{ id: 'bug', points: 10 }, { id: 'feat', points: 25 }];
const users = [
  { id: 'a', name: 'Ann', role: 'member', team: 'Alpha' },
  { id: 'b', name: 'Bob', role: 'member', team: 'Beta' },
  { id: 'c', name: 'Cy', role: 'member', team: 'Beta' },
  { id: 'l', name: 'Lead', role: 'lead', team: 'Alpha' },
];
const aw = (userId, points, at, qty = 1) => ({ userId, points, at, qty });
describe('scoring', () => {
  it('multiplies fixed points by quantity', () => expect(pointsFor('feat', types, 2)).toBe(50));
  it('rejects unknown types and bad quantity', () => {
    expect(() => pointsFor('x', types)).toThrow();
    expect(() => pointsFor('bug', types, 0)).toThrow();
    expect(() => pointsFor('bug', types, 1.5)).toThrow();
  });
  it('week starts on Monday', () => {
    expect(weekStart('2026-10-15')).toBe('2026-10-12');
    expect(weekStart('2026-10-18')).toBe('2026-10-12');
  });
  const awards = [aw('a', 10, '2026-10-15T09:00:00Z'), aw('a', 25, '2026-10-13T09:00:00Z'), aw('b', 10, '2026-10-15T10:00:00Z')];
  it('separates daily and weekly totals', () => {
    const d = buildLeaderboard({ users, awards, period: 'daily', date: '2026-10-15' });
    const w = buildLeaderboard({ users, awards, period: 'weekly', date: '2026-10-15' });
    expect(d.find((r) => r.user.id === 'a').points).toBe(10);
    expect(w.find((r) => r.user.id === 'a').points).toBe(35);
    expect(w[0].user.id).toBe('a');
  });
  it('ties share a rank and leads are excluded', () => {
    const r = buildLeaderboard({ users, awards: [aw('b', 10, '2026-10-15T01:00:00Z'), aw('c', 10, '2026-10-15T02:00:00Z')], date: '2026-10-15' });
    expect(r.map((x) => x.rank)).toEqual([1, 1, 3]);
    expect(r.some((x) => x.user.role === 'lead')).toBe(false);
  });
  it('filters by team and counts attendance', () => {
    const r = buildLeaderboard({ users, awards, attendance: [{ userId: 'b', date: '2026-10-15', present: true }], date: '2026-10-15', team: 'Beta' });
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.user.id === 'b').daysPresent).toBe(1);
  });
  it('enforces who can award', () => {
    expect(canAward(users[3], users[0])).toBe(true);
    expect(canAward(users[3], users[1])).toBe(false);
    expect(canAward({ role: 'admin' }, users[1])).toBe(true);
    expect(canAward(users[0], users[1])).toBe(false);
  });
});
