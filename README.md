# EPUB Translator

A modern web application that translates EPUB books into different languages using the DeepSeek AI model. Built with React, TypeScript, and Vite.

🌐 **[Try it live!](https://epub-translator.onrender.com/)**

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

## Project Structure

```
src/
├── components/          # React components
│   ├── EpubUploader.tsx
│   └── CancelModal.tsx
├── hooks/              # Custom React hooks
│   └── useEpubTranslator.ts
├── services/           # External services integration
│   └── translation.ts  # DeepSeek API integration
├── types/             # TypeScript type definitions
│   ├── languages.ts
│   └── epub.ts
└── utils/             # Utility functions
    ├── fileUtils.ts          # File handling utilities
    ├── splitContent.ts       # Content splitting logic
    ├── translationQueue.ts   # Translation queue management
    └── translationProcessor.ts # Translation processing logic
```

## Usage

1. Upload an EPUB file by dragging and dropping or clicking the upload area
2. Select your target language from the dropdown
3. Click "Translate" to start the translation process
4. Monitor the progress bar for translation status
5. Once complete, the translated EPUB will automatically download

The translation process:
- Splits content into optimal chunks
- Processes multiple chunks concurrently
- Caches translations to avoid duplicate work
- Preserves EPUB structure and formatting

## Technical Details

### Built With
- React 18
- TypeScript
- Vite
- TailwindCSS
- DeepSeek AI API

### Key Components

- **EpubUploader**: Main component for handling file uploads and displaying translation progress
- **useEpubTranslator**: Core hook managing the translation process
- **Translation Utilities**:
  - `fileUtils.ts`: Handles file operations (download, name truncation)
  - `splitContent.ts`: Splits EPUB content into manageable chunks
  - `translationQueue.ts`: Manages concurrent translation requests
  - `translationProcessor.ts`: Orchestrates the translation process

## License

This project is licensed under the MIT License.

## Acknowledgments

- DeepSeek for their powerful translation API
- The React and Vite communities
