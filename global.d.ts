interface Window {
  aistudio?: {
    hasSelectedApiKey?: () => Promise<boolean>;
    openSelectKey?: () => Promise<void>;
    getSelectedApiKey?: () => Promise<string | null>;
  };
}
