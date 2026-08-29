import React, { createContext, useCallback, useContext, useState } from 'react';

type PreviewContextValue = {
  isPreviewMode: boolean;
  enterPreview: () => void;
  exitPreview: () => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const enterPreview = useCallback(() => {
    if (!__DEV__) return;
    setIsPreviewMode(true);
  }, []);

  const exitPreview = useCallback(() => {
    if (!__DEV__) return;
    setIsPreviewMode(false);
  }, []);

  return (
    <PreviewContext.Provider
      value={{
        isPreviewMode: __DEV__ && isPreviewMode,
        enterPreview,
        exitPreview,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within PreviewProvider');
  }
  return context;
}
