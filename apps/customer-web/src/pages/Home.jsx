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
  
  const [dealStrip, setDealStrip] = useState([]);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [stripLoading, setStripLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [overlayAds, setOverlayAds] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadStrips = async () => {
      setStripLoading(true);
      try {
        const dealsRes = await axios.get(`${API_BASE_URL}/products?todaysDeal=true&limit=8`);
        if (!cancelled) {
          setDealStrip(dealsRes.data?.products || []);
        }
      } catch {
        if (!cancelled) {
          setDealStrip([]);
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

  const defaultSlides = [
    {
      _id: 'default-1',
      title: 'Premium Handpicked Organic Spices',
      description: 'Sourced directly from authentic Indian spice farms.',
      image: { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1600' },
      link: '/search?category=Spices',
      mediaType: 'image'
    },
    {
      _id: 'default-2',
      title: 'Traditional Masala Blends',
      description: 'Hand-crafted recipes passed down through generations.',
      image: { url: 'https://images.unsplash.com/photo-1532336414038-cf190733eb37?auto=format&fit=crop&q=80&w=1600' },
      link: '/search?category=Blends',
      mediaType: 'image'
    },
    {
      _id: 'default-3',
      title: '100% Pure & Cold Pressed Oils',
      description: 'Zero additives, rich organic nutrients intact.',
      image: { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=1600' },
      link: '/search?category=Organic',
      mediaType: 'image'
    }
  ];

  const activeSlides = heroSlides.length > 0 ? heroSlides : defaultSlides;

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
        if (isAuthenticated) {
          const { data } = await axios.get(`${API_BASE_URL}/products/personalized-feed`, config);
          if (!cancelled) setPersonalizedRecs(data.products || []);
        } else {
          const { data } = await axios.get(`${API_BASE_URL}/products?sort=rating&limit=8`);
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
  }, [isAuthenticated]);

  const handleCategoryChange = (category) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  const defaultOverlayCards = [
    {
      _id: 'default-card-1',
      title: 'Spices & Herbs | Up to 40% Off',
      description: 'Whole Spices, Powders, Seeds & Herbs',
      image: { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400' },
      link: '/search?category=Spices',
      linkText: 'Shop Premium Spices',
      mediaType: 'image',
      items: [
        { label: 'Whole Spices', category: 'Spices', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300' },
        { label: 'Spice Powders', category: 'Powders', img: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=300' },
        { label: 'Aromatic Seeds', category: 'Seeds', img: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=300' },
        { label: 'Herbal Infusions', category: 'Herbs', img: 'https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?auto=format&fit=crop&q=80&w=300' }
      ]
    },
    {
      _id: 'default-card-2',
      title: 'Pantry Essentials | Fresh & Pure',
      description: 'Basmati Rice, Forest Honey, Pure Ghee & Pressed Oils',
      image: { url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
      link: '/search?category=Organic',
      linkText: 'Browse Pantry Range',
      mediaType: 'image',
      items: [
        { label: 'Basmati Rice', category: 'Organic', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300' },
        { label: 'Forest Honey', category: 'Organic', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=300' },
        { label: 'Pure Ghee', category: 'Organic', img: 'https://images.unsplash.com/photo-1622484211148-716598e09141?auto=format&fit=crop&q=80&w=300' },
        { label: 'Pressed Oils', category: 'Organic', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300' }
      ]
    },
    {
      _id: 'default-card-3',
      title: 'Superfoods & Healthy Snacks',
      description: 'Nuts, Makhana, Teas & Seeds',
      image: { url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=400' },
      link: '/search?category=Organic',
      linkText: 'Explore Healthy Foods',
      mediaType: 'image',
      items: [
        { label: 'Dry Fruits & Nuts', category: 'Organic', img: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=300' },
        { label: 'Organic Makhana', category: 'Organic', img: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=300' },
        { label: 'Herbal Teas', category: 'Herbs', img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300' },
        { label: 'Super Seeds', category: 'Organic', img: 'https://images.unsplash.com/photo-1568644365101-527c18005f01?auto=format&fit=crop&q=80&w=300' }
      ]
    },
    {
      _id: 'default-card-4',
      title: 'SBMI Bulk Business | Save Big',
      description: 'Catering, Hampers, Logistics & Partner Benefits',
      image: { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400' },
      link: '/login',
      linkText: 'Create Free Account',
      mediaType: 'image',
      items: [
        { label: 'Catering Packs', category: 'Organic', img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=300' },
        { label: 'Gourmet Hampers', category: 'Organic', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300' },
        { label: 'Supply Chain', category: 'Organic', img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=300' },
        { label: 'Partner Benefits', category: 'Organic', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300' }
      ]
    }
  ];

  const activeOverlayCards = overlayAds.length > 0 ? overlayAds : defaultOverlayCards;

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
                <img src={item.img || item.image || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300'} alt={item.label} />
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
            backgroundImage: `url(${card.image?.url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400'})`,
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
        {/* Sleek Subheader Navigation Bar (Amazon-style) */}
        <div className="amazon-subheader" style={{ backgroundColor: '#232f3e', color: 'white', padding: '8px 20px', fontSize: '13px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>🌶️ SBMI Spices</span>
          <span style={{ cursor: 'pointer', color: '#ddd' }} onClick={() => handleCategoryChange('Spices')}>Whole Spices</span>
          <span style={{ cursor: 'pointer', color: '#ddd' }} onClick={() => handleCategoryChange('Powders')}>Ground Powders</span>
          <span style={{ cursor: 'pointer', color: '#ddd' }} onClick={() => handleCategoryChange('Blends')}>Gourmet Blends</span>
          <span style={{ cursor: 'pointer', color: '#ddd' }} onClick={() => handleCategoryChange('Organic')}>Organic Pantry</span>
          <span style={{ cursor: 'pointer', marginLeft: 'auto', color: '#febd69', fontWeight: '700' }}>🔥 Festive Spice Sale | Up to 60% Off</span>
        </div>

        {/* Dynamic Hero Slideshow with Amazon-style bottom fade overlay */}
        <section className="slideshow-container" style={{ height: '380px', position: 'relative', overflow: 'hidden' }}>
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
              {/* Overlay card */}
              <div className="slide-overlay-content" style={{
                position: 'absolute',
                top: '40px',
                left: '60px',
                zIndex: 2,
                color: 'white',
                maxWidth: '480px',
                background: 'rgba(0,0,0,0.45)',
                padding: '24px',
                borderRadius: '8px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span className="premium-badge-label" style={{
                  background: '#f0c14b',
                  color: '#111',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>AMRIT RASOI SPECIAL</span>
                <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>{slide.title}</h1>
                <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>{slide.description}</p>
                <Link to={slide.link || '/search'} style={{
                  background: '#f0c14b',
                  color: '#111',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  border: '1px solid #a88734'
                }}>Shop Now</Link>
              </div>
            </div>
          ))}
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

        {/* Dynamic Multi-Row Grid System */}
        <div className="amazon-grid-container" style={{ marginTop: '-120px', position: 'relative', zIndex: 4, padding: '0 20px' }}>
          
          {/* Row 1 Grid */}
          <div className="amazon-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            
            {/* Card 1: Continue Shopping deals */}
            <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#111' }}>Continue Shopping Deals</h3>
              <div className="card-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexGrow: 1 }}>
                {(personalizedRecs.length > 0 ? personalizedRecs : dealStrip).slice(0, 4).map((p, idx) => (
                  <div key={p._id || idx} className="sub-grid-item" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f7f7f7', borderRadius: '4px', padding: '8px' }}>
                      <img src={p.image?.url || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200'} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#c7511f', fontWeight: '700', display: 'block', marginTop: '4px' }}>
                      {p.price ? `₹${p.price}` : 'Special'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{p.name}</span>
                  </div>
                ))}
              </div>
              <Link to="/search" style={{ color: '#007185', fontSize: '13px', fontWeight: '600', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>See all recommendations</Link>
            </div>

            {/* Card 2: Hot Deals on Masalas */}
            <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#111' }}>SBMI Hot Deals</h3>
              <div className="card-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexGrow: 1 }}>
                {(dealStrip.length > 0 ? dealStrip : personalizedRecs).slice(0, 4).map((p, idx) => (
                  <div key={p._id || idx} className="sub-grid-item" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate(`/product/${p.slug || p._id}`)}>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f7f7f7', borderRadius: '4px', padding: '8px' }}>
                      <img src={p.image?.url || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=200'} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#b12704', fontWeight: '700', display: 'block', marginTop: '4px' }}>
                      Min. {p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 30}% Off
                    </span>
                    <span style={{ fontSize: '10px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{p.name}</span>
                  </div>
                ))}
              </div>
              <Link to="/deals" style={{ color: '#007185', fontSize: '13px', fontWeight: '600', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>Shop all spices deals</Link>
            </div>

            {/* Card 3: Dynamic overlay card C */}
            {activeOverlayCards.length > 2 ? renderOverlayCard(activeOverlayCards[2]) : renderOverlayCard(defaultOverlayCards[2])}

            {/* Card 4: Dynamic overlay card D */}
            {activeOverlayCards.length > 3 ? renderOverlayCard(activeOverlayCards[3]) : renderOverlayCard(defaultOverlayCards[3])}

          </div>

          {/* Row 2 Grid */}
          <div className="amazon-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            
            {/* Card 5: Highest Discount Spice (Dynamic Deal of the Day) */}
            <div className="amazon-grid-card single-feature-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>Deal of the Day</h3>
              {dealStrip.length > 0 ? (() => {
                const maxDiscountSpice = [...dealStrip].sort((a,b) => {
                  const discA = a.mrp ? (a.mrp - a.price) / a.mrp : 0;
                  const discB = b.mrp ? (b.mrp - b.price) / b.mrp : 0;
                  return discB - discA;
                })[0];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate(`/product/${maxDiscountSpice.slug || maxDiscountSpice._id}`)}>
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#fcfcfc', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                      <img src={maxDiscountSpice.image?.url || maxDiscountSpice.images?.[0]?.url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400'} alt={maxDiscountSpice.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ backgroundColor: '#cc0c39', color: 'white', padding: '4px 8px', fontSize: '11px', fontWeight: '800', borderRadius: '2px' }}>
                        {maxDiscountSpice.mrp ? Math.round(((maxDiscountSpice.mrp - maxDiscountSpice.price) / maxDiscountSpice.mrp) * 100) : 40}% OFF
                      </span>
                      <span style={{ color: '#cc0c39', fontSize: '12px', fontWeight: '700' }}>Smart Deal of the Day</span>
                    </div>
                    <h4 style={{ fontSize: '14px', color: '#111', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{maxDiscountSpice.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>₹{maxDiscountSpice.price}</span>
                      <span style={{ fontSize: '12px', color: '#565959', textDecoration: 'line-through' }}>M.R.P: ₹{maxDiscountSpice.mrp || maxDiscountSpice.price + 99}</span>
                    </div>
                  </div>
                );
              })() : (
                <p style={{ fontSize: '13px', color: '#666' }}>No active deals today. Check back later!</p>
              )}
            </div>

            {/* Card 6: Dynamic overlay card A */}
            {activeOverlayCards.length > 0 ? renderOverlayCard(activeOverlayCards[0]) : renderOverlayCard(defaultOverlayCards[0])}

            {/* Card 7: Dynamic overlay card B */}
            {activeOverlayCards.length > 1 ? renderOverlayCard(activeOverlayCards[1]) : renderOverlayCard(defaultOverlayCards[1])}

            {/* Card 8: Partner Benefits & Spices Wholesale */}
            <div className="amazon-grid-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>SBMI Bulk Business</h3>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '13px', color: '#444', marginBottom: '16px', lineHeight: '1.5' }}>
                  Register your business and save up to <strong>18% GST input tax credit</strong> plus volume discounts on bulk masala ordering!
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: 'white', border: '1px solid #ffd814', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#664d03', fontWeight: '600' }}>⚡ GST Invoice</span>
                  <span style={{ background: 'white', border: '1px solid #ffd814', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#664d03', fontWeight: '600' }}>📦 Catering Packs</span>
                </div>
              </div>
              <Link to="/login" style={{ alignSelf: 'flex-start', background: '#ffd814', color: '#111', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid #fcd200', textAlign: 'center', boxShadow: '0 2px 5px rgba(213,217,217,.5)' }}>
                Register Wholesale Account
              </Link>
            </div>

          </div>

        </div>

        {/* Dynamic Horizontal Scrolling Strips */}
        {/* Strip 1: Recommended Deals */}
        <section className="home-strip-section today-deals-carousel-section" style={{ background: '#ffffff', borderTop: '1px solid #e7ebeb', padding: '30px 20px', marginBottom: '20px' }}>
          <div className="home-strip-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>🔥 Recommended Spices Deals for You</h2>
              <span style={{ fontSize: '12px', color: '#c7511f', fontWeight: '600' }}>AI-calibrated loss-proof discounts based on stock, rating and trust reviews</span>
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
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>🍂 Based on your browsing history</h2>
                <span style={{ fontSize: '12px', color: '#555' }}>Top recommendations curated dynamically by your trust patterns</span>
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
            <div className="feature-card" style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚚</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Free Delivery</h3>
              <p style={{ fontSize: '12px', color: '#555' }}>On orders above ₹500</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>100% Authentic</h3>
              <p style={{ fontSize: '12px', color: '#555' }}>Premium spice farm sourcing</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>↻</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Easy Returns</h3>
              <p style={{ fontSize: '12px', color: '#555' }}>7-day hassle-free policy</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Secure Payments</h3>
              <p style={{ fontSize: '12px', color: '#555' }}>Safe & encrypted transactions</p>
            </div>
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

      {/* Amazon-style Overlay Multi-Cards Grid */}
      <div className="amazon-grid-container">
        <div className="amazon-grid-row">
          {activeOverlayCards.slice(0, 4).map((card) => renderOverlayCard(card))}
        </div>
      </div>

      {/* Categories Section */}
      <section className="categories-section" style={{ padding: '60px 0', background: '#fcfcfc' }}>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '26px', fontWeight: '700', marginBottom: '28px', color: '#0f1111' }}>Shop by Category</h2>
          <div className="categories-grid">
            
            {/* SPICES */}
            <motion.div
              className="premium-category-card"
              onClick={() => handleCategoryChange('Spices')}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-bg-image" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400')` }}></div>
              <div className="category-card-overlay">
                <span className="category-card-badge">🌶️ Hot Deals</span>
                <h3>Premium Spices</h3>
                <span className="category-card-action">Browse Collection &rarr;</span>
              </div>
            </motion.div>

            {/* POWDERS */}
            <motion.div
              className="premium-category-card"
              onClick={() => handleCategoryChange('Powders')}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-bg-image" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=400')` }}></div>
              <div className="category-card-overlay">
                <span className="category-card-badge">🧂 Pure Ground</span>
                <h3>Spice Powders</h3>
                <span className="category-card-action">Browse Collection &rarr;</span>
              </div>
            </motion.div>

            {/* BLENDS */}
            <motion.div
              className="premium-category-card"
              onClick={() => handleCategoryChange('Blends')}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-bg-image" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1532336414038-cf190733eb37?auto=format&fit=crop&q=80&w=400')` }}></div>
              <div className="category-card-overlay">
                <span className="category-card-badge">🥘 Rich Masalas</span>
                <h3>Gourmet Blends</h3>
                <span className="category-card-action">Browse Collection &rarr;</span>
              </div>
            </motion.div>

            {/* ORGANIC */}
            <motion.div
              className="premium-category-card"
              onClick={() => handleCategoryChange('Organic')}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-bg-image" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400')` }}></div>
              <div className="category-card-overlay">
                <span className="category-card-badge">🌿 100% Organic</span>
                <h3>Organic Pantry</h3>
                <span className="category-card-action">Browse Collection &rarr;</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

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
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: 0 }}>🔥 SBMI Smart Deals | Spices & Pantry</h2>
              <span style={{ fontSize: '13px', color: '#c7511f', fontWeight: '600' }}>AI-calibrated loss-proof discounts based on stock levels, seller ratings, and trust reviews</span>
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

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">🚚</div>
              <h3>Free Delivery</h3>
              <p>On orders above ₹500</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">✓</div>
              <h3>100% Authentic</h3>
              <p>Premium quality guaranteed</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">↻</div>
              <h3>Easy Returns</h3>
              <p>7-day return policy</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>Safe & encrypted checkout</p>
            </motion.div>
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
