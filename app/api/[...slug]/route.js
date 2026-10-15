import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/store';
import { buildLeaderboard, pointsFor, canAward, dayKey } from '../../../lib/scoring';
export const dynamic = 'force-dynamic';
const out = (d, s = 200) => NextResponse.json(d, { status: s });
const bad = (m, s = 400) => out({ error: m }, s);
const okPts = (n) => Number.isInteger(n) && n >= 1 && n <= 1000;
async function handle(req) {
  const S = getStore(), url = new URL(req.url), q = url.searchParams, m = req.method;
  const [r, id] = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const me = S.users.find((u) => u.id === req.cookies.get('uid')?.value);
  let body = {};
  if (m !== 'GET') { try { body = await req.json(); } catch {} }
  if (r === 'users' && m === 'GET') return out(S.users);
  if (r === 'login' && m === 'POST') {
    const u = S.users.find((u) => u.id === body.userId);
    if (!u) return bad('Unknown user', 404);
    const res = out(u); res.cookies.set('uid', u.id, { httpOnly: true, sameSite: 'lax', path: '/' }); return res;
  }
  if (!me) return bad('Not authenticated', 401);
  const date = q.get('date') || dayKey(new Date());
  if (r === 'logout' && m === 'POST') { const res = out({ ok: true }); res.cookies.delete('uid'); return res; }
  if (r === 'me') return out({ ...me, today: dayKey(new Date()) });
  if (r === 'leaderboard' && m === 'GET')
    return out(buildLeaderboard({ ...S, period: q.get('period') === 'weekly' ? 'weekly' : 'daily', date, team: q.get('team') || undefined }));
  if (r === 'daily' && m === 'GET') {
    const team = q.get('team') || undefined;
    return out(buildLeaderboard({ ...S, period: 'daily', date, team }).map((x) => ({
      user: x.user, tasks: x.tasks, points: x.points, present: !!S.attendance.find((a) => a.userId === x.user.id && a.date === date && a.present) })));
  }
  if (r === 'task-types') {
    if (m === 'GET') return out(S.types);
    if (me.role !== 'admin') return bad('Admins only', 403);
    if (m === 'POST') {
      if (!body.name?.trim() || !okPts(body.points)) return bad('Name and points (1-1000) required');
      const t = { id: body.name.toLowerCase().trim().replace(/\W+/g, '-'), name: body.name.trim(), points: body.points };
      if (S.types.some((x) => x.id === t.id)) return bad('Task type exists', 409);
      S.types.push(t); return out(t, 201);
    }
    if (m === 'PUT') {
      const t = S.types.find((x) => x.id === id);
      if (!t) return bad('Not found', 404);
      if (!okPts(body.points)) return bad('Points must be 1-1000');
      t.points = body.points; return out(t); // past awards keep their original points
    }
  }
  if (r === 'awards' && m === 'POST') {
    const target = S.users.find((u) => u.id === body.userId);
    if (!canAward(me, target)) return bad('You cannot award points to this user', 403);
    try {
      const qty = body.qty ?? 1, t = S.types.find((x) => x.id === body.typeId);
      const a = { id: crypto.randomUUID(), userId: target.id, typeId: body.typeId, typeName: t?.name, points: pointsFor(body.typeId, S.types, qty),
        qty, note: String(body.note || '').slice(0, 200), awardedBy: me.id, at: new Date().toISOString() };
      S.awards.push(a); return out(a, 201);
    } catch (e) { return bad(e.message); }
  }
  if (r === 'attendance' && m === 'POST') {
    const target = S.users.find((u) => u.id === body.userId);
    if (!canAward(me, target)) return bad('You cannot mark this user', 403);
    const d = body.date || dayKey(new Date());
    let rec = S.attendance.find((a) => a.userId === target.id && a.date === d);
    if (!rec) S.attendance.push((rec = { userId: target.id, date: d }));
    rec.present = !!body.present; return out(rec);
  }
  if (r === 'history' && m === 'GET') {
    const name = (i) => S.users.find((u) => u.id === i)?.name;
    return out([...S.awards].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)
      .map((a) => ({ ...a, member: name(a.userId), awardedByName: name(a.awardedBy) })));
  }
  return bad('Not found', 404);
}
export { handle as GET, handle as POST, handle as PUT };
