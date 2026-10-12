import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { Brand } from '../components/Brand';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [searchParams] = useSearchParams();
  const ownerFlow = searchParams.get('role') === 'owner';
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const notify = useToast();
  const [role, setRole] = useState(ownerFlow ? 'ACADEMY_OWNER' : 'STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', academyName: '', academySlug: '' });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isRegister) {
        const payload = { name: form.name, email: form.email, password: form.password, role };
        if (role === 'ACADEMY_OWNER') {
          payload.academy = { name: form.academyName, slug: form.academySlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') };
        }
        const user = await register(payload);
        notify(role === 'ACADEMY_OWNER' ? 'Your academy workspace is ready for setup.' : 'Welcome to Bowan. Your learning journey starts here.');
        navigate(user.role === 'STUDENT' ? '/dashboard/learning' : '/dashboard', { replace: true });
      } else {
        const user = await login({ email: form.email, password: form.password });
        notify(`Welcome back, ${user.name?.split(' ')[0] || 'friend'}.`);
        navigate(location.state?.from || (user.role === 'STUDENT' ? '/dashboard/learning' : '/dashboard'), { replace: true });
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || (requestError?.code === 'ERR_NETWORK' ? 'Bowan could not connect to the server. Please try again in a moment.' : requestError?.message || 'Please check your details and try again.'));
    } finally { setLoading(false); }
  };

  return <main className="auth-page">
    <div className="auth-left-panel"><Link className="auth-brand" to="/"><Brand /></Link><div className="auth-left-copy"><div className="auth-kicker"><span>✳</span> A LEARNING MARKETPLACE FOR REAL LIFE</div><h1>One good step<br />can change your<br /><em>direction.</em></h1><p>Find a community, a class, a new skill—or just the thing you didn’t know you were looking for.</p><div className="auth-quote"><span className="auth-quote-star">✦</span><p>Make room for what’s next.</p><div><span className="auth-quote-line" /><small>Learning, on your terms</small></div></div></div><div className="auth-left-bottom"><span>Made for every next chapter.</span><span>Karachi · Lahore · Everywhere</span></div><div className="auth-panel-flower auth-panel-flower-one">✳</div><div className="auth-panel-flower auth-panel-flower-two">✦</div></div>
    <div className="auth-right-panel"><div className="auth-right-mobile-brand"><Link to="/"><Brand /></Link></div><div className="auth-card">
      <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to explore</Link>
      <span className="eyebrow eyebrow-muted">{isRegister ? 'MAKE YOURSELF AT HOME' : 'GOOD TO SEE YOU AGAIN'}</span>
      <h2>{isRegister ? 'Let’s get started.' : 'Welcome back.'}</h2>
      <p className="auth-intro">{isRegister ? 'Create one account for all your learning adventures.' : (location.state?.message || 'Pick up right where your curiosity left off.')}</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister && <>
          <label htmlFor="auth-name">Your name</label><div className="input-icon-wrap"><UserRound size={17} /><input id="auth-name" type="text" autoComplete="name" placeholder="Enter your name" value={form.name} onChange={(event) => update('name', event.target.value)} required minLength={2} /></div>
          <label htmlFor="auth-role">I’m here as a</label><div className="input-icon-wrap"><GraduationCap size={17} /><select id="auth-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="STUDENT">Learner</option><option value="ACADEMY_OWNER">Academy owner</option></select></div>
          {role === 'ACADEMY_OWNER' && <div className="academy-register-fields"><label htmlFor="academy-name">Academy name</label><div className="input-icon-wrap"><Sparkles size={17} /><input id="academy-name" placeholder="Enter your academy name" value={form.academyName} onChange={(event) => update('academyName', event.target.value)} required /></div><label htmlFor="academy-slug">Your Bowan page address</label><div className="slug-input"><span>bowan.com/academy/</span><input id="academy-slug" placeholder="your-academy" value={form.academySlug} onChange={(event) => update('academySlug', event.target.value)} required pattern="[a-z0-9-]+" title="Use lowercase letters, numbers, and hyphens." /></div></div>}
        </>}
        <label htmlFor="auth-email">Email address</label><div className="input-icon-wrap"><Mail size={17} /><input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => update('email', event.target.value)} required /></div>
        <label htmlFor="auth-password">Password</label><div className="input-icon-wrap"><LockKeyhole size={17} /><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} required /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {!isRegister && <div className="auth-form-help"><label className="remember-label"><input type="checkbox" /> <span>Remember me</span></label><Link to="/contact">Need sign-in help?</Link></div>}
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'One moment…' : isRegister ? 'Create your account' : 'Log in'} <ArrowRight size={16} /></button>
      </form>
      <div className="auth-switch">{isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to Bowan? <Link to="/register">Create an account <ArrowUpRight size={13} /></Link></>}</div>
      <div className="auth-legal">By continuing, you agree to Bowan’s <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</div>
    </div></div>
  </main>;
}
