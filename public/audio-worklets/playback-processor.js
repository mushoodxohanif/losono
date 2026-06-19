class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];
    this._current = null;
    this._offset = 0;

    this.port.onmessage = (event) => {
      const samples = new Float32Array(event.data);
      if (samples.length > 0) {
        this._queue.push(samples);
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0]?.[0];
    if (!output) {
      return true;
    }

    for (let i = 0; i < output.length; i++) {
      if (!this._current || this._offset >= this._current.length) {
        this._current = this._queue.shift() ?? null;
        this._offset = 0;
      }

      if (!this._current) {
        output[i] = 0;
        continue;
      }

      output[i] = this._current[this._offset];
      this._offset += 1;
    }

    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
