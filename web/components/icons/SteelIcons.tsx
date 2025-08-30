import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// Welding Helmet Icon
export const WeldingHelmetIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for welding helmet - replace with designer SVG */}
    <path
      d="M12 2C9 2 6 4 6 7V14C6 16 7 18 9 19V21C9 21.5 9.5 22 10 22H14C14.5 22 15 21.5 15 21V19C17 18 18 16 18 14V7C18 4 15 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="8"
      y="8"
      width="8"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
)

// Beam Connection Icon
export const BeamConnectionIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for beam connection - replace with designer SVG */}
    <path
      d="M4 12H20M4 8H8M16 8H20M4 16H8M16 16H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
)

// Spud Wrench Icon
export const SpudWrenchIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for spud wrench - replace with designer SVG */}
    <path
      d="M12 2L10 4L14 8L20 2L18 0L16 2L14 4M10 8L2 16L4 18L6 20L8 22L16 14L12 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 18L8 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Column Base Plate Icon
export const ColumnBasePlateIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for column base plate - replace with designer SVG */}
    <rect
      x="8"
      y="4"
      width="8"
      height="12"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="4"
      y="16"
      width="16"
      height="4"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
    <circle cx="18" cy="18" r="1" fill="currentColor" />
  </svg>
)

// Torch Cut Sparks Icon
export const TorchCutIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for torch cut sparks - replace with designer SVG */}
    <path
      d="M16 4L8 12L10 14L18 6L16 4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 11L5 13M8 14L6 16M11 15L9 17M14 16L12 18M17 17L15 19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
)

// Ironworker Silhouette Icon
export const IronworkerIcon: React.FC<IconProps> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Placeholder for ironworker silhouette - replace with designer SVG */}
    <circle cx="12" cy="5" r="2" fill="currentColor" />
    <path
      d="M12 8C10 8 8 9 8 11V13L6 15V22H10V18L12 16L14 18V22H18V15L16 13V11C16 9 14 8 12 8Z"
      fill="currentColor"
    />
    <path
      d="M7 13L4 11M17 13L20 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Animated versions for hover effects
export const WeldingSparkIcon: React.FC<
  IconProps & { isAnimating?: boolean }
> = ({ className = '', size = 24, isAnimating = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g className={isAnimating ? 'animate-pulse' : ''}>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 5V8M12 16V19M5 12H8M16 12H19M7.5 7.5L9.5 9.5M14.5 14.5L16.5 16.5M7.5 16.5L9.5 14.5M14.5 9.5L16.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={isAnimating ? '1' : '0.3'}
        className={isAnimating ? 'animate-ping' : ''}
      />
    </g>
  </svg>
)

export const BoltTighteningIcon: React.FC<
  IconProps & { isAnimating?: boolean }
> = ({ className = '', size = 24, isAnimating = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g className={isAnimating ? 'animate-spin' : ''}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 4L10 2M12 4L14 2M12 20L10 22M12 20L14 22M4 12L2 10M4 12L2 14M20 12L22 10M20 12L22 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

export const BeamLiftingIcon: React.FC<
  IconProps & { isAnimating?: boolean }
> = ({ className = '', size = 24, isAnimating = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g
      className={isAnimating ? 'translate-y-[-2px]' : ''}
      style={{ transition: 'transform 0.3s ease' }}
    >
      <rect
        x="6"
        y="12"
        width="12"
        height="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M12 12V6M10 8L12 6L14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isAnimating ? 'animate-pulse' : ''}
      />
    </g>
  </svg>
)
