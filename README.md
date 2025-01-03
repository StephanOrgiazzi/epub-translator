# EPUB Translator

A modern web application that translates EPUB books into different languages using the DeepSeek AI model. Built with React, TypeScript, and Vite.

🌐 **[Try it live: epub-translator.onrender.com](https://epub-translator.onrender.com/)**

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
    ├── translationProcessor.ts # Translation processing logic
    └── translationStreamUtils.ts # Stream processing utilities
```

## Usage

### Translation Process

1. Upload an EPUB file by dragging and dropping or clicking the upload area
2. Select your target language from the dropdown
3. Click "Translate" to start the translation process
4. The system will:
   - Extract and parse EPUB content
   - Split content into optimal chunks
   - Process chunks concurrently with rate limiting
   - Stream translations in real-time
   - Show accurate progress with streaming updates
   - Generate and download the translated EPUB
5. Monitor the progress bar for translation status
6. Once complete, the translated EPUB will automatically download

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
- **Translation Service**: 
  - `translation.ts`: Handles DeepSeek API integration
  - `translationStreamUtils.ts`: Manages streaming response processing
- **Translation Utilities**:
  - `fileUtils.ts`: Handles file operations (download, name truncation)
  - `splitContent.ts`: Splits EPUB content into manageable chunks
  - `translationQueue.ts`: Manages concurrent translation requests
  - `translationProcessor.ts`: Orchestrates the translation process
  - `translationStreamUtils.ts`: Processes streaming API responses

### Technical Implementation

- **Concurrent Processing**: 
  - Processes multiple files simultaneously
  - Handles multiple chunks per file concurrently
  - Rate limits API requests to prevent overload

- **Stream Processing**:
  - Real-time translation streaming
  - Efficient buffer management
  - Progress tracking per character
  - Memory-efficient processing

- **Error Handling**:
  - Graceful error recovery
  - Detailed error reporting
  - Translation validation
  - Cancellation support

## License

This project is licensed under the MIT License.

## Acknowledgments

- DeepSeek for their powerful translation API
- The React and Vite communities
