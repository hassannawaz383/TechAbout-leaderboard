'use client';
import { useEffect, useState, useCallback } from 'react';
async function api(p, o = {}) {
  const r = await fetch('/api' + p, { method: o.method || 'GET', headers: { 'content-type': 'application/json' }, body: o.body ? JSON.stringify(o.body) : undefined });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}
const ini = (n) => n.split(' ').map((x) => x[0]).join('');
const fmt = (s) => new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
export default function Home() {
  const [me, setMe] = useState(null), [users, setUsers] = useState([]), [tab, setTab] = useState('board'), [period, setPeriod] = useState('daily');
  const [team, setTeam] = useState(''), [date, setDate] = useState(''), [board, setBoard] = useState([]), [daily, setDaily] = useState([]);
  const [types, setTypes] = useState([]), [hist, setHist] = useState([]), [msg, setMsg] = useState('');
  const [f, setF] = useState({ userId: '', typeId: '', qty: 1, note: '' }), [nt, setNt] = useState({ name: '', points: 10 });
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const run = async (fn) => { try { await fn(); } catch (e) { flash(e.message); } };
  useEffect(() => { api('/users').then(setUsers); api('/me').then((u) => { setMe(u); setDate(u.today); }).catch(() => {}); }, []);
  const load = useCallback(() => run(async () => {
    if (!me || !date) return;
    setBoard(await api(`/leaderboard?period=${period}&date=${date}&team=${team}`));
    setDaily(await api(`/daily?date=${date}&team=${team}`));
    setTypes(await api('/task-types')); setHist(await api('/history'));
  }), [me, date, period, team]);
  useEffect(() => { load(); }, [load]);
  const teams = [...new Set(users.map((u) => u.team).filter(Boolean))];
  const staff = me && me.role !== 'member';
  const mine = users.filter((u) => u.role === 'member' && (me?.role === 'admin' || u.team === me?.team));
  if (!me) return (
    <div className="wrap"><header><h1><b>TechAbout</b> Leaderboard</h1></header>
      <div className="card"><h3>Sign in as a mock user</h3><p className="sub">Demo only. Pick a role to explore.</p>
        <div className="login">{users.map((u) => <button key={u.id} onClick={() => run(async () => { await api('/login', { method: 'POST', body: { userId: u.id } }); const m = await api('/me'); setMe(m); setDate(m.today); })}>
          <b>{u.name}</b><div className="sub">{u.role}{u.team ? ` · ${u.team}` : ''}</div></button>)}</div></div>{msg && <div className="toast">{msg}</div>}</div>);
  const tabs = [['board', 'Leaderboard'], ['daily', 'Daily'], ['hist', 'History'], ...(staff ? [['log', 'Log task']] : []), ...(me.role === 'admin' ? [['types', 'Task types']] : [])];
  return (
    <div className="wrap">
      <header><div><h1><b>TechAbout</b> Leaderboard</h1><div className="sub">{me.name} · {me.role}{me.team ? ` · ${me.team}` : ''}</div></div>
        <button onClick={() => run(async () => { await api('/logout', { method: 'POST' }); setMe(null); })}>Switch user</button></header>
      <div className="tabs" style={{ marginBottom: 16 }}>{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {(tab === 'board' || tab === 'daily') && <div className="row">
        {tab === 'board' && <div className="seg">{['daily', 'weekly'].map((p) => <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p}</button>)}</div>}
        <select value={team} onChange={(e) => setTeam(e.target.value)}><option value="">All teams</option>{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>}
      {tab === 'board' && <>
        <div className="podium">{board.slice(0, 3).map((r) => <div key={r.user.id} className={`pod r${r.rank}`}><div className="av">{ini(r.user.name)}</div><div>#{r.rank} {r.user.name}</div><div className="sub">{r.user.team}</div><div className="pts">{r.points}</div><div className="sub">{r.tasks} tasks</div></div>)}</div>
        <div className="card"><table><thead><tr><th>Rank</th><th>Member</th><th>Team</th><th>Tasks</th><th>Days present</th><th>Points</th></tr></thead>
          <tbody>{board.map((r) => <tr key={r.user.id}><td>#{r.rank}</td><td>{r.user.name}</td><td>{r.user.team}</td><td>{r.tasks}</td><td>{r.daysPresent}</td><td><b>{r.points}</b></td></tr>)}</tbody></table></div></>}
      {tab === 'daily' && <div className="card"><table><thead><tr><th>Member</th><th>Attendance</th><th>Tasks done</th><th>Points</th>{staff && <th />}</tr></thead>
        <tbody>{daily.map((r) => <tr key={r.user.id}><td>{r.user.name}</td><td><span className={`badge ${r.present ? 'ok' : ''}`}>{r.present ? 'Present' : 'Absent'}</span></td><td>{r.tasks}</td><td>{r.points}</td>
          {staff && <td><button onClick={() => run(async () => { await api('/attendance', { method: 'POST', body: { userId: r.user.id, date, present: !r.present } }); load(); })}>Mark {r.present ? 'absent' : 'present'}</button></td>}</tr>)}</tbody></table></div>}
      {tab === 'hist' && <div className="card"><table><thead><tr><th>When</th><th>Member</th><th>Task</th><th>Points</th><th>Awarded by</th></tr></thead>
        <tbody>{hist.map((h) => <tr key={h.id}><td>{fmt(h.at)}</td><td>{h.member}</td><td>{h.typeName}{h.qty > 1 ? ` ×${h.qty}` : ''}</td><td>+{h.points}</td><td>{h.awardedByName}</td></tr>)}</tbody></table></div>}
      {tab === 'log' && <div className="card"><h3>Log a completed task</h3><div className="row">
        <select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}><option value="">Member</option>{mine.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select value={f.typeId} onChange={(e) => setF({ ...f, typeId: e.target.value })}><option value="">Task type</option>{types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.points} pts)</option>)}</select>
        <input type="number" min="1" max="50" style={{ width: 80 }} value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })} />
        <input placeholder="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <button className="on" onClick={() => run(async () => { await api('/awards', { method: 'POST', body: f }); flash('Points awarded'); setF({ ...f, note: '' }); load(); })}>Award</button></div></div>}
      {tab === 'types' && <div className="card"><h3>Task types & fixed points</h3>
        <table><tbody>{types.map((t) => <tr key={t.id}><td>{t.name}</td><td><input type="number" style={{ width: 90 }} defaultValue={t.points} onBlur={(e) => run(async () => { await api('/task-types/' + t.id, { method: 'PUT', body: { points: +e.target.value } }); flash('Saved'); load(); })} /> pts</td></tr>)}</tbody></table>
        <div className="row" style={{ marginTop: 16 }}><input placeholder="New task type" value={nt.name} onChange={(e) => setNt({ ...nt, name: e.target.value })} />
          <input type="number" style={{ width: 90 }} value={nt.points} onChange={(e) => setNt({ ...nt, points: +e.target.value })} />
          <button className="on" onClick={() => run(async () => { await api('/task-types', { method: 'POST', body: nt }); setNt({ name: '', points: 10 }); load(); })}>Add</button></div>
        <p className="sub">Changing points affects future awards only; history keeps the points awarded at the time.</p></div>}
      {msg && <div className="toast">{msg}</div>}
    </div>);
}
