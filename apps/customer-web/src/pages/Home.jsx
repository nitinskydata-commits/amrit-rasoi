import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import TrustBadges from '../components/TrustBadges';
import Newsletter from '../components/Newsletter';
import AdDisplay from '../components/AdDisplay';
import { API_BASE_URL } from '../config/api';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { settings } = useSelector(state => state.settings);
  
  const [dealStrip, setDealStrip] = useState([]);
  const [newArrivalsStrip, setNewArrivalsStrip] = useState([]);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [stripLoading, setStripLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [overlayAds, setOverlayAds] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  const getCategoryDetails = (catName) => {
    return {
      title: catName,
      badge: '🔥 Popular',
      img: ''
    };
  };

  useEffect(() => {
    let cancelled = false;
    const loadStrips = async () => {
      setStripLoading(true);
      try {
        const [dealsRes, newArrivalsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/products?todaysDeal=true&limit=8`),
          axios.get(`${API_BASE_URL}/products?newArrivals=true&limit=8`)
        ]);

        if (!cancelled) {
          if (dealsRes.status === 'fulfilled') {
            setDealStrip(dealsRes.value.data?.products || []);
          } else {
            setDealStrip([]);
          }

          if (newArrivalsRes.status === 'fulfilled') {
            setNewArrivalsStrip(newArrivalsRes.value.data?.products || []);
          } else {
            setNewArrivalsStrip([]);
          }
        }
      } catch {
        if (!cancelled) {
          setDealStrip([]);
          setNewArrivalsStrip([]);
        }
      } finally {
        if (!cancelled) setStripLoading(false);
      }
    };
    loadStrips();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSlides = heroSlides;

  useEffect(() => {
    let cancelled = false;
    const fetchHeroSlides = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/ads/home-top`);
        if (!cancelled && data.success) {
          setHeroSlides(data.ads || []);
        }
      } catch (err) {
        console.error('Error fetching hero slides:', err);
      }
    };
    const fetchOverlayAds = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/ads/home-overlay`);
        if (!cancelled && data.success) {
          setOverlayAds(data.ads || []);
        }
      } catch (err) {
        console.error('Error fetching overlay ads:', err);
      }
    };
    fetchHeroSlides();
    fetchOverlayAds();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeSlides]);

  useEffect(() => {
    let cancelled = false;
    const fetchPersonalizedFeed = async () => {
      setRecsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const isLatestMode = settings?.homepageRecommendationMode === 'latest';
        
        if (isAuthenticated && !isLatestMode) {
          const { data } = await axios.get(`${API_BASE_URL}/products/personalized-feed`, config);
          if (!cancelled) setPersonalizedRecs(data.products || []);
        } else {
          const { data } = await axios.get(`${API_BASE_URL}/products?sort=-createdAt&limit=8`);
          if (!cancelled) setPersonalizedRecs(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch personalized feed:', err);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    };
    fetchPersonalizedFeed();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, settings?.homepageRecommendationMode]);

  const handleCategoryChange = (category) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  const categoriesList = Array.isArray(settings?.homepageCategories) ? settings.homepageCategories : [];
  
  const activeOverlayCards = overlayAds;

  const renderOverlayCard = (card) => {
    let subItems = null;
    if (card.items) {
      subItems = card.items;
    } else if (card.description && card.description.trim().startsWith('[')) {
      try {
        subItems = JSON.parse(card.description);
      } catch (e) {
        subItems = null;
      }
    }

    if (subItems && Array.isArray(subItems)) {
      return (
        <div className="amazon-grid-card" key={card._id}>
          <h3>{card.title}</h3>
          <div className="card-sub-grid">
            {subItems.slice(0, 4).map((item, idx) => (
              <div className="sub-grid-item" key={idx} onClick={() => handleCategoryChange(item.category || 'Spices')}>
                <img src={item.img || item.image || '/placeholder.png'} alt={item.label} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <Link to={card.link || '/search'} className="card-explore-link">
            {card.linkText || 'Explore More'}
          </Link>
        </div>
      );
    } else {
      return (
        <div className="amazon-grid-card single-feature-card" key={card._id} style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="card-bg-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${card.image?.url || '/placeholder.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1,
            transition: 'transform 0.4s ease'
          }} />
          <div className="single-card-content" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.45) 70%, rgba(0,0,0,0.1) 100%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '24px',
            color: 'white',
            textAlign: 'left'
          }}>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.3' }}>{card.title}</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>
              {card.description || 'Explore our premium selection.'}
            </p>
            <Link to={card.link || '/search'} style={{
              alignSelf: 'flex-start',
              background: '#f0c14b',
              color: '#111',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              border: '1px solid #a88734',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Shop Collection &rarr;
            </Link>
          </div>
        </div>
      );
    }
  };

  if (isAuthenticated) {
    return (
      <div className="home logged-in-home" style={{ backgroundColor: '#eaeded', minHeight: '100vh', paddingBottom: '40px' }}>


        {/* Dynamic Hero Slideshow with Amazon-style bottom fade overlay */}
        {/* Dynamic Hero Slideshow with Amazon-style bottom fade overlay */}
        {activeSlides.length > 0 ? (
          <section className="slideshow-container" style={{ height: '480px', position: 'relative', overflow: 'hidden' }}>
          {activeSlides.map((slide, idx) => (
            <div
              key={slide._id}
              className={`slide-item ${idx === currentSlideIdx ? 'active' : ''}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: idx === currentSlideIdx ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                zIndex: idx === currentSlideIdx ? 1 : 0
              }}
            >
              {slide.mediaType === 'video' ? (
                <video
                  src={slide.video?.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={slide.image?.url}
                  alt={slide.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {/* Left-side subtle gradient shading to ensure high readability */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '60%',
                background: 'linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0) 100%)',
                zIndex: 1
              }} />

              {/* Elegant Text Overlay */}
              <div className="slide-overlay-content" style={{
                position: 'absolute',
                top: '70px',
                left: '60px',
                zIndex: 2,
                color: 'white',
                maxWidth: '520px',
                padding: '0',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>
                <span className="premium-badge-label" style={{
                  background: '#febd69',
                  color: '#111',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '14px',
                  letterSpacing: '0.5px'
                }}>SBMI SPECIAL</span>
                <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '10px', lineHeight: '1.2' }}>{slide.title}</h1>
                <p style={{ fontSize: '15px', opacity: 0.95, marginBottom: '24px', lineHeight: '1.5' }}>{slide.description}</p>
                <Link to={slide.link || '/search'} style={{
                  background: '#f0c14b',
                  color: '#111',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  border: '1px solid #a88734',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  display: 'inline-block',
                  transition: '0.2s'
                }}>Shop Now</Link>
              </div>
            </div>
          ))}

          {/* Left Arrow Button */}
          {activeSlides.length > 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIdx((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
              }}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: '0',
                width: '80px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '50px',
                fontWeight: '300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s',
                outline: 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              &#10094;
            </button>
          )}

          {/* Right Arrow Button */}
          {activeSlides.length > 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIdx((prev) => (prev + 1) % activeSlides.length);
              }}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: '0',
                width: '80px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '50px',
                fontWeight: '300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s',
                outline: 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              &#10095;
            </button>
          )}

          {/* Amazon-style bottom fade gradient */}
          <div className="amazon-banner-fade" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '140px',
            background: 'linear-gradient(to top, #eaeded 0%, rgba(234, 237, 237, 0.8) 40%, rgba(234, 237, 237, 0) 100%)',
            zIndex: 3
          }} />
        </section>
        ) : (
          <section className="slideshow-container-fallback" style={{ 
            height: '480px', 
            position: 'relative', 
            overflow: 'hidden', 
            background: 'linear-gradient(135deg, #232f3e 0%, #146eb4 100%)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 60px',
            boxSizing: 'border-box'
          }}>
            {/* Ambient Shading */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '100%',
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 100%)',
              zIndex: 1
            }} />
            
            <div style={{ zIndex: 2, color: 'white', maxWidth: '600px', textShadow: '0 2px 10px rgba(0,0,0,0.4)', textAlign: 'left' }}>
              <span style={{ background: '#ff9900', color: '#111', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'inline-block', marginBottom: '14px' }}>
                Unified Marketplace
              </span>
              <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.2', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                Welcome to SBMI E-Store
              </h1>
              <p style={{ fontSize: '15px', opacity: 0.95, marginBottom: '24px', lineHeight: '1.5', color: '#cbd5e1' }}>
                Your complete all-rounder e-commerce platform. Shop from top verified sellers across electronics, home appliances, pantry goods, personal care, and more.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/search" style={{ background: '#ff9900', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
                  Browse All Products
                </Link>
                <Link to="/seller/apply" style={{ background: 'transparent', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', border: '1px solid #fff' }}>
                  Sell on SBMI &rarr;
                </Link>
              </div>
            </div>

            {/* Amazon-style bottom fade gradient */}
            <div className="amazon-banner-fade" style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '140px',
              background: 'linear-gradient(to top, #eaeded 0%, rgba(234, 237, 237, 0.8) 40%, rgba(234, 237, 237, 0) 100%)',
              zIndex: 3
            }} />
          </section>
        )}

        {/* Dynamic Multi-Row Grid System */}
        <div className="amazon-grid-container" style={{ marginTop: '-120px', position: 'relative', zIndex: 4, padding: '0 20px' }}>
          
          {/* Row 1 Grid */}
          <div className="amazon-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            
            {/* Card 1: Continue Shopping deals */}
            {settings?.homepageCards?.card1?.isActive !== false && (
              <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px 20px 15px', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                <h2 style={{ fontSize: '21px', fontWeight: '700', marginBottom: '10px', color: '#0F1111', lineHeight: '27.3px' }}>{settings?.homepageCards?.card1?.title || 'Continue shopping for'}</h2>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    const products = (personalizedRecs.length > 0 ? personalizedRecs : dealStrip).slice(0, 4);
                    return (
                      <div className="card-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '15px 15px', flexGrow: 1, minHeight: '275px' }}>
                        {products.map((p, idx) => (
                          <div key={p._id || idx} className="sub-grid-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                            <div style={{ height: '115px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                              <img src={p.image?.url || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200'} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: '#0F1111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <Link to="/search" style={{ color: '#007185', fontSize: '13px', fontWeight: '500', textDecoration: 'none', marginTop: '14px', display: 'inline-block' }}>See all recommendations</Link>
              </div>
            )}

            {/* Card 2: Hot Deals on Masalas */}
            {settings?.homepageCards?.card2?.isActive !== false && (
              <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px 20px 15px', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                <h2 style={{ fontSize: '21px', fontWeight: '700', marginBottom: '10px', color: '#0F1111', lineHeight: '27.3px' }}>{settings?.homepageCards?.card2?.title || 'Up to 60% off | Top deals'}</h2>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    const products = (dealStrip.length > 0 ? dealStrip : personalizedRecs).slice(0, 4);
                    return (
                      <div className="card-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '15px 15px', flexGrow: 1, minHeight: '275px' }}>
                        {products.map((p, idx) => (
                          <div key={p._id || idx} className="sub-grid-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                            <div style={{ height: '115px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                              <img src={p.image?.url || p.images?.[0]?.url || '/placeholder.png'} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <span style={{ backgroundColor: '#CC0C39', color: 'white', padding: '2px 4px', fontSize: '10px', fontWeight: '700', borderRadius: '2px' }}>
                                {p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 30}% off
                              </span>
                              <span style={{ color: '#CC0C39', fontSize: '10px', fontWeight: '700' }}>Limited Deal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <Link to="/deals" style={{ color: '#007185', fontSize: '13px', fontWeight: '500', textDecoration: 'none', marginTop: '14px', display: 'inline-block' }}>See all deals</Link>
              </div>
            )}

            {/* Card 3: Dynamic overlay card C */}
            {activeOverlayCards.length > 2 && renderOverlayCard(activeOverlayCards[2])}

            {/* Card 4: Dynamic overlay card D */}
            {activeOverlayCards.length > 3 && renderOverlayCard(activeOverlayCards[3])}

          </div>

          {/* Row 2 Grid */}
          <div className="amazon-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            
            {/* Card 5: Highest Discount Spice (Flipkart style horizontal strip spanning full row) */}
            {settings?.homepageCards?.dealOfDay?.isActive !== false && (
              <div className="flipkart-deal-strip" style={{ 
                gridColumn: '1 / -1', 
                backgroundColor: 'white', 
                borderRadius: '8px',
                display: 'flex', 
                flexDirection: 'column',
                zIndex: 1,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ background: '#232f3e', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'white' }}>{settings?.homepageCards?.dealOfDay?.title || 'Grab or gone'}</h2>
                  <Link to="/deals" style={{ color: '#ffd814', fontSize: '14px', textDecoration: 'none', fontWeight: '700' }}>VIEW ALL</Link>
                </div>

                <div style={{ display: 'flex', gap: '16px', padding: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {dealStrip.length > 0 ? (
                    [...dealStrip].sort((a,b) => {
                      const discA = a.mrp ? (a.mrp - a.price) / a.mrp : 0;
                      const discB = b.mrp ? (b.mrp - b.price) / b.mrp : 0;
                      return discB - discA;
                    }).slice(0, 6).map((p, idx) => (
                      <div key={p._id || idx} style={{ minWidth: '180px', maxWidth: '200px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f8', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                          <img src={p.image?.url || p.images?.[0]?.url || '/placeholder.png'} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                        </div>
                        <span style={{ fontSize: '14px', color: '#212121', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{p.name}</span>
                        <span style={{ fontSize: '15px', color: '#212121', fontWeight: '600' }}>{p.price ? `Under ₹${p.price + 10}` : 'Special offer'}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{fontSize: '14px', color: '#878787'}}>No deals available today.</p>
                  )}
                </div>
              </div>
            )}

            {/* Card 6: Dynamic overlay card A */}
            {activeOverlayCards.length > 0 && renderOverlayCard(activeOverlayCards[0])}

            {/* Card 7: Dynamic overlay card B */}
            {activeOverlayCards.length > 1 && renderOverlayCard(activeOverlayCards[1])}

            {/* Card 8: Partner Benefits & Spices Wholesale */}
            {(!settings?.bulkBusinessCard || settings.bulkBusinessCard.isActive) && (
              <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>{settings?.bulkBusinessCard?.title || 'SBMI Bulk Business'}</h3>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#444', marginBottom: '16px', lineHeight: '1.5' }}>
                    {settings?.bulkBusinessCard?.description || 'Register your business and save up to 18% GST input tax credit plus volume discounts on bulk catalog ordering!'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {settings?.bulkBusinessCard?.badge1 && <span style={{ background: 'white', border: '1px solid #ffd814', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#664d03', fontWeight: '600' }}>{settings.bulkBusinessCard.badge1}</span>}
                    {settings?.bulkBusinessCard?.badge2 && <span style={{ background: 'white', border: '1px solid #ffd814', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#664d03', fontWeight: '600' }}>{settings.bulkBusinessCard.badge2}</span>}
                  </div>
                </div>
                <Link to={settings?.bulkBusinessCard?.link || '/wholesale/apply'} style={{ alignSelf: 'flex-start', background: '#ffd814', color: '#111', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid #fcd200', textAlign: 'center', boxShadow: '0 2px 5px rgba(213,217,217,.5)' }}>
                  {settings?.bulkBusinessCard?.buttonText || 'Register Wholesale Account'}
                </Link>
              </div>
            )}

          </div>

        </div>

        {/* Dynamic Horizontal Scrolling Strips */}
        {/* Strip 1: Recommended Deals */}
        <section className="home-strip-section today-deals-carousel-section" style={{ background: '#ffffff', borderTop: '1px solid #e7ebeb', padding: '30px 20px', marginBottom: '20px' }}>
          <div className="home-strip-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>🔥 Recommended Deals for You</h2>
              <span style={{ fontSize: '12px', color: '#c7511f', fontWeight: '600' }}>{settings?.sectionHeadings?.dealsSubtitle || 'AI-calibrated loss-proof discounts based on stock, rating and trust reviews'}</span>
            </div>
            <Link to="/deals" style={{ color: '#007185', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>See all deals &rarr;</Link>
          </div>
          {stripLoading ? (
            <p>Loading deals…</p>
          ) : dealStrip.length > 0 ? (
            <div className="deals-horizontal-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
              {dealStrip.map((product) => (
                <div key={product._id} style={{ flex: '0 0 240px', minWidth: '240px' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No active deals matching your profile at the moment.</p>
          )}
        </section>

        {/* Ad Middle Banner controlled by Admin */}
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <AdDisplay position="home-middle" />
        </div>

        {/* Strip 2: Browsing History (Personalized Feed) */}
        {personalizedRecs.length > 0 && (
          <section className="home-strip-section" style={{ background: '#ffffff', padding: '30px 20px', marginBottom: '20px' }}>
            <div className="home-strip-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>{settings?.sectionHeadings?.browsingHistoryTitle || '🍂 Based on your browsing history'}</h2>
                <span style={{ fontSize: '12px', color: '#555' }}>{settings?.sectionHeadings?.browsingHistorySubtitle || 'Top recommendations curated dynamically by your trust patterns'}</span>
              </div>
              <Link to="/search" style={{ color: '#007185', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>More recommendations &rarr;</Link>
            </div>
            <div className="deals-horizontal-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
              {personalizedRecs.map((product) => (
                <div key={product._id} style={{ flex: '0 0 240px', minWidth: '240px' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Trust Bar */}
        <section className="features-section" style={{ background: 'white', padding: '40px 20px', borderTop: '1px solid #eee' }}>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {(settings?.featureBadges || [
              { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500', isActive: true },
              { icon: '✓', title: '100% Authentic', subtitle: 'Premium quality guaranteed', isActive: true },
              { icon: '↻', title: 'Easy Returns', subtitle: '7-day return policy', isActive: true },
              { icon: '🔒', title: 'Secure Payments', subtitle: 'Safe & encrypted checkout', isActive: true }
            ]).filter(b => b.isActive).map((badge, idx) => (
              <div key={idx} className="feature-card" style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{badge.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{badge.title}</h3>
                <p style={{ fontSize: '12px', color: '#555' }}>{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST BADGES & NEWSLETTER */}
        <TrustBadges />
        <Newsletter />
      </div>
    );
  }

  return (
    <div className="home">
      {/* Dynamic Hero Slideshow with arrow overlays & dynamic dots */}
      {activeSlides.length > 0 ? (
        <section className="hero-slideshow-container">
        <div className="slideshow-track">
          {activeSlides.map((slide, idx) => (
            <div
              key={slide._id || idx}
              className={`slide-item ${idx === currentSlideIdx ? 'active' : ''}`}
              style={{ display: idx === currentSlideIdx ? 'block' : 'none' }}
            >
              {slide.mediaType === 'video' ? (
                <video
                  src={slide.video?.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="hero-slide-video"
                />
              ) : (
                <img
                  src={slide.image?.url}
                  alt={slide.title}
                  className="hero-slide-image"
                />
              )}
              <div className="hero-slide-overlay">
                <div className="hero-slide-content">
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                  {slide.link && (
                    <Link to={slide.link} className="hero-slide-btn">
                      Shop Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              className="slideshow-arrow prev"
              onClick={() =>
                setCurrentSlideIdx(
                  (prev) => (prev - 1 + activeSlides.length) % activeSlides.length
                )
              }
              aria-label="Previous Slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="slideshow-arrow next"
              onClick={() =>
                setCurrentSlideIdx((prev) => (prev + 1) % activeSlides.length)
              }
              aria-label="Next Slide"
            >
              ›
            </button>
            <div className="slideshow-dots">
              {activeSlides.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === currentSlideIdx ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIdx(idx)}
                />
              ))}
            </div>
          </>
        )}
        </section>
      ) : (
        <section className="hero-slideshow-fallback" style={{ height: '350px', position: 'relative', overflow: 'hidden', background: settings?.defaultHeroGradient || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', marginBottom: '-220px' }}>
          {/* Amazon-style bottom fade gradient is built into CSS for this view, but we'll add one if needed, or rely on the grid overlapping */}
        </section>
      )}

      {/* Amazon-style Overlay Multi-Cards Grid */}
      <div className="amazon-grid-container">
        <div className="amazon-grid-row">
          {activeOverlayCards.slice(0, 4).map((card) => renderOverlayCard(card))}
        </div>
      </div>

      {/* Categories Section */}
      {categoriesList.length > 0 && (
      <section className="categories-section" style={{ padding: '60px 0', background: '#fcfcfc' }}>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '26px', fontWeight: '700', marginBottom: '28px', color: '#0f1111' }}>Shop by Category</h2>
          <div className="categories-grid">
            {categoriesList.map((cat, idx) => {
              const isString = typeof cat === 'string';
              const catName = isString ? cat.trim() : (cat.category || cat.title || '');
              const details = isString ? getCategoryDetails(catName) : cat;
              return (
                <motion.div
                  key={catName || idx}
                  className="premium-category-card"
                  onClick={() => handleCategoryChange(catName)}
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="category-bg-image" style={{ backgroundImage: `url('${details.img || details.image?.url || ''}')` }}></div>
                  <div className="category-card-overlay">
                    <span className="category-card-badge">{details.badge || '🔥 Popular'}</span>
                    <h3>{details.title || catName}</h3>
                    <span className="category-card-action">Browse Collection &rarr;</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Middle Banner Ad Spot controlled by admin */}
      <AdDisplay position="home-middle" />

      {/* Recommended for You Personalized Feed */}
      {personalizedRecs.length > 0 && (
        <section className="home-strip-section" style={{ background: '#ffffff', borderTop: '1px solid #f0f0f0' }}>
          <div className="container">
            <div className="home-strip-head">
              <h2>Recommended for You</h2>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Personalized matches based on your interests</span>
            </div>
            {recsLoading ? (
              <p className="home-strip-empty">Loading recommendations…</p>
            ) : (
              <div className="home-strip-grid">
                {personalizedRecs.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TODAY'S DEALS - LOWER POSITIONED SLEEK CAROUSEL STRIP */}
      <section className="home-strip-section today-deals-carousel-section" style={{ background: '#f7fafa', borderTop: '1px solid #e7ebeb', padding: '40px 0' }}>
        <div className="container">
          <div className="home-strip-head">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: 0 }}>
                {settings?.homepageDealsHeader || '🔥 SBMI Smart Deals | Handpicked Offers'}
              </h2>
              <span style={{ fontSize: '13px', color: '#c7511f', fontWeight: '600' }}>AI-calibrated smart discounts based on inventory levels, vendor performance, and customer reviews</span>
            </div>
            <Link to="/deals" style={{ color: '#007185', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>See all deals</Link>
          </div>
          
          {stripLoading ? (
            <p className="home-strip-empty">Loading deals…</p>
          ) : dealStrip.length > 0 ? (
            <div className="deals-horizontal-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
              {dealStrip.map((product) => (
                <div key={product._id} style={{ flex: '0 0 260px', minWidth: '260px' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className="home-strip-empty">
              No deals yet — your admin can add products and enable <strong>Today&apos;s Deal</strong> in the admin panel.
            </p>
          )}
        </div>
      </section>

      {/* NEW ARRIVALS STRIP (Fallback if products exist but not in deals) */}
      {(newArrivalsStrip.length > 0) && (
        <section className="home-strip-section new-arrivals-carousel-section" style={{ background: '#ffffff', borderTop: '1px solid #e7ebeb', padding: '40px 0' }}>
          <div className="container">
            <div className="home-strip-head">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: 0 }}>
                  🌟 New Arrivals
                </h2>
                <span style={{ fontSize: '13px', color: '#007185', fontWeight: '600' }}>Freshly stocked premium products</span>
              </div>
              <Link to="/new-arrivals" style={{ color: '#007185', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>See all arrivals</Link>
            </div>
            
            <div className="deals-horizontal-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
              {newArrivalsStrip.map((product) => (
                <div key={product._id} style={{ flex: '0 0 260px', minWidth: '260px' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {(settings?.featureBadges || [
              { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500', isActive: true },
              { icon: '✓', title: '100% Authentic', subtitle: 'Premium quality guaranteed', isActive: true },
              { icon: '↻', title: 'Easy Returns', subtitle: '7-day return policy', isActive: true },
              { icon: '🔒', title: 'Secure Payments', subtitle: 'Safe & encrypted checkout', isActive: true }
            ]).filter(b => b.isActive).map((badge, idx) => (
              <motion.div key={idx} className="feature-card" whileHover={{ y: -5 }}>
                <div className="feature-icon">{badge.icon}</div>
                <h3>{badge.title}</h3>
                <p>{badge.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES, TESTIMONIALS & NEWSLETTER */}
      <TrustBadges />
      <Testimonials />
      <Newsletter />
    </div>
  );
};

export default Home;
