import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Newsletter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.post('/api/v1/newsletter/subscribe', { email });
      
      if (data.success) {
        setMessage(data.message || 'Successfully subscribed!');
        setMessageType('success');
        setEmail('');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Subscription failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="newsletter-text">
            <h2>Stay Updated!</h2>
            <p>Subscribe to our newsletter for exclusive offers and updates</p>
          </div>
          
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {message && (
            <motion.div
              className={`newsletter-message ${messageType}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
