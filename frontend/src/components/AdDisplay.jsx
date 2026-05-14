import React, { useState, useEffect } from 'react';
import { getActiveAdsByPosition } from '../utils/api';
import './AdDisplay.css';

const AdDisplay = ({ position }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await getActiveAdsByPosition(position);
        if (response.success) {
          setAds(response.ads);
        }
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position]);

  if (loading || ads.length === 0) return null;

  return (
    <div className={`ad-container ad-${position}`}>
      {ads.map((ad) => (
        <a 
          key={ad._id} 
          href={ad.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="ad-item"
          title={ad.title}
        >
          <img src={ad.image?.url} alt={ad.title} className="ad-image" />
          {ad.title && <div className="ad-overlay"><h3>{ad.title}</h3></div>}
        </a>
      ))}
    </div>
  );
};

export default AdDisplay;
