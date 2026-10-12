import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Compass, LogOut, Menu, Moon, Settings, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Brand, Avatar } from './Brand';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [location.pathname, location.hash]);

  const goDashboard = () => navigate(user?.role === 'STUDENT' ? '/dashboard/learning' : '/dashboard');
  const links = [
    { to: '/', label: 'Explore' },
    { to: '/academies', label: 'Academies' },
    { to: '/#how-it-works', label: 'How it works' },
  ];

  const signOut = async () => { await logout(); setProfileOpen(false); navigate('/'); };
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link to="/" className="brand-link" aria-label="Bowan home"><Brand /></Link>
        <nav className={`primary-nav ${open ? 'primary-nav-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => {
            const isActive = link.to === '/'
              ? location.pathname === '/' && !location.hash
              : link.to === '/academies'
                ? location.pathname === '/academies'
                : location.hash === '#how-it-works';
            return <Link key={link.label} to={link.to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => { setOpen(false); if (link.to === '/#how-it-works' && location.pathname === '/' && location.hash === '#how-it-works') document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{link.label}</Link>;
          })}
          <Link className="nav-link mobile-nav-link" to="/for-academies" onClick={() => setOpen(false)}>For academies <ArrowUpRight size={14} /></Link>
          <Link className="nav-link mobile-nav-link mobile-login-link" to="/login" onClick={() => setOpen(false)}>Log in</Link>
        </nav>
        <div className="nav-actions">
          <Link className="nav-for-academies" to="/for-academies">For academies <ArrowUpRight size={14} /></Link>
          <div className="appearance-settings">
            <button className="appearance-trigger" type="button" aria-label="Appearance settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((value) => !value)}><Settings size={18} /></button>
            {settingsOpen && <div className="appearance-menu" role="group" aria-label="Choose appearance"><strong>Appearance</strong><span>Choose a theme for Bowan</span><div className="appearance-options"><button type="button" className={theme === 'light' ? 'appearance-option-active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={15} /> Light</button><button type="button" className={theme === 'dark' ? 'appearance-option-active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={15} /> Dark</button></div></div>}
          </div>
          {user ? (
            <div className="profile-wrap">
              <button className="profile-trigger" type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
                <Avatar name={user.name} initials={user.initials} size="sm" />
                <span className="profile-name">{user.name?.split(' ')[0]}</span><ChevronDown size={15} className={profileOpen ? 'rotate-180' : ''} />
              </button>
              {profileOpen && <div className="profile-menu">
                <div className="profile-menu-user"><Avatar name={user.name} initials={user.initials} /><div><strong>{user.name}</strong><small>{user.role?.replaceAll('_', ' ').toLowerCase()}</small></div></div>
                <button type="button" className="profile-menu-link" onClick={() => { setProfileOpen(false); goDashboard(); }}><Compass size={16} /> Open dashboard</button>
                <button type="button" className="profile-menu-link profile-logout" onClick={signOut}><LogOut size={16} /> Sign out</button>
              </div>}
            </div>
          ) : <>
            <Link className="nav-login" to="/login">Log in</Link>
            <Link className="button button-nav" to="/register">Get started <ArrowUpRight size={15} /></Link>
          </>}
          <button className="mobile-menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
  );
}
