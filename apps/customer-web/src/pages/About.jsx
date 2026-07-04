import React from 'react';
import { useSelector } from 'react-redux';
import './About.css';

const About = () => {
  const { settings } = useSelector((state) => state.settings);

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About {settings?.siteName || 'SBMI'}</h1>
        <p>{settings?.tagline || 'Your Trusted Source for Authentic Indian Spices'}</p>
      </div>

      <div className="container">
        <section className="about-section">
          <h2>Our Story</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {settings?.aboutPageContent?.storyText || `${settings?.siteName || 'SBMI'} has been serving authentic Indian spices and food products since its inception. We are committed to bringing the finest quality spices from across India directly to your kitchen.\n\nLocated in ${settings?.companyAddress || '[Our Business Address]'}, we take pride in maintaining traditional methods while embracing modern quality standards. Every product that leaves our facility carries the legacy of generations of spice expertise.`}
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {settings?.aboutPageContent?.missionText || 'To provide pure, authentic, and high-quality spices that enhance the flavor of your meals while maintaining the health benefits and aromatic richness that Indian cuisine is known for.'}
          </p>
        </section>

        <section className="about-section">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            {(settings?.aboutPageContent?.whyChooseUs && settings.aboutPageContent.whyChooseUs.length > 0 
              ? settings.aboutPageContent.whyChooseUs 
              : [
                { icon: '🌿', title: '100% Pure', description: 'No artificial colors, preservatives, or additives' },
                { icon: '✓', title: 'Quality Tested', description: 'Every batch undergoes rigorous quality checks' },
                { icon: '🚚', title: 'Fast Delivery', description: 'Quick and reliable delivery across India' },
                { icon: '💰', title: 'Best Prices', description: 'Premium quality at affordable prices' }
              ]
            ).map((card, idx) => (
              <div key={idx} className="feature-card">
                <h3>{card.icon} {card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
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
