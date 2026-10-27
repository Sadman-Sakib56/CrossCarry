import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import Alert from '../components/Alert';

const COUNTRIES = [
  'Bangladesh', 'United Kingdom', 'USA', 'Canada', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain',
  'Malaysia', 'Singapore', 'Australia', 'Germany', 'France', 'Italy', 'Japan', 'South Korea', 'India', 'Maldives',
  'Sweden', 'Netherlands', 'Ireland', 'New Zealand',
];
const CATEGORIES = ['document', 'medicine', 'clothes', 'gift', 'other'];

const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const initialState = {
  itemName: '', category: 'document', description: '', weightKg: '',
  pickupCountry: 'Bangladesh', pickupCity: '', destinationCountry: '', destinationCity: '',
  requiredDate: '', offeredFee: '', currency: 'BDT',
  confirmedNotProhibited: false, confirmedVideoRecording: false,
};

const NewRequest = () => {
  const navigate = useNavigate();
  const { t, fmtMoney, apiError } = useLang();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.confirmedNotProhibited || !formData.confirmedVideoRecording) {
      setError(t('err.CHECKBOXES_REQUIRED'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/requests', {
        ...formData,
        weightKg: Number(formData.weightKg),
        offeredFee: Number(formData.offeredFee),
      });
      navigate(`/requests/${res.data._id}`);
    } catch (err) {
      setError(apiError(err, 'err.createFailed'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const fee = Number(formData.offeredFee) || 0;
  const canSubmit = formData.confirmedNotProhibited && formData.confirmedVideoRecording && !loading;

  return (
    <div className="cc-container cc-page narrow">
      <div className="cc-page-head">
        <div>
          <h1 className="cc-h1">{t('new.title')}</h1>
          <p className="cc-sub">{t('new.sub')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="cc-stack">
        <Alert tone="error">{error}</Alert>

        {/* ১. জিনিসের তথ্য */}
        <section className="cc-card cc-stack">
          <h2 className="cc-h2">{t('new.sec.item')}</h2>
          <label className="cc-field">
            <span className="cc-label">{t('new.itemName')}</span>
            <input className="cc-input" name="itemName" value={formData.itemName} onChange={handleChange} required maxLength={120} placeholder={t('new.itemPlaceholder')} />
          </label>
          <div className="cc-form-grid two">
            <label className="cc-field">
              <span className="cc-label">{t('new.category')}</span>
              <select className="cc-select" name="category" value={formData.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
              </select>
            </label>
            <label className="cc-field">
              <span className="cc-label">{t('new.weight')}</span>
              <input className="cc-input" type="number" inputMode="decimal" name="weightKg" value={formData.weightKg} onChange={handleChange} required min="0.1" max="50" step="0.1" />
            </label>
          </div>
          <label className="cc-field">
            <span className="cc-label">{t('new.description')}</span>
            <textarea className="cc-textarea" name="description" value={formData.description} onChange={handleChange} rows={3} maxLength={1000} />
          </label>
        </section>

        {/* ২. কোথা থেকে কোথায় */}
        <section className="cc-card cc-stack">
          <h2 className="cc-h2">{t('new.sec.route')}</h2>
          <div className="cc-form-grid two">
            <label className="cc-field">
              <span className="cc-label">{t('new.pickupCountry')}</span>
              <input className="cc-input" list="cc-countries" name="pickupCountry" value={formData.pickupCountry} onChange={handleChange} required />
            </label>
            <label className="cc-field">
              <span className="cc-label">{t('new.pickupCity')}</span>
              <input className="cc-input" name="pickupCity" value={formData.pickupCity} onChange={handleChange} required />
            </label>
            <label className="cc-field">
              <span className="cc-label">{t('new.destCountry')}</span>
              <input className="cc-input" list="cc-countries" name="destinationCountry" value={formData.destinationCountry} onChange={handleChange} required />
            </label>
            <label className="cc-field">
              <span className="cc-label">{t('new.destCity')}</span>
              <input className="cc-input" name="destinationCity" value={formData.destinationCity} onChange={handleChange} required />
            </label>
          </div>
          <datalist id="cc-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
          <p className="cc-hint">{t('new.routeHint')}</p>
        </section>

        {/* ৩. তারিখ ও ফি */}
        <section className="cc-card cc-stack">
          <h2 className="cc-h2">{t('new.sec.fee')}</h2>
          <label className="cc-field">
            <span className="cc-label">{t('new.date')}</span>
            <input className="cc-input" type="date" name="requiredDate" min={todayStr()} value={formData.requiredDate} onChange={handleChange} required />
          </label>
          <div className="cc-form-grid two">
            <label className="cc-field">
              <span className="cc-label">{t('new.fee')}</span>
              <input className="cc-input" type="number" inputMode="numeric" name="offeredFee" value={formData.offeredFee} onChange={handleChange} required min="1" />
            </label>
            <label className="cc-field">
              <span className="cc-label">{t('new.currency')}</span>
              <select className="cc-select" name="currency" value={formData.currency} onChange={handleChange}>
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </select>
            </label>
          </div>
          {fee > 0 && (
            <Alert tone="info">{t('new.feePreview', { traveller: fmtMoney(Math.round(fee * 70) / 100, formData.currency), total: fmtMoney(fee, formData.currency) })}</Alert>
          )}
        </section>

        {/* ৪. নিরাপত্তা নিশ্চিতকরণ */}
        <section className="cc-card cc-stack">
          <h2 className="cc-h2">{t('new.sec.safety')}</h2>
          <label className={`cc-check${formData.confirmedNotProhibited ? ' on' : ''}`}>
            <input type="checkbox" name="confirmedNotProhibited" checked={formData.confirmedNotProhibited} onChange={handleChange} />
            <span>{t('new.check1')}</span>
          </label>
          <label className={`cc-check${formData.confirmedVideoRecording ? ' on' : ''}`}>
            <input type="checkbox" name="confirmedVideoRecording" checked={formData.confirmedVideoRecording} onChange={handleChange} />
            <span>{t('new.check2')}</span>
          </label>
        </section>

        <div className="cc-row" style={{ gap: 10 }}>
          <Link to="/dashboard" className="cc-btn cc-btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" disabled={!canSubmit} className="cc-btn cc-btn-primary" style={{ flex: 1 }}>
            {loading ? t('new.posting') : t('new.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
