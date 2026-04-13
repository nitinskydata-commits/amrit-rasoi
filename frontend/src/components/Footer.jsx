import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>Get to Know Us</h4>
              <Link to="/about">About SBMI</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/press">Press Releases</Link>
              <Link to="/blog">SBMI Blog</Link>
            </div>

            <div className="footer-section">
              <h4>Connect with Us</h4>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook /> Facebook
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter /> Twitter
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram /> Instagram
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <FaYoutube /> YouTube
              </a>
            </div>

            <div className="footer-section">
              <h4>Make Money with Us</h4>
              <Link to="/sell">Sell on SBMI</Link>
              <Link to="/affiliate">Become an Affiliate</Link>
              <Link to="/advertise">Advertise Your Products</Link>
            </div>

            <div className="footer-section">
              <h4>Let Us Help You</h4>
              <Link to="/account">Your Account</Link>
              <Link to="/orders">Returns Centre</Link>
              <Link to="/help">Help</Link>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-middle">
        <div className="container">
          <div className="footer-logo">
            <img src="/logo.png" alt="SBMI" />
            <span>SBMI - Amrit Rasoi</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 Shree Bhanwal Mata Industries. All rights reserved.</p>
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
