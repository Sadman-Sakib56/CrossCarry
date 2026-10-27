import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Alert from '../components/Alert';
import SecureImage from '../components/SecureImage';
import { IconLogout } from '../components/Icons';

const TONE = { not_submitted: 'gray', pending: 'amber', approved: 'green', rejected: 'red' };

const Profile = () => {
  const { user, refreshUser, logout } = useAuth();
  const { t, apiError } = useLang();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imgVersion, setImgVersion] = useState(0);

  // preview এর object URL পরিষ্কার করা হচ্ছে, যাতে memory leak না হয়
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const isAdmin = user?.role === 'admin';
  const status = user?.verificationStatus || 'not_submitted';

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
    setSuccess('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError(t('profile.pickFirst')); return; }
    const formData = new FormData();
    formData.append('passportImage', file);

    setUploading(true);
    setError('');
    try {
      await api.post('/users/passport', formData);
      setSuccess(t('profile.uploaded'));
      setFile(null);
      setPreview(null);
      setImgVersion((v) => v + 1);
      await refreshUser();
    } catch (err) {
      setError(apiError(err, 'err.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="cc-container cc-page narrow">
      <div className="cc-page-head"><h1 className="cc-h1">{t('profile.title')}</h1></div>

      <div className="cc-stack">
        <section className="cc-card">
          <div className="cc-person" style={{ marginBottom: 18 }}>
            <span className="cc-avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{user?.name?.[0]?.toUpperCase()}</span>
            <div><b style={{ fontSize: '1.1rem' }}>{user?.name}</b><span className="cc-badge nodot tone-teal">{isAdmin ? t('profile.admin') : t('profile.member')}</span></div>
          </div>
          <div className="cc-facts">
            <div className="cc-fact"><small>{t('form.email')}</small><b>{user?.email}</b></div>
            <div className="cc-fact"><small>{t('form.phone')}</small><b>{user?.phone}</b></div>
          </div>
        </section>

        {/* Admin কে traveller হতে হয় না, তাই verification শুধু সাধারণ user এর জন্য */}
        {!isAdmin && (
          <section className="cc-card cc-stack">
            <div className="cc-row cc-between">
              <h2 className="cc-h2">{t('profile.verifyTitle')}</h2>
              <span className={`cc-badge tone-${TONE[status]}`}>{t(`verify.${status}`)}</span>
            </div>
            <p className="cc-muted cc-small">{t('profile.verifyText')}</p>

            {status === 'rejected' && user?.rejectionReason && (
              <Alert tone="error"><b>{t('profile.reason')}:</b> {user.rejectionReason}</Alert>
            )}
            <Alert tone="error">{error}</Alert>
            <Alert tone="success">{success}</Alert>

            {status === 'approved' ? (
              <Alert tone="success">{t('profile.approvedNote')}</Alert>
            ) : (
              <>
                {user?.passportImage && !preview && (
                  <div>
                    <p className="cc-hint" style={{ marginTop: 0, marginBottom: 8 }}>{t('profile.current')}</p>
                    <SecureImage key={imgVersion} userId={user.id || user._id} alt="Passport" version={imgVersion} />
                  </div>
                )}

                <form onSubmit={handleUpload} className="cc-stack">
                  <input className="cc-file" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} />
                  {preview && (
                    <div>
                      <p className="cc-hint" style={{ marginTop: 0, marginBottom: 8 }}>{t('profile.preview')}</p>
                      <img src={preview} alt="Preview" className="cc-passport" />
                    </div>
                  )}
                  <p className="cc-hint">{t('profile.fileHint')}</p>
                  <button type="submit" disabled={uploading || !file} className="cc-btn cc-btn-primary block">
                    {uploading ? t('profile.uploading') : status === 'pending' ? t('profile.replace') : t('profile.upload')}
                  </button>
                </form>
              </>
            )}
          </section>
        )}

        <button type="button" className="cc-btn cc-btn-danger block" onClick={handleLogout}><IconLogout size={18} /> {t('nav.logout')}</button>
      </div>
    </div>
  );
};

export default Profile;
