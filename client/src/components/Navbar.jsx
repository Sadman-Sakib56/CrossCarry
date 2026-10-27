import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Brand from './Brand';
import LanguageToggle from './LanguageToggle';
import { IconHome, IconSend, IconSearch, IconWallet, IconUser, IconLogout, IconGrid, IconUsers, IconList, IconCard } from './Icons';

// Admin এর মেনুতে Send/Find/Wallet নেই: admin parcel পাঠাতে বা বহন করতে পারে না
const USER_LINKS = [
  { to: '/dashboard', key: 'nav.dashboard', Icon: IconHome, end: true },
  { to: '/requests/new', key: 'nav.send', Icon: IconSend },
  { to: '/find-parcels', key: 'nav.find', Icon: IconSearch },
  { to: '/wallet', key: 'nav.wallet', Icon: IconWallet },
  { to: '/profile', key: 'nav.profile', Icon: IconUser },
];
const ADMIN_LINKS = [
  { to: '/admin', key: 'nav.overview', Icon: IconGrid, end: true },
  { to: '/admin/users', key: 'nav.users', Icon: IconUsers },
  { to: '/admin/requests', key: 'nav.requests', Icon: IconList },
  { to: '/admin/payments', key: 'nav.payments', Icon: IconCard },
  { to: '/profile', key: 'nav.profile', Icon: IconUser },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = user?.role === 'admin' ? ADMIN_LINKS : USER_LINKS;
  const handleLogout = () => { logout(); navigate('/login'); };
  const cls = ({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`;

  return (
    <>
      <header className={`cc-nav${scrolled ? ' scrolled' : ''}`}>
        <nav className="cc-container cc-nav-inner" aria-label="Main">
          <Brand />

          {user && (
            <div className="cc-nav-links">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={cls}>{t(l.key)}</NavLink>
              ))}
            </div>
          )}

          <div className="cc-nav-right">
            <LanguageToggle />
            {user ? (
              <button type="button" className="cc-icon-btn" onClick={handleLogout} aria-label={t('nav.logout')} title={t('nav.logout')}>
                <IconLogout />
              </button>
            ) : (
              <>
                <Link to="/login" className="cc-btn cc-btn-ghost sm cc-desktop-only">{t('nav.login')}</Link>
                <Link to="/register" className="cc-btn cc-btn-primary sm">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* মোবাইলে নিচের tab bar: এক হাতে সহজে চালানো যায় */}
      {user && (
        <nav className="cc-bottom-nav" aria-label="Quick navigation">
          {links.map(({ to, key, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `cc-bottom-link${isActive ? ' active' : ''}`}>
              <Icon /><span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navbar;
