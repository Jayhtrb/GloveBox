/**
 * Bridge to the Android app. The Android WebView injects `GloveBoxNative` only when this
 * UI runs inside the app. In a normal browser every helper here is a no-op or returns false,
 * so the prototype still works on its own.
 */
interface NativeBridge {
  /** Open a page in the native browser, which enforces video lock while driving. */
  openUrl(url: string): void;
  /** Show the native browser with the given page or the home page. */
  showBrowser(url: string): void;
  /** Start the system speech recognizer. The result comes back through window.gloveboxVoiceResult. */
  startVoice(): void;
}

declare global {
  interface Window {
    GloveBoxNative?: NativeBridge;
    gloveboxSetDriving?: (driving: boolean) => void;
    gloveboxVoiceResult?: (text: string) => void;
  }
}

export const native: NativeBridge | undefined =
  typeof window !== 'undefined' ? window.GloveBoxNative : undefined;

export const isNative = native !== undefined;
