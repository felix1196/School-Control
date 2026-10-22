const $ = s => document.querySelector(s);
const app = $('#app');
let token = localStorage.getItem('token');
let user = null, tab = 'subjects', cache = {}, semSel = '', weekOffset = 0, schedSubj = '';
let lang = localStorage.getItem('lang') || (navigator.language.startsWith('en') ? 'en' : 'es');
let theme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

// Las claves son el texto en español; EN contiene las traducciones al inglés.
const EN = {
  'Inicia sesión para continuar': 'Sign in to continue', 'Usuario': 'Username', 'Contraseña': 'Password', 'Entrar': 'Sign in',
  'Cuentas de prueba': 'Demo accounts', 'Admin': 'Admin', 'Maestro': 'Teacher', 'Alumno': 'Student', 'Administrador': 'Administrator',
  'Salir': 'Log out', 'Tema oscuro': 'Dark mode', 'Tema claro': 'Light mode',
  'Boleta de calificaciones': 'Report card', 'Reporte académico': 'Academic report', 'Horario semanal': 'Weekly schedule',
  'Semestre': 'Semester', 'actual': 'current', '📄 Exportar PDF': '📄 Export PDF', 'Exportar PDF': 'Export PDF',
  '¡Vas aprobando todas tus materias!': "You're passing all your subjects!", 'Tienes 1 materia reprobada': 'You have 1 failed subject',
  'Tienes {n} materias reprobadas': 'You have {n} failed subjects', 'Reprobado en todo el semestre': 'Failed the whole semester',
  'Aún sin calificaciones': 'No grades yet',
  'Sigue así, ¡excelente trabajo!': 'Keep it up, great job!', 'Ponte al corriente con esa materia, aún estás a tiempo.': "Catch up on that subject, there's still time.",
  'Tienes más de una materia reprobada. Habla con tus maestros.': 'You have more than one failed subject. Talk to your teachers.',
  'Todas tus materias con calificación están reprobadas. Pide apoyo de inmediato.': 'All your graded subjects are failed. Ask for help right away.',
  'Tus maestros aún no capturan calificaciones.': 'Your teachers have not entered grades yet.',
  'Promedio general': 'Overall average', 'Materias sin reprobar': 'Subjects not failed', 'Reprobadas (≤ {n})': 'Failed (≤ {n})',
  'Aprobada': 'Passed', 'Reprobada': 'Failed', 'Sin calificar': 'Not graded', 'Promedio': 'Average',
  'Aún no tienes materias en este semestre.': "You don't have subjects in this semester yet.",
  'Aún no tienes materias asignadas.': "You don't have assigned subjects yet.",
  'Calificaciones': 'Grades', 'Horario': 'Schedule', 'Horarios': 'Schedules', 'Parcial': 'Midterm', 'Aula': 'Room', 'Materia': 'Subject', 'Materias': 'Subjects',
  'Sin alumnos inscritos': 'No students enrolled', 'Calificación guardada ✅': 'Grade saved ✅',
  '📚 Materias': '📚 Subjects', '🗓️ Semestres': '🗓️ Semesters', '👥 Usuarios': '👥 Users', '📝 Inscripciones': '📝 Enrollments', '📊 Reporte': '📊 Report', '🕒 Horarios': '🕒 Schedules',
  'Nueva materia': 'New subject', 'Nombre de la materia': 'Subject name', 'Maestro (opcional)': 'Teacher (optional)', 'Crear': 'Create',
  'Sin asignar': 'Unassigned', 'Eliminar': 'Delete', 'Quitar': 'Remove', 'Nuevo semestre': 'New semester', 'Semestres': 'Semesters',
  'Estado': 'Status', 'Actual': 'Current', 'Anterior/Futuro': 'Past/Future', 'Marcar como actual': 'Set as current',
  'Nuevo usuario': 'New user', 'Nombre completo': 'Full name', 'Contraseña (mín. 6)': 'Password (min. 6)', 'Usuarios': 'Users', 'Nombre': 'Name', 'Rol': 'Role',
  'Asignar materia y aula a un alumno': 'Assign a subject and room to a student', 'Aula (vacío = la de la materia)': "Room (empty = the subject's)",
  'Asignar': 'Assign', 'Inscripciones': 'Enrollments',
  'Situación académica por alumno': 'Academic standing by student', 'Reprobadas': 'Failed', 'Todo aprobado': 'All passed', '1 materia reprobada': '1 failed subject',
  '{n} materias reprobadas': '{n} failed subjects', 'Sin calificaciones': 'No grades',
  'Guardado ✅': 'Saved ✅', 'Restablecer datos de demostración': 'Reset demo data', '¿Restablecer los datos de demostración?': 'Reset the demo data?', '🎓 Alumnos': '🎓 Students', '👨‍🏫 Maestros': '👨‍🏫 Teachers', '🛡️ Administradores': '🛡️ Administrators',
  'Nuevo alumno': 'New student', 'Nuevo maestro': 'New teacher', 'Nuevo administrador': 'New administrator',
  'Alumnos': 'Students', 'Maestros': 'Teachers', 'Administradores': 'Administrators', 'Se actualiza automáticamente': 'Updates automatically', '🔔 Tus calificaciones se actualizaron': '🔔 Your grades were updated',
  '{a} de {b} parciales calificados': '{a} of {b} midterms graded', 'Actualizada': 'Updated', 'Última actualización': 'Last updated', 'Actualizado ✅': 'Updated ✅', 'Semestre actual cambiado ✅': 'Current semester changed ✅', '¿Seguro que deseas eliminar?': 'Are you sure you want to delete?',
  'Semana anterior': 'Previous week', 'Semana siguiente': 'Next week', 'Esta semana': 'This week', 'Sin clases': 'No classes', 'Semana del {a} al {b}': 'Week of {a} to {b}',
  'Selecciona una materia': 'Select a subject', 'Horario de clases': 'Class schedule', 'Sin horarios definidos': 'No schedule set',
  'Día': 'Day', 'Inicio': 'Start', 'Fin': 'End', 'Agregar': 'Add', 'Horario de {s}': 'Schedule for {s}', 'Maestro:': 'Teacher:',
  'Lunes': 'Monday', 'Martes': 'Tuesday', 'Miércoles': 'Wednesday', 'Jueves': 'Thursday', 'Viernes': 'Friday', 'Sábado': 'Saturday',
  'Usuario o contraseña incorrectos': 'Incorrect username or password', 'Sesión no válida': 'Invalid session', 'Sin permiso': 'Permission denied',
  'Nombre, usuario y contraseña (mín. 6) son obligatorios': 'Name, username and password (min. 6) are required', 'Rol inválido': 'Invalid role',
  'El usuario ya existe': 'The username already exists', 'No puedes eliminarte a ti mismo': "You can't delete yourself",
  'Nombre y aula son obligatorios': 'Name and room are required', 'El nombre del semestre es obligatorio': 'Semester name is required',
  'Ese semestre ya existe': 'That semester already exists', 'No encontrada': 'Not found', 'No encontrado': 'Not found',
  'Alumno o materia inválidos': 'Invalid student or subject', 'El alumno ya está inscrito en esa materia': 'The student is already enrolled in that subject',
  'Parcial inválido': 'Invalid midterm', 'La calificación debe estar entre 1 y 10': 'Grade must be between 1 and 10', 'Solicitud inválida': 'Invalid request',
  'Horario inválido': 'Invalid schedule', 'Conflicto: el aula ya está ocupada en ese horario': 'Conflict: the room is already in use at that time',
  'Conflicto: el maestro ya tiene clase en ese horario': 'Conflict: the teacher already has a class at that time', 'Error': 'Error',
};
const t = (k, p) => {
  let s = lang === 'en' && EN[k] !== undefined ? EN[k] : k;
  if (p) for (const x in p) s = s.replace('{' + x + '}', p[x]);
  return s;
};
const locale = () => lang === 'en' ? 'en-US' : 'es-MX';
const fmtDate = d => d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
const ROLES = { admin: 'Administrador', teacher: 'Maestro', student: 'Alumno' };
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function applyPrefs() { document.documentElement.dataset.theme = theme; document.documentElement.lang = lang; }
applyPrefs();
const prefButtons = () => `<button class="btn icon" id="theme">${theme === 'dark' ? '☀️ ' + t('Tema claro') : '🌙 ' + t('Tema oscuro')}</button>
  <button class="btn icon" id="lang">🌐 ${lang === 'en' ? 'ES' : 'EN'}</button>`;
function bindPrefs() {
  $('#theme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', theme); applyPrefs(); render(); };
  $('#lang').onclick = () => { lang = lang === 'en' ? 'es' : 'en'; localStorage.setItem('lang', lang); applyPrefs(); render(); };
}

const semQ = () => semSel ? '?semester=' + semSel : '';
const semSelect = (list, cur) => `<select id="semsel" style="width:auto;margin:0">${list.map(s => `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>${t('Semestre')} ${esc(s.name)}${s.active ? ' (' + t('actual') + ')' : ''}</option>`).join('')}</select>`;
const bindSem = () => { const e = $('#semsel'); if (e) e.onchange = () => { semSel = e.value; render(); }; };
const bindPrint = () => { const b = $('#pdf'); if (b) b.onclick = () => window.print(); };
const printHead = (title, sub) => `<div class="print-head"><img src="logo.svg" width="70" height="70" alt=""><div><h1>Escuela Horizonte</h1>
  <p>${esc(title)}${sub ? ' · ' + esc(sub) : ''}<br>${fmtDate(new Date())}</p></div></div>`;
const levelText = (lv, n) => ({ passed: t('¡Vas aprobando todas tus materias!'), 'failed-one': t('Tienes 1 materia reprobada'),
  'failed-many': t('Tienes {n} materias reprobadas', { n }), 'failed-all': t('Reprobado en todo el semestre'), pending: t('Aún sin calificaciones') })[lv];
const adminLevelText = (lv, n) => ({ passed: t('Todo aprobado'), 'failed-one': t('1 materia reprobada'),
  'failed-many': t('{n} materias reprobadas', { n }), 'failed-all': t('Reprobado en todo el semestre'), pending: t('Sin calificaciones') })[lv];

function toast(msg, err) {
  const el = $('#toast'); el.textContent = t(msg); el.className = 'show' + (err ? ' err' : '');
  setTimeout(() => el.className = '', 2500);
}
async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { logoutLocal(); throw new Error(d.error); }
  if (!r.ok) throw new Error(d.error || 'Error');
  return d;
}
const act = async fn => { try { await fn(); } catch (e) { toast(e.message, true); } };
function logoutLocal() { token = null; user = null; semSel = ''; weekOffset = 0; schedSubj = ''; prevGrades = null; localStorage.removeItem('token'); render(); }

function loginView() {
  app.innerHTML = `<div class="login-wrap"><div class="corner">${prefButtons()}</div><form class="login" id="lf">
    <img class="logo" src="logo.svg" alt="Logo" width="96" height="96"><h1>Escuela Horizonte</h1><p>${t('Inicia sesión para continuar')}</p>
    <input name="u" placeholder="${t('Usuario')}" autocomplete="username" required>
    <input name="p" type="password" placeholder="${t('Contraseña')}" autocomplete="current-password" required>
    <button class="btn block">${t('Entrar')}</button>
    ${window.DEMO_MODE ? `<div class="demo"><a href="#" id="reset">${t('Restablecer datos de demostración')}</a></div>` : ''}
  </form></div>`;
  bindPrefs();
      const rs = $('#reset'); if (rs) rs.onclick = e => { e.preventDefault(); if (confirm(t('¿Restablecer los datos de demostración?'))) window.resetDemo(); };
  $('#lf').onsubmit = e => { e.preventDefault(); act(async () => {
    const d = await api('/login', 'POST', { username: e.target.u.value, password: e.target.p.value });
    token = d.token; user = d.user; localStorage.setItem('token', token); tab = ''; render();
  }); };
}

function shell(content, tabs) {
  app.innerHTML = `<header><h2><img src="logo.svg" alt="" width="34" height="34" style="vertical-align:middle"> Escuela Horizonte</h2><div class="who">
    <span>${esc(user.name)}</span><span class="role">${t(ROLES[user.role])}</span>${prefButtons()}
    <button class="btn sm ghost" id="out">${t('Salir')}</button></div></header>
    <main>${tabs ? `<div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>` : ''}${content}</main>`;
  bindPrefs();
  $('#out').onclick = () => act(async () => { await api('/logout'); logoutLocal(); });
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
}
const gradeChip = (g, isNew) => g === null || g === undefined ? '<span class="chip">—</span>' : `<span class="chip ${g <= 5 ? 'low' : ''} ${isNew ? 'new' : ''}">${g}</span>`;
const statusPill = avg => { const s = avg === null || avg === undefined ? 'pending' : avg <= 5 ? 'failed' : 'passed';
  return `<span class="pill ${s}">${t({ passed: 'Aprobada', failed: 'Reprobada', pending: 'Sin calificar' }[s])}</span>`; };
let prevGrades = null, lastSync = null; const flash = {};
const opts = (arr, label) => arr.map(x => `<option value="${x.id}">${esc(label(x))}</option>`).join('');
const subTabs = () => [['grades', '📊 ' + t('Calificaciones')], ['schedule', '🕒 ' + t('Horario')]];

// ---------- Horario semanal (alumno y maestro)
function weekDays() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 6 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}
async function scheduleView(endpoint, showTeacher) {
  const d = await api(endpoint);
  const days = weekDays(), today = new Date().toDateString();
  const colors = {}; let n = 0;
  d.classes.forEach(c => { if (!(c.subject in colors)) colors[c.subject] = 'c' + (n++ % 6); });
  const col = (day, i) => {
    const cls = d.classes.filter(c => c.day === i + 1).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="day ${day.toDateString() === today ? 'today' : ''}"><h4>${t(DAYS[i])}<small>${fmtDate(day)}</small></h4>
      ${cls.map(c => `<div class="cls ${colors[c.subject]}"><b>${esc(c.subject)}</b><span>⏰ ${c.start} – ${c.end}</span>
      <span>🏫 ${esc(c.room)}</span>${showTeacher && c.teacher ? `<span>👨‍🏫 ${esc(c.teacher)}</span>` : ''}</div>`).join('') || `<div class="empty">${t('Sin clases')}</div>`}</div>`;
  };
  const label = t('Semana del {a} al {b}', { a: fmtDate(days[0]), b: fmtDate(days[5]) });
  shell(`<div class="toolbar"><div class="grp"><button class="btn sm ghost" id="wp">◀ ${t('Semana anterior')}</button>
    <button class="btn sm ghost" id="wt">${t('Esta semana')}</button><button class="btn sm ghost" id="wn">${t('Semana siguiente')} ▶</button></div>
    <button class="btn sm" id="pdf">${t('📄 Exportar PDF')}</button></div>
    ${printHead(t('Horario semanal'), `${t('Semestre')} ${d.semesterName}`)}
    <h3>${label} <span class="muted">· ${t('Semestre')} ${esc(d.semesterName)}</span></h3>
    <div class="scroll"><div class="week">${days.map(col).join('')}</div></div>`, subTabs());
  $('#wp').onclick = () => { weekOffset--; render(); };
  $('#wn').onclick = () => { weekOffset++; render(); };
  $('#wt').onclick = () => { weekOffset = 0; render(); };
  bindPrint();
}

// ---------- ALUMNO
async function studentView() {
  if (tab === 'schedule') return scheduleView('/student/schedule', true);
  const d = await api('/student/summary' + semQ());
  semSel = d.semesterId;
  const snapshot = {}; d.subjects.forEach(s => { snapshot[s.enrollmentId] = s.grades.join(','); });
  const changed = new Set();
  if (prevGrades && prevGrades.sem === d.semesterId) {
    for (const k in snapshot) if (prevGrades.data[k] !== undefined && prevGrades.data[k] !== snapshot[k]) changed.add(k);
    if (changed.size) setTimeout(() => toast('🔔 Tus calificaciones se actualizaron'), 50);
  }
  changed.forEach(k => { flash[k] = Date.now() + 60000; });
  const isNew = k => (flash[k] || 0) > Date.now();
  prevGrades = { sem: d.semesterId, data: snapshot }; lastSync = new Date();
  const icon = { passed: '🌟', 'failed-one': '⚠️', 'failed-many': '🚨', 'failed-all': '❌', pending: '⏳' }[d.level];
  const hint = { passed: 'Sigue así, ¡excelente trabajo!', 'failed-one': 'Ponte al corriente con esa materia, aún estás a tiempo.',
    'failed-many': 'Tienes más de una materia reprobada. Habla con tus maestros.',
    'failed-all': 'Todas tus materias con calificación están reprobadas. Pide apoyo de inmediato.', pending: 'Tus maestros aún no capturan calificaciones.' }[d.level];
  shell(`<div class="toolbar">${semSelect(d.semesters, d.semesterId)}<span class="muted live">🔄 ${t('Se actualiza automáticamente')} · ${lastSync.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><button class="btn sm" id="pdf">${t('📄 Exportar PDF')}</button></div>
    ${printHead(t('Boleta de calificaciones'), `${t('Semestre')} ${d.semesterName} · ${d.studentName}`)}
    <div class="banner ${d.level}"><span>${icon}</span><div>${levelText(d.level, d.failed)}<small>${t(hint)}</small></div></div>
    <div class="grid" style="margin-bottom:18px">
      <div class="stat s1"><b>${d.overall ?? '—'}</b>${t('Promedio general')}</div>
      <div class="stat s2"><b>${d.total - d.failed}</b>${t('Materias sin reprobar')}</div>
      <div class="stat s3"><b>${d.failed}</b>${t('Reprobadas (≤ {n})', { n: d.passing })}</div></div>
    ${d.subjects.map(s => `<div class="card subj ${s.status}">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <h3 style="margin:0">${esc(s.subject)}</h3>
        <span class="pill ${s.status}">${t({ passed: 'Aprobada', failed: 'Reprobada', pending: 'Sin calificar' }[s.status])}</span></div>
      <p class="muted">👨‍🏫 ${esc(s.teacher)} &nbsp;·&nbsp; 🏫 ${esc(s.room)}</p>
      <div class="chips">${s.grades.map((g, i) => `<span class="muted">P${i + 1}</span>${gradeChip(g, isNew(s.enrollmentId))}`).join('')}
        <span class="muted">${t('Promedio')}</span>${gradeChip(s.average, isNew(s.enrollmentId))}
        <span class="muted">· ${t('{a} de {b} parciales calificados', { a: s.grades.filter(g => g !== null).length, b: s.grades.length })}</span>
        ${isNew(s.enrollmentId) ? `<span class="pill passed">${t('Actualizada')}</span>` : ''}</div>
      ${s.updatedAt ? `<div class="muted" style="margin-bottom:6px">🕒 ${t('Última actualización')}: ${new Date(s.updatedAt).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })}</div>` : ''}
      <div class="bar"><i class="${s.status}" style="width:${(s.average || 0) * 10}%"></i></div></div>`).join('') || `<div class="card">${t('Aún no tienes materias en este semestre.')}</div>`}`, subTabs());
  bindSem(); bindPrint();
}

// ---------- MAESTRO
async function teacherView() {
  if (tab === 'schedule') return scheduleView('/teacher/schedule', false);
  const list = await api('/teacher/subjects');
  shell(list.map(s => `<div class="card"><h3>${esc(s.name)} <span class="muted">· 🏫 ${esc(s.room)} · ${t('Semestre')} ${esc(s.semesterName)}</span></h3>
    <div class="scroll"><table><tr><th>${t('Alumno')}</th><th>${t('Aula')}</th>${[1, 2, 3].map(i => `<th>${t('Parcial')} ${i}</th>`).join('')}<th>${t('Promedio')}</th><th>${t('Estado')}</th></tr>
    ${s.students.map(st => `<tr data-e="${st.enrollmentId}"><td>${esc(st.name)}</td><td>${esc(st.room)}</td>
      ${st.grades.map((g, i) => `<td><input class="gin" type="number" min="1" max="10" step="0.1" data-i="${i}" value="${g ?? ''}"></td>`).join('')}
      <td class="avg">${gradeChip(st.average)}</td><td class="st">${statusPill(st.average)}</td></tr>`).join('') || `<tr><td colspan="7" class="muted">${t('Sin alumnos inscritos')}</td></tr>`}
    </table></div></div>`).join('') || `<div class="card">${t('Aún no tienes materias asignadas.')}</div>`, subTabs());
  document.querySelectorAll('.gin').forEach(inp => inp.onchange = () => act(async () => {
    const tr = inp.closest('tr');
    try {
      const r = await api('/teacher/grade', 'PUT', { enrollmentId: tr.dataset.e, index: inp.dataset.i, value: inp.value });
      tr.querySelector('.avg').innerHTML = gradeChip(r.average); tr.querySelector('.st').innerHTML = statusPill(r.average); toast('Calificación guardada ✅');
    } catch (e) { inp.value = ''; throw e; }
  }));
}

// ---------- ADMIN
async function adminView() {
  const tabs = [['subjects', t('📚 Materias')], ['semesters', t('🗓️ Semestres')], ['schedules', t('🕒 Horarios')], ['students', t('🎓 Alumnos')], ['teachers', t('👨‍🏫 Maestros')], ['admins', t('🛡️ Administradores')], ['enroll', t('📝 Inscripciones')], ['report', t('📊 Reporte')]];
  let html;
  if (tab === 'report') {
    const r = await api('/admin/report' + semQ());
    semSel = r.semester.id;
    html = `<div class="toolbar">${semSelect(r.semesters, r.semester.id)}<button class="btn sm" id="pdf">${t('📄 Exportar PDF')}</button></div>
      ${printHead(t('Reporte académico'), `${t('Semestre')} ${r.semester.name}`)}
      <div class="card"><h3>${t('Situación académica por alumno')}</h3><div class="scroll"><table>
      <tr><th>${t('Alumno')}</th><th>${t('Promedio')}</th><th>${t('Reprobadas')}</th><th>${t('Estado')}</th></tr>
      ${r.students.map(s => `<tr><td>${esc(s.name)}</td><td>${gradeChip(s.overall)}</td><td>${s.failed}/${s.total}</td>
      <td><span class="pill ${s.level === 'passed' ? 'passed' : s.level === 'pending' ? 'pending' : 'failed'}">${adminLevelText(s.level, s.failed)}</span></td></tr>`).join('')}
      </table></div></div>`;
  } else {
    cache = await api('/admin/data');
    const { users, subjects, enrollments, semesters } = cache;
    const teachers = users.filter(u => u.role === 'teacher'), students = users.filter(u => u.role === 'student');
    const uname = id => (users.find(u => u.id === id) || {}).name || t('Sin asignar');
    const sname = id => { const s = subjects.find(s => s.id === id); return s ? `${s.name} (${s.semesterName})` : '?'; };
    if (!tab || !tabs.some(x => x[0] === tab)) tab = 'subjects';
    if (tab === 'semesters') html = `<div class="card"><h3>${t('Nuevo semestre')}</h3><form id="fsem" class="row">
      <input name="name" placeholder="2026-B" required><button class="btn">${t('Crear')}</button></form></div>
      <div class="card"><h3>${t('Semestres')}</h3><div class="scroll"><table><tr><th>${t('Semestre')}</th><th>${t('Materias')}</th><th>${t('Estado')}</th><th></th></tr>
      ${semesters.map(s => `<tr><td>${esc(s.name)}</td><td>${subjects.filter(x => x.semesterId === s.id).length}</td>
      <td>${s.active ? `<span class="pill passed">${t('Actual')}</span>` : `<span class="pill pending">${t('Anterior/Futuro')}</span>`}</td>
      <td>${s.active ? '' : `<button class="btn sm" data-act="${s.id}">${t('Marcar como actual')}</button>`}</td></tr>`).join('')}</table></div></div>`;
    if (tab === 'subjects') html = `<div class="card"><h3>${t('Nueva materia')}</h3><form id="fs" class="row">
      <input name="name" placeholder="${t('Nombre de la materia')}" required><input name="room" placeholder="${t('Aula')}" required>
      <select name="semesterId">${semesters.map(s => `<option value="${s.id}" ${s.active ? 'selected' : ''}>${t('Semestre')} ${esc(s.name)}</option>`).join('')}</select>
      <select name="teacherId"><option value="">${t('Maestro (opcional)')}</option>${opts(teachers, x => x.name)}</select>
      <button class="btn">${t('Crear')}</button></form></div>
      <div class="card"><h3>${t('Materias')}</h3><div class="scroll"><table><tr><th>${t('Materia')}</th><th>${t('Semestre')}</th><th>${t('Aula')}</th><th>${t('Maestro')}</th><th></th></tr>
      ${subjects.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.semesterName)}</td><td><input data-s="${s.id}" data-f="room" value="${esc(s.room)}" style="margin:0"></td>
      <td><select data-s="${s.id}" data-f="teacherId" style="margin:0"><option value="">${t('Sin asignar')}</option>${teachers.map(x => `<option value="${x.id}" ${x.id === s.teacherId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>
      <td><button class="btn sm red" data-ds="${s.id}">${t('Eliminar')}</button></td></tr>`).join('')}</table></div></div>`;
    if (tab === 'schedules') {
      const cur = subjects.find(s => s.id === schedSubj) || subjects[0];
      if (cur) schedSubj = cur.id;
      html = `<div class="card"><h3>${t('Horario de clases')}</h3>
        <select id="ssel">${subjects.map(s => `<option value="${s.id}" ${cur && s.id === cur.id ? 'selected' : ''}>${esc(s.name)} · ${t('Semestre')} ${esc(s.semesterName)}</option>`).join('')}</select>
        ${cur ? `<p class="muted">${t('Aula')}: ${esc(cur.room)} · ${t('Maestro:')} ${esc(uname(cur.teacherId))}</p>
        <div class="slots">${[...cur.schedule].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)).map(c => `<span class="slot">${t(DAYS[c.day - 1])} ${c.start}–${c.end}
          <button data-rm="${c.day}|${c.start}|${c.end}">✕</button></span>`).join('') || `<span class="muted">${t('Sin horarios definidos')}</span>`}</div>
        <form id="fsch" class="row"><select name="day">${DAYS.map((d, i) => `<option value="${i + 1}">${t(d)}</option>`).join('')}</select>
        <input name="start" type="time" required title="${t('Inicio')}"><input name="end" type="time" required title="${t('Fin')}"><button class="btn">${t('Agregar')}</button></form>` : `<p class="muted">${t('Selecciona una materia')}</p>`}</div>`;
    }
    const roleTab = { students: ['student', 'Nuevo alumno', 'Alumnos'], teachers: ['teacher', 'Nuevo maestro', 'Maestros'], admins: ['admin', 'Nuevo administrador', 'Administradores'] }[tab];
    if (roleTab) {
      const [role, newLabel, listLabel] = roleTab;
      html = `<div class="card"><h3>${t(newLabel)}</h3><form id="fu" class="row">
      <input type="hidden" name="role" value="${role}">
      <input name="name" placeholder="${t('Nombre completo')}" required><input name="username" placeholder="${t('Usuario')}" required>
      <input name="password" type="password" placeholder="${t('Contraseña (mín. 6)')}" required minlength="6">
      <button class="btn">${t('Crear')}</button></form></div>
      <div class="card"><h3>${t(listLabel)} (${users.filter(u => u.role === role).length})</h3><div class="scroll"><table><tr><th>${t('Nombre')}</th><th>${t('Usuario')}</th><th></th></tr>
      ${users.filter(u => u.role === role).map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.username)}</td>
      <td>${u.id === user.id ? '' : `<button class="btn sm red" data-du="${u.id}">${t('Eliminar')}</button>`}</td></tr>`).join('')}</table></div></div>`;
    }
    if (tab === 'enroll') html = `<div class="card"><h3>${t('Asignar materia y aula a un alumno')}</h3><form id="fe" class="row">
      <select name="studentId" required><option value="">${t('Alumno')}</option>${opts(students, s => s.name)}</select>
      <select name="subjectId" required><option value="">${t('Materia')}</option>${opts(subjects, s => `${s.name} · ${s.semesterName} (${s.room} · ${uname(s.teacherId)})`)}</select>
      <input name="room" placeholder="${t('Aula (vacío = la de la materia)')}"><button class="btn">${t('Asignar')}</button></form></div>
      <div class="card"><h3>${t('Inscripciones')}</h3><div class="scroll"><table><tr><th>${t('Alumno')}</th><th>${t('Materia')}</th><th>${t('Aula')}</th><th>${t('Maestro')}</th><th></th></tr>
      ${enrollments.map(e => `<tr><td>${esc(uname(e.studentId))}</td><td>${esc(sname(e.subjectId))}</td><td>${esc(e.room)}</td>
      <td>${esc(uname((subjects.find(s => s.id === e.subjectId) || {}).teacherId))}</td><td><button class="btn sm red" data-de="${e.id}">${t('Quitar')}</button></td></tr>`).join('')}</table></div></div>`;
  }
  shell(html, tabs);
  const form = (id, url) => { const f = $(id); if (f) f.onsubmit = e => { e.preventDefault(); act(async () => {
    await api(url, 'POST', Object.fromEntries(new FormData(f))); toast('Guardado ✅'); render(); }); }; };
  form('#fs', '/admin/subjects'); form('#fu', '/admin/users'); form('#fe', '/admin/enrollments'); form('#fsem', '/admin/semesters');
  bindSem(); bindPrint();
  document.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(async () => {
    await api(`/admin/semesters/${b.dataset.act}/activate`, 'PUT'); toast('Semestre actual cambiado ✅'); render(); }));
  const del = (attr, url) => document.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => {
    if (confirm(t('¿Seguro que deseas eliminar?'))) act(async () => { await api(`${url}/${b.dataset[attr]}`, 'DELETE'); render(); }); });
  del('ds', '/admin/subjects'); del('du', '/admin/users'); del('de', '/admin/enrollments');
  document.querySelectorAll('[data-s]').forEach(el => el.onchange = () => act(async () => {
    try { await api('/admin/subjects/' + el.dataset.s, 'PUT', { [el.dataset.f]: el.value }); toast('Actualizado ✅'); }
    catch (e) { render(); throw e; } }));
  const ss = $('#ssel'); if (ss) ss.onchange = () => { schedSubj = ss.value; render(); };
  const saveSched = list => act(async () => {
    await api('/admin/subjects/' + schedSubj, 'PUT', { schedule: list }); toast('Guardado ✅'); render(); });
  const cur = (cache.subjects || []).find(s => s.id === schedSubj);
  const fsch = $('#fsch');
  if (fsch && cur) fsch.onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(fsch));
    saveSched([...cur.schedule, { day: Number(f.day), start: f.start, end: f.end }]); };
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    const [d, s, e] = b.dataset.rm.split('|');
    saveSched(cur.schedule.filter(c => !(c.day === Number(d) && c.start === s && c.end === e))); });
}

async function render() {
  if (!token) return loginView();
  try {
    if (!user) user = await api('/me');
    if (user.role !== 'admin' && !['grades', 'schedule'].includes(tab)) tab = 'grades';
    if (user.role === 'student') await studentView();
    else if (user.role === 'teacher') await teacherView();
    else await adminView();
  } catch (e) { if (token) toast(e.message, true); }
}
render();
setInterval(() => { if (token && user && user.role === 'student' && tab === 'grades' && !document.hidden) render(); }, 8000);