# Lottery Video Background

## Video Requirements

For the hero section background, you should use a high-quality lottery-themed video with the following specifications:

### Recommended Video Content:
- **Lottery balls bouncing/rolling** in slow motion
- **Number sequences** appearing and disappearing
- **Golden/colorful lottery tickets** floating
- **Casino/lottery atmosphere** with soft lighting
- **Abstract lottery patterns** with numbers and symbols
- **Money/coins** falling or floating (subtle)
- **Data visualization elements** like charts and graphs

### Technical Specifications:
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (Full HD) minimum
- **Duration**: 10-30 seconds (will loop)
- **File Size**: Under 10MB for web optimization
- **Frame Rate**: 30fps or 60fps
- **Aspect Ratio**: 16:9

### Visual Style:
- **Color Palette**: 
  - Primary: Gold (#FFD700), Silver (#C0C0C0)
  - Accent: Deep Blue (#1e3a8a), Purple (#8b5cf6)
  - Background: Dark tones with subtle lighting
- **Mood**: Professional, exciting, trustworthy
- **Lighting**: Soft, cinematic lighting
- **Motion**: Smooth, elegant movements

### Content Guidelines:
- Avoid showing actual lottery results or winning numbers
- Keep it abstract and professional
- Focus on the technology and data aspect
- No gambling imagery (cards, dice, slot machines)
- Emphasize prediction, analysis, and technology

## Video Sources

### Free Stock Video Sites:
1. **Pexels Videos** - https://www.pexels.com/videos/
2. **Pixabay Videos** - https://pixabay.com/videos/
3. **Unsplash Videos** - https://unsplash.com/videos
4. **Videvo** - https://www.videvo.net/

### Search Terms:
- "lottery balls"
- "number sequence"
- "data visualization"
- "abstract numbers"
- "golden particles"
- "floating numbers"
- "tech background"
- "analytics visualization"

### Premium Sources:
1. **Shutterstock** - https://www.shutterstock.com/video
2. **Adobe Stock** - https://stock.adobe.com/video
3. **Getty Images** - https://www.gettyimages.com/videos

## Implementation

Once you have the video file:

1. **Rename** your video file to `hero-background.mp4`
2. **Place** it in the `public/videos/` directory
3. **Optimize** the file size using tools like:
   - HandBrake (free)
   - Adobe Media Encoder
   - Online compressors like CloudConvert

## Fallback

If no video is provided, the component will automatically fall back to the CSS-animated background with floating numbers and data visualization elements.

## Performance Considerations

- The video is set to `preload="metadata"` for faster loading
- Video is muted and autoplays for better user experience
- Fallback ensures the site works even without video support
- Mobile-optimized with `playsInline` attribute

