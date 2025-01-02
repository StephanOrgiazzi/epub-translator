# EPUB Translator

A modern web application that translates EPUB books into different languages using the DeepSeek AI model. Built with React, TypeScript, and Vite.

## Features

- 🚀 Fast and efficient EPUB translation
- 🎯 Support for multiple languages
- 📚 Preserves EPUB formatting and structure
- 💫 Beautiful, modern UI with glassmorphism effects
- 🔄 Real-time translation progress tracking
- ⚡ Parallel chunk processing for faster translation
- 📱 Responsive design for all devices

![EPUB Translator Screenshot](screenshot.png)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- DeepSeek API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/epub-translator.git
cd epub-translator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your DeepSeek API key:
```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Open the application in your browser
2. Drop an EPUB file or click to select one
3. Choose your target translation language
4. Wait for the translation to complete
5. Download your translated EPUB

## Technical Details

### Built With
- React 18
- TypeScript
- Vite
- TailwindCSS
- DeepSeek AI API

### Key Components
- `EpubUploader`: Main component handling file upload and UI
- `useEpubTranslator`: Custom hook managing translation logic
- `translation.ts`: DeepSeek API integration
- `content.ts`: EPUB content processing

### Translation Process
1. EPUB file is parsed and HTML content extracted
2. Content is split into optimal chunks
3. Chunks are translated in parallel
4. Translated content is reassembled
5. New EPUB is generated with preserved formatting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- DeepSeek for their powerful translation API
- The React and Vite communities
