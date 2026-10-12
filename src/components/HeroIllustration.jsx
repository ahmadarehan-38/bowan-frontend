import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function HeroIllustration() {
  return <div className="hero-art" aria-label="Illustration of a student's learning journey">
    <div className="hero-art-grain" />
    <span className="hero-sun" />
    <span className="hero-star hero-star-a">✳</span><span className="hero-star hero-star-b">✦</span>
    <div className="hero-floating-note"><span className="note-icon"><Sparkles size={14} /></span><div><b>A little progress</b><small>adds up to a lot.</small></div></div>
    <div className="hero-path"><svg viewBox="0 0 430 300" fill="none" aria-hidden="true"><path d="M39 251C111 241 89 159 172 158C254 157 204 78 294 84C354 89 357 126 393 109" stroke="#F6E8B8" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round"/><circle cx="39" cy="251" r="7" fill="#F6E8B8"/><circle cx="393" cy="109" r="7" fill="#F6E8B8"/></svg></div>
    <div className="hero-book-card"><div className="book-card-top"><span className="mini-label">YOUR NEXT CHAPTER</span><span className="book-menu-dots">•••</span></div><div className="book-illustration"><div className="book-page book-page-left"><span /><span /><span /><b>make</b></div><div className="book-page book-page-right"><i>room</i><small>to grow</small></div><span className="book-spine" /></div><div className="book-card-bottom"><div><b>Find your thing.</b><small>Start anywhere.</small></div><span className="book-arrow"><ArrowUpRight size={16} /></span></div></div>
    <span className="hero-doodle hero-doodle-left">✦</span><span className="hero-doodle hero-doodle-right">✳</span>
  </div>;
}
