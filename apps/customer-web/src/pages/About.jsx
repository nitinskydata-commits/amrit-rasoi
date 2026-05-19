import React from 'react';
import { useSelector } from 'react-redux';
import './About.css';

const About = () => {
  const { settings } = useSelector((state) => state.settings);

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About {settings?.siteName || 'SBMI - Amrit Rasoi'}</h1>
        <p>{settings?.tagline || 'Your Trusted Source for Authentic Indian Spices'}</p>
      </div>

      <div className="container">
        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            {settings?.siteName || 'SBMI - Amrit Rasoi'} has been serving authentic Indian spices
            and food products since its inception. We are committed to bringing the finest quality spices
            from across India directly to your kitchen.
          </p>
          <p>
            Located in {settings?.companyAddress || '[Our Business Address]'}, we take pride in maintaining traditional methods while embracing
            modern quality standards. Every product that leaves our facility carries the legacy of
            generations of spice expertise.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            To provide pure, authentic, and high-quality spices that enhance the flavor of your meals
            while maintaining the health benefits and aromatic richness that Indian cuisine is known for.
          </p>
        </section>

        <section className="about-section">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🌿 100% Pure</h3>
              <p>No artificial colors, preservatives, or additives</p>
            </div>
            <div className="feature-card">
              <h3>✓ Quality Tested</h3>
              <p>Every batch undergoes rigorous quality checks</p>
            </div>
            <div className="feature-card">
              <h3>🚚 Fast Delivery</h3>
              <p>Quick and reliable delivery across India</p>
            </div>
            <div className="feature-card">
              <h3>💰 Best Prices</h3>
              <p>Premium quality at affordable prices</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Contact Information</h2>
          <div className="contact-info-about">
            <p><strong>Address:</strong> {settings?.companyAddress || '[Your Business Address Here]'}</p>
            <p><strong>Phone:</strong> {settings?.supportPhone || '+91 xxxxx xxxxx'}</p>
            <p><strong>Email:</strong> {settings?.supportEmail || 'admin@example.com'}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
