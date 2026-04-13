import React from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

const ComingSoon = ({ title }) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <h1>🚧 Coming Soon</h1>
        <p>{title || 'This page'} is under construction</p>
        <p>We're working hard to bring you this feature soon!</p>
        <Link to="/" className="back-home-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
