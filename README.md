# Cipher Suite

An advanced, feature-rich encryption and decryption web application supporting multiple cipher methods with powerful analysis tools.

## 🔐 Features

### Encryption Methods
- **Caesar Cipher** - Classic shift cipher with adjustable shift (1-25)
- **Vigenère Cipher** - Polyalphabetic substitution using repeating keyword
- **Keyword Cipher** - Substitution using custom keyword alphabet
- **ROT13** - Special case Caesar cipher (shift 13)
- **Atbash Cipher** - Alphabet reversal cipher
- **Morse Code** - With audio playback support
- **Base64** - Encoding/decoding for data transmission
- **AES Encryption** - Military-grade symmetric encryption
- **Reverse Text** - Simple character reversal

### 🎯 Advanced Features

#### Analysis Tools
- **Frequency Analysis** - Visual letter frequency distribution
- **Brute Force Demonstrator** - Try all 25 Caesar shifts automatically
- **Cipher Strength Analyzer** - Real-time security level indicators
- **Password Strength Meter** - For AES keys

#### Multi-Layer Encryption
- Chain multiple cipher methods in sequence
- Apply layers for enhanced security
- Visual layer management

#### Smart Features
- **Auto-Process** - Real-time encryption as you type
- **Auto-Copy** - Automatically copy results to clipboard
- **Text Formatting** - Uppercase/lowercase transformation, space removal, character grouping
- **File Upload/Download** - Process text files directly
- **Share Functionality** - Generate shareable URLs with encrypted text

#### User Experience
- **Keyboard Shortcuts** - Power user features (Ctrl+Enter, Ctrl+K, Ctrl+S, Ctrl+L)
- **Interactive Tutorial** - Step-by-step guide for beginners
- **Settings Panel** - Persistent preferences with localStorage
- **Responsive Design** - Optimized for mobile and desktop

## ⌨️ Keyboard Shortcuts

- `Ctrl+Enter` / `Cmd+Enter` - Encrypt/Decrypt
- `Ctrl+K` / `Cmd+K` - Copy output to clipboard
- `Ctrl+S` / `Cmd+S` - Swap input and output
- `Ctrl+L` / `Cmd+L` - Clear all text
- `?` - Show keyboard shortcuts help
- `Esc` - Close modals

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Basic Usage

1. **Select a cipher method** from the left sidebar
2. **Enter your text** in the Input area (or upload a file)
3. **Click Encrypt or Decrypt** (or press Ctrl+Enter)
4. **Copy or download** your result

### Advanced Features

#### Multi-Layer Encryption
1. Click "🔗 Multi-Layer Encryption"
2. Select methods to chain (e.g., Caesar → Base64 → Reverse)
3. Click "Apply All" to encrypt through all layers

#### Brute Force Analysis
1. Select Caesar Cipher
2. Enter encrypted text
3. Click "🔓 Brute Force" to try all 25 shifts
4. Review results and select the correct plaintext

#### Frequency Analysis
1. Encrypt some text
2. Click "📊 Frequency Analysis"
3. Compare letter frequencies with standard English distribution

#### Settings & Customization
1. Click "⚙️ Settings" in the header
2. Configure:
   - Default encryption method
   - Auto-copy output
   - Auto-process (real-time encryption)
   - Text formatting (case, spacing, grouping)
3. Settings are saved automatically

## Deployment

This app is configured for Firebase Hosting.

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- CryptoJS
- Firebase Hosting

## 🔒 Security Information

### Cipher Strength Ratings

- 🟢 **Strong** - AES (with strong key 16+ characters)
- 🟡 **Medium** - Vigenère (with long, random key)
- 🔴 **Weak** - Caesar, ROT13, Keyword, Atbash
- ⚪ **Not Encryption** - Base64, Morse Code, Reverse Text

### Security Guidelines

⚠️ **Important:** This tool is designed for educational purposes and basic encryption needs. For highly sensitive data, always use industry-standard encryption libraries and follow security best practices.

- **AES Encryption** - Secure when used with a strong key (16+ characters recommended)
- **Vigenère Cipher** - Reasonably secure with a long, random key but vulnerable to known-plaintext attacks
- **Classical Ciphers** - Caesar, ROT13, Keyword, Atbash are easily broken and should NOT be used for sensitive data
- **Encoding** - Base64, Morse Code are not encryption; they provide NO security

### Best Practices

1. **Use AES for sensitive data** with a strong, unique password
2. **Never share encryption keys** through insecure channels
3. **Classical ciphers are for learning** - great for understanding cryptography but not for real security
4. **Multi-layer encryption** can add complexity but doesn't necessarily add security if the base ciphers are weak
5. **Frequency analysis** demonstrates why simple substitution ciphers are insecure

## License

See LICENSE file for details.

---

&copy; 2025 Amer Kovacevic All rights reserved.

