# TechAbout Team Leaderboard & Task Points

Internal leaderboard with fixed points per task type, daily attendance + tasks, daily/weekly rankings, team filter and an award history log. **Mock data only.**

## Setup
```bash
npm install
cp .env.example .env.local   # no secrets needed
npm run dev                  # http://localhost:3000
npm test                     # scoring + permission tests
npm run build
```
Deploy: push to GitHub, import the repo in Vercel (framework: Next.js, no env vars required).

## Architecture
- **Next.js 14 (App Router)**: one client UI (`app/page.js`) and one REST handler (`app/api/[...slug]/route.js`).
- `lib/scoring.js`: pure functions (points, week/day keys, ranking, permissions); the unit-tested core.
- `lib/store.js`: seeded in-memory mock data (9 users, 2 teams, 7 days of tasks/attendance).
- Auth is a mock cookie (`uid`) set by picking a user at login. Roles are enforced server-side.
- Each award stores a **snapshot of its points**, so changing a task type never rewrites history.

## Roles
| Role | Can do |
|---|---|
| member | view leaderboard, daily view, history |
| lead | + log tasks and mark attendance for members of own team |
| admin | + create/edit task types and points; log for any member |

## API (all JSON; cookie `uid` required except `users`, `login`)
| Method & path | Role | Notes |
|---|---|---|
| GET `/api/users` | any | mock user list |
| POST `/api/login` `{userId}` / `/api/logout` | any | sets/clears cookie |
| GET `/api/me` | auth | current user + today |
| GET `/api/leaderboard?period=daily\|weekly&date=YYYY-MM-DD&team=` | auth | ranked, ties share rank |
| GET `/api/daily?date=&team=` | auth | attendance + tasks per member |
| GET `/api/task-types` | auth | |
| POST `/api/task-types` `{name,points}` / PUT `/api/task-types/:id` `{points}` | admin | points 1-1000 |
| POST `/api/awards` `{userId,typeId,qty,note}` | lead/admin | qty 1-50 |
| POST `/api/attendance` `{userId,date,present}` | lead/admin | |
| GET `/api/history` | auth | latest 100: who awarded what, when |

## Limitations
- Data lives in server memory: it resets on redeploy/cold start and is not shared across serverless instances. Swap `lib/store.js` for a database (e.g. Postgres) for real use.
- Mock login has no passwords; not production auth.
- Weeks are Monday-Sunday in UTC. No pagination beyond the latest 100 history rows.
