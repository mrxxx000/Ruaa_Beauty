import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';

const Contact: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  
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
            
            <div className="nav-dropdown">
              <button 
                className="nav-dropdown-btn"
                onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
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
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
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
              <p style={{ marginTop: 12 }}>🎓 <a href="https://www.superprof.se/makeupartist-lash-lift-brow-lift-artist-privatlektioner-svenska-arabiska-makeup-skonhet-film.html" target="_blank" rel="noreferrer">Superprof Profile</a></p>

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
