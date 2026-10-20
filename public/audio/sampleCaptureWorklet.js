// AudioWorkletProcessor — runs on the dedicated audio thread (not main),
// so it ticks reliably whenever the audio graph processes blocks. We use
// it to capture mono PCM samples from the tab-audio source and post them
// back to the main thread for the circular buffer in audioPipeline.
//
// Why AudioWorklet instead of ScriptProcessor:
//   - ScriptProcessor is deprecated and Chrome was silently dropping the
//     onaudioprocess callback in some session states (observed: capture
//     "enabled" but buffer never fills despite audio playing through the
//     analyser). AudioWorklet ticks deterministically once the node is in
//     the graph.
//   - Audio-thread execution means we don't share the main-thread budget
//     with Three.js rendering. Less jank potential during heavy frames.
//
// Each process() call gets a fresh 128-sample block per channel (Web Audio
// fixed quantum). We downmix to mono and post the slice. The main thread
// receives via port.onmessage and appends to a Float32Array circular buffer.
// Transferable list keeps the postMessage zero-copy.

// Batch BATCH_SIZE quanta (each 128 samples at the AudioContext's sample
// rate) before posting to the main thread. Cuts message frequency from
// ~375/sec (one per quantum at 48kHz) to ~23/sec (one per 16 quanta), which
// massively reduces main-thread event-loop pressure. Latency cost is ~43ms
// at 48kHz — negligible for mood analysis on 15-second windows.
const BATCH_QUANTA = 16   // 16 × 128 = 2048 samples per message

class SampleCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._batch = null
    this._batchIdx = 0
  }
  process(inputs) {
    const input = inputs[0]
    const inL = input?.[0]
    if (!input || input.length === 0 || !inL) return true
    const inR = input.length > 1 ? input[1] : inL
    const len = inL.length

    if (!this._batch) this._batch = new Float32Array(len * BATCH_QUANTA)
    const buf = this._batch
    let w = this._batchIdx
    for (let i = 0; i < len; i++) {
      buf[w++] = (inL[i] + inR[i]) * 0.5
    }
    this._batchIdx = w

    if (w >= buf.length) {
      this.port.postMessage(buf, [buf.buffer])
      this._batch = new Float32Array(len * BATCH_QUANTA)
      this._batchIdx = 0
    }
    return true
  }
}

registerProcessor('sample-capture', SampleCaptureProcessor)
