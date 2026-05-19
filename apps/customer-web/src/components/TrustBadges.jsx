import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './TrustBadges.css';

const TrustBadges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/badges`);
        if (data.success) {
          setBadges(data.badges);
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  if (loading || badges.length === 0) {
    return null;
  }

  return (
    <section className="trust-badges-section">
      <div className="container">
        <h2 className="section-title">Why Choose SBMI?</h2>
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <motion.div
              key={badge._id}
              className="badge-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <div className="badge-icon">
                {badge.icon?.url ? (
                  <img src={badge.icon.url} alt={badge.title} />
                ) : (
                  <span className="emoji">{badge.emoji}</span>
                )}
              </div>
              <h3>{badge.title}</h3>
              {badge.description && <p>{badge.description}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
