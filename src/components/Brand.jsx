import { BookOpen, Sparkles } from 'lucide-react';

export function Brand({ light = false, compact = false }) {
  return (
    <span className={`brand-lockup ${light ? 'brand-lockup-light' : ''}`}>
      <span className="brand-mark"><BookOpen size={19} strokeWidth={2.2} /><i><Sparkles size={9} fill="currentColor" /></i></span>
      {!compact && <span className="brand-word">bowan<span className="brand-period">.</span></span>}
    </span>
  );
}

export function Avatar({ name = 'Learner', initials, size = 'md', className = '' }) {
  const letters = initials || name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span aria-label={name} className={`avatar avatar-${size} ${className}`}>{letters}</span>;
}
