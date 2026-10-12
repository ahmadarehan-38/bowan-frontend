import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, ChevronRight, Clock3, Compass, GraduationCap, MapPin, Search, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import HeroIllustration from '../components/HeroIllustration';
import { AcademyVisual } from '../components/AcademyVisual';

const subjects = ['Everything', 'Design', 'Technology', 'Business', 'Languages', 'Science'];
const allCities = 'All cities';
const cityRegions = [
  { name: 'Punjab', cities: ['Attock', 'Bahawalnagar', 'Bahawalpur', 'Bhakkar', 'Chakwal', 'Chiniot', 'Dera Ghazi Khan', 'Faisalabad', 'Gujranwala', 'Gujrat', 'Hafizabad', 'Jhang', 'Jhelum', 'Kamoke', 'Kasur', 'Khanewal', 'Khushab', 'Lahore', 'Layyah', 'Lodhran', 'Mandi Bahauddin', 'Mian Channu', 'Mianwali', 'Multan', 'Muzaffargarh', 'Murree', 'Nankana Sahib', 'Narowal', 'Okara', 'Pakpattan', 'Rahim Yar Khan', 'Rajanpur', 'Rawalpindi', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Sialkot', 'Talagang', 'Taunsa', 'Toba Tek Singh', 'Vehari', 'Wah Cantonment'] },
  { name: 'Sindh', cities: ['Badin', 'Dadu', 'Ghotki', 'Hyderabad', 'Jacobabad', 'Karachi', 'Kashmore', 'Khairpur', 'Larkana', 'Matiari', 'Mithi', 'Mirpur Khas', 'Naushahro Feroze', 'Nawabshah', 'Qambar', 'Sanghar', 'Shikarpur', 'Sukkur', 'Tando Adam', 'Tando Allahyar', 'Tando Muhammad Khan', 'Thatta', 'Umerkot'] },
  { name: 'Khyber Pakhtunkhwa', cities: ['Abbottabad', 'Alpuri', 'Bannu', 'Batkhela', 'Battagram', 'Charsadda', 'Chitral', 'Dera Ismail Khan', 'Dir', 'Hangu', 'Haripur', 'Khar', 'Kohat', 'Lakki Marwat', 'Landi Kotal', 'Mansehra', 'Mardan', 'Mingora', 'Miranshah', 'Nowshera', 'Parachinar', 'Peshawar', 'Shangla', 'Swabi', 'Swat', 'Tank', 'Timergara', 'Wana'] },
  { name: 'Balochistan', cities: ['Awaran', 'Barkhan', 'Chaman', 'Dera Allah Yar', 'Dera Murad Jamali', 'Duki', 'Gandawa', 'Gwadar', 'Harnai', 'Hub', 'Jiwani', 'Kalat', 'Kharan', 'Khuzdar', 'Loralai', 'Mastung', 'Nushki', 'Panjgur', 'Pasni', 'Pishin', 'Quetta', 'Sibi', 'Turbat', 'Uthal', 'Zhob'] },
  { name: 'Islamabad Capital Territory', cities: ['Islamabad'] },
  { name: 'Azad Jammu and Kashmir', cities: ['Bagh', 'Kotli', 'Mirpur', 'Muzaffarabad', 'Rawalakot'] },
  { name: 'Gilgit-Baltistan', cities: ['Gilgit', 'Ghizer', 'Hunza', 'Skardu'] },
];
const modes = [{ label: 'Any format', value: '' }, { label: 'Online', value: 'ONLINE' }, { label: 'On campus', value: 'ON_CAMPUS' }, { label: 'Hybrid', value: 'HYBRID' }];

function getCityGroups(academies) {
  const regionByCity = new Map(cityRegions.flatMap((region) => region.cities.map((city) => [city.toLowerCase(), region.name])));
  const citiesByRegion = new Map(cityRegions.map((region) => [region.name, new Map(region.cities.map((city) => [city.toLowerCase(), city]))]));
  const regionNames = new Map(cityRegions.map((region) => [region.name.toLowerCase(), region.name]));

  academies.forEach((academy) => {
    const city = academy.city?.trim();
    if (!city) return;
    const rawRegion = academy.province || academy.region || academy.contactInfo?.province || academy.address?.province || '';
    const region = regionByCity.get(city.toLowerCase()) || regionNames.get(rawRegion.trim().toLowerCase()) || 'Other locations';
    if (!citiesByRegion.has(region)) citiesByRegion.set(region, new Map());
    const regionCities = citiesByRegion.get(region);
    if (!regionCities.has(city.toLowerCase())) regionCities.set(city.toLowerCase(), city);
  });

  return [
    ...cityRegions.map((region) => ({ name: region.name, cities: [...citiesByRegion.get(region.name).values()].sort((a, b) => a.localeCompare(b)) })),
    ...(citiesByRegion.has('Other locations') ? [{ name: 'Other locations', cities: [...citiesByRegion.get('Other locations').values()].sort((a, b) => a.localeCompare(b)) }] : []),
  ].filter((region) => region.cities.length);
}

function CityPicker({ value, onChange, academies, id }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef(null);
  const searchRef = useRef(null);
  const cityGroups = useMemo(() => getCityGroups(academies), [academies]);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleGroups = cityGroups.map((region) => ({
    ...region,
    cities: region.cities.filter((city) => city.toLowerCase().includes(normalizedSearch)),
  })).filter((region) => region.cities.length);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectCity = (nextCity) => {
    onChange(nextCity);
    setSearch('');
    setOpen(false);
  };

  return <div className={`city-picker ${open ? 'city-picker-open' : ''}`} ref={pickerRef}>
    <button className="city-picker-trigger" id={id} type="button" aria-label="Choose city" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <MapPin size={18} /><span>{value}</span><ChevronDown size={15} />
    </button>
    {open && <div className="city-picker-menu">
      <label className="city-picker-search"><Search size={16} /><input ref={searchRef} type="search" aria-label="Search cities" placeholder="Search city" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} /></label>
      <div className="city-picker-options" role="listbox" aria-label="Cities by province">
        {allCities.toLowerCase().includes(normalizedSearch) && <button className={`city-picker-option ${value === allCities ? 'city-picker-option-active' : ''}`} type="button" role="option" aria-selected={value === allCities} onClick={() => selectCity(allCities)}>{allCities}</button>}
        {visibleGroups.map((region) => <div className="city-picker-region" key={region.name} role="group" aria-label={region.name}>
          <span className="city-picker-region-name">{region.name}</span>
          {region.cities.map((city) => <button className={`city-picker-option ${value === city ? 'city-picker-option-active' : ''}`} key={city} type="button" role="option" aria-selected={value === city} onClick={() => selectCity(city)}>{city}</button>)}
        </div>)}
        {!allCities.toLowerCase().includes(normalizedSearch) && visibleGroups.length === 0 && <p className="city-picker-empty">No cities found. Try another search.</p>}
      </div>
    </div>}
  </div>;
}

function formatFee(amount) {
  return `Rs ${Number(amount || 0).toLocaleString('en-PK')}`;
}

function normalizeAcademy(raw) {
  const city = raw.city || raw.contactInfo?.city || raw.address?.city || '';
  return {
    ...raw,
    _id: raw._id || raw.id,
    initials: raw.initials || raw.name?.split(' ').map((part) => part[0]).slice(0, 2).join(''),
    city,
    area: raw.area || [raw.contactInfo?.area, city].filter(Boolean).join(', '),
    rating: raw.rating ?? raw.averageRating,
    featured: raw.featured ?? raw.isFeatured ?? false,
    reviewCount: raw.reviewCount || raw.reviewsCount || 0,
    studentCount: raw.studentCount || raw.learnersCount || 0,
    feeFrom: raw.feeFrom ?? raw.startingFee,
    subjects: raw.subjects || [],
    courses: raw.courses || [],
    deliveryModes: raw.deliveryModes || [],
    icon: raw.icon || 'sparkles',
  };
}

function CourseArtwork({ course }) {
  const mark = { mint: '✳', blue: '⌘', peach: '❋', lilac: '✦', yellow: '◈', rose: '⌁' }[course.color] || '✳';
  return <div className={`course-art course-art-${course.color || 'mint'}`}><span className="course-art-mark">{mark}</span><span className="course-art-shape course-art-shape-one" /><span className="course-art-shape course-art-shape-two" /><span className="course-art-caption">{course.category}</span></div>;
}

function AcademyCard({ academy, saved, onSave, onOpen }) {
  return <article className="academy-card">
    <button className="academy-card-image" type="button" onClick={onOpen} aria-label={`Explore ${academy.name}`}><AcademyVisual academy={academy} /><span className="academy-image-badge"><Sparkles size={12} /> {academy.featured ? 'Bowan pick' : 'Great fit'}</span></button>
    <div className="academy-card-content">
      <div className="academy-card-row"><button className="academy-card-title" type="button" onClick={onOpen}>{academy.name}</button><button type="button" aria-label={saved ? 'Remove from favorites' : 'Add to favorites'} className={`save-button ${saved ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); onSave(academy); }}>{saved ? <Bookmark size={17} fill="currentColor" /> : <Bookmark size={17} />}</button></div>
      <div className="academy-location"><MapPin size={13} /> {academy.area || academy.city}</div>
      <p className="academy-tagline">{academy.tagline || academy.about}</p>
      <div className="subject-pills">{academy.subjects.slice(0, 3).map((subject) => <span key={subject}>{subject}</span>)}</div>
      <div className="academy-card-bottom">{academy.rating != null && Number(academy.rating) > 0 && <div className="academy-rating"><Star size={14} fill="currentColor" /><b>{Number(academy.rating).toFixed(1)}</b><span>({academy.reviewCount})</span></div>}<div className="academy-starting">{academy.feeFrom != null ? <>from <b>{formatFee(academy.feeFrom)}</b></> : <b>Fees on request</b>}</div></div>
    </div>
  </article>;
}

function CourseCard({ course, onApply, onAcademy }) {
  return <article className="course-card">
    <button className="course-card-art-button" type="button" onClick={onAcademy} aria-label={`View ${course.title}`}><CourseArtwork course={course} /><span className="course-level">{course.level || 'All levels'}</span></button>
    <div className="course-card-body"><div className="course-academy-line"><span className="course-academy-dot" style={{ background: course.academyColor || 'var(--primary-color)' }} />{course.academyName}</div><button className="course-card-title" type="button" onClick={onAcademy}>{course.title}</button><p>{course.description}</p><div className="course-card-facts"><span><Clock3 size={14} />{course.duration || 'Flexible schedule'}</span>{course.rating != null && <span><Star size={14} fill="currentColor" />{Number(course.rating).toFixed(1)}</span>}</div><div className="course-card-footer"><div><small>Course fee</small><b>{course.fee != null ? formatFee(course.fee) : 'Fees on request'}</b></div><button type="button" className="course-apply-button" onClick={() => onApply(course)}>Explore <ArrowUpRight size={15} /></button></div></div>
  </article>;
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [academies, setAcademies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [city, setCity] = useState(allCities);
  const [subject, setSubject] = useState('Everything');
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('mode') === 'ONLINE' ? 'ONLINE' : '');
  const [maxFee, setMaxFee] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('bowan.favorites') || '[]'); } catch { return []; } });
  const { user } = useAuth();
  const notify = useToast();

  useEffect(() => {
    if (location.pathname === '/academies') {
      requestAnimationFrame(() => document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/marketplace/academies', { timeout: 3500 }),
      api.get('/marketplace/courses', { timeout: 3500 }),
    ]).then((results) => {
      if (!active) return;
      const failures = results.filter((result) => result.status === 'rejected');
      if (results[0].status === 'fulfilled') {
        const data = results[0].value.data;
        setAcademies((data.academies || data.items || []).map(normalizeAcademy));
      }
      if (results[1].status === 'fulfilled') {
        const data = results[1].value.data;
        setCourses(data.courses || data.items || []);
      }
      if (failures.length) notify('Some marketplace listings could not be loaded. Please refresh to try again.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);

  const filterString = submittedQuery.toLowerCase().trim();
  const filteredAcademies = useMemo(() => academies.filter((academy) => {
    const text = [academy.name, academy.city, academy.about, academy.tagline, ...(academy.subjects || [])].join(' ').toLowerCase();
    const matchesText = !filterString || text.includes(filterString);
    const matchesSubject = subject === 'Everything' || academy.subjects?.some((item) => item.toLowerCase().includes(subject.toLowerCase())) || academy.name.toLowerCase().includes(subject.toLowerCase());
    const matchesCity = city === allCities || academy.city?.toLowerCase() === city.toLowerCase();
    const matchesMode = !mode || academy.deliveryModes?.includes(mode);
    const matchesPrice = !maxFee || academy.feeFrom <= Number(maxFee);
    return matchesText && matchesSubject && matchesCity && matchesMode && matchesPrice;
  }), [academies, filterString, subject, city, mode, maxFee]);

  const filteredCourses = useMemo(() => courses.filter((course) => {
    const text = [course.title, course.category, course.academyName, course.description].join(' ').toLowerCase();
    const matchesText = !filterString || text.includes(filterString);
    const matchesSubject = subject === 'Everything' || (course.category || '').toLowerCase().includes(subject.toLowerCase()) || (subject === 'Technology' && ['Data', 'Science'].includes(course.category));
    const matchesCity = city === allCities || academies.find((academy) => academy.slug === course.academySlug)?.city?.toLowerCase() === city.toLowerCase();
    const matchesMode = !mode || course.deliveryMode === mode;
    const matchesPrice = !maxFee || course.fee <= Number(maxFee);
    return matchesText && matchesSubject && matchesCity && matchesMode && matchesPrice;
  }), [courses, filterString, subject, city, mode, maxFee, academies]);

  const submitSearch = (event) => { event?.preventDefault(); setSubmittedQuery(query); document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const toggleFavorite = async (academy) => {
    const id = String(academy._id);
    const removing = favorites.includes(id);
    const next = removing ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('bowan.favorites', JSON.stringify(next));
    if (user?.role === 'STUDENT') {
      try {
        await api.request({ method: removing ? 'delete' : 'post', url: `/marketplace/favorites/${id}`, headers: { 'x-tenant-slug': academy.slug } });
      } catch (error) {
        notify(error?.response?.data?.message || 'Your saved academies could not be synced. Please try again.', 'error');
      }
    }
    notify(removing ? 'Removed from your saved academies.' : `${academy.name} saved to your favorites.`);
  };

  const applyToCourse = async (course) => {
    if (!user) {
      navigate('/login', { state: { from: '/', message: 'Sign in to apply for a course.' } });
      return;
    }
    if (user.role !== 'STUDENT') {
      notify('Course applications are available to learner accounts.', 'error');
      return;
    }
    try {
      await api.post('/enrollments', { courseId: course._id }, { headers: { 'x-tenant-slug': course.academySlug } });
      notify(`Your application for ${course.title} has been sent.`);
    } catch (error) {
      notify(error?.response?.data?.message || 'Your application could not be sent right now.', 'error');
    }
  };

  const openAcademy = (academy) => navigate(`/academy/${academy.slug}`);
  const clearFilters = () => { setQuery(''); setSubmittedQuery(''); setCity(allCities); setSubject('Everything'); setMode(''); setMaxFee(''); };
  const keepExploring = () => {
    setQuery('');
    setSubmittedQuery('');
    setCity(allCities);
    setSubject('Everything');
    setMode('');
    setMaxFee('');
    setShowFilters(false);
    document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToBrowse = () => document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const featured = filteredAcademies.filter((academy) => academy.featured || !filterString).slice(0, 3);
  const visibleAcademies = filteredAcademies.length ? filteredAcademies.slice(0, 6) : [];

  return <main className="marketplace-page">
    <section className="market-hero">
      <div className="market-hero-inner content-width">
        <div className="market-hero-copy">
          <div className="eyebrow"><span className="eyebrow-spark">✳</span> A learning marketplace for real life</div>
          <h1>Find your<br /><span>next chapter.</span></h1>
          <p className="hero-subtitle">Good things happen when you find the right place to learn. Let’s find yours.</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <label className="hero-search-query"><Search size={20} /><input aria-label="Search academies or courses" placeholder="What would you love to learn?" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" aria-label="Clear search" className={`search-clear ${query ? 'search-clear-visible' : ''}`} onClick={() => setQuery('')}><X size={15} /></button></label>
            <span className="hero-search-divider" />
            <div className="hero-search-location"><CityPicker id="hero-city-picker" value={city} onChange={setCity} academies={academies} /></div>
            <button className="hero-search-submit" type="submit" aria-label="Search"><Search size={19} /><span>Find a class</span></button>
          </form>
          <div className="hero-trending"><span>Trending:</span>{['UI Design', 'Python', 'English speaking'].map((item) => <button key={item} type="button" onClick={() => { setQuery(item); setSubmittedQuery(item); }}>{item}</button>)}</div>
          <div className="hero-social-proof"><div><b>Learning looks good on you.</b><span>Discover a class that fits your next chapter.</span></div></div>
        </div>
        <div className="market-hero-art"><HeroIllustration /><div className="hero-art-caption"><span>01 / FIND YOUR SPARK</span><span>Pakistan, and beyond <ArrowUpRight size={13} /></span></div></div>
      </div>
      <div className="hero-scribble hero-scribble-left">✦</div><div className="hero-scribble hero-scribble-right">✳</div>
    </section>

    <section className="market-proof content-width" aria-label="Bowan marketplace highlights">
      <div className="proof-item"><span className="proof-icon proof-icon-green"><Compass size={19} /></span><div><b>One good place to start</b><small>Thoughtful academies, all together</small></div></div>
      <div className="proof-item"><span className="proof-icon proof-icon-peach"><GraduationCap size={19} /></span><div><b>Learning for every season</b><small>From first steps to fresh starts</small></div></div>
      <div className="proof-item"><span className="proof-icon proof-icon-lilac"><Check size={19} /></span><div><b>People you can trust</b><small>Real reviews from real learners</small></div></div>
      <div className="proof-note"><span>✳</span> Curiosity looks good on you.</div>
    </section>

    <section className="how-it-works content-width" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-heading">
        <span className="eyebrow eyebrow-muted">A SIMPLE WAY TO BEGIN</span>
        <h2 id="how-it-works-title">From curious to confident, one step at a time.</h2>
        <p>Bowan brings discovery, comparison, and a direct connection to your next learning experience into one simple journey.</p>
      </div>
      <div className="how-it-works-steps">
        <article className="how-it-works-step"><span className="how-it-works-number">01</span><span className="how-it-works-icon"><Search size={20} /></span><h3>Discover your direction</h3><p>Search by subject or city, explore online and in-person classes, and save academies that catch your eye.</p></article>
        <article className="how-it-works-step"><span className="how-it-works-number">02</span><span className="how-it-works-icon"><Compass size={20} /></span><h3>Compare what matters</h3><p>Get to know each academy, compare course details and learning formats, and read learner reviews.</p></article>
        <article className="how-it-works-step"><span className="how-it-works-number">03</span><span className="how-it-works-icon"><ArrowUpRight size={20} /></span><h3>Connect with your pick</h3><p>Choose a course and send your application. The academy can follow up with the next steps.</p></article>
      </div>
      <div className="how-it-works-followup"><span className="how-it-works-icon"><GraduationCap size={20} /></span><div><b>Then make it yours.</b><p>Track applications and keep your learning journey organized from your Bowan dashboard.</p></div><button className="text-link" type="button" onClick={() => navigate('/register')}>Create your account <ArrowRight size={15} /></button></div>
      <button className="how-it-works-cta" type="button" onClick={scrollToBrowse}>Keep exploring <ArrowRight size={16} /></button>
    </section>

    <section className="team-contact content-width" id="talk-to-our-team" aria-labelledby="team-contact-title">
      <div><span className="eyebrow eyebrow-muted">A REAL PERSON, JUST A HELLO AWAY</span><h2 id="team-contact-title">Questions about your next step?</h2><p>Whether you’re looking for a place to learn or growing an academy, we’d love to hear from you.</p></div>
      <a className="button button-primary" href="mailto:ahmadrehan20102007@gmail.com">Talk to our team <ArrowUpRight size={16} /></a>
      <a className="team-contact-email" href="mailto:ahmadrehan20102007@gmail.com">ahmadrehan20102007@gmail.com</a>
    </section>

    <section className="browse-section content-width" id="browse-results">
      <div className="section-heading browse-heading"><div><div className="eyebrow eyebrow-muted">YOUR NEXT GOOD THING</div><h2>Explore a little.</h2><p>Follow what makes you curious. We’ll help with the rest.</p></div><button className={`filter-toggle ${showFilters ? 'filter-toggle-active' : ''}`} type="button" onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={16} /> Filters {(city !== 'All cities' || mode || maxFee) && <span className="filter-count">{[city !== 'All cities', !!mode, !!maxFee].filter(Boolean).length}</span>}</button></div>
      <div className="subject-toolbar"><div className="subject-tabs" role="tablist" aria-label="Filter by subject">{subjects.map((item) => <button key={item} type="button" role="tab" aria-selected={subject === item} className={`subject-tab ${subject === item ? 'subject-tab-active' : ''}`} onClick={() => setSubject(item)}>{item}</button>)}</div><span className="result-count">{filteredAcademies.length + filteredCourses.length} places to begin</span></div>
      {showFilters && <div className="filter-panel"><div className="filter-field"><label htmlFor="mode-select">Learning format</label><select id="mode-select" value={mode} onChange={(event) => setMode(event.target.value)}>{modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="filter-field"><label htmlFor="fee-select">Maximum course fee</label><select id="fee-select" value={maxFee} onChange={(event) => setMaxFee(event.target.value)}><option value="">Any fee</option><option value="10000">Up to Rs 10,000</option><option value="15000">Up to Rs 15,000</option><option value="25000">Up to Rs 25,000</option></select></div><div className="filter-field"><label htmlFor="filter-city-picker">City</label><CityPicker id="filter-city-picker" value={city} onChange={setCity} academies={academies} /></div><button type="button" className="clear-filters" onClick={clearFilters}>Clear all</button><button type="button" className="close-filter" aria-label="Close filters" onClick={() => setShowFilters(false)}><X size={17} /></button></div>}

      <div className="browse-subheading"><div><h3>Academies worth knowing</h3><span>Thoughtful people. Lovely places to learn.</span></div><button className="text-link" type="button" onClick={() => { setSubject('Everything'); setCity(allCities); document.querySelector('.academy-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>See all academies <ArrowRight size={16} /></button></div>
      {loading ? <div className="empty-results" role="status"><h3>Loading academies…</h3></div> : visibleAcademies.length ? <div className="academy-grid">{visibleAcademies.map((academy, index) => <AcademyCard key={academy._id || academy.slug || index} academy={academy} saved={favorites.includes(String(academy._id))} onSave={toggleFavorite} onOpen={() => openAcademy(academy)} />)}</div> : <div className="empty-results"><span className="empty-results-icon"><Search size={22} /></span><h3>{filteredAcademies.length ? 'No academies match these filters.' : 'No academies are listed yet.'}</h3><p>{filteredAcademies.length ? 'Try broadening your search or clearing your filters.' : 'Please check back soon as new academies join Bowan.'}</p>{filteredAcademies.length > 0 && <button className="button button-primary" type="button" onClick={clearFilters}>Clear filters</button>}</div>}
      {visibleAcademies.length > 0 && <div className="academy-grid-footer"><span><span className="dot-indicator" /> {filteredAcademies.length} lovely places to learn</span><button className="button button-soft" type="button" onClick={() => navigate('/register')}>List your academy <ArrowUpRight size={15} /></button></div>}

      <div className="course-section-heading" id="course-list"><div className="browse-subheading"><div><h3>Classes to get excited about</h3><span>Small steps can take you somewhere lovely.</span></div><button className="text-link" type="button" onClick={() => setSubject('Everything')}>Browse all courses <ArrowRight size={16} /></button></div></div>
      {loading ? <div className="course-empty" role="status">Loading courses…</div> : filteredCourses.length ? <div className="course-grid">{filteredCourses.slice(0, 3).map((course) => <CourseCard key={course._id} course={course} onApply={applyToCourse} onAcademy={() => navigate(`/academy/${course.academySlug}`)} />)}</div> : <div className="course-empty">No courses are listed yet. Please check back soon.</div>}
      <div className="more-courses"><div><span className="more-course-icon"><Sparkles size={17} /></span><span><b>A good class can change your direction.</b><small>There’s always room to try something new.</small></span></div><button type="button" onClick={keepExploring}>Keep exploring <ArrowRight size={16} /></button></div>
    </section>

    <section className="academy-cta"><div className="academy-cta-inner content-width"><div className="cta-flower">✳</div><div><span className="eyebrow eyebrow-light">FOR PEOPLE WHO TEACH</span><h2>Good learning deserves<br />a good home.</h2><p>Bring your academy to a marketplace made for the way people learn today.</p></div><div className="cta-action"><button type="button" className="button button-white" onClick={() => navigate('/register?role=owner')}>Bring your academy to Bowan <ArrowUpRight size={16} /></button><span>Free to get started · Made for growing academies</span></div><div className="cta-orb" /></div></section>
  </main>;
}
