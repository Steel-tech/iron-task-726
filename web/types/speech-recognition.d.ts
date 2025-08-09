declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Fallback type for browsers without a built-in SpeechRecognition type
// This satisfies TypeScript without affecting runtime.
type SpeechRecognition = any;

export {}; 