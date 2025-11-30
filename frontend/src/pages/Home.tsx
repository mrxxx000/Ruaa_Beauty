import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import Hero from '../components/Hero';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';

const VideoGrid: React.FC<{ videos?: string[] }> = ({ videos }) => {
  // If caller provides videos prop, use it; otherwise use the default lashes shorts
  const defaultVideos = [
    process.env.PUBLIC_URL + '/assets/short1.mp4',
    process.env.PUBLIC_URL + '/assets/short2.mp4',
    process.env.PUBLIC_URL + '/assets/short3.mp4',
    process.env.PUBLIC_URL + '/assets/short4.mp4'
  ];
  const list = videos && videos.length ? videos : defaultVideos;

  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    // Lazy-load videos when they enter the viewport to avoid loading all at once
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = entry.target as HTMLVideoElement;
          if (!vid) return;

          if (entry.isIntersecting) {
            // If not loaded yet, set the src from data-src and load
            if (!vid.dataset.loaded) {
              const src = vid.dataset.src;
              if (src) {
                vid.src = src;
                // allow browser to fetch
                try { vid.load(); } catch (e) {}
                vid.dataset.loaded = '1';
              }
            }
            // try to play the muted video for preview
            vid.muted = true;
            vid.play().catch(() => {});
          } else {
            // pause videos that leave viewport to save CPU/bandwidth
            try { vid.pause(); } catch (e) {}
          }
        });
      },
      { threshold: 0.5 }
    );

    // observe current refs
    videoRefs.current.forEach((v) => {
      if (v) observer.observe(v);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (index: number) => {
    const clicked = videoRefs.current[index];
    if (!clicked) return;

    if (clicked.muted) {
      // unmute clicked, mute/pause others
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
            // do not set src initially; use data-src for lazy loading
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

  // Redirect admin users to admin dashboard
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
    if (location.hash) {
      const id = location.hash.replace('#', '');
      // scroll to the element with matching id, if present
      const el = document.getElementById(id);
      if (el) {
        // small timeout to allow layout/paint after navigation
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    }
  }, [location]);
  return (
    <div className="home-landing">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">

            {/* Using the image imported from src so the bundler serves it correctly; sizing controlled via CSS */}
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
                Salon Services
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
                Products
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
          </nav>
          <AuthModal />
        </div>
      </header>

      {/* Language Switcher - Below navbar, centered */}
      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <main>
        <Hero />

        {/* Lashes video grid: 2 videos per row. Place your short video files in public/assets and update the `videos` array in VideoGrid. */}
        <section className="videos container" id="Lashes">
          <h2 style={{ marginTop: 18, marginBottom: 18 }}>{t('home.lashesTitle')}</h2>
          <VideoGrid />
        </section>

        {/* Mehendi shorts - same layout as Lashes, using specific mehendi videos */}
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
      </main>

      

      <footer className="site-footer">
        <div className="container text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
