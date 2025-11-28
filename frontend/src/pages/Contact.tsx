import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Contact: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  return (
    <div className="contact-page">
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
        <section className="container contact-main">
          <div className="contact-inner">
            <h1 className="contact-title">{t('contact.title')}</h1>
            <p className="contact-lead">
              {t('contact.lead')}
            </p>

            <div className="contact-block">
              <h3>{t('contact.generalBookingsTitle')}</h3>
              <p>
                {t('contact.generalBookingsDescription')}
              </p>
              <p>📱 {t('contact.whatsapp')}: <a href="https://wa.me/46704679469" target="_blank" rel="noreferrer">+46 70 467 94 69</a> {t('contact.orDmInstagram')} <a href="https://www.instagram.com/ruaa5r/" target="_blank" rel="noreferrer">@ruaa5r</a></p>

              <h3 style={{ marginTop: 18 }}>{t('contact.mehendiBookingsTitle')}</h3>
              <p>
                {t('contact.mehendiBookingsDescription')}
              </p>
              <p>📱 {t('contact.whatsapp')}: <a href="https://wa.me/46720030442" target="_blank" rel="noreferrer">+46 72 00 30 442</a> {t('contact.orDmInstagram')} <a href="https://www.instagram.com/glamourmehendi/" target="_blank" rel="noreferrer">@glamourmehendi</a></p>

              <p style={{ marginTop: 18 }}>
                {t('contact.bothServices')}
              </p>

              <p style={{ marginTop: 12 }}><strong>{t('contact.perfectLook')}</strong></p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
