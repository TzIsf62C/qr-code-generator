// Global variables
let uploadedIcon = null;
let currentQRData = null;

// DOM elements
let textInput, iconUpload, errorCorrectionSelect, generateBtn, previewSection, qrCanvas, exportButtons;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Get DOM elements
    textInput = document.getElementById('text-input');
    iconUpload = document.getElementById('icon-upload');
    errorCorrectionSelect = document.getElementById('error-correction');
    generateBtn = document.getElementById('generate-btn');
    previewSection = document.getElementById('preview-section');
    qrCanvas = document.getElementById('qr-canvas');
    exportButtons = document.querySelectorAll('.btn-export');

    // Event listeners
    generateBtn.addEventListener('click', generateQRCode);
    iconUpload.addEventListener('change', handleIconUpload);
    exportButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const size = parseInt(e.target.dataset.size);
            exportQRCode(size);
        });
    });
    
    // Optional: Generate QR code on Enter key
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQRCode();
        }
    });
}

// Handle icon upload
function handleIconUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                uploadedIcon = img;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        uploadedIcon = null;
    }
}

// Clean text by removing UTF-8 BOM and problematic control characters
function cleanText(text) {
    // Remove UTF-8 BOM (U+FEFF) only at the start
    text = text.replace(/^\uFEFF/, '');
    
    // Remove other common BOMs at the start
    text = text.replace(/^\uFFFE/, ''); // UTF-16 BE BOM
    
    // Remove specific problematic control characters, but preserve:
    // - Newlines (\n = 0x0A)
    // - Carriage returns (\r = 0x0D)  
    // - Tabs (\t = 0x09)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove zero-width characters
    text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
    
    return text;
}

// Generate QR code
function generateQRCode() {
    let text = textInput.value.trim();
    
    // Remove UTF-8 BOM and control characters
    text = cleanText(text);
    
    if (!text) {
        alert('Please enter text to encode');
        return;
    }
    
    const errorCorrection = errorCorrectionSelect.value;
    
    try {
        // Clear previous QR code
        qrCanvas.innerHTML = '';
        
        // Map error correction levels
        const correctionLevel = {
            'L': 'L',
            'M': 'M',
            'Q': 'Q',
            'H': 'H'
        }[errorCorrection];
        
        // Generate QR code using qrcode-generator library
        const typeNumber = 0; // Auto-detect
        const qr = qrcode(typeNumber, correctionLevel);
        
        console.log('Text to encode:', text);
        const utf8Bytes = new TextEncoder().encode(text);
        console.log('Text bytes:', Array.from(utf8Bytes));
        console.log('Text length:', text.length);
        console.log('Byte length:', utf8Bytes.length);
        
        // Convert UTF-8 bytes to string of characters (each byte as a character)
        // This ensures no BOM is added
        let byteString = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
            byteString += String.fromCharCode(utf8Bytes[i]);
        }
        
        console.log('Byte string length:', byteString.length);
        console.log('Byte string char codes:', Array.from(byteString).map(c => c.charCodeAt(0)));
        
        // Add data with explicit mode for UTF-8 support
        qr.addData(byteString, 'Byte');
        qr.make();
        
        console.log('QR code generated, module count:', qr.getModuleCount());
        
        // Create canvas and render QR code with quiet zone
        const canvas = createQRCanvas(qr, 400);
        
        // Overlay icon if present
        if (uploadedIcon) {
            overlayIcon(canvas, uploadedIcon);
        }
        
        // Add canvas to container
        qrCanvas.appendChild(canvas);
        
        // Store current QR data for export
        currentQRData = {
            text: text,
            errorCorrection: errorCorrection
        };
        
        // Show preview section
        previewSection.style.display = 'block';
        
        // Smooth scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code. Please try again.');
    }
}

// Create canvas with QR code and quiet zone
function createQRCanvas(qr, size) {
    const canvas = document.createElement('canvas');
    const modules = qr.getModuleCount();
    
    // Calculate quiet zone (4 modules on each side as per spec)
    const quietZone = 4;
    const totalModules = modules + (quietZone * 2);
    const scale = size / totalModules;
    
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR code modules
    ctx.fillStyle = '#000000';
    for (let y = 0; y < modules; y++) {
        for (let x = 0; x < modules; x++) {
            if (qr.isDark(y, x)) {
                ctx.fillRect(
                    (x + quietZone) * scale,
                    (y + quietZone) * scale,
                    scale,
                    scale
                );
            }
        }
    }
    
    return canvas;
}

// Overlay icon on canvas
function overlayIcon(canvas, icon) {
    const ctx = canvas.getContext('2d');
    const canvasSize = canvas.width;
    
    // Icon size is 20% of QR code size
    const iconSize = canvasSize * 0.2;
    const iconX = (canvasSize - iconSize) / 2;
    const iconY = (canvasSize - iconSize) / 2;
    
    // Draw white background circle for better visibility
    const bgSize = iconSize * 1.2;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, bgSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, iconSize / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    
    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
    ctx.restore();
}

// Export QR code as PNG
function exportQRCode(size) {
    if (!currentQRData) {
        alert('Please generate a QR code first');
        return;
    }
    
    try {
        const errorCorrection = currentQRData.errorCorrection;
        const text = currentQRData.text;
        
        // Map error correction levels
        const correctionLevel = {
            'L': 'L',
            'M': 'M',
            'Q': 'Q',
            'H': 'H'
        }[errorCorrection];
        
        // Generate QR code
        const typeNumber = 0; // Auto-detect
        const qr = qrcode(typeNumber, correctionLevel);
        
        // Convert UTF-8 bytes to string of characters (each byte as a character)
        // This ensures no BOM is added
        const utf8Bytes = new TextEncoder().encode(text);
        let byteString = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
            byteString += String.fromCharCode(utf8Bytes[i]);
        }
        
        qr.addData(byteString, 'Byte');
        qr.make();
        
        // Create canvas at export size
        const canvas = createQRCanvas(qr, size);
        
        // Overlay icon if present
        if (uploadedIcon) {
            overlayIcon(canvas, uploadedIcon);
        }
        
        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qrcode-${size}x${size}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
        
    } catch (error) {
        console.error('Error exporting QR code:', error);
        alert('Error exporting QR code. Please try again.');
    }
}
