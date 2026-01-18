// Global variables
let uploadedIcon = null;
let currentQRData = null;
let qrCodeInstance = null;

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
// Preserves all legitimate Unicode characters including Chinese, Japanese, Korean, etc.
function cleanText(text) {
    // Remove UTF-8 BOM (U+FEFF) only at the start
    text = text.replace(/^\uFEFF/, '');
    
    // Remove other common BOMs at the start
    text = text.replace(/^\uFFFE/, ''); // UTF-16 BE BOM
    
    // Remove specific problematic control characters, but preserve:
    // - Newlines (\n = 0x0A)
    // - Carriage returns (\r = 0x0D)  
    // - Tabs (\t = 0x09)
    // Only remove: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F (DEL)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove zero-width characters (but NOT zero-width joiner used in some scripts)
    text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
    
    return text;
}

// Calculate optimal QR code type number based on text length and error correction
function getOptimalTypeNumber(text, errorCorrectionLevel) {
    // Estimate byte length (UTF-8 encoding)
    const byteLength = new Blob([text]).size;
    
    // Add 80% overhead for QR code encoding to be safe
    // (mode indicators, character count, terminators, padding, bit alignment)
    const estimatedEncodedLength = Math.ceil(byteLength * 1.8);
    
    console.log('=== QR Code Type Calculation ===');
    console.log('Text:', text);
    console.log('Text length (characters):', text.length);
    console.log('Byte length (UTF-8):', byteLength);
    console.log('Estimated encoded length (with overhead):', estimatedEncodedLength);
    console.log('Error correction level:', errorCorrectionLevel);
    
    // Capacity table for different type numbers at different error correction levels
    // [L, M, Q, H] capacities in bytes
    const capacities = {
        1: [17, 14, 11, 7],
        2: [32, 26, 20, 14],
        3: [53, 42, 32, 24],
        4: [78, 62, 46, 34],
        5: [106, 84, 60, 44],
        6: [134, 106, 74, 58],
        7: [154, 122, 86, 64],
        8: [192, 152, 108, 84],
        9: [230, 180, 130, 98],
        10: [271, 213, 151, 119],
        11: [321, 251, 177, 137],
        12: [367, 287, 203, 155],
        13: [425, 331, 241, 177],
        14: [458, 362, 258, 194],
        15: [520, 412, 292, 220],
        16: [586, 450, 322, 250],
        17: [644, 504, 364, 280],
        18: [718, 560, 394, 310],
        19: [792, 624, 442, 338],
        20: [858, 666, 482, 382],
        25: [1273, 977, 689, 545],
        30: [1852, 1425, 1009, 751],
        35: [2409, 1903, 1373, 1051],
        40: [2953, 2331, 1663, 1276]
    };
    
    const levelIndex = { 'L': 0, 'M': 1, 'Q': 2, 'H': 3 }[errorCorrectionLevel];
    
    // Find the smallest typeNumber that can hold the data with overhead
    for (let typeNum of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40]) {
        if (capacities[typeNum][levelIndex] >= estimatedEncodedLength) {
            console.log('Selected typeNumber:', typeNum);
            console.log('Capacity at this level:', capacities[typeNum][levelIndex], 'bytes');
            console.log('================================');
            return typeNum;
        }
    }
    
    // If data is too large, return max type number
    console.log('Data too large, using max typeNumber: 40');
    console.log('================================');
    return 40;
}

// Generate QR code
function generateQRCode() {
    let text = textInput.value.trim();
    
    console.log('=== Starting QR Code Generation ===');
    console.log('Original text before cleaning:', text);
    console.log('Original text byte array:', Array.from(new TextEncoder().encode(text)));
    
    // Remove UTF-8 BOM and control characters
    text = cleanText(text);
    
    console.log('Text after cleaning:', text);
    console.log('Cleaned text byte array:', Array.from(new TextEncoder().encode(text)));
    
    if (!text) {
        alert('Please enter text to encode');
        return;
    }
    
    const errorCorrection = errorCorrectionSelect.value;
    
    try {
        // Clear previous QR code
        qrCanvas.innerHTML = '';
        qrCanvas.style.width = '';
        qrCanvas.style.height = '';
        
        // Generate QR code
        const correctionLevel = {
            'L': QRCode.CorrectLevel.L,
            'M': QRCode.CorrectLevel.M,
            'Q': QRCode.CorrectLevel.Q,
            'H': QRCode.CorrectLevel.H
        }[errorCorrection];
        
        const optimalType = getOptimalTypeNumber(text, errorCorrection);
        
        console.log('Creating QR code instance with typeNumber:', optimalType);
        
        // Create QR code instance WITHOUT text first (to set typeNumber)
        qrCodeInstance = new QRCode(qrCanvas, {
            width: 400,
            height: 400,
            typeNumber: optimalType,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: correctionLevel
        });
        
        // Now make the code with the text (this will use the typeNumber we set)
        qrCodeInstance.makeCode(text);
        
        console.log('✓ QR Code generated successfully');
        console.log('Instance typeNumber:', qrCodeInstance._htOption.typeNumber);
        
        // Store current QR data for export
        currentQRData = {
            text: text,
            errorCorrection: errorCorrection
        };
        
        // Wait for QR code to render, then add quiet zone and overlay icon if present
        setTimeout(() => {
            const img = qrCanvas.querySelector('img');
            if (img && img.complete) {
                addQuietZoneToPreview(img);
            } else if (img) {
                img.onload = () => addQuietZoneToPreview(img);
            }
        }, 100);
        
        // Show preview section
        previewSection.style.display = 'block';
        
        // Smooth scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        console.error('Error stack:', error.stack);
        alert('Error generating QR code. Please try again with shorter text or lower error correction.');
    }
}

// Add quiet zone to preview image (with or without icon)
function addQuietZoneToPreview(qrImage) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Add quiet zone (white border) - 10% on each side (approx 4-5 modules for typical QR codes)
    const quietZone = 0.1; // 10% padding on each side
    const qrSize = 400 * (1 - 2 * quietZone);
    const offset = 400 * quietZone;
    
    // Fill canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 400);
    
    // Draw QR code with quiet zone
    ctx.drawImage(qrImage, offset, offset, qrSize, qrSize);
    
    // Overlay icon if present
    if (uploadedIcon) {
        overlayIcon(canvas, uploadedIcon);
    }
    qrImage.src = canvas.toDataURL();
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
        // Create temporary div for QR generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const correctionLevel = {
            'L': QRCode.CorrectLevel.L,
            'M': QRCode.CorrectLevel.M,
            'Q': QRCode.CorrectLevel.Q,
            'H': QRCode.CorrectLevel.H
        }[currentQRData.errorCorrection];
        
        const optimalType = getOptimalTypeNumber(currentQRData.text, currentQRData.errorCorrection);
        
        console.log('Export: Creating QR with typeNumber:', optimalType);
        
        // Create QR code instance WITHOUT text first (to set typeNumber)
        const tempQR = new QRCode(tempDiv, {
            width: size,
            height: size,
            typeNumber: optimalType,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: correctionLevel
        });
        
        // Now make the code with the text (this will use the typeNumber we set)
        tempQR.makeCode(currentQRData.text);
        
        console.log('Export: QR generated successfully');
        
        // Wait for generation, then export
        setTimeout(() => {
            const img = tempDiv.querySelector('img');
            if (img && img.complete) {
                exportImage(img, size);
            } else if (img) {
                img.onload = () => exportImage(img, size);
            }
            document.body.removeChild(tempDiv);
        }, 100);
        
    } catch (error) {
        console.error('Error exporting QR code:', error);
        alert('Error exporting QR code. Please try again.');
    }
}

function exportImage(qrImage, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Add quiet zone (white border) - 10% on each side (approx 4-5 modules for typical QR codes)
    const quietZone = 0.1; // 10% padding on each side
    const qrSize = size * (1 - 2 * quietZone);
    const offset = size * quietZone;
    
    // Fill canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR code with quiet zone
    ctx.drawImage(qrImage, offset, offset, qrSize, qrSize);
    
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
}
