import toWav from "audiobuffer-to-wav";

export async function webmToWavFile(mediaBlobUrl: string): Promise<File> {
  const res = await fetch(mediaBlobUrl);
  const webmBlob = await res.blob();
  const arrayBuffer = await webmBlob.arrayBuffer();

  const AudioCtx =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();

  const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
    audioCtx.decodeAudioData(
      arrayBuffer,
      (buf: any) => resolve(buf),
      (err: any) => reject(err)
    );
  });
  const wavArrayBuffer = toWav(audioBuffer);
  const wavBlob = new Blob([wavArrayBuffer], { type: "audio/wav" });
  return new File([wavBlob], `speaking-${Date.now()}.wav`, {
    type: "audio/wav",
  });
}
