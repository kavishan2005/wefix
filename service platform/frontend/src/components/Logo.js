import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium', centered = false }) => {
  const getSize = () => {
    switch(size) {
      case 'small': return '50px';
      case 'medium': return '80px';
      case 'large': return '120px';
      default: return '80px';
    }
  };

  return (
    <div className={`logo-container ${centered ? 'centered' : ''}`}>
      <div className="logo-circle" style={{ width: getSize(), height: getSize() }}>
        <span className="logo-letter">W</span>
      </div>
      <div className="logo-text">
        <h1 className="logo-title">WeFix</h1>
        <span className="logo-subtitle">Service Platform</span>
      </div>
    </div>
  );
};

export default Logo;
