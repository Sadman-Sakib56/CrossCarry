import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Alert from '../components/Alert';
import { IconBox } from '../components/Icons';

// শুধু development এ দেখায় (production build এ এই box আসবে না)
const DEMO = [
  { label: 'Admin', email: 'admin@crosscarry.com' },
  { label: 'Sender', email: 'sender1@crosscarry.com' },
  { label: 'Traveller', email: 'traveller1@crosscarry.com' },
];

const Login = () => {
  const { user, login } = useAuth();
  const { t, apiError } = useLang();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // আগে থেকেই login করা থাকলে এই page এর দরকার নেই
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(formData.email, formData.password);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard'); // admin সরাসরি নিজের panel এ
    } catch (err) {
      setError(apiError(err, 'err.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-container cc-page slim">
      <div className="cc-auth-head">
        <span className="cc-brand-mark"><IconBox /></span>
        <h1 className="cc-h1">{t('login.title')}</h1>
        <p className="cc-sub">{t('login.sub')}</p>
      </div>

      <form onSubmit={handleSubmit} className="cc-card cc-stack">
        <Alert tone="error">{error}</Alert>

        <label className="cc-field">
          <span className="cc-label">{t('form.email')}</span>
          <input className="cc-input" type="email" name="email" autoComplete="email" inputMode="email" value={formData.email} onChange={handleChange} required />
        </label>

        <label className="cc-field">
          <span className="cc-label">{t('form.password')}</span>
          <input className="cc-input" type="password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} required />
        </label>

        <button type="submit" disabled={loading} className="cc-btn cc-btn-primary block">
          {loading ? t('login.loading') : t('login.submit')}
        </button>

        <p className="cc-small cc-muted cc-center">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="cc-link-btn">{t('login.register')}</Link>
        </p>
      </form>

      {import.meta.env.DEV && (
        <div className="cc-demo">
          <b>Dev only</b> · password: <code>password123</code>
          <div className="cc-demo-btns">
            {DEMO.map((d) => (
              <button key={d.email} type="button" className="cc-btn cc-btn-secondary sm" onClick={() => setFormData({ email: d.email, password: 'password123' })}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
