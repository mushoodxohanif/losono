class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._chunkSize = 1600;
    this._buffer = new Float32Array(0);
    this._ratio = sampleRate / 16000;
  }

  _downsample(input) {
    if (this._ratio <= 1) {
      return input;
    }

    const outputLength = Math.floor(input.length / this._ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      output[i] = input[Math.floor(i * this._ratio)];
    }

    return output;
  }

  _floatToInt16(float32) {
    const int16 = new Int16Array(float32.length);

    for (let i = 0; i < float32.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return int16;
  }

  _append(samples) {
    const merged = new Float32Array(this._buffer.length + samples.length);
    merged.set(this._buffer, 0);
    merged.set(samples, this._buffer.length);
    this._buffer = merged;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      return true;
    }

    const downsampled = this._downsample(input);
    this._append(downsampled);

    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.slice(0, this._chunkSize);
      this._buffer = this._buffer.slice(this._chunkSize);
      const pcm = this._floatToInt16(chunk);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
