import { useEffect, useRef, useState } from 'react';

export function usePitchDetection(
  analyser: AnalyserNode | null,
  isActive: boolean
) {
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !isActive) {
      setPitch(null);
      setNote('');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    const sampleRate = analyser.context.sampleRate;

    const detectPitch = () => {
      analyser.getFloatTimeDomainData(buffer);
      
      const detectedPitch = autoCorrelate(buffer, sampleRate);
      
      if (detectedPitch && detectedPitch > 0) {
        setPitch(detectedPitch);
        setNote(frequencyToNote(detectedPitch));
      } else {
        setPitch(null);
        setNote('');
      }

      animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    detectPitch();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive]);

  return { pitch, note };
}

// Autocorrelation pitch detection algorithm
function autoCorrelate(buffer: Float32Array, sampleRate: number): number | null {
  // Calculate RMS to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  
  // If signal is too quiet, don't detect pitch
  if (rms < 0.01) return null;

  // Find the first zero crossing
  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;

  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      r2 = buffer.length - i;
      break;
    }
  }

  const trimmedBuffer = buffer.slice(r1, r2);
  const size = trimmedBuffer.length;

  // Autocorrelation
  const correlations = new Array(size).fill(0);
  
  for (let lag = 0; lag < size; lag++) {
    for (let i = 0; i < size - lag; i++) {
      correlations[lag] += trimmedBuffer[i] * trimmedBuffer[i + lag];
    }
  }

  // Find the first peak after the initial correlation
  let maxCorrelation = 0;
  let maxLag = 0;
  let foundPeak = false;

  for (let lag = 1; lag < size; lag++) {
    if (correlations[lag] > correlations[lag - 1] && correlations[lag] > correlations[lag + 1]) {
      if (!foundPeak) {
        foundPeak = true;
      } else if (correlations[lag] > maxCorrelation * 0.9) {
        maxCorrelation = correlations[lag];
        maxLag = lag;
        break;
      }
    }
  }

  if (maxLag === 0) return null;

  const frequency = sampleRate / maxLag;

  // Filter out unrealistic frequencies (human voice range roughly 80-1100 Hz)
  if (frequency < 60 || frequency > 1200) return null;

  return frequency;
}

// Convert frequency to musical note
function frequencyToNote(frequency: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  
  const halfSteps = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(halfSteps / 12);
  const note = noteNames[halfSteps % 12];
  
  return `${note}${octave}`;
}
