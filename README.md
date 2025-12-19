# QR Code Generator

A modern, feature-rich QR code generator built with HTML, CSS, and JavaScript. Create custom QR codes with optional icon overlays and export them in multiple sizes.

## Features

- 🎨 **Beautiful Modern UI** - Clean, responsive design with gradient styling
- 📱 **Text Encoding** - Convert any text, URL, or data into QR codes
- 🖼️ **Icon Overlay** - Add custom icons/logos to the center of your QR codes
- 📊 **Error Correction Levels** - Choose from Low (7%), Medium (15%), Quartile (25%), or High (30%)
- 💾 **Multiple Export Sizes** - Export as PNG in 256x256, 512x512, 1024x1024, or 2048x2048
- ⚡ **Live Preview** - See your QR code before exporting
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Demo

Visit the live demo: [Your GitHub Pages URL]

## Usage

1. Enter text, URL, or any content you want to encode
2. (Optional) Upload an icon/logo to place in the center
3. Select your preferred error correction level
4. Click "Generate QR Code"
5. Export in your desired size

## Deployment on GitHub Pages

### Quick Setup

1. Create a new repository on GitHub
2. Upload these files to your repository:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `qrcode.min.js`
   - `README.md`

3. Go to repository Settings → Pages
4. Under "Source", select the branch (usually `main` or `master`)
5. Click Save
6. Your site will be live at `https://yourusername.github.io/repositoryname/`

### Using Git Command Line

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - QR Code Generator"

# Add remote repository (replace with your repository URL)
git remote add origin https://github.com/yourusername/qr-code-generator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in your repository settings.

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with modern gradients and animations
- **JavaScript (ES6+)** - QR code generation and image manipulation
- **QRCode.js** - QR code library

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

- QR Code generation powered by [QRCode.js](https://davidshimjs.github.io/qrcodejs/)
- Built with ❤️ using vanilla JavaScript

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements!
