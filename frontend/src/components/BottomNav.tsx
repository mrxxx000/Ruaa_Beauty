import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Sparkles, Package, ShoppingBag, Mail, Star, ChevronUp } from 'lucide-react';
import '../styles/bottom-nav.css';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [salonDropdownPos, setSalonDropdownPos] = useState<number>(0);
  const [productsDropdownPos, setProductsDropdownPos] = useState<number>(0);
  const [salonDropdownWidth, setSalonDropdownWidth] = useState<number>(0);
  const [productsDropdownWidth, setProductsDropdownWidth] = useState<number>(0);
  const salonBtnRef = React.useRef<HTMLButtonElement>(null);
  const productsBtnRef = React.useRef<HTMLButtonElement>(null);

  const regularItems = [
    { path: '/', icon: Home, label: t('nav.home') },
  ];

  const salonItems = [
    { path: '/makeup', label: t('nav.makeup') },
    { path: '/mehendi', label: t('nav.mehendi') },
  ];

  const productItems = [
    { path: '/lashes', label: t('nav.lashes') },
  ];

  const handleNavClick = () => {
    setSalonDropdownOpen(false);
    setProductsDropdownOpen(false);
  };

  const handleSalonDropdownClick = () => {
    if (salonBtnRef.current) {
      const rect = salonBtnRef.current.getBoundingClientRect();
      // Calculate center position of button
      const centerPos = rect.left + rect.width / 2;
      setSalonDropdownPos(centerPos);
      setSalonDropdownWidth(rect.width);
    }
    setSalonDropdownOpen(!salonDropdownOpen);
    setProductsDropdownOpen(false);
  };

  const handleProductsDropdownClick = () => {
    if (productsBtnRef.current) {
      const rect = productsBtnRef.current.getBoundingClientRect();
      // Calculate center position of button
      const centerPos = rect.left + rect.width / 2;
      setProductsDropdownPos(centerPos);
      setProductsDropdownWidth(rect.width);
    }
    setProductsDropdownOpen(!productsDropdownOpen);
    setSalonDropdownOpen(false);
  };

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {/* Home */}
          {regularItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`bottom-nav-item ${location.pathname === path ? 'active' : ''}`}
              onClick={handleNavClick}
              title={label}
            >
              <Icon className="bottom-nav-icon" />
              <span className="bottom-nav-label">{label}</span>
            </Link>
          ))}

          {/* Salon Services Dropdown */}
          <div className="bottom-nav-dropdown">
            <button
              ref={salonBtnRef}
              className={`bottom-nav-item dropdown-btn ${
                salonItems.some(item => item.path === location.pathname) ? 'active' : ''
              }`}
              onClick={handleSalonDropdownClick}
              title={t('nav.salonService')}
            >
              <Sparkles className="bottom-nav-icon" />
              <span className="bottom-nav-label">{t('nav.salonService')}</span>
              <ChevronUp className="dropdown-chevron" style={{ opacity: salonDropdownOpen ? 1 : 0.5 }} />
            </button>
          </div>

          {/* Products Dropdown */}
          <div className="bottom-nav-dropdown">
            <button
              ref={productsBtnRef}
              className={`bottom-nav-item dropdown-btn ${
                productItems.some(item => item.path === location.pathname) ? 'active' : ''
              }`}
              onClick={handleProductsDropdownClick}
              title={t('nav.products')}
            >
              <Package className="bottom-nav-icon" />
              <span className="bottom-nav-label">{t('nav.products')}</span>
              <ChevronUp className="dropdown-chevron" style={{ opacity: productsDropdownOpen ? 1 : 0.5 }} />
            </button>
          </div>

          {/* Book */}
          <Link
            to="/book"
            className={`bottom-nav-item ${location.pathname === '/book' ? 'active' : ''}`}
            onClick={handleNavClick}
            title={t('nav.book')}
          >
            <ShoppingBag className="bottom-nav-icon" />
            <span className="bottom-nav-label">{t('nav.book')}</span>
          </Link>

          {/* Contact */}
          <Link
            to="/contact"
            className={`bottom-nav-item ${location.pathname === '/contact' ? 'active' : ''}`}
            onClick={handleNavClick}
            title={t('nav.contact')}
          >
            <Mail className="bottom-nav-icon" />
            <span className="bottom-nav-label">{t('nav.contact')}</span>
          </Link>

          {/* Reviews */}
          <Link
            to="/reviews"
            className={`bottom-nav-item ${location.pathname === '/reviews' ? 'active' : ''}`}
            onClick={handleNavClick}
            title={t('nav.reviews')}
          >
            <Star className="bottom-nav-icon" />
            <span className="bottom-nav-label">{t('nav.reviews')}</span>
          </Link>
        </div>
      </nav>

      {/* Salon Dropdown Portal */}
      {salonDropdownOpen && (
        <div
          className="bottom-nav-menu-wrapper"
          style={{
            '--menu-left': `${salonDropdownPos}px`,
          } as React.CSSProperties & { '--menu-left': string }}
        >
          <div className="bottom-nav-dropdown-menu">
            {salonItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`dropdown-menu-item ${location.pathname === path ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Dropdown Portal */}
      {productsDropdownOpen && (
        <div
          className="products-dropdown-menu"
          style={{
            '--menu-left': `${productsDropdownPos}px`,
          } as React.CSSProperties & { '--menu-left': string }}
        >
          <div className="products-dropdown-content">
            {productItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`dropdown-menu-item ${location.pathname === path ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
