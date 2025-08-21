// src/components/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ level, xp, gems }) => {
  const xpPercentage = (xp / 100) * 100; // Assuming 100 XP to level up for now

  return (
    <div className="header">
      <div className="profile">
        <div className="level">Level {level}</div>
        <div className="xp-bar">
          <div className="xp-progress" style={{ width: `${xpPercentage}%` }}></div>
        </div>
      </div>
      <div className="currency">
        <span className="gem-icon">💎</span>
        <span className="gem-count">{gems}</span>
      </div>
    </div>
  );
};

export default Header;
