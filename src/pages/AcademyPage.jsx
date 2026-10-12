import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, CalendarDays, ChevronRight, Clock3, Globe2, Heart, MapPin, Quote, Star, Users } from 'lucide-react';
import { api } from '../lib/api';
import { normalizeBrandColor } from '../lib/normalizeBrandColor';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { AcademyVisual } from '../components/AcademyVisual';
import { Avatar } from '../components/Brand';

const fee = (value) => value == null ? 'Fees on request' : `Rs ${Number(value).toLocaleString('en-PK')}`;
const readFavorites = () => { try { return JSON.parse(localStorage.getItem('bowan.favorites') || '[]'); } catch { return []; } };

function normalizeAcademy(raw) {
  const city = raw.city || raw.contactInfo?.city || '';
  return { ...raw, city, rating: raw.rating ?? raw.averageRating, area: raw.area || [raw.contactInfo?.area, city].filter(Boolean).join(', '), initials: raw.initials || raw.name?.split(' ').map((word) => word[0]).slice(0, 2).join(''), subjects: raw.subjects || [], courses: raw.courses || [], teacherNames: raw.teacherNames || [], reviews: raw.reviews || [] };
}

export default function AcademyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { tenant, setTenant } = useTenant();
  const { user } = useAuth();
  const notify = useToast();
  const [academy, setAcademy] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAcademy(null);
    setCourses([]);
    setReviews([]);
    setTenant(null);
    api.get('/tenants/resolve', { params: { slug }, timeout: 3500 }).then(({ data }) => {
      if (active && data.academy) {
        const next = normalizeAcademy(data.academy);
        setAcademy(next); setTenant(next); setSaved(readFavorites().includes(String(next._id)));
        api.get('/marketplace/academies/' + next._id + '/reviews').then(({ data: reviewData }) => { if (active) setReviews(reviewData.reviews || []); }).catch((error) => { if (active) notify(error?.response?.data?.message || 'Academy reviews could not be loaded.', 'error'); });
      } else if (active) {
        setTenant(null);
      }
    }).catch((error) => {
      if (active) notify(error?.response?.data?.message || 'This academy could not be loaded. Please try again.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    api.get('/courses', { headers: { 'x-tenant-slug': slug }, timeout: 3500 }).then(({ data }) => {
      if (active) setCourses(data.courses || []);
    }).catch((error) => {
      if (active && error?.response?.status !== 404) notify(error?.response?.data?.message || 'Academy courses could not be loaded.', 'error');
    });
    return () => { active = false; };
  }, [slug, setTenant, notify]);

  const academyCourses = useMemo(() => courses.map((course) => ({ ...course, academySlug: course.academySlug || slug, academyName: course.academyName || academy?.name })), [courses, slug, academy]);

  const saveAcademy = async () => {
    if (!academy) return;
    const id = String(academy._id);
    let items = [];
    try { items = JSON.parse(localStorage.getItem('bowan.favorites') || '[]'); } catch { items = []; }
    const next = saved ? items.filter((item) => item !== id) : [...new Set([...items, id])];
    localStorage.setItem('bowan.favorites', JSON.stringify(next));
    setSaved(!saved);
    if (user?.role === 'STUDENT' && academy._id) {
      try { await api.request({ method: saved ? 'delete' : 'post', url: `/marketplace/favorites/${id}`, headers: { 'x-tenant-slug': slug } }); }
      catch (error) { notify(error?.response?.data?.message || 'Your saved list could not be updated on the server.', 'error'); }
    }
    notify(saved ? 'Removed from your favorites.' : 'Saved to your favorite academies.');
  };

  const handleApply = async (event) => {
    event.preventDefault();
    if (!user) { navigate('/login', { state: { message: 'Sign in as a learner to apply for a course.' } }); return; }
    if (user.role !== 'STUDENT') { notify('Course applications are available to learner accounts.', 'error'); return; }
    setApplying(true);
    try {
      await api.post('/enrollments', { courseId: selectedCourse }, { headers: { 'x-tenant-slug': slug } });
      notify('Your application has been sent. You can track it in your dashboard.');
      setSelectedCourse('');
    } catch (error) {
      notify(error?.response?.data?.message || 'We could not submit your application. Please try again.', 'error');
    } finally { setApplying(false); }
  };

  if (loading) return <main className="academy-not-found content-width" role="status"><h1>Loading academy…</h1></main>;
  if (!academy) return <main className="academy-not-found content-width"><div className="not-found-mark">✳</div><span className="eyebrow eyebrow-muted">ACADEMY UNAVAILABLE</span><h1>We couldn't find that academy.</h1><p>It may have moved, or the link might not be quite right.</p><button className="button button-primary" type="button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back to explore</button></main>;

  const displayCourses = academyCourses;
  const teacherNames = academy.teacherNames || [];


  return <main className="academy-page" style={{ '--academy-primary': normalizeBrandColor(academy.primaryColor, '#7450bd'), '--academy-soft': normalizeBrandColor(academy.secondaryColor, '#eee8fa') }}>
    <section className="academy-hero content-width">
      <div className="academy-breadcrumb"><button type="button" onClick={() => navigate('/')}><ArrowLeft size={14} /> Explore</button><ChevronRight size={13} /><span>{academy.city}</span></div>
      <div className="academy-hero-grid">
        <div className="academy-hero-copy"><div className="academy-verified"><span className="verified-mark"><BadgeCheck size={15} fill="currentColor" /></span> BOWAN VERIFIED ACADEMY</div><h1>{academy.name}</h1><p className="academy-lead">{academy.tagline || academy.about}</p><div className="academy-hero-meta"><span><MapPin size={16} />{academy.area || academy.city}</span>{academy.rating != null && <span><Star size={15} fill="currentColor" />{Number(academy.rating).toFixed(1)} <small>({academy.reviewCount || 0} reviews)</small></span>}</div><div className="academy-hero-actions"><a className="button button-primary" href="#academy-courses">Explore classes <ArrowRight size={16} /></a><button className={`button button-outline ${saved ? 'button-is-saved' : ''}`} type="button" onClick={saveAcademy}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Following' : 'Follow academy'}</button></div><div className="academy-subject-tags">{academy.subjects.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div></div>
        <div className="academy-hero-visual"><AcademyVisual academy={academy} className="academy-storefront-visual"/>{academy.studentCount != null && <div className="academy-hero-stat"><span><b>{Number(academy.studentCount).toLocaleString()}</b> learners</span></div>}<span className="academy-stamp">GOOD<br />THINGS<br /><b>GROW</b></span></div>
      </div>
    </section>

    <div className="academy-info-bar"><div className="content-width academy-info-inner"><div><span className="info-icon"><Users size={17} /></span><span><b>{academy.studentCount != null ? Number(academy.studentCount).toLocaleString() : '?'}</b><small>curious learners</small></span></div><div><span className="info-icon"><BookOpen size={17} /></span><span><b>{academy.courseCount ?? displayCourses.length} programs</b><small>something for every season</small></span></div><div><span className="info-icon"><Globe2 size={17} /></span><span><b>{(academy.deliveryModes || ['HYBRID']).map((mode) => mode.replace('_', ' ').toLowerCase()).join(' · ')}</b><small>learn your way</small></span></div><a href="#academy-courses">Find your class <ArrowRight size={15} /></a></div></div>

    <section className="academy-content content-width" id="academy-courses">
      <div className="academy-course-intro"><div><span className="eyebrow eyebrow-muted">COURSES</span><h2>Classes at {academy.name.split(' ')[0]}.</h2><p>Explore current courses offered by this academy.</p></div><div className="academy-course-count"><strong>{displayCourses.length.toString().padStart(2, '0')}</strong><span>courses</span></div></div>
      <div className="academy-course-list">{displayCourses.map((course, index) => <article className="academy-course-row" key={course._id || course.title}>
        <div className={`academy-course-number course-number-${index % 3}`}>0{index + 1}</div><div className="academy-course-info"><span className="academy-course-category">{course.category || course.subject || 'Learning'}</span><h3>{course.title}</h3><p>{course.description}</p><div className="academy-course-meta">{course.duration && <span><Clock3 size={14} />{course.duration}</span>}{course.nextStart && <span><CalendarDays size={14} />Next start {course.nextStart}</span>}{course.rating != null && <span><Star size={14} fill="currentColor" />{course.rating}</span>}</div></div><div className="academy-course-price"><small>Course fee</small><b>{fee(course.fee)}</b><span>{course.deliveryMode?.replace('_', ' ') || 'HYBRID'}</span></div><button className="button button-outline academy-course-apply" type="button" onClick={() => { setSelectedCourse(course._id); document.getElementById('academy-apply')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>See details <ArrowUpRight size={15} /></button>
      </article>)}</div>
    </section>

    <section className="academy-about-band"><div className="content-width academy-about-grid"><div className="academy-about-kicker"><span className="about-asterisk">✳</span><span className="eyebrow eyebrow-muted">A LITTLE ABOUT US</span></div><div className="academy-about-copy"><h2>More than a class.<br /><em>A place to belong.</em></h2><p>{academy.about || 'More information about this academy will be available soon.'}</p><div className="academy-values"><span>01 / Curious by nature</span><span>02 / Kind by design</span><span>03 / Better, together</span></div></div>{teacherNames.length > 0 && <div className="academy-teachers"><span className="eyebrow eyebrow-muted">ACADEMY TEAM</span><div className="teacher-mini-list">{teacherNames.slice(0, 3).map((name) => <div className="teacher-mini" key={name}><Avatar name={name} size="md" /><div><b>{name}</b></div></div>)}</div></div>}</div></section>

    <section className="academy-reviews content-width"><div className="reviews-heading"><div><span className="eyebrow eyebrow-muted">KIND WORDS, REAL PEOPLE</span><h2>Learning feels better<br />when you’re not alone.</h2></div><div className="reviews-score"><span className="review-big-score">{Number(academy.rating || 4.8).toFixed(1)}</span><span><span className="review-stars">★★★★★</span><small>Based on {academy.reviewCount || 68} learner reviews</small></span></div></div><div className="review-grid">{reviews.map((review) => <article className="review-card" key={review.name}><Quote size={21} className="review-quote" /><p>“{review.text}”</p><div className="review-person"><Avatar name={review.name} initials={review.initials} size="sm" /><div><b>{review.name}</b><small>{review.date} · verified learner</small></div><span className="review-stars">★★★★★</span></div></article>)}</div></section>

    <section className="academy-apply-band" id="academy-apply"><div className="content-width academy-apply-inner"><div><span className="eyebrow eyebrow-light">YOUR NEXT STEP</span><h2>There’s a place for you here.</h2><p>Tell us what you’re curious about. We’ll help you take it from there.</p></div><form className="academy-apply-form" onSubmit={handleApply}><label htmlFor="course-select">I’m interested in</label><select id="course-select" required value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}><option value="">Choose a class</option>{displayCourses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select><button className="button button-white" disabled={applying || !selectedCourse}>{applying ? 'Sending…' : 'Apply for a place'} <ArrowRight size={16} /></button><small>No pressure. Just a first hello.</small></form><div className="academy-apply-flower">✳</div></div></section>
    <div className="academy-bottom-note content-width"><span><MessageCircle size={16} /> Have a question for the academy?</span><a href={`mailto:${academy.contactInfo?.email || 'ahmadrehan20102007@gmail.com'}`}>Start a conversation <ArrowUpRight size={14} /></a></div>
  </main>;
}
