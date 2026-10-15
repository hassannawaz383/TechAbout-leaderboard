# TechAbout Team Leaderboard & Task Points

# TechAbout: Team Leaderboard & Task Points System

An internal leaderboard where team members' work is tracked and scored using **fixed points per task type**, so rankings stay simple and transparent. Built with **mock data only**.

- **Live URL:** https://tech-about-leaderboard.vercel.app
- **Repository:** https://github.com/hassannawaz383/TechAbout-leaderboard.git

## Features

- **Role-based access:** member, team lead and admin, enforced on the server.
- **Fixed points per task type**, configurable by admins. Team leads log tasks, and the points are calculated as `fixed points × quantity`.
- **Daily attendance and tasks completed per day** shown together.
- **Leaderboard** with daily and weekly views, a date picker and a team filter. Ties share a rank.
- **History log** of who awarded which points, to whom, and when.
- **Automated tests** for the scoring logic and award permissions.
- Premium dark UI with gold accents, responsive down to mobile.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18 |
| API | One catch-all route handler (`app/api/[...slug]/route.js`) |
| Data | Seeded in-memory mock store |
| Tests | Vitest |
| Hosting | Vercel |

## Getting started

Requirements: Node.js 18.17 or newer.

```bash
git clone https://github.com/hassannawaz383/TechAbout-leaderboard.git
cd TechAbout-leaderboard
npm install
cp .env.example .env.local    # no secrets are required
npm run dev                   # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm test` | Run the automated tests |

### Environment variables

See `.env.example`. The app is mock-data only and needs **no secrets**. `.env` files are git-ignored.

### Deploying to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel (framework preset: Next.js).
3. Deploy. No environment variables are needed.

## Demo login

The login screen lists mock users. Pick one to explore each role:

| User | Role | Team |
|---|---|---|
| Ayesha Khan | Admin | n/a |
| Bilal Ahmed | Team lead | Alpha |
| Sana Malik | Team lead | Beta |
| Hamza Ali, Zara Iqbal, Usman Tariq | Member | Alpha |
| Maryam Noor, Danish Raza, Hira Saeed | Member | Beta |

## Roles and permissions

| Capability | Member | Team lead | Admin |
|---|:-:|:-:|:-:|
| View leaderboard, daily view, history | ✅ | ✅ | ✅ |
| Log tasks and award points | ❌ | Own team only | Any member |
| Mark attendance | ❌ | Own team only | Any member |
| Create and edit task types and points | ❌ | ❌ | ✅ |

Only members are ranked. Leads and admins are excluded from the scoring table.

## Scoring rules

- Each task type has a fixed point value (1 to 1000), editable by admins.
- An award is worth `task type points × quantity` (quantity is an integer from 1 to 50).
- Every award stores a **snapshot of its points**, so editing a task type later changes future awards only and never rewrites history.
- **Daily** view counts awards on the selected date. **Weekly** view counts the Monday to Sunday week (UTC) containing the selected date.
- **Ranking:** points (high to low), then tasks completed, then name. Members with equal points and equal tasks share a rank (for example 1, 1, 3).

### Seeded task types

| Task type | Points |
|---|---|
| Bug Fix | 10 |
| Feature Delivery | 25 |
| Code Review | 8 |
| Content Post | 15 |
| Outreach Email | 5 |
| Report | 20 |

## Architecture

```
app/
  layout.js                  Root layout and metadata
  globals.css                Dark/gold theme, responsive styles
  page.js                    Client UI: login, tabs, tables, forms
  api/[...slug]/route.js     REST API and role checks
lib/
  scoring.js                 Pure scoring logic (unit tested)
  store.js                   Seeded in-memory mock data
tests/
  scoring.test.js            Automated tests
```

- **`lib/scoring.js`** contains the core logic: `pointsFor`, `dayKey`, `weekStart`, `buildLeaderboard` and `canAward`. It has no framework dependencies, which keeps it easy to test.
- **`lib/store.js`** generates 9 users, 2 teams and 7 days of attendance and task awards, relative to the current date.
- **Auth** is a mock `httpOnly` cookie (`uid`) set when you pick a user. Every protected endpoint resolves the user from it and checks their role.

## API documentation

All endpoints are JSON. Protected endpoints require the `uid` cookie, which is set by `POST /api/login`.

| Method and path | Access | Description |
|---|---|---|
| `GET /api/users` | Public | List mock users (for the login screen) |
| `POST /api/login` | Public | Body `{ "userId": "u2" }`. Sets the session cookie |
| `POST /api/logout` | Signed in | Clears the session cookie |
| `GET /api/me` | Signed in | Current user plus `today` (YYYY-MM-DD) |
| `GET /api/leaderboard` | Signed in | Query: `period` (`daily` or `weekly`), `date`, `team`. Returns ranked rows |
| `GET /api/daily` | Signed in | Query: `date`, `team`. Returns attendance, tasks and points per member |
| `GET /api/task-types` | Signed in | List task types |
| `POST /api/task-types` | Admin | Body `{ "name": "Design Review", "points": 12 }` |
| `PUT /api/task-types/:id` | Admin | Body `{ "points": 15 }` |
| `POST /api/awards` | Lead, Admin | Body `{ "userId", "typeId", "qty", "note" }` |
| `POST /api/attendance` | Lead, Admin | Body `{ "userId", "date", "present": true }` |
| `GET /api/history` | Signed in | Latest 100 awards with member and awarder names |

### Example requests

```bash
# Log in as a team lead (stores the cookie)
curl -c jar.txt -X POST https://tech-about-leaderboard.vercel.app/api/login \
  -H "content-type: application/json" -d '{"userId":"u2"}'

# Award 2 bug fixes to Hamza (Alpha)
curl -b jar.txt -X POST https://tech-about-leaderboard.vercel.app/api/awards \
  -H "content-type: application/json" \
  -d '{"userId":"u4","typeId":"bug-fix","qty":2,"note":"Fixed login issues"}'

# Weekly leaderboard for team Alpha
curl -b jar.txt "https://tech-about-leaderboard.vercel.app/api/leaderboard?period=weekly&team=Alpha"
```

### Example leaderboard row

```json
{
  "user": { "id": "u4", "name": "Hamza Ali", "role": "member", "team": "Alpha" },
  "points": 45,
  "tasks": 4,
  "daysPresent": 5,
  "rank": 1
}
```

### Error responses

Errors return `{ "error": "message" }` with one of these statuses:

| Status | Meaning |
|---|---|
| 400 | Validation error (invalid points, quantity or task type) |
| 401 | Not signed in |
| 403 | Role not permitted, or a lead acting outside their own team |
| 404 | Unknown user, task type or route |
| 409 | Task type already exists |

## Testing

```bash
npm test
```

The suite has 7 tests covering:

- Points calculation (`fixed points × quantity`)
- Rejection of unknown task types and invalid quantities
- Monday week boundaries, including the Sunday edge case
- Separation of daily and weekly totals
- Tie ranking, and exclusion of leads from the leaderboard
- Team filter and attendance day counts
- Award permissions for member, lead and admin

## Limitations

- **Data is in memory.** It resets on server restart or redeploy, and serverless instances on Vercel may not share the same data, so a newly logged award can occasionally appear missing after a refresh. This is acceptable for a mock-data demo. For production, replace `lib/store.js` with a database such as Postgres.
- **Mock authentication.** There are no passwords. Anyone can sign in as any user, so this is not production-grade auth.
- **Time zone.** Days and weeks are calculated in UTC.
- **History** shows only the latest 100 entries, with no pagination.
- **No editing or deleting** of awards after they are logged.
- **Tests** cover the scoring logic and permissions. The API routes and UI have no automated tests.

## Possible next steps

- Persist data in Postgres, with real authentication (SSO or email and password).
- Allow awards to be revoked, with an audit trail.
- Add pagination and filters to the history log.
- Add end-to-end tests for the API and UI.



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
