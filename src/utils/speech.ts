export function speak(text: string, rate: number = 0.8): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}
