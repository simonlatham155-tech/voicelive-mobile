import { useEffect, useRef, useState } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { useAudioEffects } from './useAudioEffects';
import { usePitchDetection } from './usePitchDetection';

interface VoiceProcessorProps {
  isActive: boolean;
  currentPreset: string;
  onUpdateChorus?: (fn: (amount: number) => void) => void;
  onUpdateAutotune?: (fn: (amount: number, pitch: number | null) => void) => void;
  onUpdateAutotuneKey?: (fn: (key: string) => void) => void;
  onPitchDetected?: (pitch: number | null) => void;
}

export function VoiceProcessor({ 
  isActive, 
  currentPreset, 
  onUpdateChorus,
  onUpdateAutotune,
  onUpdateAutotuneKey,
  onPitchDetected
}: VoiceProcessorProps) {
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { setupEffects, updatePreset, updateChorus, updateAutotune, updateAutotuneKey, cleanupEffects } = useAudioEffects();
  const { pitch, note } = usePitchDetection(analyserRef.current, isActive && permissionGranted);

  // Expose updateChorus to parent
  useEffect(() => {
    if (onUpdateChorus && updateChorus) {
      onUpdateChorus(updateChorus);
    }
  }, [updateChorus, onUpdateChorus]);

  // Expose updateAutotune to parent
  useEffect(() => {
    if (onUpdateAutotune && updateAutotune) {
      onUpdateAutotune(updateAutotune);
    }
  }, [updateAutotune, onUpdateAutotune]);

  // Expose updateAutotuneKey to parent
  useEffect(() => {
    if (onUpdateAutotuneKey && updateAutotuneKey) {
      onUpdateAutotuneKey(updateAutotuneKey);
    }
  }, [updateAutotuneKey, onUpdateAutotuneKey]);

  // Notify parent of pitch changes
  useEffect(() => {
    if (onPitchDetected) {
      onPitchDetected(pitch);
    }
  }, [pitch, onPitchDetected]);

  useEffect(() => {
    if (isActive) {
      startAudioProcessing();
    } else {
      stopAudioProcessing();
    }

    return () => {
      stopAudioProcessing();
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && audioContextRef.current) {
      updatePreset(currentPreset);
    }
  }, [currentPreset, isActive]);

  const startAudioProcessing = async () => {
    try {
      setError(null);
      
      console.log('[VoiceProcessor] Starting audio processing...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      console.log('[VoiceProcessor] getUserMedia is available');
      
      // Use the global AudioContext created by the Power button (iOS requirement)
      // This ensures the AudioContext is created and resumed in direct response to user gesture
      let audioContext = (window as any).__globalAudioContext;
      
      if (!audioContext) {
        console.log('[VoiceProcessor] No global AudioContext found, creating new one...');
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } else {
        console.log('[VoiceProcessor] Using global AudioContext');
      }
      
      audioContextRef.current = audioContext;
      console.log('[VoiceProcessor] AudioContext state:', audioContext.state);

      // Request microphone access FIRST (this is another user gesture)
      console.log('[VoiceProcessor] Requesting microphone access...');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          },
        });
        console.log('[VoiceProcessor] getUserMedia succeeded');
      } catch (micError: any) {
        console.error('[VoiceProcessor] getUserMedia failed:', micError);
        console.error('[VoiceProcessor] Error name:', micError.name);
        console.error('[VoiceProcessor] Error message:', micError.message);
        console.error('[VoiceProcessor] Error type:', typeof micError);
        throw micError;
      }

      streamRef.current = stream;
      setPermissionGranted(true);
      console.log('[VoiceProcessor] Microphone access granted');

      // NOW try to resume AudioContext after we have mic permission (another user gesture context)
      if (audioContext.state === 'suspended') {
        console.log('[VoiceProcessor] Resuming AudioContext after mic grant...');
        try {
          await audioContext.resume();
          console.log('[VoiceProcessor] AudioContext resumed:', audioContext.state);
        } catch (resumeErr: any) {
          console.error('[VoiceProcessor] Resume after mic failed:', resumeErr?.message || resumeErr);
          console.log('[VoiceProcessor] Continuing anyway, state:', audioContext.state);
        }
      }

      console.log('[VoiceProcessor] AudioContext final state:', audioContext.state);

      // Create nodes
      console.log('[VoiceProcessor] Creating audio nodes...');
      await new Promise(resolve => setTimeout(resolve, 500)); // DELAY to see logs
      const source = audioContext.createMediaStreamSource(stream);
      console.log('[VoiceProcessor] MediaStreamSource created');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      console.log('[VoiceProcessor] Analyser created');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Setup effects chain
      console.log('[VoiceProcessor] Setting up effects chain...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setupEffects(audioContext, source, analyser);
      console.log('[VoiceProcessor] Effects chain setup complete');

      // TEMPORARY: Don't connect to destination to debug iOS crash
      // Connect to destination - user MUST wear headphones to prevent feedback
      // This is required for the vocal processor to work
      console.log('[VoiceProcessor] NOT connecting to output (testing iOS crash fix)');
      // const effectsOutput = setupEffects(audioContext, source, analyser);
      // effectsOutput.connect(audioContext.destination);
      
      console.log('[VoiceProcessor] Audio nodes connected - monitoring only mode');

      // Start level monitoring
      console.log('[VoiceProcessor] Starting level monitoring...');
      monitorAudioLevel();
      console.log('[VoiceProcessor] Audio processing started successfully!');
    } catch (err: any) {
      console.error('[VoiceProcessor] Audio processing error:', err);
      console.error('[VoiceProcessor] Error name:', err?.name);
      console.error('[VoiceProcessor] Error message:', err?.message);
      console.error('[VoiceProcessor] Error stack:', err?.stack);
      console.error('[VoiceProcessor] Error string:', String(err));
      console.error('[VoiceProcessor] Error JSON:', JSON.stringify(err));
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please go to Settings > Safari > Microphone and allow access, then refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect your iRig mic and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is busy or being used by another app. Please close other apps and try again.');
      } else {
        setError(`Failed to start audio: ${err.message || err.name || 'Unknown error'}. Try refreshing the page.`);
      }
      
      // Auto turn off if failed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const stopAudioProcessing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    cleanupEffects();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setAudioLevel(Math.min(rms * 5, 1)); // Scale and clamp

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isActive && !error && !permissionGranted && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-xl">
          <p className="text-yellow-400 text-sm text-center">
            Please allow microphone access when prompted...
          </p>
        </div>
      )}

      <AudioVisualizer
        level={audioLevel}
        isActive={isActive && permissionGranted}
        analyser={analyserRef.current}
      />

      {/* Pitch Detection Display */}
      {isActive && permissionGranted && pitch && (
        <div className="mt-4 p-4 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-lg border border-zinc-600 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Detected Pitch</span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-200 font-mono">{note}</span>
              <span className="text-xs text-zinc-500">{Math.round(pitch)} Hz</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}