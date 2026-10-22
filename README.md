# School Control

School management system (Spanish/English) for administrators, teachers and students. No dependencies; requires Node.js 18+.

## Live demo (GitHub Pages)

https://felix1196.github.io/School-Control/

The demo runs entirely in the browser: data is stored in `localStorage` (per browser, not shared between users) and there is no server. Use "Reset demo data" on the login screen to restore the sample data. It is a demo only, not for real student data.

## Run with the Node server

```
node server.js
```

Open http://localhost:3000. Data is stored in `data.json` (git-ignored). On localhost the app uses the server; add `?demo=1` to use the in-browser demo backend instead.

## Features

- Roles: administrator, teacher, student
- Admin: subjects, rooms, teachers, semesters, class schedules (conflict detection), enrollments, users, report
- Teachers: enter/edit midterm grades (1–10); averages update live
- Students: grades with auto-refresh, failed-subject warnings (average ≤ 5), weekly schedule, PDF export (print)
- Light/dark theme and ES/EN language

## Demo accounts

Demo credentials are no longer shown on the login screen. They are for testing only; change them before real use. More sample students: ana, maria (password `alumno123`); another teacher: carlos (`maestro123`).

| Role | User | Password |
|---|---|---|
| Admin | admin | admin123 |
| Teacher | laura | maestro123 |
| Student | luis | alumno123 |
