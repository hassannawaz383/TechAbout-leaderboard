import { dayKey } from './scoring';
const USERS = [
  ['u1', 'Ayesha Khan', 'admin', null], ['u2', 'Bilal Ahmed', 'lead', 'Alpha'], ['u3', 'Sana Malik', 'lead', 'Beta'],
  ['u4', 'Hamza Ali', 'member', 'Alpha'], ['u5', 'Zara Iqbal', 'member', 'Alpha'], ['u6', 'Usman Tariq', 'member', 'Alpha'],
  ['u7', 'Maryam Noor', 'member', 'Beta'], ['u8', 'Danish Raza', 'member', 'Beta'], ['u9', 'Hira Saeed', 'member', 'Beta'],
].map(([id, name, role, team]) => ({ id, name, role, team }));
const TYPES = [['bug-fix', 'Bug Fix', 10], ['feature', 'Feature Delivery', 25], ['code-review', 'Code Review', 8],
  ['content', 'Content Post', 15], ['outreach', 'Outreach Email', 5], ['report', 'Report', 20]].map(([id, name, points]) => ({ id, name, points }));
function seed() {
  const awards = [], attendance = [];
  const leadOf = (t) => USERS.find((u) => u.role === 'lead' && u.team === t);
  USERS.filter((u) => u.role === 'member').forEach((u, i) => {
    for (let d = 0; d < 7; d++) {
      const date = dayKey(Date.now() - d * 864e5);
      const present = (i * 7 + d) % 5 !== 0;
      attendance.push({ userId: u.id, date, present });
      if (!present) continue;
      for (let k = 0; k < ((i + d) % 4) + 1; k++) {
        const t = TYPES[(i + d + k) % TYPES.length];
        awards.push({ id: `s${u.id}${d}${k}`, userId: u.id, typeId: t.id, typeName: t.name, points: t.points, qty: 1,
          note: 'Seeded mock entry', awardedBy: leadOf(u.team).id, at: new Date(`${date}T${String(8 + k * 2).padStart(2, '0')}:00:00Z`).toISOString() });
      }
    }
  });
  return { users: USERS, types: TYPES, awards, attendance };
}
export const getStore = () => (globalThis.__store ||= seed());
