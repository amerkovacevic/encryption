import { useState, useEffect, useRef, useCallback } from 'react';
import CryptoJS from 'crypto-js';

// Utility Functions
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('cipherSuiteSettings');
    return saved ? JSON.parse(saved) : {
      defaultMethod: 'caesar',
      autoCopy: false,
      autoProcess: false,
      textCase: 'preserve', // preserve, upper, lower
      removeSpaces: false,
      groupBy: 0, // 0 = no grouping
    };
  } catch {
    return {
      defaultMethod: 'caesar',
      autoCopy: false,
      autoProcess: false,
      textCase: 'preserve',
      removeSpaces: false,
      groupBy: 0,
    };
  }
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem('cipherSuiteSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

function App() {
  // Settings
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Main State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(settings.defaultMethod);
  const [caesarShift, setCaesarShift] = useState(3);
  const [aesKey, setAesKey] = useState('');
  const [keyword, setKeyword] = useState('');
  const [vigenereKey, setVigenereKey] = useState('');
  const [mode, setMode] = useState('encrypt');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Multi-layer encryption
  const [encryptionLayers, setEncryptionLayers] = useState([]);
  const [showMultiLayer, setShowMultiLayer] = useState(false);
  
  // Analysis tools
  const [showFrequencyAnalysis, setShowFrequencyAnalysis] = useState(false);
  const [showBruteForce, setShowBruteForce] = useState(false);
  const [bruteForceResults, setBruteForceResults] = useState([]);
  
  // UI toggles
  const [isMethodsCollapsed, setIsMethodsCollapsed] = useState(false);
  
  // File handling
  const fileInputRef = useRef(null);
  
  // Share functionality
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const encryptionMethods = [
    { id: 'caesar', name: 'Caesar Cipher', requiresKey: false, strength: 'weak' },
    { id: 'vigenere', name: 'Vigenère Cipher', requiresKey: true, strength: 'medium' },
    { id: 'keyword', name: 'Keyword Cipher', requiresKey: true, strength: 'weak' },
    { id: 'rot13', name: 'ROT13', requiresKey: false, strength: 'weak' },
    { id: 'atbash', name: 'Atbash Cipher', requiresKey: false, strength: 'weak' },
    { id: 'morse', name: 'Morse Code', requiresKey: false, strength: 'none' },
    { id: 'base64', name: 'Base64', requiresKey: false, strength: 'none' },
    { id: 'aes', name: 'AES Encryption', requiresKey: true, strength: 'strong' },
    { id: 'reverse', name: 'Reverse Text', requiresKey: false, strength: 'none' },
  ];

  // Morse Code Mapping
  const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
    ' ': '/'
  };

  const morseToChar = Object.fromEntries(Object.entries(morseCode).map(([k, v]) => [v, k]));

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Auto-process when enabled
  useEffect(() => {
    if (settings.autoProcess && inputText) {
      const timer = setTimeout(() => {
        processText();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [inputText, selectedMethod, caesarShift, aesKey, keyword, vigenereKey, mode, settings.autoProcess]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter: Process
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processText();
      }
      // Ctrl+K or Cmd+K: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+S or Cmd+S: Swap
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSwap();
      }
      // Ctrl+L or Cmd+L: Clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
      }
      // ?: Show keyboard help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowKeyboardHelp(true);
        }
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
        setShowSettings(false);
        setShowShareModal(false);
        setShowTutorial(false);
        setShowMultiLayer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [outputText, inputText]);

  // Caesar Cipher
  const caesarCipher = (text, shift, decrypt = false) => {
    if (decrypt) shift = -shift;
    return text
      .split('')
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const base = isUpperCase ? 65 : 97;
          return String.fromCharCode(((code - base + shift + 26) % 26) + base);
        }
        return char;
      })
      .join('');
  };

  // Vigenère Cipher
  const vigenereCipher = (text, key, decrypt = false) => {
    if (!key) return text;
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanKey) return text;
    
    let keyIndex = 0;
    return text
      .split('')
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const base = isUpperCase ? 65 : 97;
          const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
          keyIndex++;
          const actualShift = decrypt ? -shift : shift;
          return String.fromCharCode(((code - base + actualShift + 26) % 26) + base);
        }
        return char;
      })
      .join('');
  };

  // ROT13
  const rot13 = (text) => caesarCipher(text, 13, false);

  // Atbash Cipher
  const atbash = (text) => {
    return text
      .split('')
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const base = isUpperCase ? 65 : 97;
          return String.fromCharCode(base + (25 - (code - base)));
        }
        return char;
      })
      .join('');
  };

  // Keyword Cipher
  const keywordCipher = (text, keyword, decrypt = false) => {
    const normalAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const uniqueKeyword = [...new Set(keyword.toUpperCase().replace(/[^A-Z]/g, ''))].join('');
    const cipherAlphabet = uniqueKeyword + normalAlphabet.split('').filter(c => !uniqueKeyword.includes(c)).join('');
    const fromAlphabet = decrypt ? cipherAlphabet : normalAlphabet;
    const toAlphabet = decrypt ? normalAlphabet : cipherAlphabet;
    
    return text
      .split('')
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const isUpperCase = char === char.toUpperCase();
          const upperChar = char.toUpperCase();
          const index = fromAlphabet.indexOf(upperChar);
          if (index === -1) return char;
          const newChar = toAlphabet[index];
          return isUpperCase ? newChar : newChar.toLowerCase();
        }
        return char;
      })
      .join('');
  };

  // Morse Code
  const textToMorse = (text) => {
    return text
      .toUpperCase()
      .split('')
      .map(char => morseCode[char] || char)
      .join(' ');
  };

  const morseToText = (morse) => {
    return morse
      .split(' ')
      .map(code => morseToChar[code] || code)
      .join('');
  };

  // Play Morse Code Audio
  const playMorse = async (morseText) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const dotTime = 60;
    const dashTime = dotTime * 3;
    const letterGap = dotTime * 3;
    const wordGap = dotTime * 7;
    let currentTime = audioContext.currentTime;

    for (const char of morseText) {
      if (char === '.') {
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = 600;
        oscillator.connect(audioContext.destination);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + dotTime / 1000);
        currentTime += dotTime / 1000 + dotTime / 1000;
      } else if (char === '-') {
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = 600;
        oscillator.connect(audioContext.destination);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + dashTime / 1000);
        currentTime += dashTime / 1000 + dotTime / 1000;
      } else if (char === ' ') {
        currentTime += letterGap / 1000;
      } else if (char === '/') {
        currentTime += wordGap / 1000;
      }
    }
  };

  // Text Formatting
  const formatText = (text) => {
    let formatted = text;
    
    // Apply case transformation
    if (settings.textCase === 'upper') {
      formatted = formatted.toUpperCase();
    } else if (settings.textCase === 'lower') {
      formatted = formatted.toLowerCase();
    }
    
    // Remove spaces if enabled
    if (settings.removeSpaces) {
      formatted = formatted.replace(/\s/g, '');
    }
    
    // Group by characters
    if (settings.groupBy > 0) {
      formatted = formatted.match(new RegExp(`.{1,${settings.groupBy}}`, 'g'))?.join(' ') || formatted;
    }
    
    return formatted;
  };

  // Frequency Analysis
  const calculateFrequency = (text) => {
    const letters = text.toUpperCase().replace(/[^A-Z]/g, '');
    const freq = {};
    for (const char of letters) {
      freq[char] = (freq[char] || 0) + 1;
    }
    const total = letters.length;
    return Object.entries(freq)
      .map(([char, count]) => ({ char, count, percent: ((count / total) * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count);
  };

  // Brute Force Caesar
  const bruteForceCaesar = (text) => {
    const results = [];
    for (let shift = 1; shift <= 25; shift++) {
      results.push({
        shift,
        text: caesarCipher(text, shift, true)
      });
    }
    setBruteForceResults(results);
    setShowBruteForce(true);
  };

  // Cipher Strength Indicator
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'text-success-400';
      case 'medium': return 'text-warning-400';
      case 'weak': return 'text-error-400';
      default: return 'text-quaternary-400';
    }
  };

  const getStrengthLabel = (strength) => {
    switch (strength) {
      case 'strong': return '🟢 Strong';
      case 'medium': return '🟡 Medium';
      case 'weak': return '🔴 Weak';
      default: return '⚪ Not Encryption';
    }
  };

  // Process text based on selected method and mode
  const processText = useCallback(() => {
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }

    try {
      let result = '';

      switch (selectedMethod) {
        case 'caesar':
          result = caesarCipher(inputText, caesarShift, mode === 'decrypt');
          break;

        case 'vigenere':
          if (!vigenereKey.trim()) {
            setOutputText('Please enter a Vigenère key');
            return;
          }
          result = vigenereCipher(inputText, vigenereKey, mode === 'decrypt');
          break;

        case 'rot13':
          result = rot13(inputText);
          break;

        case 'base64':
          if (mode === 'encrypt') {
            result = btoa(inputText);
          } else {
            result = atob(inputText);
          }
          break;

        case 'aes':
          if (!aesKey.trim()) {
            setOutputText('Please enter an encryption key');
            return;
          }
          if (mode === 'encrypt') {
            result = CryptoJS.AES.encrypt(inputText, aesKey).toString();
          } else {
            const bytes = CryptoJS.AES.decrypt(inputText, aesKey);
            result = bytes.toString(CryptoJS.enc.Utf8);
            if (!result) {
              result = 'Decryption failed - wrong key or corrupted data';
            }
          }
          break;

        case 'reverse':
          result = inputText.split('').reverse().join('');
          break;

        case 'atbash':
          result = atbash(inputText);
          break;

        case 'keyword':
          if (!keyword.trim()) {
            setOutputText('Please enter a keyword');
            return;
          }
          result = keywordCipher(inputText, keyword, mode === 'decrypt');
          break;

        case 'morse':
          if (mode === 'encrypt') {
            result = textToMorse(inputText);
          } else {
            result = morseToText(inputText);
          }
          break;

        default:
          result = 'Unknown method';
      }

      // Apply text formatting
      result = formatText(result);

      setOutputText(result);

      // Auto-copy if enabled
      if (settings.autoCopy && result) {
        navigator.clipboard.writeText(result);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1000);
      }
    } catch (error) {
      setOutputText(`Error: ${error.message}`);
    }
  }, [inputText, selectedMethod, caesarShift, vigenereKey, mode, aesKey, keyword, settings]);

  // Multi-layer encryption
  const applyMultiLayer = () => {
    if (encryptionLayers.length === 0) {
      alert('Please add at least one encryption layer');
      return;
    }
    
    let result = inputText;
    const layerDetails = [];
    
    for (const layer of encryptionLayers) {
      const prevResult = result;
      // Apply each layer
      // This is simplified - in production you'd call the actual cipher functions
      if (layer.method === 'caesar') {
        result = caesarCipher(result, layer.shift || caesarShift, false);
      } else if (layer.method === 'base64') {
        result = btoa(result);
      } else if (layer.method === 'reverse') {
        result = result.split('').reverse().join('');
      }
      layerDetails.push({ method: layer.method, input: prevResult.substring(0, 50), output: result.substring(0, 50) });
    }
    
    setOutputText(result);
  };

  // File handling
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleFileDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share functionality
  const generateShareUrl = () => {
    const params = new URLSearchParams({
      method: selectedMethod,
      text: btoa(outputText),
      mode: mode
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  // Load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('text')) {
      try {
        const decodedText = atob(params.get('text'));
        setInputText(decodedText);
        if (params.has('method')) {
          setSelectedMethod(params.get('method'));
        }
      } catch (error) {
        console.error('Failed to load from URL:', error);
      }
    }
  }, []);

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  const handleSwap = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const currentMethod = encryptionMethods.find((m) => m.id === selectedMethod);

  const tutorialSteps = [
    { title: "Welcome!", content: "Let's learn how to use Cipher Suite. Click Next to continue." },
    { title: "Choose a Method", content: "Select an encryption method from the list on the left. Each method has different security levels." },
    { title: "Enter Text", content: "Type or paste your text in the Input area. You can also upload a file!" },
    { title: "Encrypt/Decrypt", content: "Click the Encrypt button (or press Ctrl+Enter) to process your text." },
    { title: "Keyboard Shortcuts", content: "Press '?' to see all keyboard shortcuts. Ctrl+K copies output, Ctrl+S swaps input/output!" },
    { title: "Advanced Features", content: "Explore Frequency Analysis, Brute Force tools, and Multi-Layer encryption for advanced use!" }
  ];

  return (
    <div className="min-h-screen bg-primary-800 text-accent-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-secondary-800 border-b border-tertiary-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-accent-50 truncate">Cipher Suite</h1>
            <p className="text-quaternary-400 text-xs sm:text-sm mt-1 hidden sm:block">
              Advanced encryption and decryption tool
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setShowTutorial(true)}
              className="button-secondary text-xs px-2 sm:px-4 py-2"
              title="Tutorial"
            >
              <span className="hidden sm:inline">📚 Tutorial</span>
              <span className="sm:hidden">📚</span>
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="button-secondary text-xs px-2 sm:px-4 py-2 hidden sm:inline-block"
              title="Keyboard Shortcuts (Press ?)"
            >
              ⌨️ Shortcuts
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="button-secondary text-xs px-2 sm:px-4 py-2"
              title="Settings"
            >
              <span className="hidden sm:inline">⚙️ Settings</span>
              <span className="sm:hidden">⚙️</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Method Selection */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-accent-50">
                  Encryption Method
                </h2>
                <button
                  onClick={() => setIsMethodsCollapsed(!isMethodsCollapsed)}
                  className="text-quaternary-400 hover:text-accent-50 transition-colors p-1"
                  title={isMethodsCollapsed ? "Expand" : "Collapse"}
                >
                  {isMethodsCollapsed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {!isMethodsCollapsed && (
                <div className="space-y-2">
                  {encryptionMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                        selectedMethod === method.id
                          ? 'bg-tertiary-600 text-accent-50'
                          : 'bg-secondary-800/50 text-quaternary-300 hover:bg-secondary-700/70'
                      }`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              )}
              
              {isMethodsCollapsed && (
                <div className="text-sm text-quaternary-400">
                  Current: <span className="text-accent-50 font-semibold">{currentMethod?.name}</span>
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="card">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-accent-50 mb-3 sm:mb-4">Mode</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    mode === 'encrypt'
                      ? 'bg-tertiary-600 text-accent-50'
                      : 'bg-secondary-800/50 text-quaternary-300 hover:bg-secondary-700/70'
                  }`}
                >
                  Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    mode === 'decrypt'
                      ? 'bg-tertiary-600 text-accent-50'
                      : 'bg-secondary-800/50 text-quaternary-300 hover:bg-secondary-700/70'
                  }`}
                >
                  Decrypt
                </button>
              </div>
            </div>

            {/* Method Settings */}
            <div className="card">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-accent-50 mb-3 sm:mb-4">
                Settings
              </h2>

              {selectedMethod === 'caesar' && (
                <div className="space-y-2">
                  <label className="block text-sm text-quaternary-300">
                    Shift Value: {caesarShift}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={caesarShift}
                    onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                    className="w-full accent-tertiary-500"
                  />
                  <button
                    onClick={() => bruteForceCaesar(inputText || outputText)}
                    className="button-secondary w-full text-xs mt-2"
                  >
                    🔓 Brute Force (Try All Shifts)
                  </button>
                </div>
              )}

              {selectedMethod === 'vigenere' && (
                <div className="space-y-2">
                  <label className="block text-sm text-quaternary-300">Vigenère Key</label>
                  <input
                    type="text"
                    value={vigenereKey}
                    onChange={(e) => setVigenereKey(e.target.value)}
                    placeholder="Enter key (e.g., SECRET)"
                    className="input-field"
                  />
                  <p className="text-xs text-quaternary-500">
                    A repeating keyword for polyalphabetic substitution
                  </p>
                </div>
              )}

              {selectedMethod === 'aes' && (
                <div className="space-y-2">
                  <label className="block text-sm text-quaternary-300">Encryption Key</label>
                  <input
                    type="password"
                    value={aesKey}
                    onChange={(e) => setAesKey(e.target.value)}
                    placeholder="Enter a secure key"
                    className="input-field"
                  />
                  <div className="text-xs text-quaternary-500">
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-secondary-700 rounded">
                        <div 
                          className={`h-1 rounded transition-all ${
                            aesKey.length < 8 ? 'bg-error-500 w-1/4' :
                            aesKey.length < 12 ? 'bg-warning-500 w-1/2' :
                            aesKey.length < 16 ? 'bg-warning-400 w-3/4' :
                            'bg-success-500 w-full'
                          }`}
                        />
                      </div>
                      <span className="text-xs">
                        {aesKey.length < 8 ? 'Weak' : aesKey.length < 16 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'keyword' && (
                <div className="space-y-2">
                  <label className="block text-sm text-quaternary-300">Keyword</label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Enter keyword (e.g., ZEBRA)"
                    className="input-field"
                  />
                  <p className="text-xs text-quaternary-500">
                    Letters only - duplicates are automatically removed
                  </p>
                </div>
              )}

              {selectedMethod === 'morse' && (
                <div className="space-y-2">
                  <p className="text-sm text-quaternary-400">
                    Convert text to/from Morse code
                  </p>
                  {outputText && mode === 'encrypt' && (
                    <button
                      onClick={() => playMorse(outputText)}
                      className="button-secondary w-full text-xs"
                    >
                      🔊 Play Morse Code Audio
                    </button>
                  )}
                </div>
              )}

              {!['caesar', 'vigenere', 'aes', 'keyword', 'morse'].includes(selectedMethod) && (
                <p className="text-sm text-quaternary-400">
                  No additional settings required for this method.
                </p>
              )}
            </div>

          </div>

          {/* Right Column - Input/Output */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Input Area */}
            <div className="card">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-accent-50">Input Text</h2>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-xs sm:text-sm text-quaternary-400">
                    {inputText.length}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="button-secondary text-xs px-2 sm:px-3 py-1 sm:py-2"
                    title="Upload file"
                  >
                    <span className="hidden sm:inline">📁 Upload</span>
                    <span className="sm:hidden">📁</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to encrypt or decrypt..."
                className="textarea-field text-sm sm:text-base"
                rows="6"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button onClick={processText} className="button-primary text-sm sm:text-base px-3 sm:px-4 py-2">
                {mode === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'} 
                <span className="text-xs ml-2 opacity-75 hidden md:inline">Ctrl+Enter</span>
              </button>
              <button onClick={handleSwap} className="button-secondary text-sm sm:text-base px-3 sm:px-4 py-2" disabled={!outputText}>
                ⇄ <span className="hidden xs:inline">Swap</span>
                <span className="text-xs ml-1 opacity-75 hidden md:inline">Ctrl+S</span>
              </button>
              <button onClick={handleClear} className="button-secondary text-sm sm:text-base px-3 sm:px-4 py-2">
                <span className="hidden xs:inline">Clear</span>
                <span className="xs:hidden">✕</span>
                <span className="text-xs ml-1 opacity-75 hidden md:inline">Ctrl+L</span>
              </button>
              <button
                onClick={handleCopy}
                className="button-secondary text-sm sm:text-base px-3 sm:px-4 py-2"
                disabled={!outputText}
              >
                {copySuccess ? '✓' : '📋'} <span className="hidden xs:inline">{copySuccess ? 'Copied!' : 'Copy'}</span>
                {!copySuccess && <span className="text-xs ml-1 opacity-75 hidden md:inline">Ctrl+K</span>}
              </button>
              <button
                onClick={handleFileDownload}
                className="button-secondary text-sm sm:text-base px-3 sm:px-4 py-2"
                disabled={!outputText}
              >
                💾 <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={generateShareUrl}
                className="button-secondary text-sm sm:text-base px-3 sm:px-4 py-2"
                disabled={!outputText}
              >
                🔗 <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Advanced Tools */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setShowFrequencyAnalysis(!showFrequencyAnalysis)}
                className="button-secondary text-xs px-2 sm:px-3 py-1.5 sm:py-2"
                disabled={!outputText}
              >
                📊 <span className="hidden xs:inline">Frequency</span>
              </button>
              <button
                onClick={() => setShowMultiLayer(!showMultiLayer)}
                className="button-secondary text-xs px-2 sm:px-3 py-1.5 sm:py-2"
              >
                🔗 <span className="hidden xs:inline">Multi-Layer</span>
              </button>
            </div>

            {/* Frequency Analysis */}
            {showFrequencyAnalysis && outputText && (
              <div className="card bg-secondary-900/50">
                <h3 className="text-lg font-semibold text-accent-50 mb-3">Letter Frequency Analysis</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {calculateFrequency(outputText).slice(0, 10).map((item) => (
                    <div key={item.char} className="bg-tertiary-900/50 rounded p-2 text-center">
                      <div className="text-xl font-bold text-accent-50">{item.char}</div>
                      <div className="text-xs text-quaternary-400">{item.count}</div>
                      <div className="text-xs text-tertiary-400">{item.percent}%</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-quaternary-500 mt-3">
                  Top 10 most frequent letters. In English, E, T, A, O, I, N are most common.
                </p>
              </div>
            )}

            {/* Multi-Layer Encryption */}
            {showMultiLayer && (
              <div className="card bg-secondary-900/50">
                <h3 className="text-lg font-semibold text-accent-50 mb-3">Multi-Layer Encryption</h3>
                <p className="text-sm text-quaternary-400 mb-3">
                  Apply multiple encryption methods in sequence for stronger security.
                </p>
                <div className="space-y-2 mb-3">
                  {encryptionLayers.map((layer, index) => (
                    <div key={index} className="flex items-center gap-2 bg-tertiary-900/50 p-2 rounded">
                      <span className="text-sm">Layer {index + 1}: {layer.method}</span>
                      <button
                        onClick={() => setEncryptionLayers(encryptionLayers.filter((_, i) => i !== index))}
                        className="ml-auto text-error-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setEncryptionLayers([...encryptionLayers, { method: e.target.value }]);
                        e.target.value = '';
                      }
                    }}
                    className="input-field text-sm"
                  >
                    <option value="">Add layer...</option>
                    {encryptionMethods.filter(m => !m.requiresKey).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={applyMultiLayer}
                    className="button-primary text-xs"
                    disabled={encryptionLayers.length === 0}
                  >
                    Apply All
                  </button>
                </div>
              </div>
            )}

            {/* Output Area */}
            <div className="card">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-accent-50">Output Text</h2>
                <span className="text-xs sm:text-sm text-quaternary-400">
                  {outputText.length}
                </span>
              </div>
              <textarea
                value={outputText}
                readOnly
                placeholder="Result will appear here..."
                className="textarea-field bg-secondary-900/70 cursor-default text-sm sm:text-base"
                rows="6"
              />
            </div>

            {/* Method Info */}
            <div className="card bg-tertiary-900/30 border-tertiary-700/50">
              <h3 className="text-base sm:text-lg font-display font-semibold text-accent-50 mb-2 sm:mb-3">
                About {currentMethod?.name}
              </h3>
              <p className="text-xs sm:text-sm text-quaternary-300 leading-relaxed">
                {selectedMethod === 'caesar' && 'The Caesar cipher shifts each letter by a fixed number of positions in the alphabet. Named after Julius Caesar, who used it for military communications.'}
                {selectedMethod === 'vigenere' && 'The Vigenère cipher uses a keyword to create multiple Caesar ciphers. Each letter of the keyword determines the shift for the corresponding letter in the message. Much more secure than simple substitution ciphers.'}
                {selectedMethod === 'rot13' && 'ROT13 is a special case of the Caesar cipher that shifts letters by 13 positions. Since the alphabet has 26 letters, applying ROT13 twice returns the original text.'}
                {selectedMethod === 'base64' && 'Base64 encoding converts binary data into ASCII text format using 64 printable characters. While not encryption, it\'s useful for data transmission and storage.'}
                {selectedMethod === 'aes' && 'AES (Advanced Encryption Standard) is a symmetric encryption algorithm widely used worldwide. It\'s considered very secure and is used by governments and organizations to protect sensitive data.'}
                {selectedMethod === 'reverse' && 'Reverse text simply flips the order of characters. While not a secure encryption method, it\'s useful for obfuscation and can be combined with other methods.'}
                {selectedMethod === 'atbash' && 'Atbash is a monoalphabetic substitution cipher originally used for the Hebrew alphabet. It maps each letter to its reverse in the alphabet (A↔Z, B↔Y, etc.).'}
                {selectedMethod === 'keyword' && 'A keyword cipher uses a keyword to create a cipher alphabet. The keyword (with duplicates removed) is placed at the start of the alphabet, followed by the remaining letters in order.'}
                {selectedMethod === 'morse' && 'Morse code represents text as a series of dots and dashes. Invented by Samuel Morse in the 1830s, it was used extensively in telegraphy and is still used in aviation and amateur radio.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-accent-50">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-quaternary-400 hover:text-accent-50 text-2xl">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Default Method */}
              <div>
                <label className="block text-sm font-semibold text-accent-50 mb-2">
                  Default Encryption Method
                </label>
                <select
                  value={settings.defaultMethod}
                  onChange={(e) => setSettings({ ...settings, defaultMethod: e.target.value })}
                  className="input-field"
                >
                  {encryptionMethods.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Auto-copy */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-accent-50">Auto-copy Output</div>
                  <div className="text-sm text-quaternary-400">Automatically copy result to clipboard</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoCopy}
                  onChange={(e) => setSettings({ ...settings, autoCopy: e.target.checked })}
                  className="w-5 h-5 accent-tertiary-500"
                />
              </div>

              {/* Auto-process */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-accent-50">Auto-process</div>
                  <div className="text-sm text-quaternary-400">Encrypt/decrypt as you type</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoProcess}
                  onChange={(e) => setSettings({ ...settings, autoProcess: e.target.checked })}
                  className="w-5 h-5 accent-tertiary-500"
                />
              </div>

              {/* Text Case */}
              <div>
                <label className="block text-sm font-semibold text-accent-50 mb-2">
                  Output Text Case
                </label>
                <select
                  value={settings.textCase}
                  onChange={(e) => setSettings({ ...settings, textCase: e.target.value })}
                  className="input-field"
                >
                  <option value="preserve">Preserve Original</option>
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                </select>
              </div>

              {/* Remove Spaces */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-accent-50">Remove Spaces from Output</div>
                  <div className="text-sm text-quaternary-400">Strip all whitespace characters</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.removeSpaces}
                  onChange={(e) => setSettings({ ...settings, removeSpaces: e.target.checked })}
                  className="w-5 h-5 accent-tertiary-500"
                />
              </div>

              {/* Group By */}
              <div>
                <label className="block text-sm font-semibold text-accent-50 mb-2">
                  Group Characters (0 = no grouping)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.groupBy}
                  onChange={(e) => setSettings({ ...settings, groupBy: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="e.g., 5 for groups of 5"
                />
                <p className="text-xs text-quaternary-500 mt-1">
                  Classic cipher format: 5 groups text like this
                </p>
              </div>

              <button onClick={() => setShowSettings(false)} className="button-primary w-full">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-accent-50">⌨️ Keyboard Shortcuts</h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-quaternary-400 hover:text-accent-50 text-2xl">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-tertiary-700">
                <span className="text-quaternary-300">Encrypt/Decrypt</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-tertiary-700">
                <span className="text-quaternary-300">Copy Output</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-tertiary-700">
                <span className="text-quaternary-300">Swap Input/Output</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-tertiary-700">
                <span className="text-quaternary-300">Clear All</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-tertiary-700">
                <span className="text-quaternary-300">Show This Help</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">?</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-quaternary-300">Close Modals</span>
                <kbd className="px-3 py-1 bg-secondary-700 rounded text-sm">Esc</kbd>
              </div>
            </div>

            <button onClick={() => setShowKeyboardHelp(false)} className="button-primary w-full mt-6">
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-accent-50">
                {tutorialSteps[tutorialStep].title}
              </h2>
              <button onClick={() => { setShowTutorial(false); setTutorialStep(0); }} className="text-quaternary-400 hover:text-accent-50 text-2xl">
                ✕
              </button>
            </div>

            <p className="text-quaternary-300 text-lg mb-6 leading-relaxed">
              {tutorialSteps[tutorialStep].content}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-quaternary-500">
                Step {tutorialStep + 1} of {tutorialSteps.length}
              </div>
              <div className="flex gap-3">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep(tutorialStep - 1)}
                    className="button-secondary"
                  >
                    Previous
                  </button>
                )}
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep(tutorialStep + 1)}
                    className="button-primary"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowTutorial(false); setTutorialStep(0); }}
                    className="button-primary"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-accent-50">🔗 Share</h2>
              <button onClick={() => setShowShareModal(false)} className="text-quaternary-400 hover:text-accent-50 text-2xl">
                ✕
              </button>
            </div>

            <p className="text-quaternary-300 mb-4">
              Share this encrypted text with others using the URL below:
            </p>

            <div className="bg-secondary-900 rounded p-3 mb-4 break-all text-sm text-accent-50">
              {shareUrl}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="button-primary flex-1"
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy URL'}
              </button>
              <button onClick={() => setShowShareModal(false)} className="button-secondary">
                Close
              </button>
            </div>

            <p className="text-xs text-quaternary-500 mt-4">
              ⚠️ Note: The URL contains the encrypted text. Only share with trusted recipients.
            </p>
          </div>
        </div>
      )}

      {/* Brute Force Results Modal */}
      {showBruteForce && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-accent-50">🔓 Brute Force Results</h2>
              <button onClick={() => setShowBruteForce(false)} className="text-quaternary-400 hover:text-accent-50 text-2xl">
                ✕
              </button>
            </div>

            <p className="text-quaternary-300 mb-4">
              All 25 possible Caesar cipher shifts:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bruteForceResults.map((result) => (
                <div key={result.shift} className="bg-secondary-900/50 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-tertiary-400">Shift {result.shift}</span>
                    <button
                      onClick={() => {
                        setOutputText(result.text);
                        setShowBruteForce(false);
                      }}
                      className="button-secondary text-xs"
                    >
                      Use This
                    </button>
                  </div>
                  <div className="text-sm text-accent-50 break-words">
                    {result.text.substring(0, 200)}
                    {result.text.length > 200 && '...'}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowBruteForce(false)} className="button-primary w-full mt-6">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-tertiary-500/30 bg-primary-800/80 py-3 sm:py-4 text-center text-xs text-quaternary-500 px-4">
        <p>&copy; {new Date().getFullYear()} Amer Kovacevic All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
