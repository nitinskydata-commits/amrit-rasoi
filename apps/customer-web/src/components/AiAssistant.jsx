import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './AiAssistant.css';

const AiAssistant = () => {
  const { settings } = useSelector(state => state.settings);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Products cache for local search
  const [productsCache, setProductsCache] = useState([]);

  useEffect(() => {
    // Only load if enabled
    if (settings?.aiAssistantEnabled === false) return;
    
    // Initialize greeting
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: settings?.aiAssistantGreeting || "Hi! I'm your SBMI shopping assistant. How can I help you find the perfect spices today?",
          timestamp: new Date()
        }
      ]);
    }

    // Fetch products for local search
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products`);
        if (res.data && res.data.products) {
          setProductsCache(res.data.products);
        }
      } catch (err) {
        console.error('Failed to fetch products for AI assistant', err);
      }
    };
    fetchProducts();
  }, [settings, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (settings?.aiAssistantEnabled === false) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input.trim();
    setInput('');
    
    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate network delay for realistic "thinking"
    setTimeout(() => {
      generateResponse(userText);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const generateResponse = (query) => {
    const q = query.toLowerCase();
    let responseText = '';
    let productLink = null;

    // 1. Policy & Info matching
    if (q.includes('shipping') || q.includes('delivery')) {
      responseText = `We offer ${settings?.featureBadges?.[0]?.title || 'Fast Delivery'}! Most orders are delivered within 3-5 business days.`;
    } 
    else if (q.includes('return') || q.includes('refund')) {
      responseText = `We have a ${settings?.featureBadges?.[2]?.subtitle || '7-day hassle-free return policy'}. You can request a return from your Orders page.`;
    }
    else if (q.includes('wholesale') || q.includes('bulk') || q.includes('business')) {
      responseText = settings?.bulkBusinessCard?.description || 'You can register a business account with us to get up to 18% GST input tax credit and bulk discounts!';
      productLink = { label: 'Register Wholesale', url: '/login' };
    }
    else if (q.includes('contact') || q.includes('support')) {
      responseText = `You can reach our support team at ${settings?.supportEmail || 'support@sbmi.com'} or call us at ${settings?.supportPhone || '+91 XXXX XXXX'}.`;
    }
    // 2. Product matching
    else {
      // Find matching products
      const matches = productsCache.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );

      if (matches.length > 0) {
        const topMatch = matches[0];
        responseText = `I found ${matches.length} product(s) for "${query}". Our top match is ${topMatch.name}.`;
        productLink = { label: `View ${topMatch.name}`, url: `/product/${topMatch.slug || topMatch._id}` };
      } else {
        responseText = "I couldn't find exactly what you're looking for. Try searching for specific spices like 'turmeric', 'cardamom', or 'garam masala'.";
      }
    }

    setIsTyping(false);
    setMessages(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        type: 'bot', 
        text: responseText, 
        link: productLink,
        timestamp: new Date() 
      }
    ]);
  };

  return (
    <div className="ai-assistant-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ai-assistant-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="ai-assistant-header">
              <div className="ai-header-info">
                <div className="ai-avatar">✨</div>
                <div>
                  <h3>SBMI Assistant</h3>
                  <span className="online-status">Online</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
            
            <div className="ai-assistant-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                  {msg.type === 'bot' && <div className="message-avatar">✨</div>}
                  <div className={`message-bubble ${msg.type}`}>
                    <p>{msg.text}</p>
                    {msg.link && (
                      <button 
                        className="message-action-btn"
                        onClick={() => {
                          navigate(msg.link.url);
                          setIsOpen(false);
                        }}
                      >
                        {msg.link.label}
                      </button>
                    )}
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-wrapper bot">
                  <div className="message-avatar">✨</div>
                  <div className="message-bubble bot typing">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-assistant-input">
              <input 
                type="text" 
                placeholder="Ask about spices, delivery, bulk orders..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className={`ai-assistant-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? '×' : '✨'}
      </motion.button>
    </div>
  );
};

export default AiAssistant;
