import React from 'react';

export const StatusBadge = ({ info }) => (
  <div className={`stat-badge ${info.className}`}>
    {info.icon} {info.label}
  </div>
);

export const StatusText = ({ info, subText }) => (
  <div className="status-col">
    <span className={info.color}>{info.icon} {info.label}</span>
    {subText && <span className={`sub-${info.color}`} title={subText}>{subText.substring(0, 35)}...</span>}
  </div>
);