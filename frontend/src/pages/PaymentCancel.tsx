import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNav from '../components/BottomNav';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <div
      className="payment-page"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff6f8 0%, #fff1f3 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <AlertCircle
            className="w-16 h-16"
            style={{
              margin: '0 auto 20px',
              color: '#ff9800',
            }}
          />
          <h1 style={{ color: '#333', marginBottom: '16px', fontSize: '28px' }}>
            {t('paymentCancel.title')}
          </h1>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>
            {t('paymentCancel.message')}
          </p>

          <div
            style={{
              backgroundColor: '#fff3e0',
              border: '2px solid #ff9800',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left',
            }}
          >
            <p style={{ margin: '0', color: '#d84315', fontSize: '14px', fontWeight: '600' }}>
              {t('paymentCancel.noWorries')}
            </p>
            <ul style={{ margin: '12px 0 0 0', color: '#666', fontSize: '14px', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                {t('paymentCancel.tip1')}
              </li>
              <li style={{ marginBottom: '8px' }}>
                {t('paymentCancel.tip2')}
              </li>
              <li>{t('paymentCancel.tip3')}</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/book')}
              style={{
                padding: '12px 32px',
                backgroundColor: '#ff6fa3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                fontSize: '16px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5a8f')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6fa3')}
            >
              {t('paymentCancel.tryAgain')}
            </button>
            <Link
              to="/"
              style={{
                padding: '12px 32px',
                backgroundColor: '#e0e0e0',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'background-color 0.3s',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '16px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
            >
              {t('paymentCancel.backHome')}
            </Link>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <p style={{ color: '#999', fontSize: '14px', margin: '0' }}>
              {t('paymentCancel.questions')}{' '}
              <Link
                to="/contact"
                style={{
                  color: '#ff6fa3',
                  textDecoration: 'none',
                  fontWeight: '600',
                }}
              >
                {t('paymentCancel.contactPage')}
              </Link>{' '}
              {t('paymentCancel.orReachOut')}
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
