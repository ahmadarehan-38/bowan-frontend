import { Atom, BookOpen, Camera, Code2, Flower2, Music2, Palette, Sparkles } from 'lucide-react';
import { normalizeBrandColor } from '../lib/normalizeBrandColor';

const iconMap = { sparkles: Sparkles, orbit: Code2, flower: Flower2, door: BookOpen, atom: Atom, music: Music2, design: Palette, layers: BookOpen, code: Code2, camera: Camera };

export function AcademyVisual({ academy, className = '' }) {
  const Icon = iconMap[academy?.icon] || Sparkles;
  return (
    <div className={`academy-visual visual-${academy?.icon || 'sparkles'} ${className}`} style={{ '--visual-primary': normalizeBrandColor(academy?.primaryColor, '#7450bd'), '--visual-soft': normalizeBrandColor(academy?.accent, '#eee8fa') }}>
      <div className="visual-grid" />
      <span className="visual-orb visual-orb-one" />
      <span className="visual-orb visual-orb-two" />
      <span className="visual-spark visual-spark-one">✳</span>
      <span className="visual-spark visual-spark-two">✦</span>
      <div className="visual-object"><Icon size={44} strokeWidth={1.45} /></div>
      <div className="visual-label"><span className="visual-monogram">{academy?.initials || 'BA'}</span><span>curiosity looks good on you</span></div>
    </div>
  );
}
