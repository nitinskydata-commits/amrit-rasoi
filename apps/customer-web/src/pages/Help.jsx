import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaMinus } from 'react-icons/fa';
import './Help.css';

const Help = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      category: "Orders & Delivery",
      questions: [
        {
          q: "How do I track my order?",
          a: "Go to 'My Orders' in your account and click on the order to see tracking details. You'll also receive tracking updates via SMS and email."
        },
        {
          q: "What are the delivery charges?",
          a: "Free delivery on orders above ₹500. For orders below ₹500, a delivery charge of ₹40 applies."
        },
        {
          q: "How long does delivery take?",
          a: "Standard delivery takes 3-5 business days. Metro cities typically receive orders within 2-3 days."
        },
        {
          q: "Do you deliver to my area?",
          a: "We deliver across India. Enter your pincode at checkout to check delivery availability."
        }
      ]
    },
    {
      category: "Payment",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept Credit/Debit Cards, Net Banking, UPI, Wallets, and Cash on Delivery (COD)."
        },
        {
          q: "Is it safe to use my card on your website?",
          a: "Yes, absolutely! All transactions are secured with 256-bit SSL encryption. We use trusted payment gateways and never store your card details."
        },
        {
          q: "Can I pay cash on delivery?",
          a: "Yes, COD is available for orders up to ₹5,000."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "You can return unopened products within 7 days of delivery. See our Return Policy page for complete details."
        },
        {
          q: "How do I return a product?",
          a: "Contact our support team with your order number. We'll arrange a free pickup for eligible returns."
        },
        {
          q: "When will I receive my refund?",
          a: "Refunds are processed within 5-7 business days after we receive the returned product."
        }
      ]
    },
    {
      category: "Products",
      questions: [
        {
          q: "Are your products 100% pure?",
          a: "Yes! All our spices and products are 100% pure with no artificial colors, preservatives, or additives."
        },
        {
          q: "Do you have organic options?",
          a: "Yes, we have a range of certified organic products. Look for the 'Organic' tag on product pages."
        },
        {
          q: "What is the shelf life of your products?",
          a: "Typically 12-18 months from the date of manufacture. Each product has a 'Best Before' date printed on the package."
        }
      ]
    },
    {
      category: "Account",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click 'Sign In' at the top, then 'Create Account'. Enter your details and you're all set!"
        },
        {
          q: "I forgot my password. What do I do?",
          a: "Click 'Forgot Password' on the login page. Enter your email and we'll send you a reset link."
        },
        {
          q: "Can I change my delivery address?",
          a: "Yes, you can add/edit addresses in 'My Account' > 'Addresses'. For placed orders, contact support immediately."
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenFAQ(openFAQ === key ? null : key);
  };

  return (
    <div className="help-page">
      <div className="help-header">
        <h1>Help Center</h1>
        <p>Find answers to common questions</p>
      </div>

      <div className="container">
        <div className="help-quick-links">
          <h2>Quick Links</h2>
          <div className="quick-links-grid">
            <Link to="/contact" className="quick-link-card">
              <h3>📧 Contact Us</h3>
              <p>Get in touch with our support team</p>
            </Link>
            <Link to="/orders" className="quick-link-card">
              <h3>📦 Track Order</h3>
              <p>Check your order status</p>
            </Link>
            <Link to="/returns" className="quick-link-card">
              <h3>↩️ Returns</h3>
              <p>Learn about our return policy</p>
            </Link>
            <Link to="/account" className="quick-link-card">
              <h3>👤 My Account</h3>
              <p>Manage your account settings</p>
            </Link>
          </div>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="faq-category">
              <h3 className="category-title">{category.category}</h3>
              {category.questions.map((faq, qIndex) => {
                const key = `${catIndex}-${qIndex}`;
                const isOpen = openFAQ === key;
                return (
                  <div key={qIndex} className="faq-item">
                    <button 
                      className="faq-question"
                      onClick={() => toggleFAQ(catIndex, qIndex)}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <FaMinus /> : <FaPlus />}
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="help-contact-section">
          <h2>Still Need Help?</h2>
          <p>Our customer support team is here to assist you!</p>
          <div className="contact-methods">
            <div className="contact-method">
              <strong>📞 Phone:</strong> +91 8619706042
            </div>
            <div className="contact-method">
              <strong>📧 Email:</strong> shreebhanwalmataindustries@gmail.com
            </div>
            <div className="contact-method">
              <strong>💬 WhatsApp:</strong> +91 8619706042
            </div>
            <div className="contact-method">
              <strong>🕒 Hours:</strong> Monday-Saturday, 9 AM - 6 PM IST
            </div>
          </div>
          <Link to="/contact" className="contact-btn">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Help;
