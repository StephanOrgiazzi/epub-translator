interface TranslationQueueState {
  running: number;
  maxConcurrent: number;
}

export const createTranslationQueue = (maxConcurrent: number) => {
  const state: TranslationQueueState = {
    running: 0,
    maxConcurrent,
  };

  const enqueueAndExecute = async <T>(task: () => Promise<T>): Promise<T> => {
    while (state.running >= state.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    state.running++;
    try {
      return await task();
    } finally {
      state.running--;
    }
  };

  return { enqueueAndExecute };
};
