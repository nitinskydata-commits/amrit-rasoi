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
            
            <div className="footer-section">
              <h4>Get to Know Us</h4>
              <Link to="/about">About Us</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/press">Press Releases</Link>
              <Link to="/science">Amrit Rasoi Science</Link>
            </div>

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
              <Link to="/contact">Contact Us</Link>
            </div>

            <div className="footer-section">
              <h4>Make Money with Us</h4>
              <Link to="/login">Sell on Amrit Rasoi</Link>
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
              <span>{settings?.siteName || 'Amrit Rasoi'}</span>
            </div>

            <div className="footer-badges">
              <div className="footer-badge">
                <FaGlobe className="badge-icon-small" />
                <span>English</span>
              </div>
              <div className="footer-badge">
                <span>🇮🇳 India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚖️ SECTION 4: LEGAL COPYRIGHT & DISCLAIMER */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-legal-links">
            <Link to="/privacy">Conditions of Use</Link>
            <Link to="/privacy">Privacy Notice</Link>
            <Link to="/privacy">Interest-Based Ads</Link>
          </div>
          <p className="copyright-text">
            © 2011-{new Date().getFullYear()}, {settings?.siteName || 'Amrit Rasoi, Inc.'} or its affiliates. Registered GST: {settings?.gstNumber || 'XXXXXXXXXX'}, FSSAI: {settings?.fssaiNumber || 'XXXXXXXXXX'}
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
