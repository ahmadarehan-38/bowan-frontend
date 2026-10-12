import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, CloudUpload, FileText, ListChecks, Plus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './ToastContext';
import Modal from './Modal';

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="dash-page-title"><div><span className="eyebrow eyebrow-muted">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function formatDue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Due date to be confirmed';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const dateLabel = new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  return sameDay ? `Today · ${new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(date)}` : dateLabel;
}

function normalizeAssignment(item, role, userId) {
  const courseName = typeof item.courseId === 'object' ? item.courseId?.title : item.course || 'Class assignment';
  const submission = item.submissions?.find((entry) => String(entry.studentId?._id || entry.studentId) === String(userId));
  const dueDate = item.dueDate || item.due;
  const overdue = dueDate && new Date(dueDate) < new Date();
  const status = role === 'STUDENT' ? (submission ? 'SUBMITTED' : overdue ? 'PAST DUE' : new Date(dueDate).toDateString() === new Date().toDateString() ? 'DUE TODAY' : 'UP NEXT') : `${item.submissions?.length || 0} SUBMISSIONS`;
  return { ...item, course: courseName, dueDate, due: formatDue(dueDate), status, submission };
}

export default function AssignmentsPanel({ role, academy, courses = [], canManage = false }) {
  const notify = useToast();
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState('All work');
  const [uploadItem, setUploadItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', courseId: courses[0]?._id || '', dueDate: '', description: '' });
  const isStudent = role === 'STUDENT';

  useEffect(() => {
    let active = true;
    api.get('/assignments', { headers: academy?.slug ? { 'x-tenant-slug': academy.slug } : {} }).then(({ data }) => {
      if (active && Array.isArray(data.assignments)) setAssignments(data.assignments.map((item) => normalizeAssignment(item, role, JSON.parse(localStorage.getItem('bowan.session') || '{}')?.user?._id)));
    }).catch((error) => {
      if (active && error?.response?.status && error.response.status !== 404) notify(error?.response?.data?.message || 'Assignments could not be loaded.', 'error');
    });
    return () => { active = false; };
  }, [role, academy?.slug]);

  useEffect(() => {
    if (!form.courseId && courses[0]?._id) setForm((current) => ({ ...current, courseId: courses[0]._id }));
  }, [courses, form.courseId]);

  const visible = useMemo(() => selected === 'All work' ? assignments : assignments.filter((item) => ['DUE TODAY', 'PAST DUE'].includes(item.status)), [assignments, selected]);
  const dueToday = assignments.filter((item) => item.status === 'DUE TODAY').length;
  const inProgress = assignments.filter((item) => ['IN PROGRESS', 'UP NEXT'].includes(item.status)).length;
  const submitted = assignments.filter((item) => item.status === 'SUBMITTED').length;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !uploadItem) return;
    setBusy(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('purpose', 'assignment');
      const headers = academy?.slug ? { 'x-tenant-slug': academy.slug } : {};
      const uploadResponse = await api.post('/uploads', payload, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      await api.post(`/assignments/${uploadItem._id}/submissions`, { fileUrl: uploadResponse.data.file.url }, { headers });
      setAssignments((items) => items.map((item) => item._id === uploadItem._id ? { ...item, status: 'SUBMITTED', submission: { fileUrl: uploadResponse.data.file.url } } : item));
      notify('Your work is uploaded and submitted securely. Nice job showing up.');
      setUploadItem(null);
    } catch (error) {
      notify(error?.response?.data?.message || 'Your work could not be uploaded. Check the file and try again.', 'error');
    } finally { setBusy(false); event.target.value = ''; }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    const course = courses.find((item) => String(item._id) === String(form.courseId));
    setBusy(true);
    let newAssignment;
    try {
      const headers = academy?.slug ? { 'x-tenant-slug': academy.slug } : {};
      const { data } = await api.post('/assignments', { ...form, dueDate: new Date(form.dueDate).toISOString() }, { headers });
      newAssignment = normalizeAssignment(data.assignment, role);
    } catch (error) {
      notify(error?.response?.data?.message || 'The assignment could not be created.', 'error');
      setBusy(false);
      return;
    }
    setBusy(false);
    setAssignments((items) => [newAssignment, ...items]);
    setCreateOpen(false);
    setForm({ title: '', courseId: courses[0]?._id || '', dueDate: '', description: '' });
    notify('Assignment added. Your learners will see it in their workspace.');
  };

  const itemAction = (item) => {
    if (isStudent && item.status !== 'SUBMITTED') setUploadItem(item);
    else if (isStudent) notify('Your work has been submitted. Your teacher will share feedback here.');
    else notify(`${item.submissions?.length || 0} learner submissions for ${item.title}.`);
  };

  const title = isStudent ? 'A few things you’re making.' : 'A little structure for big ideas.';
  const subtitle = isStudent ? 'Every assignment is a chance to practice, not to be perfect.' : 'Give your learners a thoughtful prompt and room to make it their own.';
  const canCreate = !isStudent && canManage;

  return <div className="dash-panel-page">
    <PageTitle eyebrow="WORK IN PROGRESS IS GOOD WORK" title={title} subtitle={subtitle} action={canCreate ? <button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Create assignment</button> : <button className="button button-outline" onClick={() => notify('Showing every assignment for this term.')}><ListChecks size={15} /> My assignments</button>} />
    <div className="assignment-summary"><div><span className="assignment-summary-icon"><Clock3 size={19} /></span><span><small>Due today</small><b>{String(dueToday).padStart(2, '0')}</b><small>Assignments due today</small></span></div><div><span className="assignment-summary-icon assignment-summary-purple"><ListChecks size={19} /></span><span><small>{isStudent ? 'Up next' : 'Learner submissions'}</small><b>{String(isStudent ? inProgress : assignments.reduce((sum, item) => sum + (item.submissions?.length || 0), 0)).padStart(2, '0')}</b><small>{isStudent ? 'Upcoming assignments' : 'Submissions to review'}</small></span></div><div><span className="assignment-summary-icon assignment-summary-green"><Check size={19} /></span><span><small>{isStudent ? 'Submitted' : 'Classes with work'}</small><b>{String(isStudent ? submitted : courses.length).padStart(2, '0')}</b><small>{isStudent ? 'Work submitted' : 'Classes with assignments'}</small></span></div></div>
    <div className="learning-list-heading"><div><h2>{isStudent ? 'Your assignments' : 'Classroom assignments'}</h2><p>{isStudent ? 'Show yourself what you can do.' : 'Prompts your learners are working through.'}</p></div><div className="learning-list-tabs">{['All work', 'Due soon'].map((tab) => <button key={tab} className={selected === tab ? 'active' : ''} type="button" onClick={() => setSelected(tab)}>{tab}</button>)}</div></div>
    <div className="assignment-list">{visible.map((item) => <article className="assignment-row" key={item._id}><div className={`assignment-icon assignment-icon-${item.color || 'mint'}`}><FileText size={19} /></div><div className="assignment-copy"><span>{item.course}</span><h3>{item.title}</h3><small><CalendarDays size={13} />{item.due}</small></div><span className={`assignment-status assignment-status-${item.status.toLowerCase().replaceAll(' ', '-')}`}><i />{item.status}</span><button className="button button-soft" type="button" onClick={() => itemAction(item)}>{isStudent ? item.status === 'SUBMITTED' ? 'See feedback' : 'Submit your work' : 'View submissions'} <ArrowRight size={14} /></button></article>)}{visible.length === 0 && <div className="table-empty">{assignments.length ? 'No assignments match this filter.' : 'No assignments have been added yet.'}</div>}</div>

    <Modal open={Boolean(uploadItem)} onClose={() => !busy && setUploadItem(null)} title="Submit your work"><div className="assignment-modal-copy"><span className="assignment-modal-icon"><FileText size={22} /></span><h3>{uploadItem?.title}</h3><p>{uploadItem?.course} · {uploadItem?.due}</p><p>Upload your completed work when you’re ready.</p><label className="upload-drop-zone"><CloudUpload size={25} /><b>{busy ? 'Uploading your work…' : 'Choose your work to upload'}</b><span>PDF, image, or document · up to 20 MB</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xlsx" disabled={busy} onChange={handleFile} /></label></div></Modal>
    <Modal open={createOpen} onClose={() => !busy && setCreateOpen(false)} title="Create a thoughtful assignment"><form className="dashboard-form" onSubmit={createAssignment}><p className="modal-copy">Give learners something interesting to explore.</p><label>Assignment title<input required minLength={3} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Design a calmer morning" /></label><div className="form-row"><label>Class<select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select></label><label>Due date<input required type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label></div><label>What should learners know?<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A little context or guidance…" /></label><div className="form-note"><Users size={14} /> Only enrolled learners in this class can view or submit.</div><div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create assignment'} <ArrowRight size={15} /></button></div></form></Modal>
  </div>;
}
