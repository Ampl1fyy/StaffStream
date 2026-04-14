# StaffStream Mobile Assets

This folder contains app icons and splash screens for the Expo mobile app.

## Required Files

- **icon.png** — App icon (192x192 minimum, 512x512 recommended)
- **splash.png** — Splash screen (1080x1920 recommended)
- **adaptive-icon.png** — Android adaptive icon (192x192 minimum)
- **notification-icon.png** — Push notification icon (192x192 minimum)

## How to Generate Assets

### Option 1: Using Figma (Recommended)
1. Create a 512x512 design in Figma or your design tool
2. Export as PNG files
3. Place in this directory

### Option 2: Using Online Tool
1. Visit https://www.figma.com or use Expo's built-in asset generator
2. Create or download a 512x512 icon

### Option 3: Placeholder Assets (Temporary)
For development, you can use **1x1 pixel transparent PNG** files:

```bash
# On Linux/Mac:
convert -size 512x512 xc:transparent icon.png
convert -size 1080x1920 xc:transparent splash.png

# Or use ImageMagick online: https://online-convert.com/
```

### Option 4: Use Default Expo Assets
If assets are missing during local dev, Expo will show a warning but still run.

## Color Reference

- **Primary Brand Color**: `#4F46E5` (Indigo - used in splash background)
- See `tailwind.config.js` for full color scheme

## Asset Guidelines

- **Format**: PNG with transparency support
- **Icon**: Square format, works best without rounded corners (Expo handles rounding)
- **Splash**: Landscape or portrait, centered logo recommended
- **Quality**: At least 72 DPI, preferably 300 DPI

## .gitignore

Asset files are not tracked in git. Add them locally when setting up the dev environment.
