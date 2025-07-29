# Steel Construction Icons

This directory contains custom SVG icons designed for the FSW Iron Task application with a steel construction theme.

## Icon Set

### Navigation Icons
- **WeldingHelmetIcon** - For the Capture page (photo/video capture)
- **BeamConnectionIcon** - For the Projects page 
- **SpudWrenchIcon** - For the Upload page and settings
- **ColumnBasePlateIcon** - For the Dashboard home
- **TorchCutIcon** - For the Media gallery
- **IronworkerIcon** - For the Team management page

### Animated Hover Icons
- **WeldingSparkIcon** - Animated sparks effect
- **BoltTighteningIcon** - Rotating bolt animation
- **BeamLiftingIcon** - Lifting beam animation

## Color Theme

The application uses a steel construction industry color palette:

- **Steel Gray** (#2e2e2e) - Dark sidebar background
- **Safety Orange** (#ff6600) - Accent color for alerts and user avatars
- **AISC Blue** (#0072ce) - Primary brand color
- **Arc Flash Yellow** (#ffcc00) - Active state highlight
- **Safety Green** (#33cc33) - Success states

## Implementation Notes

1. **Replace Placeholder SVGs**: The current SVGs are placeholders. Work with a designer to create professional minimalist icons that represent:
   - Actual welding helmet design
   - I-beam connection details
   - Spud wrench tool shape
   - Column base plate with anchor bolts
   - Torch cutting with realistic sparks
   - Ironworker silhouette in action pose

2. **Animation Guidelines**:
   - Welding spark: Pulsing glow effect
   - Bolt tightening: 360° rotation
   - Beam lifting: Vertical translation with ease-in-out

3. **Icon Usage**:
   ```tsx
   import { WeldingHelmetIcon } from '@/components/icons/SteelIcons'
   
   // Basic usage
   <WeldingHelmetIcon className="h-5 w-5 text-white" />
   
   // With hover animation
   <WeldingSparkIcon isAnimating={isHovered} />
   ```

4. **Accessibility**:
   - Add proper aria-labels to icon buttons
   - Ensure sufficient color contrast
   - Test with screen readers

## Design Resources

When working with a designer, provide these references:
- AISC (American Institute of Steel Construction) branding guidelines
- OSHA safety color standards
- Construction industry iconography examples
- Minimalist industrial design patterns