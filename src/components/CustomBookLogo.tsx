import React from 'react';

interface CustomBookLogoProps {
  className?: string;
  strokeWidth?: number;
}

export const CustomBookLogo: React.FC<CustomBookLogoProps> = ({ 
  className = "w-6 h-6", 
  strokeWidth = 2.5 
}) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Left Page */}
      <path d="M12 18.5c-2-1.5-5-1.5-8-1.5V5c3 0 6 0 8 1.5v12z" />
      {/* Right Page */}
      <path d="M12 18.5c2-1.5 5-1.5 8-1.5V5c-3 0-6 0-8 1.5v12z" />
    </svg>
  );
};
