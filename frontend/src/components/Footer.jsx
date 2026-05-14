import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';
import AdDisplay from './AdDisplay';
import './Footer.css';

const Footer = () => {
  const { settings } = useSelector(state => state.settings);

  return (
    <footer className="footer">
      {/* Footer Banner Ad */}
      <AdDisplay position="footer-banner" />
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>Get to Know Us</h4>
              <Link to="/about">About Us</Link>
              <Link to="/shipping">Shipping Policy</Link>
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
              {settings?.socialLinks?.youtube && (
                <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                  <FaYoutube /> YouTube
                </a>
              )}
              {settings?.socialLinks?.linkedin && (
                <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
              <Link to="/contact">Contact Us</Link>
            </div>

            <div className="footer-section">
              <h4>Trust & Security</h4>
              <p style={{fontSize: '14px', color: '#ccc', lineHeight: '1.6'}}>
                {settings?.tagline || 'Premium Quality Food Products'}
              </p>
              <p style={{fontSize: '13px', color: '#999', marginTop: '10px'}}>
                GST: {settings?.gstNumber || 'XXXXXXXXXXXX'}
              </p>
              <p style={{fontSize: '13px', color: '#999'}}>
                FSSAI: {settings?.fssaiNumber || 'XXXXXXXXXXXX'}
              </p>
            </div>

            <div className="footer-section">
              <h4>Contact Details</h4>
              <p style={{color: '#ccc', fontSize: '14px'}}>{settings?.companyAddress || '[Your Business Address]'}</p>
              <p style={{color: '#eee', fontWeight: 'bold', marginTop: '10px'}}>{settings?.supportPhone || '+91 xxxxx xxxxx'}</p>
              <p style={{color: '#eee'}}>{settings?.supportEmail || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-middle">
        <div className="container">
          <div className="footer-logo">
            {settings?.companyLogo?.url ? (
              <img src={settings.companyLogo.url} alt={settings.siteName} />
            ) : (
              <img src="/logo.png" alt="SBMI" />
            )}
            <span>{settings?.siteName || 'SBMI - Amrit Rasoi'}</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>{settings?.footerText || `© ${new Date().getFullYear()} Shree Bhanwal Mata Industries. All rights reserved.`}</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/returns">Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
