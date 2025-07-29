import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// Hard Hat Silhouette Icon
export const HardHatIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Hard hat silhouette */}
    <path
      d="M12 3C8 3 4 5 4 9C4 10 4 11 4 12C4 13 4 14 4 14H20C20 14 20 13 20 12C20 11 20 10 20 9C20 5 16 3 12 3Z"
      fill="currentColor"
    />
    <path
      d="M6 14H8V16C8 16.5 8.5 17 9 17H15C15.5 17 16 16.5 16 16V14H18V18C18 19 17 20 16 20H8C7 20 6 19 6 18V14Z"
      fill="currentColor"
    />
    <path
      d="M10 6H14V8H10V6Z"
      fill="currentColor"
      opacity="0.3"
    />
  </svg>
)

// I-beam with Crane Hook Icon
export const IBeamCraneIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Crane hook */}
    <path
      d="M12 2V6M10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Cable */}
    <line
      x1="12"
      y1="6"
      x2="12"
      y2="10"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="1 1"
    />
    {/* I-beam */}
    <path
      d="M6 10H18M6 10V12H8V16H6V18H18V16H16V12H18V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <rect x="8" y="12" width="8" height="4" fill="currentColor" opacity="0.2" />
  </svg>
)

// Welding Torch with Spark Icon
export const WeldingTorchIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Torch handle */}
    <path
      d="M14 16L18 12L16 10L12 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Torch tip */}
    <path
      d="M11 15L9 17C8.5 17.5 8.5 18.5 9 19C9.5 19.5 10.5 19.5 11 19L13 17"
      fill="currentColor"
    />
    {/* Sparks */}
    <circle cx="8" cy="16" r="1" fill="currentColor" opacity="0.8" />
    <circle cx="6" cy="18" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="7" cy="19" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="5" cy="17" r="0.5" fill="currentColor" opacity="0.4" />
    <path
      d="M9 18L7 20M10 17L8 19M8 17L6 19"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.6"
      strokeLinecap="round"
    />
  </svg>
)

// Group of Ironworkers Icon
export const IronworkersTeamIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Center ironworker */}
    <g>
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <path
        d="M12 8C10.5 8 9 9 9 10.5V12L7 13V20H11V16L12 15L13 16V20H17V13L15 12V10.5C15 9 13.5 8 12 8Z"
        fill="currentColor"
      />
    </g>
    {/* Left ironworker */}
    <g opacity="0.7">
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <path
        d="M6 8.5C5 8.5 4 9.2 4 10V11L2.5 12V18H5V15L6 14L7 15V18H9.5V12L8 11V10C8 9.2 7 8.5 6 8.5Z"
        fill="currentColor"
      />
    </g>
    {/* Right ironworker */}
    <g opacity="0.7">
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <path
        d="M18 8.5C17 8.5 16 9.2 16 10V11L14.5 12V18H17V15L18 14L19 15V18H21.5V12L20 11V10C20 9.2 19 8.5 18 8.5Z"
        fill="currentColor"
      />
    </g>
  </svg>
)

// Upload with Plate Steel Icon
export const UploadFabricationIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Steel plate */}
    <rect
      x="6"
      y="16"
      width="12"
      height="4"
      fill="currentColor"
      opacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
    />
    {/* Bolt holes */}
    <circle cx="8" cy="18" r="0.5" fill="currentColor" />
    <circle cx="16" cy="18" r="0.5" fill="currentColor" />
    {/* Upload arrow */}
    <path
      d="M12 14V4M12 4L8 8M12 4L16 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Material texture lines */}
    <line x1="7" y1="17" x2="17" y2="17" stroke="currentColor" opacity="0.2" strokeWidth="0.5" />
    <line x1="7" y1="19" x2="17" y2="19" stroke="currentColor" opacity="0.2" strokeWidth="0.5" />
  </svg>
)

// Rolled-up Blueprints Icon
export const ProjectDrawingsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Rolled blueprint */}
    <path
      d="M5 7C5 6 6 5 7 5H15C16 5 17 6 17 7V15C17 16 16 17 15 17H7C6 17 5 16 5 15V7Z"
      fill="currentColor"
      opacity="0.2"
    />
    {/* Blueprint edge */}
    <path
      d="M17 7V15C17 16 16 17 15 17C15 17 18 17 19 16C20 15 20 12 20 10C20 8 20 5 19 4C18 3 15 3 15 3C16 3 17 4 17 5V7Z"
      fill="currentColor"
      opacity="0.4"
    />
    {/* Drawing lines */}
    <line x1="8" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1" />
    <line x1="8" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1" />
    <line x1="8" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1" />
    <line x1="8" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1" />
    {/* Roll curve */}
    <path
      d="M15 17C15 17 17 17 18.5 16.5C20 16 20 15 20 15"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

// Media Gallery Icon (for consistency)
export const MediaGalleryIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Photo frames */}
    <rect x="4" y="6" width="10" height="8" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
    <rect x="8" y="10" width="10" height="8" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" />
    <rect x="10" y="8" width="10" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Image content indicator */}
    <circle cx="13" cy="11" r="1" fill="currentColor" />
    <path d="M11 14L13 12L15 14L17 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Animated versions for hover effects
export const SparkAnimationIcon: React.FC<IconProps & { isAnimating?: boolean }> = ({ 
  className = '', 
  size = 24, 
  isAnimating = false 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g className={isAnimating ? 'animate-pulse' : ''}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * Math.PI / 180
        const x1 = 12 + 4 * Math.cos(angle)
        const y1 = 12 + 4 * Math.sin(angle)
        const x2 = 12 + 8 * Math.cos(angle)
        const y2 = 12 + 8 * Math.sin(angle)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1"
            opacity={isAnimating ? "0.8" : "0.3"}
            className={isAnimating ? 'animate-spark' : ''}
          />
        )
      })}
    </g>
  </svg>
)

export const CraneHookAnimationIcon: React.FC<IconProps & { isAnimating?: boolean }> = ({ 
  className = '', 
  size = 24, 
  isAnimating = false 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g className={isAnimating ? 'animate-lift' : ''}>
      <path
        d="M12 4V8M10 6C10 7.1 10.9 8 12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
        className={isAnimating ? 'animate-pulse' : ''}
      />
    </g>
  </svg>
)

export const BoltRotationIcon: React.FC<IconProps & { isAnimating?: boolean }> = ({ 
  className = '', 
  size = 24, 
  isAnimating = false 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g className={isAnimating ? 'animate-tighten' : ''}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 8L10 6M12 8L14 6M12 16L10 18M12 16L14 18M8 12L6 10M8 12L6 14M16 12L18 10M16 12L18 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

// User Group icon - for team page
export const UserGroupIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="9" cy="7" r="2" fill="currentColor" />
    <circle cx="15" cy="7" r="2" fill="currentColor" />
    <path d="M9 11C6.5 11 4.5 12.5 4.5 14V18H13.5V14C13.5 12.5 11.5 11 9 11Z" fill="currentColor" />
    <path d="M15 11C14.3 11 13.7 11.1 13.2 11.3C14.3 12 15 13 15 14V18H19.5V14C19.5 12.5 17.5 11 15 11Z" fill="currentColor" opacity="0.7" />
  </svg>
)

// Site Plan icon - blueprint with grid
export const SitePlanIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="16" y1="3" x2="16" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <rect x="10" y="10" width="6" height="4" fill="currentColor" opacity="0.8"/>
    <rect x="5" y="14" width="4" height="4" fill="currentColor" opacity="0.6"/>
    <rect x="17" y="5" width="2" height="6" fill="currentColor" opacity="0.6"/>
  </svg>
)

// Pencil Ruler icon - for annotation and measurement
export const PencilRulerIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Ruler */}
    <rect x="2" y="14" width="20" height="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="6" y1="14" x2="6" y2="17" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="14" y1="14" x2="14" y2="17" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="18" y1="14" x2="18" y2="17" stroke="currentColor" strokeWidth="1.5"/>
    
    {/* Pencil */}
    <g transform="rotate(-45 12 7)">
      <rect x="10" y="2" width="4" height="10" fill="currentColor"/>
      <polygon points="10,12 12,15 14,12" fill="currentColor"/>
      <rect x="11" y="0" width="2" height="2" fill="currentColor" opacity="0.5"/>
    </g>
  </svg>
)