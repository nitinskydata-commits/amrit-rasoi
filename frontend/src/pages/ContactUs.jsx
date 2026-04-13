import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp } from 'react-icons/fa';
import './ContactUs.css';

const ContactUs = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Send to backend API
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Get in touch with us.</p>
      </div>

      <div className="container">
        <div className="contact-grid">
          {/* Contact Information */}
          <div className="contact-info">
            <h2>Get In Touch</h2>
            
            <div className="info-card">
              <FaPhone className="info-icon" />
              <div>
                <h3>Phone</h3>
                <p>{settings.supportPhone || '+91 98765 43210'}</p>
                <p>{settings.supportPhone2 || '+91 98765 43211'}</p>
              </div>
            </div>

            <div className="info-card">
              <FaWhatsapp className="info-icon whatsapp" />
              <div>
                <h3>WhatsApp</h3>
                <p>{settings.whatsappNumber || '+91 98765 43210'}</p>
              </div>
            </div>

            <div className="info-card">
              <FaEnvelope className="info-icon" />
              <div>
                <h3>Email</h3>
                <p>{settings.supportEmail || 'support@sbmi.com'}</p>
                <p>{settings.businessEmail || 'business@sbmi.com'}</p>
              </div>
            </div>

            <div className="info-card">
              <FaMapMarkerAlt className="info-icon" />
              <div>
                <h3>Address</h3>
                <p>{settings.address || 'Shree Bhanwal Mata Industries'}</p>
                <p>{settings.city || 'Baliali'}, {settings.state || 'Punjab'}</p>
                <p>{settings.pincode || '144211'}</p>
              </div>
            </div>

            <div className="info-card">
              <FaClock className="info-icon" />
              <div>
                <h3>Business Hours</h3>
                <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-wrapper">
            <h2>Send Us a Message</h2>
            {submitted && (
              <div className="success-message">
                ✓ Thank you! Your message has been sent successfully.
              </div>
            )}
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What is this about?"
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Write your message here..."
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
