# School Control

School management system (Spanish/English) for administrators, teachers and students. No dependencies; requires Node.js 18+.

## Run

```
node server.js
```

Open http://localhost:3000. Demo data is created on first start (`data.json`, git-ignored).

## Features

- Roles: administrator, teacher, student
- Admin: subjects, rooms, teachers, semesters, class schedules (conflict detection), enrollments, users, report
- Teachers: enter/edit midterm grades (1–10); averages update live
- Students: grades with auto-refresh, failed-subject warnings (average ≤ 5), weekly schedule, PDF export (print)
- Light/dark theme and ES/EN language

## Demo accounts

Demo credentials are for local testing only; change them before real use.

| Role | User | Password |
|---|---|---|
| Admin | admin | admin123 |
| Teacher | laura | maestro123 |
| Student | luis | alumno123 |
