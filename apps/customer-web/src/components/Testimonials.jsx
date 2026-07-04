import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { FaStar } from 'react-icons/fa';
import './Testimonials.css';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/testimonials`);
        if (data.success) {
          setTestimonials(data.testimonials);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return <div className="testimonials-loading">Loading reviews...</div>;
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2 className="section-title">What Our Customers Say</h2>
        <div className="testimonials-grid">
          {testimonials.slice(0, 3).map((testimonial) => (
            <motion.div
              key={testimonial._id}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="testimonial-header">
                {testimonial.customerImage?.url ? (
                  <img 
                    src={testimonial.customerImage.url} 
                    alt={testimonial.customerName}
                    className="customer-avatar"
                  />
                ) : (
                  <div className="customer-avatar-fallback" style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#febd69',
                    color: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '15px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    marginRight: '12px'
                  }}>
                    {getInitials(testimonial.customerName)}
                  </div>
                )}
                <div className="customer-info">
                  <h4>{testimonial.customerName}</h4>
                  <div className="rating" style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        color={i < testimonial.rating ? '#f0c14b' : '#e4e4e4'} 
                        size={14} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-text">{testimonial.review}</p>
              {testimonial.productName && (
                <p className="product-name">Product: {testimonial.productName}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
