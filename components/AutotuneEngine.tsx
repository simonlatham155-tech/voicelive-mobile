// Autotune engine using granular synthesis for pitch correction
export class AutotuneEngine {
  private audioContext: AudioContext;
  private inputNode: AudioNode;
  private outputNode: GainNode;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  
  private pitchShiftRatio: number = 1.0;
  private detectedPitch: number | null = null;
  private targetKey: string = 'C';
  private autotuneAmount: number = 0;

  constructor(audioContext: AudioContext, input: AudioNode) {
    this.audioContext = audioContext;
    this.inputNode = input;
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = 1.0;
  }

  setDetectedPitch(pitch: number | null) {
    this.detectedPitch = pitch;
    this.updatePitchCorrection();
  }

  setKey(key: string) {
    this.targetKey = key;
    this.updatePitchCorrection();
  }

  setAutotuneAmount(amount: number) {
    this.autotuneAmount = amount / 100; // 0-1
    this.updatePitchCorrection();
  }

  private updatePitchCorrection() {
    if (!this.detectedPitch || this.autotuneAmount === 0) {
      this.pitchShiftRatio = 1.0;
      return;
    }

    const targetFreq = this.getNearestNoteInKey(this.detectedPitch, this.targetKey);
    const correctionRatio = targetFreq / this.detectedPitch;
    
    // Blend between original and corrected based on autotune amount
    this.pitchShiftRatio = 1.0 + (correctionRatio - 1.0) * this.autotuneAmount;
    
    // Limit to realistic vocal range
    this.pitchShiftRatio = Math.max(0.5, Math.min(2.0, this.pitchShiftRatio));
  }

  private getNearestNoteInKey(frequency: number, key: string): number {
    // Define scale degrees for major scale (in semitones from root)
    const majorScaleDegrees = [0, 2, 4, 5, 7, 9, 11];
    
    // Note names to semitone offset from C
    const noteOffsets: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const keyOffset = noteOffsets[key] || 0;
    
    // Convert frequency to MIDI note number
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    const octave = Math.floor(midiNote / 12);
    const semitoneInOctave = Math.round(midiNote % 12);
    
    // Find nearest note in key
    let minDistance = Infinity;
    let nearestSemitone = semitoneInOctave;
    
    for (const degree of majorScaleDegrees) {
      const noteInKey = (keyOffset + degree) % 12;
      const distance = Math.abs(semitoneInOctave - noteInKey);
      const wrappedDistance = Math.min(distance, 12 - distance);
      
      if (wrappedDistance < minDistance) {
        minDistance = wrappedDistance;
        nearestSemitone = noteInKey;
      }
    }
    
    // Convert back to frequency
    const correctedMidi = octave * 12 + nearestSemitone;
    return 440 * Math.pow(2, (correctedMidi - 69) / 12);
  }

  getPitchShiftRatio(): number {
    return this.pitchShiftRatio;
  }

  connect(destination: AudioNode) {
    this.outputNode.connect(destination);
  }

  getOutputNode(): GainNode {
    return this.outputNode;
  }

  cleanup() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
  }
}