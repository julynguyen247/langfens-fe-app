// =============================================
// AUDIO HELPER (Web Speech API)
// =============================================
export function speakWord(word: string, region: 'UK' | 'US' = 'UK') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = region === 'UK' ? 'en-GB' : 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
