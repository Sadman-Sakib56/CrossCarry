import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Alert from '../components/Alert';
import { IconBox } from '../components/Icons';

const Register = () => {
  const { user, register } = useAuth();
  const { t, apiError } = useLang();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', acceptedTerms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.acceptedTerms) { setError(t('err.TERMS_REQUIRED')); return; }
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err, 'err.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-container cc-page slim">
      <div className="cc-auth-head">
        <span className="cc-brand-mark"><IconBox /></span>
        <h1 className="cc-h1">{t('register.title')}</h1>
        <p className="cc-sub">{t('register.sub')}</p>
      </div>

      <form onSubmit={handleSubmit} className="cc-card cc-stack">
        <Alert tone="error">{error}</Alert>

        <label className="cc-field">
          <span className="cc-label">{t('form.name')}</span>
          <input className="cc-input" type="text" name="name" autoComplete="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label className="cc-field">
          <span className="cc-label">{t('form.email')}</span>
          <input className="cc-input" type="email" name="email" autoComplete="email" inputMode="email" value={formData.email} onChange={handleChange} required />
        </label>
        <label className="cc-field">
          <span className="cc-label">{t('form.phone')}</span>
          <input className="cc-input" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={formData.phone} onChange={handleChange} required />
        </label>
        <label className="cc-field">
          <span className="cc-label">{t('form.password')}</span>
          <input className="cc-input" type="password" name="password" autoComplete="new-password" minLength={6} value={formData.password} onChange={handleChange} required />
          <span className="cc-hint">{t('register.passwordHint')}</span>
        </label>

        <label className={`cc-check${formData.acceptedTerms ? ' on' : ''}`}>
          <input type="checkbox" name="acceptedTerms" checked={formData.acceptedTerms} onChange={handleChange} />
          <span>{t('register.terms')}</span>
        </label>

        <button type="submit" disabled={loading || !formData.acceptedTerms} className="cc-btn cc-btn-primary block">
          {loading ? t('register.loading') : t('register.submit')}
        </button>

        <p className="cc-small cc-muted cc-center">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="cc-link-btn">{t('register.login')}</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
