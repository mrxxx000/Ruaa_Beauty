import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import BookingForm from '../components/BookingForm';
import LanguageSwitcher from '../components/LanguageSwitcher';

const About: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  return (
    <div className="book-page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
                     <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t('nav.home')}</Link>
                     <Link to="/lashes" className={location.pathname === '/lashes' ? 'active' : ''}>{t('nav.lashes')}</Link>
                     <Link to="/makeup" className={location.pathname === '/makeup' ? 'active' : ''}>{t('nav.makeup')}</Link>
                     <Link to="/mehendi" className={location.pathname === '/mehendi' ? 'active' : ''}>{t('nav.mehendi')}</Link>
                     <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>{t('nav.book')}</Link>
                     <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>{t('nav.contact')}</Link>
                   </nav>
        </div>
      </header>

      {/* Language Switcher - Below navbar, centered */}
      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <main>
        {/* Booking form */}
        <BookingForm />
      </main>

      <footer className="site-footer">
        <div className="container text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
