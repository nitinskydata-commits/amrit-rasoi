import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Navbar = () => {
  const { settings } = useSelector(state => state.settings || {});

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          {settings?.companyLogo?.url ? (
            <img 
              src={settings.companyLogo.url} 
              alt="SBMI Logo" 
              style={{ height: '50px', objectFit: 'contain' }} 
            />
          ) : (
            <h2>SBMI - Amrit Rasoi</h2>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
