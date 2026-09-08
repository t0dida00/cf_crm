let audioContext: AudioContext | null = null;

/** Short two-tone chime, synthesized via Web Audio — no external asset needed.
 * Browsers block audio before any user gesture on the page; the catch here
 * just means the very first notification before any click stays silent. */
export function playNotificationSound() {
  try {
    audioContext ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();

    const now = audioContext.currentTime;
    [880, 1175].forEach((freq, i) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.25);
    });
  } catch {
    // Audio isn't critical to the notification — a toast/modal still shows either way.
  }
}
