import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Atom, BadgeCheck, BarChart3, Bell, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, CloudUpload, CreditCard, Download, Eye, FileText, Filter, GraduationCap, Heart, LayoutDashboard, Lightbulb, ListChecks, LockKeyhole, LogOut, Mail, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Star, Users, Wallet, X } from 'lucide-react';
import { api } from '../lib/api';
import { normalizeBrandColor } from '../lib/normalizeBrandColor';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../components/ToastContext';
import { Avatar, Brand } from '../components/Brand';
import Modal from '../components/Modal';
import AssignmentsPanel from '../components/AssignmentsPanel';

const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;
const permissionFields = [
  ['canEditCourseMaterial', 'Edit course material'],
  ['canViewFeeRecords', 'View fee records'],
  ['canMarkAttendance', 'Mark attendance'],
  ['canGradeStudents', 'Grade students'],
  ['canManageAssignments', 'Manage assignments'],
  ['canViewStudents', 'View student list'],
];
const displayRole = { SUPER_ADMIN: 'Platform admin', ACADEMY_OWNER: 'Academy owner', TEACHER: 'Teacher', STUDENT: 'Learner' };

const navConfig = {
  ACADEMY_OWNER: [
    { group: 'WORKSPACE', items: [['overview', 'Overview', LayoutDashboard], ['courses', 'Courses', BookOpen], ['teachers', 'Teachers', Users], ['admissions', 'Admissions', ListChecks]] },
    { group: 'ACADEMY', items: [['attendance', 'Attendance', CalendarDays], ['settings', 'Brand & settings', Settings]] },
  ],
  TEACHER: [
    { group: 'YOUR CLASSROOM', items: [['overview', 'Overview', LayoutDashboard], ['courses', 'My classes', BookOpen], ['attendance', 'Attendance', CalendarDays], ['assignments', 'Assignments', FileText]] },
  ],
  STUDENT: [
    { group: 'YOUR LEARNING', items: [['learning', 'My learning', BookOpen], ['assignments', 'Assignments', FileText], ['schedule', 'My schedule', CalendarDays], ['grades', 'Progress & grades', BarChart3], ['favorites', 'Saved academies', Heart]] },
    { group: 'DISCOVER', items: [['explore', 'Find your next class', Sparkles]] },
  ],
  SUPER_ADMIN: [
    { group: 'PLATFORM', items: [['overview', 'Overview', LayoutDashboard], ['academies', 'Academies', Building2], ['subscriptions', 'Plans & billing', CreditCard], ['marketplace', 'Featured listings', Star]] },
  ],
};

const pathFor = (id) => id === 'overview' ? '/dashboard' : id === 'explore' ? '/' : `/dashboard/${id}`;

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="dash-page-title"><div><span className="eyebrow eyebrow-muted">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function StatusPill({ status }) {
  const normalized = (status || 'ACTIVE').toLowerCase();
  return <span className={`status-pill status-${normalized.replaceAll('_', '-')}`}><span />{status?.replaceAll('_', ' ') || 'Active'}</span>;
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`permission-toggle ${checked ? 'permission-toggle-on' : ''}`} onClick={() => onChange(!checked)}><span /></button>;
}

function DashboardOverview({ role, user, courses, teachers, enrollments, navigate, superAnalytics, pendingAcademies = [] }) {
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isSuper = role === 'SUPER_ADMIN';
  const count = (value) => Number(value || 0).toLocaleString('en-PK');
  const pendingEnrollments = enrollments.filter((item) => item.status === 'PENDING');
  const completedCourses = courses.filter((item) => item.enrollmentStatus === 'COMPLETED' || item.status === 'COMPLETED');
  const metrics = isStudent ? [
    { label: 'Active courses', value: count(courses.length), icon: BookOpen, tone: 'green' },
    { label: 'Applications', value: count(enrollments.length), icon: ListChecks, tone: 'peach' },
    { label: 'Awaiting a response', value: count(pendingEnrollments.length), icon: Clock3, tone: 'lilac' },
    { label: 'Completed courses', value: count(completedCourses.length), icon: CheckCircle2, tone: 'yellow' },
  ] : isTeacher ? [
    { label: 'Assigned classes', value: count(courses.length), icon: BookOpen, tone: 'green' },
  ] : isSuper ? [
    { label: 'Academies', value: count(superAnalytics?.academyCount), icon: Building2, tone: 'green' },
    { label: 'Learners', value: count(superAnalytics?.learnerCount), icon: Users, tone: 'peach' },
    { label: 'Applications', value: count(superAnalytics?.pendingCount), icon: ListChecks, tone: 'lilac' },
    { label: 'Published courses', value: count(superAnalytics?.courseCount), icon: BookOpen, tone: 'yellow' },
  ] : [
    { label: 'Courses', value: count(courses.length), icon: BookOpen, tone: 'green' },
    { label: 'Teachers', value: count(teachers.length), icon: Users, tone: 'peach' },
    { label: 'Applications', value: count(enrollments.length), icon: ListChecks, tone: 'lilac' },
    { label: 'Awaiting review', value: count(pendingEnrollments.length), icon: Clock3, tone: 'yellow' },
  ];
  const firstName = user?.name?.split(' ')[0] || '';
  const heading = isSuper ? 'Platform overview' : 'Welcome' + (firstName ? ', ' + firstName : '');
  const subtitle = isStudent ? 'Your learning activity and course applications.' : isTeacher ? 'Your assigned classes and teaching workspace.' : isSuper ? 'Current activity across the Bowan platform.' : 'An overview of your academy workspace.';
  const recent = isSuper ? pendingAcademies.slice(0, 5) : enrollments.slice(0, 5);
  const actionPath = isStudent ? '/' : isSuper ? '/dashboard/academies' : isTeacher ? '/dashboard/attendance' : '/dashboard/admissions';
  const actionLabel = isStudent ? 'Explore courses' : isSuper ? 'Review academies' : isTeacher ? 'Take attendance' : 'Review applications';

  return <div className="dash-overview">
    <div className="dash-greeting-row"><div><div className="dash-date-line">{new Intl.DateTimeFormat('en-PK', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div><h1>{heading}</h1><p>{subtitle}</p></div><button className="button button-primary dash-welcome-action" onClick={() => navigate(actionPath)}>{actionLabel} <ArrowRight size={15} /></button></div>
    <div className="dash-stats-grid">{metrics.map((metric) => { const Icon = metric.icon; return <article className="dash-stat-card" key={metric.label}><div className={'stat-icon stat-tone-' + metric.tone}><Icon size={18} /></div><span className="stat-label">{metric.label}</span><strong>{metric.value}</strong></article>; })}</div>
    <div className="dash-lower-grid">
      <section className="dashboard-card recent-activity-card"><div className="card-heading"><div><span className="eyebrow eyebrow-muted">{isSuper ? 'ACADEMY REVIEW' : isStudent ? 'YOUR ACTIVITY' : 'WORKSPACE ACTIVITY'}</span><h2>{isSuper ? 'Pending academies' : 'Recent applications'}</h2></div><button className="text-link" type="button" onClick={() => navigate(isStudent ? '/dashboard/learning' : isSuper ? '/dashboard/academies' : '/dashboard/admissions')}>View all <ArrowRight size={15} /></button></div><div className="activity-table"><div className="activity-table-head"><span>{isSuper ? 'ACADEMY' : 'COURSE'}</span><span>{isSuper ? 'LOCATION' : 'ACADEMY'}</span><span>STATUS</span><span>DATE</span></div>{recent.map((item) => <div className="activity-table-row" key={item._id}><div className="activity-person"><Avatar name={isSuper ? item.name : item.courseTitle || item.courseId?.title || 'Course'} /><span>{isSuper ? item.name : item.courseTitle || item.courseId?.title || 'Course'}</span></div><span>{isSuper ? item.contactInfo?.city || item.slug : item.academyName || item.academyId?.name || '?'}</span><StatusPill status={item.status || 'PENDING'} /><span>{item.createdAt || item.appliedAt ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(item.createdAt || item.appliedAt)) : '?'}</span></div>)}{recent.length === 0 && <div className="table-empty">{isSuper ? 'No academies are awaiting review.' : 'No recent activity to show.'}</div>}</div></section>
      <section className="dashboard-card schedule-card"><div className="card-heading"><div><span className="eyebrow eyebrow-muted">QUICK ACCESS</span><h2>Your workspace</h2></div><LayoutDashboard size={18} /></div><div className="dashboard-quick-links">{(isStudent ? [['My learning', '/dashboard/learning'], ['Assignments', '/dashboard/assignments'], ['Saved academies', '/dashboard/favorites']] : isSuper ? [['Academies', '/dashboard/academies'], ['Plans & billing', '/dashboard/subscriptions'], ['Featured listings', '/dashboard/marketplace']] : isTeacher ? [['My classes', '/dashboard/courses'], ['Attendance', '/dashboard/attendance'], ['Assignments', '/dashboard/assignments']] : [['Courses', '/dashboard/courses'], ['Teachers', '/dashboard/teachers'], ['Academy settings', '/dashboard/settings']]).map(([label, path]) => <button type="button" key={path} onClick={() => navigate(path)}>{label}<ArrowRight size={15} /></button>)}</div></section>
    </div>
  </div>;
}

function TeachersPanel({ teachers, setTeachers, courses, setCourses, user, academy, notify }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseTeacher, setCourseTeacher] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', title: '', password: '' });
  const filtered = teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.title}`.toLowerCase().includes(search.toLowerCase()));
  const updatePermission = async (teacherId, field, value) => {
    const previous = teachers;
    const next = teachers.map((teacher) => teacher._id === teacherId ? { ...teacher, assignedTeacherPermissions: { ...teacher.assignedTeacherPermissions, [field]: value } } : teacher);
    setTeachers(next);
    try { await api.patch(`/teachers/${teacherId}/permissions`, { [field]: value }); }
    catch (error) { setTeachers(previous); notify(error?.response?.data?.message || 'Permission could not be updated.', 'error'); }
  };
  const startCourseAssignment = (teacher) => {
    setCourseTeacher(teacher);
    let assigned = (teacher.assignedCourseIds || []).map(String);
    if (!assigned.length) assigned = courses.filter((course) => (course.assignedTeacherIds || []).some((id) => String(id) === String(teacher._id))).map((course) => String(course._id));
    setSelectedCourseIds(assigned);
    setCourseModalOpen(true);
  };
  const saveCourseAssignments = async () => {
    if (!courseTeacher) return;
    const beforeTeachers = teachers;
    const beforeCourses = courses;
    let existing = (courseTeacher.assignedCourseIds || []).map(String);
    if (!existing.length) existing = courses.filter((course) => (course.assignedTeacherIds || []).some((id) => String(id) === String(courseTeacher._id))).map((course) => String(course._id));
    const nextIds = selectedCourseIds.map(String);
    const added = nextIds.filter((id) => !existing.includes(id));
    const removed = existing.filter((id) => !nextIds.includes(id));
    setTeachers((items) => items.map((teacher) => teacher._id === courseTeacher._id ? { ...teacher, assignedCourseIds: nextIds, coursesCount: nextIds.length, courses: nextIds.length } : teacher));
    setCourses((items) => items.map((course) => {
      const current = (course.assignedTeacherIds || []).map(String);
      const next = nextIds.includes(String(course._id)) ? [...new Set([...current, String(courseTeacher._id)])] : current.filter((id) => id !== String(courseTeacher._id));
      return { ...course, assignedTeacherIds: next };
    }));
    try {
      await Promise.all([
        ...added.map((courseId) => api.post(`/teachers/${courseTeacher._id}/courses/${courseId}`, {})),
        ...removed.map((courseId) => api.delete(`/teachers/${courseTeacher._id}/courses/${courseId}`)),
      ]);
    } catch (error) {
      setTeachers(beforeTeachers); setCourses(beforeCourses);
      notify(error?.response?.data?.message || 'Class assignments could not be saved.', 'error');
      return;
    }
    setCourseModalOpen(false); setCourseTeacher(null); notify('Class assignments saved.');
  };
  const addTeacher = async (event) => {
    event.preventDefault();
    let teacher;
    let issuedPassword = '';
    try {
      const { data } = await api.post('/teachers', { ...form, password: form.password || undefined });
      teacher = data.teacher;
      issuedPassword = data.temporaryPassword || '';
    } catch (error) { notify(error?.response?.data?.message || 'Teacher account could not be created.', 'error'); return; }
    setTeachers((items) => [teacher, ...items]); setModalOpen(false); setForm({ name: '', email: '', title: '', password: '' }); if (issuedPassword) setTemporaryPassword(issuedPassword); notify('Teacher added. You can fine-tune access below.');
  };
  return <div className="dash-panel-page">
    <PageTitle eyebrow="YOUR PEOPLE, YOUR ACADEMY" title="A team that makes learning happen." subtitle="Invite teachers and give them exactly the access they need." action={<button className="button button-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add a teacher</button>} />
    <div className="teacher-panel-summary"><div><div className="teacher-panel-icon"><Users size={19} /></div><span><b>{teachers.length} teachers</b><small>teaching at {academy?.name || 'your academy'}</small></span></div><div className="teacher-panel-summary-note"><ShieldCheck size={16} /><span>Every teacher’s access is yours to decide.</span></div></div>
    <section className="dashboard-card permissions-card"><div className="permissions-card-heading"><div><span className="eyebrow eyebrow-muted">TEAM ACCESS</span><h2>Teachers & permissions</h2><p>Toggle an access right on or off at any time.</p></div><div className="table-search"><Search size={15} /><input aria-label="Search teachers" placeholder="Find a teacher" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      <div className="permissions-table-wrap"><table className="permissions-table"><thead><tr><th>TEACHER</th><th>CLASSES</th>{permissionFields.map(([key, label]) => <th key={key} title={label}>{label}</th>)}<th>STATUS</th></tr></thead><tbody>{filtered.map((teacher) => <tr key={teacher._id}><td><div className="teacher-table-person"><Avatar name={teacher.name} initials={teacher.initials} size="sm" /><span><b>{teacher.name}</b><small>{teacher.title || teacher.email}</small></span></div></td><td><div className="teacher-class-assignment"><span className="teacher-class-count">{teacher.coursesCount ?? teacher.courses ?? 0} classes</span><button type="button" onClick={() => startCourseAssignment(teacher)}>Manage</button></div></td>{permissionFields.map(([key, label]) => <td key={key}><Toggle checked={Boolean(teacher.assignedTeacherPermissions?.[key])} onChange={(value) => updatePermission(teacher._id, key, value)} label={`${label} for ${teacher.name}`} /></td>)}<td><StatusPill status={teacher.status || 'Active'} /></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="table-empty">No teachers match that search.</div>}</div>
      <div className="permissions-footnote"><LockKeyhole size={14} /><span>Changes take effect immediately. Teachers can only access courses assigned to them.</span></div>
    </section>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Bring a teacher on board"><form className="dashboard-form" onSubmit={addTeacher}><p className="modal-copy">They’ll join {academy?.name || 'your academy'} with a secure, scoped teacher account.</p><label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sana Ahmed" /></label><label>Email address<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="sana@academy.edu" /></label><label>Teaching role <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Design instructor" /></label><label>Temporary password<input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave blank to generate one securely" /></label><div className="form-note"><ShieldCheck size={15} /> Teacher starts with attendance and student-list access.</div><div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setModalOpen(false)}>Not now</button><button className="button button-primary" type="submit">Add teacher <ArrowRight size={15} /></button></div></form></Modal>
    <Modal open={Boolean(temporaryPassword)} onClose={() => setTemporaryPassword('')} title="Share the teacher’s first sign-in"><div className="teacher-password-note"><span><LockKeyhole size={18} /></span><p>This generated password is shown once. Share it privately and ask the teacher to change it after signing in.</p><div className="teacher-password-value"><code>{temporaryPassword}</code><button className="button button-soft" type="button" onClick={async () => { try { await navigator.clipboard.writeText(temporaryPassword); notify('Temporary password copied.'); } catch { notify('Select and copy the temporary password manually.'); } }}>Copy</button></div><button className="button button-primary" type="button" onClick={() => setTemporaryPassword('')}>Done <Check size={15} /></button></div></Modal>
    <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)} title={`Assign classes${courseTeacher ? ` to ${courseTeacher.name.split(' ')[0]}` : ''}`}><div className="course-assignment-modal"><p>Teachers only see the courses and learners assigned to them.</p>{courses.map((course) => <label className="course-assignment-option" key={course._id}><input type="checkbox" checked={selectedCourseIds.includes(String(course._id))} onChange={(event) => setSelectedCourseIds((current) => event.target.checked ? [...new Set([...current, String(course._id)])] : current.filter((id) => id !== String(course._id)))} /><span><b>{course.title}</b><small>{course.category} · {course.duration}</small></span><span className="course-assignment-fee">{money(course.fee)}</span></label>)}{courses.length === 0 && <div className="table-empty">Create a course before assigning classes.</div>}<div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setCourseModalOpen(false)}>Cancel</button><button className="button button-primary" type="button" onClick={saveCourseAssignments}>Save assignments <Check size={15} /></button></div></div></Modal>
  </div>;
}

function CoursesPanel({ courses, setCourses, academy, notify, role }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', category: '', fee: '', duration: '', deliveryMode: 'HYBRID', description: '' });
  const list = courses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(search.toLowerCase()));
  const canCreate = role === 'ACADEMY_OWNER';
  const saveCourse = async (event) => {
    event.preventDefault();
    let course;
    try { const { data } = await api.post('/courses', form); course = data.course || data; }
    catch (error) { notify(error?.response?.data?.message || 'The course could not be saved.', 'error'); return; }
    setCourses((items) => [course, ...items]); setModalOpen(false); setForm({ title: '', category: '', fee: '', duration: '', deliveryMode: 'HYBRID', description: '' }); notify('Your new course is ready to meet its learners.');
  };
  return <div className="dash-panel-page">
    <PageTitle eyebrow="MAKE ROOM FOR NEW IDEAS" title={role === 'TEACHER' ? 'Your classes.' : 'Good classes start here.'} subtitle={role === 'TEACHER' ? 'The learning journeys you’re guiding right now.' : 'Create thoughtful programs and help the right learners find you.'} action={canCreate && <button className="button button-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Create a course</button>} />
    <div className="course-list-toolbar"><div className="course-list-count"><b>{courses.length.toString().padStart(2, '0')}</b><span>classes in your space</span></div><div className="table-search"><Search size={15} /><input aria-label="Search courses" placeholder="Search courses" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
    <div className="dash-course-grid">{list.map((course, index) => <article className="dash-course-card" key={course._id}><div className={`dash-course-cover course-art-${course.color || ['mint', 'lilac', 'peach'][index % 3]}`}><span className="course-art-mark">{['✳', '⌘', '✦'][index % 3]}</span><span className="course-cover-code">BOWAN / {String(index + 1).padStart(2, '0')}</span></div><div className="dash-course-card-content"><div className="dash-course-card-top"><span>{course.category || 'Learning'}</span><button aria-label={`More options for ${course.title}`}><MoreHorizontal size={18} /></button></div><h3>{course.title}</h3><p>{course.description}</p><div className="dash-course-meta"><span><Clock3 size={14} /> {course.duration}</span><span><Users size={14} /> {course.students || 0} learners</span></div><div className="dash-course-card-bottom"><div><small>Course fee</small><b>{money(course.fee)}</b></div><StatusPill status={course.status || 'Published'} /></div></div></article>)}</div>
    {list.length === 0 && <div className="table-empty">No classes found. Try another search.</div>}
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a new course"><form className="dashboard-form" onSubmit={saveCourse}><p className="modal-copy">Give curious learners a good reason to begin.</p><label>Course title<input required minLength={3} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Introduction to UX design" /></label><div className="form-row"><label>Subject<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Design" /></label><label>Course fee (PKR)<input type="number" required min="0" value={form.fee} onChange={(event) => setForm({ ...form, fee: event.target.value })} placeholder="12500" /></label></div><div className="form-row"><label>Duration<input required value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="8 weeks" /></label><label>Learning format<select value={form.deliveryMode} onChange={(event) => setForm({ ...form, deliveryMode: event.target.value })}><option value="ONLINE">Online</option><option value="ON_CAMPUS">On campus</option><option value="HYBRID">Hybrid</option></select></label></div><label>What will learners discover?<textarea rows="3" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short, friendly description…" /></label><div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Save course <ArrowRight size={15} /></button></div></form></Modal>
  </div>;
}

function AdmissionsPanel({ enrollments, setEnrollments, notify }) {
  const [filter, setFilter] = useState('All');
  const choices = ['All', 'Pending', 'Approved', 'Rejected'];
  const list = enrollments.filter((row) => filter === 'All' || row.status?.toLowerCase() === filter.toLowerCase());
  const updateStatus = async (item, status) => {
    const previous = enrollments;
    setEnrollments((items) => items.map((row) => row._id === item._id ? { ...row, status } : row));
    try { await api.patch(`/enrollments/${item._id}/status`, { status }); }
    catch (error) { setEnrollments(previous); notify(error?.response?.data?.message || 'The application could not be updated.', 'error'); return; }
    notify(status === 'APPROVED' ? `${item.studentName} is in. What a lovely next step.` : 'Application decision saved.');
  };
  return <div className="dash-panel-page"><PageTitle eyebrow="A GOOD FIRST HELLO" title="Applications, thoughtfully handled." subtitle="Help learners take their next step. A small decision can open a big door." action={<button className="button button-outline" type="button"><Download size={15} /> Export list</button>} />
    <div className="admissions-summary-row"><div className="admission-summary-card admission-summary-pending"><span className="admission-summary-icon"><Clock3 size={18} /></span><small>Waiting for a hello</small><b>{enrollments.filter((row) => row.status === 'PENDING').length}</b><span>Ready for your review</span></div><div className="admission-summary-card admission-summary-approved"><span className="admission-summary-icon"><Check size={18} /></span><small>New beginnings</small><b>{enrollments.filter((row) => row.status === 'APPROVED').length}</b><span>Approved learners</span></div><div className="admission-summary-card admission-summary-conversion"><span className="admission-summary-icon"><Sparkles size={18} /></span><small>A warm welcome</small><b>{enrollments.length ? Math.round(enrollments.filter((row) => row.status === 'APPROVED').length / enrollments.length * 100) : 0}%</b><span>Application approval rate</span></div></div>
    <section className="dashboard-card admission-list-card"><div className="admission-list-header"><div><span className="eyebrow eyebrow-muted">YOUR INBOX, BUT NICER</span><h2>Admission applications</h2></div><div className="admission-filters">{choices.map((item) => <button key={item} className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)}>{item}{item === 'Pending' && <span>{enrollments.filter((row) => row.status === 'PENDING').length}</span>}</button>)}</div></div><div className="admissions-table"><div className="admissions-table-head"><span>LEARNER</span><span>INTERESTED IN</span><span>APPLIED</span><span>STATUS</span><span>A LITTLE ACTION</span></div>{list.map((item, index) => <div className="admission-row" key={item._id}><div className="admission-person"><Avatar name={item.studentName} initials={item.initials} size="sm" className={`activity-avatar-${index % 4}`} /><span><b>{item.studentName}</b><small>{item.studentEmail}</small></span></div><b className="admission-course">{item.courseTitle}</b><span className="admission-applied-date">{item.createdAt?.includes('2026-') ? `Oct ${item.createdAt.slice(-2)}` : item.createdAt}</span><StatusPill status={item.status} /><div className="admission-row-actions">{item.status === 'PENDING' ? <><button className="admission-approve" type="button" title="Approve application" onClick={() => updateStatus(item, 'APPROVED')}><Check size={15} /> Welcome</button><button className="admission-reject" type="button" title="Decline application" onClick={() => updateStatus(item, 'REJECTED')}><X size={15} /></button></> : <button className="admission-view" type="button" onClick={() => notify('Learner profile details are available in the full admissions record.')}>View <ArrowUpRight size={14} /></button>}</div></div>)}{list.length === 0 && <div className="table-empty">No {filter.toLowerCase()} applications right now. Your inbox is breathing.</div>}</div></section>
  </div>;
}

function AttendancePanel({ role, courses, user, notify }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || '');
  const [records, setRecords] = useState([]);
  const activeCourse = courses.find((course) => course._id === selectedCourse);
  const saveAttendance = async () => {
    if (!selectedCourse || records.length === 0) return;
    try {
      await api.post('/attendance', { courseId: selectedCourse, date: new Date().toISOString(), records: records.map(({ id, status }) => ({ studentId: id, status })) });
      notify('Attendance saved.');
    } catch (error) { notify(error?.response?.data?.message || 'Attendance could not be saved.', 'error'); }
  };
  const counts = records.reduce((all, item) => ({ ...all, [item.status]: all[item.status] + 1 }), { PRESENT: 0, ABSENT: 0, LATE: 0 });
  return <div className="dash-panel-page"><PageTitle eyebrow={role === 'TEACHER' ? 'YOUR CLASSROOM' : 'ACADEMY ATTENDANCE'} title="Attendance" subtitle="Record attendance for learners enrolled in your classes." action={<button className="button button-primary" disabled={!activeCourse || records.length === 0} onClick={saveAttendance}><Check size={16} /> Save attendance</button>} />
    <div className="attendance-toolbar"><label className="attendance-course-picker">Class<select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}><option value="">Select a class</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select></label><div className="attendance-date"><CalendarDays size={16} /> {new Intl.DateTimeFormat('en-PK', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div></div>
    {courses.length === 0 ? <div className="favorites-empty"><h2>No classes are available.</h2><p>Classes assigned to your account will appear here.</p></div> : <section className="dashboard-card attendance-card"><div className="attendance-card-head"><div><span className="eyebrow eyebrow-muted">{activeCourse?.title || 'Select a class'}</span><h2>Attendance records</h2></div><span className="attendance-total"><Users size={15} /> {records.length} learners</span></div>{records.length ? <div className="attendance-list">{records.map((student) => <div className="attendance-row" key={student.id}><div className="attendance-student"><Avatar name={student.name} size="sm" /><span><b>{student.name}</b><small>{student.email}</small></span></div><span>{student.status}</span></div>)}</div> : <div className="table-empty">No learner roster is available for this class yet.</div>}</section>}
  </div>;
}
function LearningPanel({ courses, navigate }) {
  const [filter, setFilter] = useState('In progress');
  const completed = courses.filter((course) => course.enrollmentStatus === 'COMPLETED');
  const inProgress = courses.filter((course) => course.enrollmentStatus !== 'COMPLETED');
  const visible = filter === 'Completed' ? completed : inProgress;
  return <div className="dash-panel-page"><PageTitle eyebrow="YOUR COURSES" title="My learning" subtitle="Review your course applications and enrolled classes." action={<button className="button button-primary" onClick={() => navigate('/')}>Explore courses <ArrowUpRight size={15} /></button>} />
    <div className="learning-list-heading"><div><h2>{filter === 'Completed' ? 'Completed courses' : 'Current courses'}</h2><p>Your course and application status.</p></div><div className="learning-list-tabs">{['In progress', 'Completed'].map((tab) => <button key={tab} className={filter === tab ? 'active' : ''} type="button" onClick={() => setFilter(tab)}>{tab}</button>)}</div></div>
    {visible.length ? <div className="learning-course-list">{visible.map((course) => { const pending = course.enrollmentStatus === 'PENDING'; return <article className="learning-course-row" key={course._id}><div className="learning-course-art course-art-mint"><span className="course-art-mark"><BookOpen size={24} /></span></div><div className="learning-course-copy"><span className="learning-course-academy">{course.academyName || 'Academy'}</span><h3>{course.title}</h3><span>{pending ? 'Application pending' : course.enrollmentStatus || 'Enrolled'}</span></div><div className="learning-course-next"><span><CalendarDays size={14} /> Course</span><b>{course.duration || 'Schedule to be confirmed'}</b></div><button className="button button-soft learning-continue" type="button" onClick={() => course.academySlug && navigate('/academy/' + course.academySlug)}>{pending ? 'View academy' : 'Course details'} <ArrowRight size={15} /></button></article>; })}</div> : <div className="favorites-empty"><span className="favorites-empty-icon"><BookOpen size={24} /></span><h2>{filter === 'Completed' ? 'No completed courses yet.' : 'No courses to show yet.'}</h2><p>{filter === 'Completed' ? 'Completed courses will appear here.' : 'Explore the marketplace to find a course that fits your goals.'}</p><button className="button button-primary" onClick={() => navigate('/')}>Explore courses <ArrowRight size={15} /></button></div>}
  </div>;
}
function SchedulePanel({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get('/assignments').then(({ data }) => { if (active) setItems(data.assignments || []); }).catch((error) => {
      if (active) notify(error?.response?.data?.message || 'Your schedule could not be loaded.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);
  return <div className="dash-panel-page"><PageTitle eyebrow="UPCOMING WORK" title="My schedule" subtitle="Assignment due dates and upcoming course work." />{loading ? <div className="table-empty">Loading your schedule?</div> : items.length ? <div className="assignment-list">{items.map((item) => <article className="assignment-row" key={item._id}><div className="assignment-icon assignment-icon-mint"><CalendarDays size={19} /></div><div className="assignment-copy"><span>{item.courseId?.title || 'Course'}</span><h3>{item.title}</h3><small>{item.dueDate ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.dueDate)) : 'Due date not set'}</small></div><StatusPill status={item.status || 'UP NEXT'} /></article>)}</div> : <div className="favorites-empty"><span className="favorites-empty-icon"><CalendarDays size={24} /></span><h2>No upcoming work.</h2><p>Assignment due dates will appear here when they are added to your courses.</p></div>}</div>;
}
function FavoritesPanel({ navigate, notify }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get('/marketplace/favorites').then(({ data }) => {
      if (!active) return;
      const list = (data.favorites || []).map((item) => {
        const academy = item.academyId;
        return { ...academy, _id: String(academy?._id), city: academy?.contactInfo?.city || '', initials: academy?.name?.split(' ').map((part) => part[0]).slice(0, 2).join(''), rating: academy?.averageRating, courseCount: academy?.courseCount, primaryColor: normalizeBrandColor(academy?.primaryColor, '#7450bd'), secondaryColor: normalizeBrandColor(academy?.secondaryColor, '#eee8fa') };
      }).filter((academy) => academy.slug);
      setFavorites(list);
      localStorage.setItem('bowan.favorites', JSON.stringify(list.map((academy) => academy._id)));
    }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Saved academies could not be loaded.', 'error'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);
  const remove = async (academy) => {
    try {
      await api.delete('/marketplace/favorites/' + academy._id, { headers: { 'x-tenant-slug': academy.slug } });
      const next = favorites.filter((item) => item._id !== academy._id);
      setFavorites(next);
      localStorage.setItem('bowan.favorites', JSON.stringify(next.map((item) => item._id)));
      notify('Academy removed from your saved list.');
    } catch (error) { notify(error?.response?.data?.message || 'The saved list could not be updated.', 'error'); }
  };
  return <div className="dash-panel-page"><PageTitle eyebrow="SAVED ACADEMIES" title="Your saved list" subtitle="Academies you?ve bookmarked for later." action={<button className="button button-primary" onClick={() => navigate('/')}>Explore academies <ArrowUpRight size={15} /></button>} />{loading ? <div className="table-empty">Loading saved academies?</div> : favorites.length ? <div className="saved-academy-grid">{favorites.map((academy) => <article className="saved-academy-card" key={academy._id}><button type="button" className="saved-academy-cover" onClick={() => navigate('/academy/' + academy.slug)}><div style={{ background: 'linear-gradient(135deg, ' + academy.secondaryColor + ', var(--surface))' }}><span style={{ color: academy.primaryColor }}>?</span><small>{academy.initials}</small></div></button><div className="saved-academy-body"><span className="saved-academy-city"><MapPin size={13} />{academy.city}</span><h3>{academy.name}</h3><div className="saved-academy-foot"><span>{academy.rating != null ? <><Star size={13} fill="currentColor" />{academy.rating}</> : 'Academy' }{academy.courseCount != null ? ' ? ' + academy.courseCount + ' classes' : ''}</span><button type="button" onClick={() => remove(academy)}><Heart size={15} fill="currentColor" /> Saved</button></div><button className="saved-explore-link" type="button" onClick={() => navigate('/academy/' + academy.slug)}>View academy <ArrowRight size={14} /></button></div></article>)}</div> : <div className="favorites-empty"><span className="favorites-empty-icon"><Heart size={25} /></span><h2>No saved academies yet.</h2><p>Use the bookmark on an academy to save it here.</p><button className="button button-primary" onClick={() => navigate('/')}>Explore academies <ArrowRight size={15} /></button></div>}</div>;
}

function GradesPanel() {
  return <div className="dash-panel-page"><PageTitle eyebrow="COURSE PROGRESS" title="Progress & grades" subtitle="Feedback and completed course progress will appear here." /><div className="favorites-empty"><span className="favorites-empty-icon"><CheckCircle2 size={24} /></span><h2>No progress reports yet.</h2><p>Your instructors? grades and feedback will be available here when shared.</p></div></div>;
}
function AdminAcademiesPanel({ notify }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/tenants').then(({ data }) => {
      if (!active) return;
      setItems((data.academies || []).map((academy) => ({
        ...academy,
        city: academy.contactInfo?.city || '—',
        initials: academy.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
        studentCount: academy.studentCount || 0,
        courseCount: academy.courseCount || 0,
        primaryColor: normalizeBrandColor(academy.primaryColor, '#7450bd'),
        secondaryColor: normalizeBrandColor(academy.secondaryColor, '#eee8fa'),
      })));
    }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Academies could not be loaded.', 'error'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);
  const filtered = items.filter((academy) => `${academy.name} ${academy.city} ${academy.slug}`.toLowerCase().includes(search.toLowerCase()));
  const exportDirectory = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [['Academy', 'Slug', 'City', 'Courses', 'Learners', 'Approval', 'Featured'], ...items.map((academy) => [academy.name, academy.slug, academy.city || academy.contactInfo?.city, academy.courseCount, academy.studentCount, academy.isApproved ? 'Approved' : 'Pending', academy.isFeatured ? 'Yes' : 'No'])];
    const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bowan-academy-directory.csv'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify('Academy directory CSV exported.');
  };
  const toggle = async (academy, field) => {
    const nextValue = !academy[field];
    const previous = items;
    setItems((current) => current.map((item) => item._id === academy._id ? { ...item, [field]: nextValue, ...(field === 'isApproved' && !nextValue ? { isFeatured: false } : {}) } : item));
    {
      setSavingId(academy._id);
      try {
        const action = field === 'isApproved' ? 'approval' : 'featured';
        await api.patch(`/tenants/${academy._id}/${action}`, { [field]: nextValue });
      } catch (error) {
        setItems(previous);
        notify(error?.response?.data?.message || 'Academy listing could not be updated.', 'error');
        return;
      } finally { setSavingId(''); }
    }
    notify(field === 'isApproved' ? nextValue ? `${academy.name} is now approved to grow on Bowan.` : `${academy.name} has been unpublished.` : nextValue ? `${academy.name} is featured on Bowan.` : `${academy.name} is no longer featured.`);
  };
  return <div className="dash-panel-page"><PageTitle eyebrow="THE PEOPLE MAKING LEARNING HAPPEN" title="Academies, all in one place." subtitle="Help the right learners find the right community." action={<button className="button button-outline" type="button" onClick={exportDirectory}><Download size={15} /> Export CSV</button>} /><div className="admin-academy-summary"><div><b>{items.length.toString().padStart(2, '0')}</b><span>academy listings</span></div><div><b>{items.filter((item) => item.isApproved).length.toString().padStart(2, '0')}</b><span>approved to grow</span></div><div><b>{items.filter((item) => !item.isApproved).length.toString().padStart(2, '0')}</b><span>waiting for review</span></div><div><b>{items.filter((item) => item.isFeatured && item.isApproved).length.toString().padStart(2, '0')}</b><span>featured on Bowan</span></div></div><section className="dashboard-card admin-academies-card"><div className="admin-academies-heading"><div><span className="eyebrow eyebrow-muted">THE BOWAN COMMUNITY</span><h2>Academy directory</h2></div><div className="table-search"><Search size={15} /><input placeholder="Find an academy" aria-label="Find an academy" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="admin-academies-list">{filtered.map((academy) => <article className="admin-academy-row" key={academy._id}><div className="admin-academy-monogram" style={{ background: academy.secondaryColor, color: academy.primaryColor }}>{academy.initials}</div><div className="admin-academy-info"><b>{academy.name}</b><small><MapPin size={12} />{academy.city} · {academy.courseCount} classes · {Number(academy.studentCount || 0).toLocaleString()} learners</small></div><StatusPill status={academy.isApproved ? 'Approved' : 'Pending'} /><button className={`featured-toggle ${academy.isFeatured ? 'featured-toggle-active' : ''}`} type="button" disabled={Boolean(savingId) || (!academy.isApproved && !academy.isFeatured)} title={!academy.isApproved && !academy.isFeatured ? 'Approve this academy before featuring it' : undefined} onClick={() => toggle(academy, 'isFeatured')}><Star size={14} fill={academy.isFeatured ? 'currentColor' : 'none'} />{academy.isFeatured ? 'Featured' : 'Feature'}</button><button className={`approval-button ${academy.isApproved ? 'approval-button-approved' : ''}`} type="button" disabled={Boolean(savingId)} onClick={() => toggle(academy, 'isApproved')}>{academy.isApproved ? <><Check size={14} /> Approved</> : <><BadgeCheck size={14} /> Approve</>}</button><Link className="admin-view-link" to={`/academy/${academy.slug}`}>View <ArrowUpRight size={13} /></Link></article>)}{loading ? <div className="table-empty">Loading academy directory…</div> : filtered.length === 0 && <div className="table-empty">No academies match that search.</div>}</div></section></div>;
}
function PlansPanel({ notify }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const emptyForm = { name: '', code: '', priceMonthly: '', maxCourses: '', maxTeachers: '', features: '', isActive: true };
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    let active = true;
    setLoadingPlans(true);
    api.get('/plans/admin').then(({ data }) => { if (active) setPlans(data.plans || []); }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Plans could not be loaded.', 'error'); }).finally(() => { if (active) setLoadingPlans(false); });
    return () => { active = false; };
  }, [notify]);
  const openPlan = (plan = null) => {
    setEditing(plan);
    setForm(plan ? { name: plan.name, code: plan.code, priceMonthly: plan.priceMonthly, maxCourses: plan.maxCourses ?? '', maxTeachers: plan.maxTeachers ?? '', features: (plan.features || []).join(', '), isActive: plan.isActive !== false } : emptyForm);
    setModalOpen(true);
  };
  const savePlan = async (event) => {
    event.preventDefault();
    const payload = { name: form.name.trim(), code: form.code.trim().toUpperCase(), priceMonthly: Number(form.priceMonthly), currency: 'PKR', maxCourses: form.maxCourses === '' ? null : Number(form.maxCourses), maxTeachers: form.maxTeachers === '' ? null : Number(form.maxTeachers), features: form.features.split(',').map((value) => value.trim()).filter(Boolean), isActive: form.isActive };
    setBusy(true);
    let saved;
    try {
      const { data } = editing ? await api.patch(`/plans/${editing._id}`, payload) : await api.post('/plans', payload);
      saved = data.plan;
    } catch (error) { notify(error?.response?.data?.message || 'This plan could not be saved.', 'error'); setBusy(false); return; }
    setPlans((items) => editing ? items.map((item) => item._id === editing._id ? saved : item) : [...items, saved]);
    setBusy(false); setModalOpen(false); setEditing(null); notify(editing ? 'Subscription plan updated.' : 'A new subscription plan is ready.');
  };
  const planTone = (plan, index) => plan.code === 'SEEDLING' ? 'plan-seedling' : plan.code === 'CANOPY' ? 'plan-canopy' : index % 2 ? 'plan-growing' : 'plan-seedling';
  const priceLabel = (plan) => Number(plan.priceMonthly) === 0 ? 'Free' : `Rs ${Number(plan.priceMonthly).toLocaleString('en-PK')}`;
  const activePlanCount = plans.filter((plan) => plan.isActive).length;
  return <div className="dash-panel-page"><PageTitle eyebrow="ROOM TO GROW" title="Plans with room for everyone." subtitle="Shape what academies can access as they grow." action={<button className="button button-primary" onClick={() => openPlan()}><Plus size={15} /> Create a plan</button>} /><div className="subscription-current"><div className="current-plan-icon"><Sparkles size={18} /></div><div><span className="eyebrow eyebrow-muted">PLATFORM PLAN GOVERNANCE</span><b>{loadingPlans ? 'Loading plans…' : `${activePlanCount} active plan${activePlanCount === 1 ? '' : 's'}`}</b><small>Define feature limits and monthly pricing for academy workspaces.</small></div><StatusPill status="Active" /></div><div className="plan-grid">{plans.map((plan, index) => <article className={`plan-card ${planTone(plan, index)} ${!plan.isActive ? 'plan-card-inactive' : ''}`} key={plan._id}><div className="plan-card-top"><span>{plan.name}</span><span className={`plan-current-badge ${plan.isActive ? '' : 'plan-inactive-badge'}`}>{plan.isActive ? 'Active' : 'Archived'}</span></div><h3>{priceLabel(plan)}<small>{Number(plan.priceMonthly) > 0 ? '/ month' : ''}</small></h3><p>{plan.isActive ? 'Available to academy owners' : 'This plan is archived'}</p><div className="plan-divider" /><span className="plan-audience">{plan.maxTeachers == null ? 'Flexible academy team' : `Up to ${plan.maxTeachers} teacher${plan.maxTeachers === 1 ? '' : 's'}`}</span><ul>{(plan.features || []).slice(0, 5).map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><button className="button button-plan-outline" type="button" onClick={() => openPlan(plan)}>Edit plan <ArrowRight size={15} /></button></article>)}</div>{loadingPlans ? <div className="table-empty">Loading subscription plans…</div> : plans.length === 0 && <div className="favorites-empty"><h2>No plans yet.</h2><p>Create the first subscription plan for academy owners.</p></div>}<Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'Create a subscription plan'}><form className="dashboard-form" onSubmit={savePlan}><p className="modal-copy">Set a clear, fair plan for academies using Bowan.</p><div className="form-row"><label>Plan name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Growing" /></label><label>Plan code<input required pattern="[A-Za-z0-9_-]+" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="GROWING" /></label></div><div className="form-row"><label>Monthly price (PKR)<input type="number" min="0" required value={form.priceMonthly} onChange={(event) => setForm({ ...form, priceMonthly: event.target.value })} placeholder="4999" /></label><label>Maximum courses<input type="number" min="0" value={form.maxCourses} onChange={(event) => setForm({ ...form, maxCourses: event.target.value })} placeholder="Leave blank for unlimited" /></label></div><label>Maximum teachers<input type="number" min="0" value={form.maxTeachers} onChange={(event) => setForm({ ...form, maxTeachers: event.target.value })} placeholder="Leave blank for unlimited" /></label><label>Included features<textarea rows="3" value={form.features} onChange={(event) => setForm({ ...form, features: event.target.value })} placeholder="Public academy page, Teacher permissions, Attendance" /></label><label className="plan-active-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Keep this plan available to academies</label><div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save plan' : 'Create plan'} <Check size={15} /></button></div></form></Modal></div>;
}
function FeaturedPanel({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/tenants').then(({ data }) => { if (active) setItems(data.academies || []); }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Academy listings could not be loaded.', 'error'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);
  const toggleFeatured = async (academy) => {
    if (!academy.isApproved) { notify('Approve this academy before adding it to Bowan Picks.', 'error'); return; }
    const nextFeatured = !academy.isFeatured;
    setItems((current) => current.map((item) => item._id === academy._id ? { ...item, isFeatured: nextFeatured } : item));
    {
      setSavingId(academy._id);
      try { const { data } = await api.patch(`/tenants/${academy._id}/featured`, { isFeatured: nextFeatured }); setItems((current) => current.map((item) => item._id === academy._id ? { ...item, ...data.academy } : item)); }
      catch (error) { setItems((current) => current.map((item) => item._id === academy._id ? { ...item, isFeatured: academy.isFeatured } : item)); notify(error?.response?.data?.message || 'That featured listing could not be updated.', 'error'); }
      finally { setSavingId(''); }
    }
  };
  const refresh = async () => {
    setLoading(true);
    try { const { data } = await api.get('/tenants'); setItems(data.academies || []); notify('Academy listings refreshed.'); }
    catch (error) { notify(error?.response?.data?.message || 'Listings could not be refreshed.', 'error'); }
    finally { setLoading(false); }
  };
  const selectedCount = items.filter((item) => item.isFeatured && item.isApproved).length;
  return <div className="dash-panel-page"><PageTitle eyebrow="A LITTLE EXTRA VISIBILITY" title="Put good places in the spotlight." subtitle="Choose approved academies learners meet first in the marketplace." action={<button className="button button-outline" onClick={refresh} disabled={loading}><Activity size={15} /> {loading ? 'Refreshing…' : 'Refresh listings'}</button>} /><div className="featured-preview"><div><span className="eyebrow eyebrow-light">BOWAN PICKS</span><h2>Good places to<br />begin right now.</h2><p>Your featured academies will appear in the marketplace.</p></div><span className="featured-preview-flower">✳</span></div><div className="featured-list-heading"><h2>Choose your Bowan picks.</h2><span>{selectedCount} featured</span></div><div className="featured-academy-list">{items.map((academy) => <article key={academy._id} className="featured-academy-row"><div className="featured-academy-monogram" style={{ background: academy.secondaryColor || '#eee8fa', color: academy.primaryColor || '#7450bd' }}>{academy.initials || academy.name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div className="featured-academy-info"><b>{academy.name}</b><small><MapPin size={12} />{academy.city || academy.contactInfo?.city || 'Location not set'} · {Number(academy.averageRating || academy.rating || 0).toFixed(1)} stars</small></div><StatusPill status={academy.isApproved ? 'Approved' : 'Pending'} /><button type="button" disabled={!academy.isApproved || Boolean(savingId)} title={!academy.isApproved ? 'Approve this academy before featuring it' : ''} className={`feature-select ${academy.isFeatured ? 'feature-selected' : ''}`} onClick={() => toggleFeatured(academy)}>{savingId === academy._id ? 'Saving…' : academy.isFeatured ? <><Check size={14} /> Featured</> : <><Plus size={14} /> Add to picks</>}</button></article>)}{loading && <div className="table-empty">Loading academy listings…</div>}{!loading && items.length === 0 && <div className="table-empty">No academy listings to feature yet.</div>}</div></div>;
}
function SettingsPanel({ academy, setTenant, notify }) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({ name: academy?.name || '', slug: academy?.slug || '', primaryColor: academy?.primaryColor || '#7450bd', secondaryColor: academy?.secondaryColor || '#eee8fa', about: academy?.about || '', logo: academy?.logo || '' });
  useEffect(() => setForm({ name: academy?.name || '', slug: academy?.slug || '', primaryColor: academy?.primaryColor || '#7450bd', secondaryColor: academy?.secondaryColor || '#eee8fa', about: academy?.about || '', logo: academy?.logo || '' }), [academy]);
  const updateField = (key, value) => { const next = { ...form, [key]: value }; setForm(next); if (['primaryColor', 'secondaryColor', 'logo'].includes(key)) setTenant({ ...academy, ...next }); };
  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const payload = new FormData(); payload.append('file', file); payload.append('purpose', 'logo');
      const { data } = await api.post('/uploads', payload, { headers: { 'Content-Type': 'multipart/form-data', ...(academy?.slug ? { 'x-tenant-slug': academy.slug } : {}) } });
      updateField('logo', data.file.url);
      notify('Your academy logo is securely uploaded. Save changes to publish it.');
    } catch (error) { notify(error?.response?.data?.message || 'The logo could not be uploaded. Check Cloudinary setup and try again.', 'error'); }
    finally { setUploadingLogo(false); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault();
    const nextAcademy = { ...academy, ...form };
    try { await api.patch('/tenants/me', form); }
    catch (error) { notify(error?.response?.data?.message || 'Your academy settings could not be saved.', 'error'); return; }
    setTenant(nextAcademy); notify('Your academy’s little corner of Bowan is updated.');
  };
  return <div className="dash-panel-page"><PageTitle eyebrow="MAKE IT FEEL LIKE YOU" title="Your academy, your way." subtitle="A little personality goes a long way. Make this space yours." action={<button className="button button-primary" form="academy-settings-form" type="submit"><Check size={15} /> Save changes</button>} /><div className="settings-layout"><form className="dashboard-card academy-settings-form" id="academy-settings-form" onSubmit={save}><div className="settings-section-head"><span className="settings-section-icon"><Building2 size={18} /></span><div><h2>The basics</h2><p>Help learners know who you are.</p></div></div><label>Academy name<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label><label>Your Bowan address<div className="slug-input"><span>bowan.com/academy/</span><input required pattern="[a-z0-9-]+" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} /></div></label><label>About your academy<textarea rows="4" value={form.about} onChange={(event) => updateField('about', event.target.value)} placeholder="Tell the world what makes learning here special…" /></label><div className="settings-divider" /><div className="settings-section-head"><span className="settings-section-icon settings-section-colors"><Sparkles size={18} /></span><div><h2>Your colors</h2><p>Bring a little of your identity to every page.</p></div></div><div className="color-setting"><div><b>Primary color</b><small>Buttons, links and the little details.</small></div><label className="color-picker-label"><input type="color" value={form.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value)} /><span>{form.primaryColor.toUpperCase()}</span></label></div><div className="color-setting"><div><b>Secondary color</b><small>Soft backgrounds and welcoming spaces.</small></div><label className="color-picker-label"><input type="color" value={form.secondaryColor} onChange={(event) => updateField('secondaryColor', event.target.value)} /><span>{form.secondaryColor.toUpperCase()}</span></label></div><div className="settings-divider" /><div className="settings-section-head"><span className="settings-section-icon settings-section-upload"><CloudUpload size={18} /></span><div><h2>Your academy logo</h2><p>Give your academy a face learners remember.</p></div></div><label className="settings-upload">{uploadingLogo ? <Clock3 size={21} /> : <CloudUpload size={21} />}<span><b>{uploadingLogo ? 'Uploading your logo…' : form.logo ? 'Choose a different logo' : 'Drop in a logo, or browse files'}</b><small>PNG, JPG or WebP · up to 20 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo} onChange={uploadLogo} /></label><div className="form-bottom-actions"><span><LockKeyhole size={14} /> Your changes are saved to this academy only.</span><button className="button button-primary" type="submit">Save changes <ArrowRight size={15} /></button></div></form><div className="settings-preview-column"><span className="eyebrow eyebrow-muted">A LITTLE PREVIEW</span><article className="settings-preview-card" style={{ '--preview-primary': form.primaryColor, '--preview-soft': form.secondaryColor }}><div className="settings-preview-cover"><span className="settings-preview-stars">✳ ✦ ✳</span><div className="settings-preview-logo" style={{ color: form.primaryColor, background: form.secondaryColor }}>{form.logo ? <img src={form.logo} alt={`${form.name} logo`} /> : form.name.split(' ').map((item) => item[0]).slice(0, 2).join('')}</div></div><div className="settings-preview-content"><span className="eyebrow eyebrow-muted">ACADEMY PROFILE</span><h3>{form.name}</h3><p>{form.about || 'A little about your learning community will show up here.'}</p></div></article><div className="settings-tips"><Lightbulb size={17} /><p><b>Little tip</b><br />A clear, warm description helps the right learners find their way to you.</p></div></div></div></div>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tenant, setTenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useToast();
  const role = user?.role || 'STUDENT';
  const tab = location.pathname.split('/')[2] || (role === 'STUDENT' ? 'learning' : 'overview');
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [superAnalytics, setSuperAnalytics] = useState(null);
  const [pendingAcademies, setPendingAcademies] = useState([]);
  const academyFallback = useMemo(() => {
    return { _id: user?.academyId, name: user?.academyName || 'Your academy', slug: user?.academySlug, primaryColor: '#7450bd', secondaryColor: '#eee8fa', initials: user?.academyName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'YA' };
  }, [user?.academyId, user?.academyName, user?.academySlug]);
  const academy = useMemo(() => {
    const current = tenant || academyFallback;
    return {
      ...current,
      primaryColor: normalizeBrandColor(current.primaryColor, '#7450bd'),
      secondaryColor: normalizeBrandColor(current.secondaryColor, '#eee8fa'),
    };
  }, [tenant, academyFallback]);
  const navGroups = navConfig[role] || navConfig.STUDENT;

  useEffect(() => {
    if ((role === 'ACADEMY_OWNER' || role === 'TEACHER') && tenant) setTenant(tenant);
    else if (tenant) setTenant(null);
    if (role === 'STUDENT' && location.pathname === '/dashboard') navigate('/dashboard/learning', { replace: true });
    if (role !== 'STUDENT' && location.pathname === '/dashboard/learning') navigate('/dashboard', { replace: true });
  }, [role, academy, tenant, setTenant, location.pathname, navigate]);

  useEffect(() => {
    if (role !== 'SUPER_ADMIN') { setSuperAnalytics(null); setPendingAcademies([]); return undefined; }
    let active = true;
    api.get('/tenants/admin/overview').then(({ data }) => {
      if (!active) return;
      setSuperAnalytics(data.analytics || null);
      setPendingAcademies(data.pendingAcademies || []);
    }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Platform overview could not be loaded.', 'error'); });
    return () => { active = false; };
  }, [role, notify]);

  useEffect(() => {
    if (['ACADEMY_OWNER', 'TEACHER'].includes(role)) {
      api.get('/courses').then(({ data }) => setCourses(data.courses || [])).catch((error) => notify(error?.response?.data?.message || 'Courses could not be loaded.', 'error'));
      if (role === 'ACADEMY_OWNER') api.get('/teachers').then(({ data }) => setTeachers(data.teachers || [])).catch((error) => notify(error?.response?.data?.message || 'Teachers could not be loaded.', 'error'));
      if (role === 'ACADEMY_OWNER') api.get('/enrollments').then(({ data }) => {
        setEnrollments((data.enrollments || []).map((item) => ({
          ...item,
          studentName: item.studentId?.name || 'Learner',
          studentEmail: item.studentId?.email || '',
          initials: item.studentId?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
          courseTitle: item.courseId?.title || 'Course',
          createdAt: item.appliedAt || item.createdAt,
        })));
      }).catch((error) => notify(error?.response?.data?.message || 'Applications could not be loaded.', 'error'));
    }
    if (role === 'STUDENT') {
      api.get('/enrollments/mine').then(({ data }) => {
        const raw = data.enrollments || [];
        setEnrollments(raw.map((item) => ({
          ...item,
          studentName: user?.name || 'Learner',
          courseTitle: item.courseId?.title || 'Course',
          academyName: item.academyId?.name || 'Academy',
          status: item.status,
          createdAt: item.appliedAt || item.createdAt,
        })));
        setCourses(raw.filter((item) => item.courseId).map((item) => ({
          ...item.courseId,
          _id: item.courseId._id,
          academyId: item.academyId?._id,
          academyName: item.academyId?.name || 'Academy',
          academySlug: item.academyId?.slug,
          academyColor: item.academyId?.primaryColor,
          enrollmentStatus: item.status,
        })));
      }).catch((error) => notify(error?.response?.data?.message || 'Your learning could not be loaded.', 'error'));
    }
  }, [role, user?._id, user?.name, notify]);

  const title = ({ overview: 'Your Bowan workspace', learning: 'My learning', teachers: 'Your teaching team', courses: 'Courses', admissions: 'Admissions', attendance: 'Attendance', assignments: 'Assignments', schedule: 'My schedule', grades: 'Progress & grades', favorites: 'Saved academies', academies: 'Academies', subscriptions: 'Plans & billing', marketplace: 'Featured listings', settings: 'Academy settings' })[tab] || 'Your Bowan workspace';
  const isOwnerOrStaff = role === 'ACADEMY_OWNER' || role === 'TEACHER';
  const currentPanel = () => {
    if (tab === 'overview') return <DashboardOverview role={role} user={user} courses={courses} teachers={teachers} enrollments={enrollments} navigate={navigate} superAnalytics={superAnalytics} pendingAcademies={pendingAcademies} />;
    if (tab === 'learning') return <LearningPanel courses={courses} navigate={navigate} notify={notify} />;
    if (tab === 'teachers' && role === 'ACADEMY_OWNER') return <TeachersPanel teachers={teachers} setTeachers={setTeachers} courses={courses} setCourses={setCourses} user={user} academy={academy} notify={notify} />;
    if (tab === 'courses' && ['ACADEMY_OWNER', 'TEACHER'].includes(role)) return <CoursesPanel courses={courses} setCourses={setCourses} academy={academy} notify={notify} role={role} />;
    if (tab === 'admissions' && role === 'ACADEMY_OWNER') return <AdmissionsPanel enrollments={enrollments} setEnrollments={setEnrollments} notify={notify} />;
    if (tab === 'attendance' && isOwnerOrStaff) return <AttendancePanel role={role} courses={courses} user={user} notify={notify} />;
    if (tab === 'assignments' && ['TEACHER', 'ACADEMY_OWNER', 'STUDENT'].includes(role)) return <AssignmentsPanel role={role} academy={academy} courses={courses} canManage={role === 'ACADEMY_OWNER' || user?.assignedTeacherPermissions?.canManageAssignments === true} />;
    if (tab === 'schedule' && role === 'STUDENT') return <SchedulePanel notify={notify} />;
    if (tab === 'favorites' && role === 'STUDENT') return <FavoritesPanel navigate={navigate} notify={notify} />;
    if (tab === 'grades' && role === 'STUDENT') return <GradesPanel notify={notify} />;
    if (tab === 'academies' && role === 'SUPER_ADMIN') return <AdminAcademiesPanel notify={notify} />;
    if (tab === 'subscriptions' && role === 'SUPER_ADMIN') return <PlansPanel notify={notify} />;
    if (tab === 'marketplace' && role === 'SUPER_ADMIN') return <FeaturedPanel notify={notify} />;
    if (tab === 'settings' && role === 'ACADEMY_OWNER') return <SettingsPanel academy={academy} setTenant={setTenant} notify={notify} />;
    return <DashboardOverview role={role} user={user} courses={courses} teachers={teachers} enrollments={enrollments} navigate={navigate} superAnalytics={superAnalytics} pendingAcademies={pendingAcademies} />;
  };

  return <main className="dashboard-page"><aside className="dashboard-sidebar"><div className="sidebar-academy"><span className="sidebar-academy-mark" style={{ background: academy?.secondaryColor || '#eee8fa', color: academy?.primaryColor || 'var(--primary-color)' }}>{role === 'SUPER_ADMIN' ? <ShieldCheck size={20} /> : academy?.initials || <Brand compact />}</span><span><b>{role === 'SUPER_ADMIN' ? 'Bowan platform' : role === 'STUDENT' ? 'My learning space' : academy?.name || user?.academyName}</b><small>{displayRole[role]} workspace</small></span><ChevronDown size={14} /></div><div className="sidebar-nav-scroll">{navGroups.map((group) => <div className="sidebar-nav-group" key={group.group}><span className="sidebar-group-label">{group.group}</span>{group.items.map(([id, label, Icon, badge]) => <NavLink to={pathFor(id)} key={id} end={id === 'overview'} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{badge && <small className="sidebar-link-badge">{badge}</small>}</NavLink>)}</div>)}</div><div className="sidebar-help"><span className="sidebar-help-icon"><Lightbulb size={17} /></span><div><b>A little help?</b><small>Our team is one hello away.</small><a href="mailto:ahmadrehan20102007@gmail.com">Say hello <ArrowUpRight size={12} /></a></div></div><div className="sidebar-user"><Avatar name={user?.name} initials={user?.initials} size="sm" /><span><b>{user?.name}</b><small>{user?.email}</small></span><button title="Sign out" type="button" onClick={async () => { await logout(); navigate('/'); }}><LogOut size={15} /></button></div></aside>
    <div className="dashboard-main"><div className="dashboard-topbar"><div className="dashboard-crumb"><span>Workspace</span><ChevronRight size={13} /><b>{title}</b></div><div className="dashboard-topbar-actions"><div className="topbar-academy"><span className="topbar-academy-dot" style={{ background: academy?.primaryColor || 'var(--primary-color)' }} />{role === 'STUDENT' ? 'My learning' : role === 'SUPER_ADMIN' ? 'Bowan platform' : academy?.name}</div><Avatar name={user?.name} initials={user?.initials} size="sm" /></div></div><div className="dashboard-content-area">{currentPanel()}</div><div className="dashboard-bottom-note"><span>✳</span> Made with care for every next chapter. <button type="button" onClick={() => navigate('/')}>Back to Bowan <ArrowUpRight size={13} /></button></div></div></main>;
}
