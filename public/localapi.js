// Backend de demostración que corre en el navegador (GitHub Pages).
// Intercepta las llamadas a /api/* y guarda todo en localStorage; no requiere servidor.
(() => {
  const h = location.hostname;
  const demo = new URLSearchParams(location.search).has('demo') || !['localhost', '127.0.0.1', '[::1]', ''].includes(h);
  if (!demo) return;
  window.DEMO_MODE = true;

  const KEY = 'school_demo_db', PASSING = 5, PARTIALS = 3;
  const enc = new TextEncoder();
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
  const uid = () => rnd(6);
  async function hash(pw, salt = rnd(16)) {
    const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, k, 256);
    return salt + ':' + hex(bits);
  }
  const verify = async (pw, stored) => (await hash(pw, stored.split(':')[0])) === stored;

  let db;
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));

  async function seed() {
    const [t1, t2, s1, s2, s3, m1, m2, m3, m4] = Array.from({ length: 9 }, uid);
    const pa = await hash('admin123'), pt = await hash('maestro123'), ps = await hash('alumno123');
    const H = (days, a, b) => days.map(day => ({ day, start: a, end: b }));
    db = {
      users: [
        { id: uid(), role: 'admin', name: 'Administrador', username: 'admin', password: pa },
        { id: t1, role: 'teacher', name: 'Laura Hernández', username: 'laura', password: pt },
        { id: t2, role: 'teacher', name: 'Carlos Ruiz', username: 'carlos', password: pt },
        { id: s1, role: 'student', name: 'Ana López', username: 'ana', password: ps },
        { id: s2, role: 'student', name: 'Luis Pérez', username: 'luis', password: ps },
        { id: s3, role: 'student', name: 'María Gómez', username: 'maria', password: ps },
      ],
      semesters: [{ id: 'sem-prev', name: '2025-B', active: false }, { id: 'sem-cur', name: '2026-A', active: true }],
      subjects: [
        { id: m1, name: 'Matemáticas', room: 'Aula 101', teacherId: t1, semesterId: 'sem-cur', schedule: H([1, 3, 5], '08:00', '09:00') },
        { id: m2, name: 'Español', room: 'Aula 102', teacherId: t1, semesterId: 'sem-cur', schedule: H([2, 4], '09:00', '10:30') },
        { id: m3, name: 'Física', room: 'Laboratorio 1', teacherId: t2, semesterId: 'sem-cur', schedule: H([1, 3], '10:30', '12:00') },
        { id: m4, name: 'Historia', room: 'Aula 204', teacherId: t2, semesterId: 'sem-cur', schedule: H([2, 4, 5], '12:00', '13:00') },
      ],
      enrollments: [], sessions: {},
    };
    const old = uid();
    db.subjects.push({ id: old, name: 'Geografía', room: 'Aula 110', teacherId: t2, semesterId: 'sem-prev', schedule: [] });
    const enr = (st, sub, g) => db.enrollments.push({ id: uid(), studentId: st, subjectId: sub,
      room: db.subjects.find(x => x.id === sub).room, grades: g });
    enr(s1, old, [9, 8, 10]); enr(s2, old, [4, 3, 5]);
    enr(s1, m1, [9, 10, 8]); enr(s1, m2, [8, 9, null]); enr(s1, m3, [10, 9, 9]); enr(s1, m4, [7, 8, 9]);
    enr(s2, m1, [4, 5, 3]); enr(s2, m2, [6, 7, 8]); enr(s2, m3, [3, 4, 5]); enr(s2, m4, [8, 7, 9]);
    enr(s3, m1, [2, 3, 4]); enr(s3, m2, [1, 5, 3]); enr(s3, m3, [4, 2, 5]); enr(s3, m4, [3, 3, 2]);
    save();
  }
  let ready;
  const init = () => ready || (ready = (async () => {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
    if (!db) await seed();
  })());
  window.resetDemo = () => { localStorage.removeItem(KEY); localStorage.removeItem('token'); location.reload(); };

  const activeSem = () => db.semesters.find(s => s.active) || db.semesters[db.semesters.length - 1];
  const semOf = id => db.semesters.find(s => s.id === id) || activeSem();
  const toMin = t => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const clash = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
  function validSchedule(list, subject) {
    if (!Array.isArray(list) || list.length > 20) return 'Horario inválido';
    const out = [], re = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const x of list) {
      const day = Number(x && x.day);
      if (!Number.isInteger(day) || day < 1 || day > 6 || !re.test(x.start) || !re.test(x.end) || toMin(x.start) >= toMin(x.end)) return 'Horario inválido';
      out.push({ day, start: x.start, end: x.end });
    }
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) if (clash(out[i], out[j])) return 'Horario inválido';
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
  const str = (v, n = 100) => typeof v === 'string' ? v.trim().slice(0, n) : '';

  function studentSummary(studentId, semesterId) {
    const sem = semOf(semesterId);
    const inSem = e => (db.subjects.find(x => x.id === e.subjectId) || {}).semesterId === sem.id;
    const rows = db.enrollments.filter(e => e.studentId === studentId && inSem(e)).map(e => {
      const s = db.subjects.find(x => x.id === e.subjectId), t = s && db.users.find(x => x.id === s.teacherId), avg = average(e.grades);
      return { enrollmentId: e.id, updatedAt: e.updatedAt || null, subject: s ? s.name : '?', room: e.room,
        teacher: t ? t.name : 'Sin asignar', grades: e.grades, average: avg,
        status: avg === null ? 'pending' : avg <= PASSING ? 'failed' : 'passed' };
    });
    const graded = rows.filter(r => r.average !== null), failed = graded.filter(r => r.status === 'failed').length;
    const overall = average(graded.map(r => r.average));
    let semester, level;
    if (!graded.length) { semester = 'Aún sin calificaciones'; level = 'pending'; }
    else if (failed === graded.length) { semester = 'Reprobado en todo el semestre'; level = 'failed-all'; }
    else if (failed > 1) { semester = `Tienes ${failed} materias reprobadas`; level = 'failed-many'; }
    else if (failed === 1) { semester = 'Tienes 1 materia reprobada'; level = 'failed-one'; }
    else { semester = '¡Vas aprobando todas tus materias!'; level = 'passed'; }
    return { semesterId: sem.id, semesterName: sem.name, subjects: rows, overall, failed, total: rows.length, semester, level, passing: PASSING };
  }

  const res = (code, data) => new Response(JSON.stringify(data), { status: code, headers: { 'Content-Type': 'application/json' } });

  async function handle(url, method, headers, body) {
    await init();
    const p = url.pathname;
    if (p === '/api/login' && method === 'POST') {
      const u = db.users.find(x => x.username === str(body.username).toLowerCase());
      if (!u || !(await verify(String(body.password || ''), u.password))) return res(401, { error: 'Usuario o contraseña incorrectos' });
      const token = rnd(24);
      db.sessions[token] = { userId: u.id, at: Date.now() }; save();
      return res(200, { token, user: pub(u) });
    }
    const token = (headers.Authorization || '').replace('Bearer ', '');
    const sess = db.sessions[token], me = sess && db.users.find(x => x.id === sess.userId);
    if (!me) return res(401, { error: 'Sesión no válida' });
    const deny = role => me.role !== role ? res(403, { error: 'Sin permiso' }) : null;

    if (p === '/api/logout') { delete db.sessions[token]; save(); return res(200, {}); }
    if (p === '/api/me') return res(200, pub(me));

    let m, d;
    if (p.startsWith('/api/admin/') && (d = deny('admin'))) return d;
    if (p === '/api/admin/data' && method === 'GET') return res(200, { users: db.users.map(pub), semesters: db.semesters,
      subjects: db.subjects.map(s => ({ ...s, semesterName: semOf(s.semesterId).name })),
      enrollments: db.enrollments.map(e => ({ id: e.id, studentId: e.studentId, subjectId: e.subjectId, room: e.room })) });
    if (p === '/api/admin/users' && method === 'POST') {
      const name = str(body.name), username = str(body.username).toLowerCase(), pw = String(body.password || '');
      if (!name || !username || pw.length < 6) return res(400, { error: 'Nombre, usuario y contraseña (mín. 6) son obligatorios' });
      if (!['teacher', 'student', 'admin'].includes(body.role)) return res(400, { error: 'Rol inválido' });
      if (db.users.some(x => x.username === username)) return res(400, { error: 'El usuario ya existe' });
      db.users.push({ id: uid(), role: body.role, name, username, password: await hash(pw) }); save(); return res(200, {});
    }
    if ((m = p.match(/^\/api\/admin\/users\/(\w+)$/)) && method === 'DELETE') {
      if (m[1] === me.id) return res(400, { error: 'No puedes eliminarte a ti mismo' });
      db.users = db.users.filter(x => x.id !== m[1]);
      db.enrollments = db.enrollments.filter(e => e.studentId !== m[1]);
      db.subjects.forEach(s => { if (s.teacherId === m[1]) s.teacherId = null; });
      for (const [k, v] of Object.entries(db.sessions)) if (v.userId === m[1]) delete db.sessions[k];
      save(); return res(200, {});
    }
    if (p === '/api/admin/subjects' && method === 'POST') {
      const name = str(body.name), room = str(body.room);
      if (!name || !room) return res(400, { error: 'Nombre y aula son obligatorios' });
      const t = db.users.find(x => x.id === body.teacherId && x.role === 'teacher');
      const sem = db.semesters.find(x => x.id === body.semesterId) || activeSem();
      db.subjects.push({ id: uid(), name, room, teacherId: t ? t.id : null, semesterId: sem.id, schedule: [] }); save(); return res(200, {});
    }
    if ((m = p.match(/^\/api\/admin\/subjects\/(\w+)$/))) {
      const s = db.subjects.find(x => x.id === m[1]);
      if (!s) return res(404, { error: 'No encontrada' });
      if (method === 'PUT') {
        const snap = { name: s.name, room: s.room, teacherId: s.teacherId };
        if (body.name !== undefined) s.name = str(body.name) || s.name;
        if (body.room !== undefined) s.room = str(body.room) || s.room;
        if (body.teacherId !== undefined) {
          const t = db.users.find(x => x.id === body.teacherId && x.role === 'teacher');
          s.teacherId = t ? t.id : null;
        }
        if (body.schedule !== undefined) {
          const r = validSchedule(body.schedule, s);
          if (typeof r === 'string') { Object.assign(s, snap); return res(400, { error: r }); }
          s.schedule = r.ok;
        } else if (s.schedule.length) {
          const r = validSchedule(s.schedule, s);
          if (typeof r === 'string' && r.startsWith('Conflicto')) { Object.assign(s, snap); return res(400, { error: r }); }
        }
        save(); return res(200, {});
      }
      if (method === 'DELETE') {
        db.subjects = db.subjects.filter(x => x.id !== s.id);
        db.enrollments = db.enrollments.filter(e => e.subjectId !== s.id);
        save(); return res(200, {});
      }
    }
    if (p === '/api/admin/enrollments' && method === 'POST') {
      const st = db.users.find(x => x.id === body.studentId && x.role === 'student');
      const sub = db.subjects.find(x => x.id === body.subjectId);
      if (!st || !sub) return res(400, { error: 'Alumno o materia inválidos' });
      if (db.enrollments.some(e => e.studentId === st.id && e.subjectId === sub.id)) return res(400, { error: 'El alumno ya está inscrito en esa materia' });
      db.enrollments.push({ id: uid(), studentId: st.id, subjectId: sub.id, room: str(body.room) || sub.room, grades: Array(PARTIALS).fill(null) });
      save(); return res(200, {});
    }
    if ((m = p.match(/^\/api\/admin\/enrollments\/(\w+)$/)) && method === 'DELETE') {
      db.enrollments = db.enrollments.filter(e => e.id !== m[1]); save(); return res(200, {});
    }
    if (p === '/api/admin/semesters' && method === 'POST') {
      const name = str(body.name, 40);
      if (!name) return res(400, { error: 'El nombre del semestre es obligatorio' });
      if (db.semesters.some(x => x.name.toLowerCase() === name.toLowerCase())) return res(400, { error: 'Ese semestre ya existe' });
      db.semesters.push({ id: uid(), name, active: false }); save(); return res(200, {});
    }
    if ((m = p.match(/^\/api\/admin\/semesters\/(\w+)\/activate$/)) && method === 'PUT') {
      if (!db.semesters.some(x => x.id === m[1])) return res(404, { error: 'No encontrado' });
      db.semesters.forEach(x => x.active = x.id === m[1]); save(); return res(200, {});
    }
    if (p === '/api/admin/report' && method === 'GET') {
      const sem = semOf(url.searchParams.get('semester'));
      return res(200, { semester: sem, semesters: db.semesters,
        students: db.users.filter(u => u.role === 'student').map(u => ({ ...pub(u), ...studentSummary(u.id, sem.id) })) });
    }

    if (p.startsWith('/api/teacher/') && (d = deny('teacher'))) return d;
    if (p === '/api/teacher/schedule' && method === 'GET') {
      const sem = activeSem();
      return res(200, { semesterName: sem.name, classes: classesFor(db.subjects.filter(s => s.teacherId === me.id && s.semesterId === sem.id)) });
    }
    if (p === '/api/teacher/subjects' && method === 'GET') {
      return res(200, db.subjects.filter(s => s.teacherId === me.id).map(s => ({ ...s, semesterName: semOf(s.semesterId).name,
        students: db.enrollments.filter(e => e.subjectId === s.id).map(e => ({ enrollmentId: e.id,
          name: (db.users.find(u => u.id === e.studentId) || {}).name || '?', room: e.room, grades: e.grades, average: average(e.grades) })) })));
    }
    if (p === '/api/teacher/grade' && method === 'PUT') {
      const e = db.enrollments.find(x => x.id === body.enrollmentId);
      const s = e && db.subjects.find(x => x.id === e.subjectId);
      if (!s || s.teacherId !== me.id) return res(403, { error: 'Sin permiso' });
      const i = Number(body.index);
      if (!Number.isInteger(i) || i < 0 || i >= PARTIALS) return res(400, { error: 'Parcial inválido' });
      let v = body.value;
      if (v === null || v === '') v = null;
      else {
        v = Number(v);
        if (!Number.isFinite(v) || v < 1 || v > 10) return res(400, { error: 'La calificación debe estar entre 1 y 10' });
        v = Math.round(v * 10) / 10;
      }
      e.grades[i] = v; e.updatedAt = Date.now(); save();
      return res(200, { grades: e.grades, average: average(e.grades) });
    }

    if (p.startsWith('/api/student/') && (d = deny('student'))) return d;
    if (p === '/api/student/schedule' && method === 'GET') {
      const sem = activeSem(), ids = db.enrollments.filter(e => e.studentId === me.id).map(e => e.subjectId);
      return res(200, { semesterName: sem.name, classes: classesFor(db.subjects.filter(s => ids.includes(s.id) && s.semesterId === sem.id)) });
    }
    if (p === '/api/student/summary' && method === 'GET') {
      const sem = semOf(url.searchParams.get('semester'));
      return res(200, { ...studentSummary(me.id, sem.id), studentName: me.name, semesters: db.semesters });
    }
    return res(404, { error: 'No encontrado' });
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const u = typeof input === 'string' ? input : input.url;
    if (!u.startsWith('/api/')) return realFetch(input, init);
    let body = {};
    try { body = init.body ? JSON.parse(init.body) : {}; } catch { return Promise.resolve(res(400, { error: 'Solicitud inválida' })); }
    return handle(new URL(u, location.origin), (init.method || 'GET').toUpperCase(), init.headers || {}, body)
      .catch(() => res(400, { error: 'Solicitud inválida' }));
  };
})();
