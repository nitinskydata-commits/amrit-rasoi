import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './Testimonials.css';

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
                {testimonial.customerImage?.url && (
                  <img 
                    src={testimonial.customerImage.url} 
                    alt={testimonial.customerName}
                    className="customer-avatar"
                  />
                )}
                <div className="customer-info">
                  <h4>{testimonial.customerName}</h4>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < testimonial.rating ? 'star filled' : 'star'}>
                        ⭐
                      </span>
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
