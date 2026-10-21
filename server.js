const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');
const PASSING = 5; // <= 5 es reprobatoria
const PARTIALS = 3;

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) =>
  salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const verify = (pw, stored) => {
  const [salt, h] = stored.split(':');
  const a = Buffer.from(hash(pw, salt).split(':')[1], 'hex');
  return crypto.timingSafeEqual(a, Buffer.from(h, 'hex'));
};
const uid = () => crypto.randomBytes(6).toString('hex');

let db;
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function seed() {
  const t1 = uid(), t2 = uid(), s1 = uid(), s2 = uid(), s3 = uid();
  const m1 = uid(), m2 = uid(), m3 = uid(), m4 = uid();
  db = {
    users: [
      { id: uid(), role: 'admin', name: 'Administrador', username: 'admin', password: hash('admin123') },
      { id: t1, role: 'teacher', name: 'Laura Hernández', username: 'laura', password: hash('maestro123') },
      { id: t2, role: 'teacher', name: 'Carlos Ruiz', username: 'carlos', password: hash('maestro123') },
      { id: s1, role: 'student', name: 'Ana López', username: 'ana', password: hash('alumno123') },
      { id: s2, role: 'student', name: 'Luis Pérez', username: 'luis', password: hash('alumno123') },
      { id: s3, role: 'student', name: 'María Gómez', username: 'maria', password: hash('alumno123') },
    ],
    subjects: [
      { id: m1, name: 'Matemáticas', room: 'Aula 101', teacherId: t1 },
      { id: m2, name: 'Español', room: 'Aula 102', teacherId: t1 },
      { id: m3, name: 'Física', room: 'Laboratorio 1', teacherId: t2 },
      { id: m4, name: 'Historia', room: 'Aula 204', teacherId: t2 },
    ],
    enrollments: [], sessions: {},
    semesters: [{ id: 'sem-prev', name: '2025-B', active: false }, { id: 'sem-cur', name: '2026-A', active: true }],
  };
  db.subjects.forEach(s => s.semesterId = 'sem-cur');
  const H = (days, a, b) => days.map(day => ({ day, start: a, end: b }));
  const sched = [H([1, 3, 5], '08:00', '09:00'), H([2, 4], '09:00', '10:30'), H([1, 3], '10:30', '12:00'), H([2, 4, 5], '12:00', '13:00')];
  db.subjects.forEach((s, i) => { s.schedule = sched[i]; });
  const old = uid();
  db.subjects.push({ id: old, name: 'Geografía', room: 'Aula 110', teacherId: t2, semesterId: 'sem-prev', schedule: [] });
  db.enrollments.push({ id: uid(), studentId: s1, subjectId: old, room: 'Aula 110', grades: [9, 8, 10] });
  db.enrollments.push({ id: uid(), studentId: s2, subjectId: old, room: 'Aula 110', grades: [4, 3, 5] });
  const enr = (st, sub, g) => db.enrollments.push({
    id: uid(), studentId: st, subjectId: sub,
    room: db.subjects.find(x => x.id === sub).room, grades: g });
  enr(s1, m1, [9, 10, 8]); enr(s1, m2, [8, 9, null]); enr(s1, m3, [10, 9, 9]); enr(s1, m4, [7, 8, 9]);
  enr(s2, m1, [4, 5, 3]); enr(s2, m2, [6, 7, 8]); enr(s2, m3, [3, 4, 5]); enr(s2, m4, [8, 7, 9]);
  enr(s3, m1, [2, 3, 4]); enr(s3, m2, [1, 5, 3]); enr(s3, m3, [4, 2, 5]); enr(s3, m4, [3, 3, 2]);
  save();
}
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); else seed();
if (!db.semesters) {
  db.semesters = [{ id: 'sem-cur', name: 'Semestre 1', active: true }];
  db.subjects.forEach(s => s.semesterId = 'sem-cur');
  save();
}
const activeSem = () => db.semesters.find(s => s.active) || db.semesters[db.semesters.length - 1];
const semOf = id => db.semesters.find(s => s.id === id) || activeSem();
if (db.subjects.some(s => !s.schedule)) { db.subjects.forEach(s => { s.schedule = s.schedule || []; }); save(); }

const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function validSchedule(list, subject) {
  if (!Array.isArray(list) || list.length > 20) return 'Horario inválido';
  const out = [];
  for (const x of list) {
    const day = Number(x && x.day), re = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!Number.isInteger(day) || day < 1 || day > 6 || !re.test(x.start) || !re.test(x.end) || toMin(x.start) >= toMin(x.end)) return 'Horario inválido';
    out.push({ day, start: x.start, end: x.end });
  }
  const clash = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
  for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++)
    if (clash(out[i], out[j])) return 'Horario inválido';
  for (const o of db.subjects) {
    if (o.id === subject.id || o.semesterId !== subject.semesterId) continue;
    for (const a of out) for (const b of o.schedule || []) if (clash(a, b)) {
      if (o.room.toLowerCase() === subject.room.toLowerCase()) return 'Conflicto: el aula ya está ocupada en ese horario';
      if (o.teacherId && o.teacherId === subject.teacherId) return 'Conflicto: el maestro ya tiene clase en ese horario';
    }
  }
  return { ok: out };
}
const classesFor = subs => subs.flatMap(s => {
  const t = db.users.find(x => x.id === s.teacherId);
  return (s.schedule || []).map(c => ({ subject: s.name, room: s.room, teacher: t ? t.name : '', ...c }));
});

const average = g => {
  const v = g.filter(x => x !== null && x !== undefined);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
const pub = u => ({ id: u.id, role: u.role, name: u.name, username: u.username });

function studentSummary(studentId, semesterId) {
  const sem = semOf(semesterId);
  const inSem = e => (db.subjects.find(x => x.id === e.subjectId) || {}).semesterId === sem.id;
  const rows = db.enrollments.filter(e => e.studentId === studentId && inSem(e)).map(e => {
    const s = db.subjects.find(x => x.id === e.subjectId);
    const t = s && db.users.find(x => x.id === s.teacherId);
    const avg = average(e.grades);
    return { enrollmentId: e.id, updatedAt: e.updatedAt || null, subject: s ? s.name : '?', room: e.room,
      teacher: t ? t.name : 'Sin asignar', grades: e.grades, average: avg,
      status: avg === null ? 'pending' : avg <= PASSING ? 'failed' : 'passed' };
  });
  const graded = rows.filter(r => r.average !== null);
  const failed = graded.filter(r => r.status === 'failed').length;
  const overall = average(graded.map(r => r.average));
  let semester, level;
  if (!graded.length) { semester = 'Aún sin calificaciones'; level = 'pending'; }
  else if (failed === graded.length) { semester = 'Reprobado en todo el semestre'; level = 'failed-all'; }
  else if (failed > 1) { semester = `Tienes ${failed} materias reprobadas`; level = 'failed-many'; }
  else if (failed === 1) { semester = 'Tienes 1 materia reprobada'; level = 'failed-one'; }
  else { semester = '¡Vas aprobando todas tus materias!'; level = 'passed'; }
  return { semesterId: sem.id, semesterName: sem.name, subjects: rows, overall, failed, total: rows.length, semester, level, passing: PASSING };
}

const send = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};
const readBody = req => new Promise((ok, bad) => {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 1e6) { bad(new Error('big')); req.destroy(); } });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { bad(e); } });
});
const str = (v, n = 100) => typeof v === 'string' ? v.trim().slice(0, n) : '';

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

async function api(req, res, url) {
  const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {};
  const p = url.pathname;

  if (p === '/api/login' && req.method === 'POST') {
    const u = db.users.find(x => x.username === str(body.username).toLowerCase());
    if (!u || !verify(String(body.password || ''), u.password)) return send(res, 401, { error: 'Usuario o contraseña incorrectos' });
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = { userId: u.id, at: Date.now() };
    save();
    return send(res, 200, { token, user: pub(u) });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const sess = db.sessions[token];
  const me = sess && db.users.find(x => x.id === sess.userId);
  if (!me) return send(res, 401, { error: 'Sesión no válida' });
  const need = role => { if (me.role !== role) { send(res, 403, { error: 'Sin permiso' }); return false; } return true; };

  if (p === '/api/logout') { delete db.sessions[token]; save(); return send(res, 200, {}); }
  if (p === '/api/me') return send(res, 200, pub(me));

  // ---- Administrador
  if (p === '/api/admin/data' && req.method === 'GET') {
    if (!need('admin')) return;
    return send(res, 200, {
      users: db.users.map(pub), semesters: db.semesters,
      subjects: db.subjects.map(s => ({ ...s, semesterName: semOf(s.semesterId).name })), enrollments: db.enrollments.map(e => ({
        id: e.id, studentId: e.studentId, subjectId: e.subjectId, room: e.room })) });
  }
  if (p === '/api/admin/users' && req.method === 'POST') {
    if (!need('admin')) return;
    const name = str(body.name), username = str(body.username).toLowerCase(), pw = String(body.password || '');
    if (!name || !username || pw.length < 6) return send(res, 400, { error: 'Nombre, usuario y contraseña (mín. 6) son obligatorios' });
    if (!['teacher', 'student', 'admin'].includes(body.role)) return send(res, 400, { error: 'Rol inválido' });
    if (db.users.some(x => x.username === username)) return send(res, 400, { error: 'El usuario ya existe' });
    db.users.push({ id: uid(), role: body.role, name, username, password: hash(pw) });
    save(); return send(res, 200, {});
  }
  let m;
  if ((m = p.match(/^\/api\/admin\/users\/(\w+)$/)) && req.method === 'DELETE') {
    if (!need('admin')) return;
    if (m[1] === me.id) return send(res, 400, { error: 'No puedes eliminarte a ti mismo' });
    db.users = db.users.filter(x => x.id !== m[1]);
    db.enrollments = db.enrollments.filter(e => e.studentId !== m[1]);
    db.subjects.forEach(s => { if (s.teacherId === m[1]) s.teacherId = null; });
    for (const [k, v] of Object.entries(db.sessions)) if (v.userId === m[1]) delete db.sessions[k];
    save(); return send(res, 200, {});
  }
  if (p === '/api/admin/subjects' && req.method === 'POST') {
    if (!need('admin')) return;
    const name = str(body.name), room = str(body.room);
    if (!name || !room) return send(res, 400, { error: 'Nombre y aula son obligatorios' });
    const t = db.users.find(x => x.id === body.teacherId && x.role === 'teacher');
    const sem = db.semesters.find(x => x.id === body.semesterId) || activeSem();
    db.subjects.push({ id: uid(), name, room, teacherId: t ? t.id : null, semesterId: sem.id, schedule: [] });
    save(); return send(res, 200, {});
  }
  if ((m = p.match(/^\/api\/admin\/subjects\/(\w+)$/))) {
    if (!need('admin')) return;
    const s = db.subjects.find(x => x.id === m[1]);
    if (!s) return send(res, 404, { error: 'No encontrada' });
    if (req.method === 'PUT') {
      const snap = { name: s.name, room: s.room, teacherId: s.teacherId };
      if (body.name !== undefined) s.name = str(body.name) || s.name;
      if (body.room !== undefined) s.room = str(body.room) || s.room;
      if (body.teacherId !== undefined) {
        const t = db.users.find(x => x.id === body.teacherId && x.role === 'teacher');
        s.teacherId = t ? t.id : null;
      }
      if (body.schedule !== undefined) {
        const r = validSchedule(body.schedule, s);
        if (typeof r === 'string') { Object.assign(s, snap); return send(res, 400, { error: r }); }
        s.schedule = r.ok;
      } else if (s.schedule.length) {
        const r = validSchedule(s.schedule, s);
        if (typeof r === 'string' && r.startsWith('Conflicto')) { Object.assign(s, snap); return send(res, 400, { error: r }); }
      }
      save(); return send(res, 200, {});
    }
    if (req.method === 'DELETE') {
      db.subjects = db.subjects.filter(x => x.id !== s.id);
      db.enrollments = db.enrollments.filter(e => e.subjectId !== s.id);
      save(); return send(res, 200, {});
    }
  }
  if (p === '/api/admin/enrollments' && req.method === 'POST') {
    if (!need('admin')) return;
    const st = db.users.find(x => x.id === body.studentId && x.role === 'student');
    const sub = db.subjects.find(x => x.id === body.subjectId);
    if (!st || !sub) return send(res, 400, { error: 'Alumno o materia inválidos' });
    if (db.enrollments.some(e => e.studentId === st.id && e.subjectId === sub.id)) return send(res, 400, { error: 'El alumno ya está inscrito en esa materia' });
    db.enrollments.push({ id: uid(), studentId: st.id, subjectId: sub.id,
      room: str(body.room) || sub.room, grades: Array(PARTIALS).fill(null) });
    save(); return send(res, 200, {});
  }
  if ((m = p.match(/^\/api\/admin\/enrollments\/(\w+)$/)) && req.method === 'DELETE') {
    if (!need('admin')) return;
    db.enrollments = db.enrollments.filter(e => e.id !== m[1]);
    save(); return send(res, 200, {});
  }
  if (p === '/api/admin/semesters' && req.method === 'POST') {
    if (!need('admin')) return;
    const name = str(body.name, 40);
    if (!name) return send(res, 400, { error: 'El nombre del semestre es obligatorio' });
    if (db.semesters.some(x => x.name.toLowerCase() === name.toLowerCase())) return send(res, 400, { error: 'Ese semestre ya existe' });
    db.semesters.push({ id: uid(), name, active: false });
    save(); return send(res, 200, {});
  }
  if ((m = p.match(/^\/api\/admin\/semesters\/(\w+)\/activate$/)) && req.method === 'PUT') {
    if (!need('admin')) return;
    if (!db.semesters.some(x => x.id === m[1])) return send(res, 404, { error: 'No encontrado' });
    db.semesters.forEach(x => x.active = x.id === m[1]);
    save(); return send(res, 200, {});
  }
  if (p === '/api/admin/report' && req.method === 'GET') {
    if (!need('admin')) return;
    const sem = semOf(url.searchParams.get('semester'));
    return send(res, 200, { semester: sem, semesters: db.semesters,
      students: db.users.filter(u => u.role === 'student').map(u => ({ ...pub(u), ...studentSummary(u.id, sem.id) })) });
  }

  // ---- Maestro
  if (p === '/api/teacher/schedule' && req.method === 'GET') {
    if (!need('teacher')) return;
    const sem = activeSem();
    return send(res, 200, { semesterName: sem.name, classes: classesFor(db.subjects.filter(s => s.teacherId === me.id && s.semesterId === sem.id)) });
  }
  if (p === '/api/teacher/subjects' && req.method === 'GET') {
    if (!need('teacher')) return;
    return send(res, 200, db.subjects.filter(s => s.teacherId === me.id).map(s => ({
      ...s, semesterName: semOf(s.semesterId).name, students: db.enrollments.filter(e => e.subjectId === s.id).map(e => ({
        enrollmentId: e.id, name: (db.users.find(u => u.id === e.studentId) || {}).name || '?',
        room: e.room, grades: e.grades, average: average(e.grades) })) })));
  }
  if (p === '/api/teacher/grade' && req.method === 'PUT') {
    if (!need('teacher')) return;
    const e = db.enrollments.find(x => x.id === body.enrollmentId);
    const s = e && db.subjects.find(x => x.id === e.subjectId);
    if (!s || s.teacherId !== me.id) return send(res, 403, { error: 'Sin permiso' });
    const i = Number(body.index);
    if (!Number.isInteger(i) || i < 0 || i >= PARTIALS) return send(res, 400, { error: 'Parcial inválido' });
    let v = body.value;
    if (v === null || v === '') v = null;
    else {
      v = Number(v);
      if (!Number.isFinite(v) || v < 1 || v > 10) return send(res, 400, { error: 'La calificación debe estar entre 1 y 10' });
      v = Math.round(v * 10) / 10;
    }
    e.grades[i] = v; e.updatedAt = Date.now(); save();
    return send(res, 200, { grades: e.grades, average: average(e.grades) });
  }

  // ---- Alumno
  if (p === '/api/student/schedule' && req.method === 'GET') {
    if (!need('student')) return;
    const sem = activeSem();
    const ids = db.enrollments.filter(e => e.studentId === me.id).map(e => e.subjectId);
    const subs = db.subjects.filter(s => ids.includes(s.id) && s.semesterId === sem.id);
    return send(res, 200, { semesterName: sem.name, classes: classesFor(subs) });
  }
  if (p === '/api/student/summary' && req.method === 'GET') {
    if (!need('student')) return;
    const sem = semOf(url.searchParams.get('semester'));
    return send(res, 200, { ...studentSummary(me.id, sem.id), studentName: me.name, semesters: db.semesters });
  }
  send(res, 404, { error: 'No encontrado' });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const f = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (!f.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); return res.end('No encontrado');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } catch (e) { send(res, 400, { error: 'Solicitud inválida' }); }
}).listen(PORT, () => console.log(`Escuela en http://localhost:${PORT}`));
