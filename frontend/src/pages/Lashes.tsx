import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';
import { getMediaByService, MediaItem } from '../mediaApi';

const Lashes: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [lashesVideos, setLashesVideos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load lashes media from database (both images and videos)
  useEffect(() => {
    const loadLashesMedia = async () => {
      try {
        const media = await getMediaByService('lashes');
        setLashesVideos(media);
      } catch (err) {
        console.error('Failed to load lashes media:', err);
        setLashesVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadLashesMedia();
  }, []);
  
  return (
    <div className="page-coming-soon">
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
        <section className="container" style={{ padding: '60px 0' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 24, textAlign: 'center' }}>{t('nav.lashes')}</h1>
          
          {loading && (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading lashes gallery...</p>
          )}

          {!loading && lashesVideos.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666' }}>Gallery coming soon...</p>
          )}

          {!loading && lashesVideos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {lashesVideos.map((item) => (
                <div key={item.id} style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.filename}
                      style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <video 
                      src={item.url}
                      style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                      controls
                      preload="metadata"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
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

export default Lashes;
