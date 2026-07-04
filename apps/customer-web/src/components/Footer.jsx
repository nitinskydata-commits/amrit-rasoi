import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaFacebook, FaTwitter, FaInstagram, FaGlobe } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const { settings } = useSelector(state => state.settings);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      
      {/* 🔝 SECTION 1: BACK TO TOP */}
      <button 
        type="button" 
        className="back-to-top-btn" 
        onClick={handleBackToTop}
        aria-label="Back to top of page"
      >
        Back to top
      </button>

      {/* 📂 SECTION 2: STRUCTURED DIRECTORIES */}
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            
            {settings?.footerLinks && settings.footerLinks.length > 0 ? (
              settings.footerLinks.map((col, idx) => (
                <div className="footer-section" key={idx}>
                  <h4>{col.title}</h4>
                  {col.links.map((link, lIdx) => (
                    <Link to={link.url} key={lIdx}>{link.label}</Link>
                  ))}
                </div>
              ))
            ) : (
              <>
                <div className="footer-section">
                  <h4>Get to Know Us</h4>
                  <Link to="/about">About Us</Link>
                  <Link to="/careers">Careers</Link>
                  <Link to="/press">Press Releases</Link>
                  <Link to="/about">SBMI Science</Link>
                </div>
                <div className="footer-section">
                  <h4>Make Money with Us</h4>
                  <Link to="/seller/apply">Sell on SBMI</Link>
                  <Link to="/login">Sell under Accelerator</Link>
                  <Link to="/login">Protect & Build Your Brand</Link>
                  <Link to="/login">Global Trade Supply</Link>
                </div>
                <div className="footer-section">
                  <h4>Let Us Help You</h4>
                  <Link to="/profile">Your Account</Link>
                  <Link to="/orders">Returns Centre</Link>
                  <Link to="/support">Help & Support</Link>
                  <Link to="/terms">100% Purchase Protection</Link>
                </div>
              </>
            )}

            <div className="footer-section">
              <h4>Connect with Us</h4>
              {settings?.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  <FaFacebook /> Facebook
                </a>
              )}
              {settings?.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <FaTwitter /> Twitter
                </a>
              )}
              {settings?.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  <FaInstagram /> Instagram
                </a>
              )}
              {!settings?.socialLinks?.facebook && !settings?.socialLinks?.twitter && !settings?.socialLinks?.instagram && (
                <>
                  <a href="#" onClick={(e) => e.preventDefault()}><FaFacebook /> Facebook</a>
                  <a href="#" onClick={(e) => e.preventDefault()}><FaInstagram /> Instagram</a>
                  <a href="#" onClick={(e) => e.preventDefault()}><FaTwitter /> Twitter</a>
                </>
              )}
              <Link to="/contact">Contact Us</Link>
            </div>

          </div>
        </div>
      </div>

      {/* 🌐 SECTION 3: LOGO & SETTINGS BADGES */}
      <div className="footer-middle">
        <div className="container">
          <div className="footer-middle-content">
            <div className="footer-logo">
              {settings?.companyLogo?.url ? (
                <img src={settings.companyLogo.url} alt={settings.siteName} />
              ) : (
                <img src="/logo.png" alt="SBMI" />
              )}
              <span>{settings?.siteName || 'SBMI'}</span>
            </div>
            
            {/* Badges removed as per user request to clean up non-working UI */}
          </div>
        </div>
      </div>

      {/* ⚖️ SECTION 4: LEGAL COPYRIGHT & DISCLAIMER */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-legal-links">
            {(settings?.footerLegalLinks || [
              { label: 'Conditions of Use', url: '/terms' },
              { label: 'Privacy Notice', url: '/privacy' },
              { label: 'Shipping & Returns', url: '/shipping' }
            ]).map((link, idx) => (
              <Link to={link.url} key={idx}>{link.label}</Link>
            ))}
          </div>
          <p className="copyright-text">
            {settings?.footerText ? settings.footerText : `© 2011-${new Date().getFullYear()}, ${settings?.siteName || 'SBMI, Inc.'} or its affiliates. Registered GST: ${settings?.gstNumber || 'XXXXXXXXXX'}, FSSAI: ${settings?.fssaiNumber || 'XXXXXXXXXX'}`}
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
