import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';

const slideA = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448241189_1815301755622097_667881131947720916_n.jpg';
const slideB = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448396960_432194449635910_11943437998895029_n.jpg';
const heroImg = process.env.PUBLIC_URL + '/assets/SnapInsta.to_432691013_331302829451121_5481086954294582843_n.jpg';
const singleImg = process.env.PUBLIC_URL + '/assets/503560008_18060668414464336_4481666084541690454_n.jpeg';
const more1 = process.env.PUBLIC_URL + '/assets/f9ee56db-cfbd-4a39-99db-cfc4a268312f.jpg';
const more2 = process.env.PUBLIC_URL + '/assets/13c307f1-e5bc-4f0c-ab4b-6a7cb281e89c.jpg';
const more3 = process.env.PUBLIC_URL + '/assets/SnapInsta.to_173380434_1154157505029811_1175835221239818215_n.jpg';
const more4 = process.env.PUBLIC_URL + '/assets/SnapInsta.to_130305880_129954255557964_2672503637875550747_n.jpg';
const more5 = process.env.PUBLIC_URL + '/assets/SnapInsta.to_125829760_423863109003604_954682821372848647_n.jpg';

const Mehendi: React.FC = () => {
	const [active, setActive] = useState<'a' | 'b'>('a');
	const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
	const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
	const location = useLocation();
	const { t } = useTranslation();

	useEffect(() => {
		const t = setInterval(() => setActive((p) => (p === 'a' ? 'b' : 'a')), 3500);
		return () => clearInterval(t);
	}, []);

	return (
		<div className="mehendi-page">
			<header className="site-header">
				<div className="container header-inner">
					<div className="brand">
									<Link to="/">
										<img src={logoImg} alt="Ruaa Beauty logo" style={{ height: 70 }} />
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
				</div>
			</header>

			{/* Language Switcher - Below navbar, centered */}
			<div className="lang-switcher-container">
				<LanguageSwitcher />
			</div>

			<main>
				<section
					className="mehendi-hero"
					style={{ backgroundImage: `url(${heroImg})` }}
				>
					<div className="mehendi-hero-overlay" />
					<div className="container mehendi-hero-inner">
						<div className="mehendi-text">
							<h2 className="mehendi-title">{t('mehendi.heroTitle')}</h2>
							<p className="mehendi-desc">
								{t('mehendi.heroDescription')}
							</p>
						</div>
					</div>
				</section>

				<section className="container mehendi-gallery">
					<div className="mehendi-slide" aria-live="polite">
						{/* use the pair-wrap class so the stylesheet's responsive rules apply (stacks on small screens) */}
						<div className="pair-wrap">
							<img src={active === 'a' ? slideA : slideB} alt="Mehendi design left" className="pair-img" />
							<img src={active === 'a' ? slideB : slideA} alt="Mehendi design right" className="pair-img" />
						</div>
					</div>

					<div style={{ marginTop: 12, textAlign: 'center' }} className="mehendi-thumbs">
						<button className="secondary-btn" onClick={() => setActive('a')}>{t('mehendi.showSetA')}</button>
						<button className="secondary-btn" onClick={() => setActive('b')}>{t('mehendi.showSetB')}</button>
					</div>

				<div style={{ marginTop: 28 }}>
					<h3 style={{ textAlign: 'center', marginTop: 18, marginBottom: 18 }}>{t('mehendi.moreDesigns')}</h3>
					<div className="more-designs-grid" style={{ marginTop: 12 }}>
							<div className="single-wrap">
								<img src={singleImg} alt="Mehendi single" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more1} alt="Mehendi extra 1" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more2} alt="Mehendi extra 2" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more3} alt="Mehendi extra 3" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more4} alt="Mehendi extra 4" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more5} alt="Mehendi extra 5" className="single-img" />
							</div>
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

export default Mehendi;

