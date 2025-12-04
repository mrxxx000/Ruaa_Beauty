import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import Hero from '../components/Hero';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';
import { 
  injectSchemaMarkup, 
  organizationSchema,
  websiteSchema,
  createBreadcrumbSchema
} from '../utils/schemaMarkup';
import {
  setCanonicalURL,
  setMetaDescription,
  setOpenGraphTags,
  sitemapPages
} from '../utils/seoHelpers';

const VideoGrid: React.FC<{ videos?: string[] }> = ({ videos }) => {
  const defaultVideos = [
    process.env.PUBLIC_URL + '/assets/short1.mp4',
    process.env.PUBLIC_URL + '/assets/short2.mp4',
    process.env.PUBLIC_URL + '/assets/short3.mp4'
  ];
  const list = videos && videos.length ? videos : defaultVideos;

  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = entry.target as HTMLVideoElement;
          if (!vid) return;

          if (entry.isIntersecting) {
            if (!vid.dataset.loaded) {
              const src = vid.dataset.src;
              if (src) {
                vid.src = src;
                try { vid.load(); } catch (e) {}
                vid.dataset.loaded = '1';
              }
            }
            vid.muted = true;
            vid.play().catch(() => {});
          } else {
            try { vid.pause(); } catch (e) {}
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((v) => {
      if (v) observer.observe(v);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (index: number) => {
    const clicked = videoRefs.current[index];
    if (!clicked) return;

    if (clicked.muted) {
      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        if (i === index) {
          v.muted = false;
          v.play().catch(() => {});
        } else {
          v.muted = true;
          v.pause();
        }
      });
      setActive(index);
    } else {
      clicked.muted = true;
      clicked.play().catch(() => {});
      setActive(null);
    }
  };

  return (
    <div className="video-grid">
      {list.map((src, i) => (
        <div className="video-card" key={i} onClick={() => handleClick(i)}>
          <video
            ref={(el) => { videoRefs.current[i] = el; }}
            data-src={src}
            preload="none"
            playsInline
            loop
            muted
            className="short-video"
          />
          <div className={`video-overlay ${active === i ? 'active' : ''}`}>
            {active === i ? '🔊' : '🔇'}
          </div>
        </div>
      ))}
    </div>
  );
};

const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userObj = JSON.parse(user);
        if (userObj.role === 'admin') {
          navigate('/admin', { replace: true });
        }
      } catch (err) {
        console.error('Failed to parse user:', err);
      }
    }
  }, [navigate]);

  useEffect(() => {
    setCanonicalURL('/');
    setMetaDescription('Ruaa Beauty - Professional beauty salon offering bridal mehendi, lashes, makeup, and more. Book your appointment online today.');
    setOpenGraphTags(
      'Ruaa Beauty - Professional Beauty Services',
      'Professional beauty salon offering bridal mehendi, lashes, makeup, and more in Skurup, Sweden.',
      'https://www.ruaa-beauty.eu/assets/logo.png',
      '/'
    );
    injectSchemaMarkup(organizationSchema);
    injectSchemaMarkup(websiteSchema);
    injectSchemaMarkup(createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.ruaa-beauty.eu/' }
    ]));
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    }
  }, [location]);

  return (
    <div className="home-landing">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <img src={logoImg} alt="Ruaa Beauty logo" />
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

      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <main>
        <Hero />

        <section className="videos container" id="Lashes">
          <h2 style={{ marginTop: 18, marginBottom: 18 }}>{t('home.lashesTitle')}</h2>
          <VideoGrid />
        </section>

        <section className="videos container" id="mehendi-shorts">
          <h2 style={{ marginTop: 18, marginBottom: 18 }}>{t('home.mehendiTitle')}</h2>
          <VideoGrid
            videos={[
              process.env.PUBLIC_URL + '/assets/mehendi1.mp4',
              process.env.PUBLIC_URL + '/assets/mehendi2.mp4'
            ]}
          />
        </section>

        <section className="cta">
          <div className="container text-center">
            <h2>{t('home.ctaTitle')}</h2>
            <p>{t('home.ctaDescription')}</p>
          </div>
        </section>

        <section className="internal-links-section" style={{ padding: '2rem 0', borderTop: '1px solid #eee' }}>
          <div className="container">
            <h3 style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1rem', color: '#666' }}>
              {t('nav.explore') || 'Explore Our Services'}
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '1rem' 
            }}>
              {sitemapPages.map((page) => {
                let translatedLabel = page.label;
                if (page.path === '/') translatedLabel = t('nav.home');
                else if (page.path === '/book') translatedLabel = t('nav.book');
                else if (page.path === '/lashes') translatedLabel = t('nav.lashes');
                else if (page.path === '/makeup') translatedLabel = t('nav.makeup');
                else if (page.path === '/mehendi') translatedLabel = t('nav.mehendi');
                else if (page.path === '/reviews') translatedLabel = t('nav.reviews');
                else if (page.path === '/contact') translatedLabel = t('nav.contact');

                return (
                  <Link
                    key={page.path}
                    to={page.path}
                    title={page.description}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: '#ff6fa3',
                      transition: 'all 0.3s ease',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff6fa3';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                      e.currentTarget.style.color = '#ff6fa3';
                    }}
                  >
                    {translatedLabel}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              {sitemapPages.slice(0, 3).map((page, index) => {
                let label = page.label;
                if (page.path === '/') label = t('nav.home');
                else if (page.path === '/book') label = t('nav.book');
                else if (page.path === '/lashes') label = t('nav.lashes');
                else if (page.path === '/makeup') label = t('nav.makeup');
                else if (page.path === '/mehendi') label = t('nav.mehendi');
                else if (page.path === '/reviews') label = t('nav.reviews');
                else if (page.path === '/contact') label = t('nav.contact');

                return (
                  <React.Fragment key={page.path}>
                    <Link to={page.path} style={{ color: '#ff6fa3', marginRight: '1.5rem', textDecoration: 'none' }}>
                      {label}
                    </Link>
                    {index < 2 && <span style={{ color: '#ccc' }}>|</span>}
                  </React.Fragment>
                );
              })}
            </div>
            <div>
              {sitemapPages.slice(3).map((page, index) => {
                let label = page.label;
                if (page.path === '/') label = t('nav.home');
                else if (page.path === '/book') label = t('nav.book');
                else if (page.path === '/lashes') label = t('nav.lashes');
                else if (page.path === '/makeup') label = t('nav.makeup');
                else if (page.path === '/mehendi') label = t('nav.mehendi');
                else if (page.path === '/reviews') label = t('nav.reviews');
                else if (page.path === '/contact') label = t('nav.contact');

                return (
                  <React.Fragment key={page.path}>
                    <Link to={page.path} style={{ color: '#ff6fa3', marginRight: '1.5rem', textDecoration: 'none' }}>
                      {label}
                    </Link>
                    {index < 3 && <span style={{ color: '#ccc' }}>|</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
