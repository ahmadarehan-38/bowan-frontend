import { Link } from 'react-router-dom';
import { ArrowUpRight, Instagram, Linkedin, Mail } from 'lucide-react';
import { Brand } from './Brand';

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-top">
      <div className="footer-brand"><Link to="/"><Brand /></Link><p>Good learning starts with finding your people.</p><a href="mailto:ahmadrehan20102007@gmail.com" className="footer-email"><Mail size={15} /> ahmadrehan20102007@gmail.com</a></div>
      <div className="footer-column"><span className="footer-heading">Discover</span><Link to="/academies">Academies</Link><Link to="/#course-list">Courses</Link><Link to="/?mode=ONLINE#course-list">Online learning</Link></div>
      <div className="footer-column"><span className="footer-heading">For academies</span><Link to="/for-academies">Grow your academy</Link><Link to="/#how-it-works">How Bowan works</Link><Link to="/contact">Talk to our team</Link></div>
      <div className="footer-note"><span className="footer-note-icon">✳</span><strong>Make space for what’s next.</strong><p>One account. Many possibilities. A little more room to grow.</p><Link to="/register" className="footer-cta">Start exploring <ArrowUpRight size={15} /></Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Bowan Learning Technologies</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div><div className="footer-social"><a aria-label="Instagram" href="https://instagram.com"><Instagram size={16} /></a><a aria-label="LinkedIn" href="https://linkedin.com"><Linkedin size={16} /></a></div></div>
  </footer>;
}
