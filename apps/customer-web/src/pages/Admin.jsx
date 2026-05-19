import React from 'react';
import { Link } from 'react-router-dom';

const Admin = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center', minHeight: '60vh' }}>
      <h1>Admin Dashboard</h1>
      <p style={{ marginTop: '20px', fontSize: '18px' }}>
        The administrative functions for this application are managed in a separate Admin application.
      </p>
      <div style={{ marginTop: '40px' }}>
        <a 
          href="http://localhost:3002" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          Go to Admin Dashboard Portal
        </a>
      </div>
      <p style={{ marginTop: '20px', color: '#666' }}>
        (Ensure the admin server is running)
      </p>
    </div>
  );
};

export default Admin;
