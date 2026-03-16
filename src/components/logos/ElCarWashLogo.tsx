import React from "react";

interface ElCarWashLogoProps {
  height?: number;
  className?: string;
}

export function ElCarWashLogo({ height = 40, className = "" }: ElCarWashLogoProps) {
  return (
    <div className={`flex items-center ${className}`} style={{ height }}>
      <svg
        width={height * 3}
        height={height}
        viewBox="0 0 180 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Car wash water drops */}
        <circle cx="12" cy="12" r="4" fill="#22D3EE" opacity="0.8">
          <animate attributeName="cy" values="12;16;12" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="8" r="4" fill="#3ECF8E" opacity="0.8">
          <animate attributeName="cy" values="8;12;8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="10" r="4" fill="#60A5FA" opacity="0.8">
          <animate attributeName="cy" values="10;14;10" dur="2.2s" repeatCount="indefinite" />
        </circle>

        {/* "El" */}
        <text
          x="45"
          y="38"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontSize="32"
          fontWeight="800"
          fill="#3ECF8E"
        >
          El
        </text>

        {/* "Car Wash" */}
        <text
          x="75"
          y="38"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontSize="32"
          fontWeight="800"
          fill="#FFFFFF"
        >
          Car Wash
        </text>

        {/* Underline accent */}
        <rect x="45" y="44" width="130" height="3" fill="url(#elcarwash-gradient)" rx="1.5" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="elcarwash-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3ECF8E" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
