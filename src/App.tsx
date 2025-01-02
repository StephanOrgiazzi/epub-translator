import { EpubUploader } from './components/EpubUploader';

function App() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            EPUB Translator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload an EPUB to translate it to any language
          </p>
          <EpubUploader />
        </div>
      </div>
    </div>
  );
}

export default App;
