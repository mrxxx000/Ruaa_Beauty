import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import Hero from '../components/Hero';

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
    // Try to autoplay all muted videos on mount
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.muted = true;
      v.play().catch(() => {
        // ignore play errors (browsers may block autoplay in some cases)
      });
    });
  }, []);

  const handleClick = (index: number) => {
    const clicked = videoRefs.current[index];
    if (!clicked) return;

    // If clicked was muted, unmute it and mute/pause others
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
      // If it's already unmuted, mute it back
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
            src={src}
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
            <Link to="#Lashes">Lashes</Link>
            <Link to="#Makeup">Makeup</Link>
            <Link to="/mehendi">Mehendi</Link>
            <Link to="#about">About</Link>
              <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero />

        {/* Lashes video grid: 2 videos per row. Place your short video files in public/assets and update the `videos` array in VideoGrid. */}
        <section className="videos container" id="videos">
          <h2 style={{ marginBottom: 18 }}>Lashes</h2>
          <VideoGrid />
        </section>

        {/* Mehendi shorts - same layout as Lashes, using specific mehendi videos */}
        <section className="videos container" id="mehendi-shorts">
          <h2 style={{ marginBottom: 18 }}>Mehendi</h2>
          <VideoGrid
            videos={[
              process.env.PUBLIC_URL + '/assets/mehendi1.mp4',
              process.env.PUBLIC_URL + '/assets/mehendi2.mp4'
            ]}
          />
        </section>

        <section className="cta">
          <div className="container text-center">
            <h2>Ready to Glow?</h2>
            <p>Browse our collection of premium beauty products and find your perfect match.</p>
          </div>
        </section>
      </main>

      

      <footer className="site-footer">
        <div className="container text-center">
          <p>© {new Date().getFullYear()} Ruaa Beauty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
