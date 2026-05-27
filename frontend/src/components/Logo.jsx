import React from 'react';

export default function Logo({ size = 24, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 162 162" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background shield base (dark blue) */}
      <path 
        d="M81 12L20 26V62.5C20 120 81 147 81 147C81 147 142 120 142 62.5V26L81 12Z" 
        fill="#1E5C9A" 
      />
      {/* Lighter blue left half for 3D effect */}
      <path 
        d="M81 12L20 26V62.5C20 120 81 147 81 147V12Z" 
        fill="#2673BF" 
      />
      
      {/* Top network icon connecting lines */}
      <path d="M57 44L81 33L105 44" stroke="#8ab4f8" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      
      {/* Top network icon (light blue dots) */}
      <circle cx="57" cy="44" r="7" fill="#8ab4f8" />
      <circle cx="105" cy="44" r="7" fill="#8ab4f8" />
      <circle cx="81" cy="33" r="7" fill="#8ab4f8" />
      
      {/* 3 horizontal lines (white) */}
      <rect x="52" y="62" width="58" height="9" rx="4.5" fill="#ffffff" />
      <rect x="52" y="82" width="44" height="9" rx="4.5" fill="#ffffff" />
      <rect x="52" y="102" width="30" height="9" rx="4.5" fill="#ffffff" />
    </svg>
  );
}
