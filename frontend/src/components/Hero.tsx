import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';

// Serve the image from the public folder so CRA can include it in builds.
// Use a simple filename (no spaces) to avoid URL encoding issues in some browsers.
const heroImage = process.env.PUBLIC_URL + '/assets/hero-lashes.png';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section
      className="hero"
      style={{
        position: 'relative',
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* dark gradient overlay */}
      <div
        className="hero-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.25))',
        }}
      />

      <div className="container hero-inner" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-text">
          <h1 className="hero-title" style={{ color: '#f108b7ff' }}>
            {t('hero.title')}
          </h1>
          <p className="hero-sub" style={{ color: 'rgba(209, 27, 27, 0.95)', marginTop: 6 }}>
            {t('hero.subtitle')}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.95)', marginTop: 12, maxWidth: 680 }}>
            {t('hero.description')}
          </p>

          <div style={{ marginTop: 18 }}>
            <Link className="primary-btn" to="/book">
              {t('hero.bookButton')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
