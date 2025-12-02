import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const navRef = React.useRef<HTMLElement>(null);

  // Force re-render when language changes
  React.useEffect(() => {
    // This effect ensures the component re-renders when language changes
  }, [i18n.language]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setSalonDropdownOpen(false);
        setProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link to="/">
            <img src={logoImg} alt="Ruaa Beauty logo" />
          </Link>
          <span className="brand-title">Ruaa Beauty</span>
        </div>
        <nav className="nav" ref={navRef}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t('nav.home')}</Link>

          <div className="nav-dropdown">
            <button
              className="nav-dropdown-btn"
              onClick={() => {
                setSalonDropdownOpen(!salonDropdownOpen);
                setProductsDropdownOpen(false);
              }}
            >
              {t('nav.salonService')}
              <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: salonDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {salonDropdownOpen && (
              <div className="nav-dropdown-menu">
                <Link to="/makeup" className={location.pathname === '/makeup' ? 'active' : ''} onClick={() => setSalonDropdownOpen(false)}>
                  {t('nav.makeup')}
                </Link>
                <Link to="/mehendi" className={location.pathname === '/mehendi' ? 'active' : ''} onClick={() => setSalonDropdownOpen(false)}>
                  {t('nav.mehendi')}
                </Link>
              </div>
            )}
          </div>

          <div className="nav-dropdown">
            <button
              className="nav-dropdown-btn"
              onClick={() => {
                setProductsDropdownOpen(!productsDropdownOpen);
                setSalonDropdownOpen(false);
              }}
            >
              {t('nav.products')}
              <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: productsDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {productsDropdownOpen && (
              <div className="nav-dropdown-menu">
                <Link to="/lashes" className={location.pathname === '/lashes' ? 'active' : ''} onClick={() => setProductsDropdownOpen(false)}>
                  {t('nav.lashes')}
                </Link>
              </div>
            )}
          </div>

          <Link to="/book" className={location.pathname === '/book' ? 'active' : ''}>{t('nav.book')}</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>{t('nav.contact')}</Link>
          <Link to="/reviews" className={location.pathname === '/reviews' ? 'active' : ''}>{t('nav.reviews')}</Link>
        </nav>
        <AuthModal />
      </div>
    </header>
  );
};

export default Header;
