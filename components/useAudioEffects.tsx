import { useRef } from 'react';
import { AutotuneEngine } from './AutotuneEngine';

interface EffectNodes {
  preGain: GainNode;
  compressor: DynamicsCompressorNode;
  autotune: AutotuneEngine | null;
  pitchShifter: BiquadFilterNode;
  harmony: GainNode;
  chorus: DelayNode;
  chorusLFO: OscillatorNode;
  chorusDepth: GainNode;
  chorusWet: GainNode;
  chorusDry: GainNode;
  reverb: ConvolverNode;
  reverbGain: GainNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  delayGain: GainNode;
  eq: BiquadFilterNode[];
  postGain: GainNode;
}

export function useAudioEffects() {
  const nodesRef = useRef<EffectNodes | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const createReverbImpulse = (audioContext: AudioContext, duration: number, decay: number) => {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    return impulse;
  };

  const setupEffects = (
    audioContext: AudioContext,
    source: MediaStreamAudioSourceNode,
    analyser: AnalyserNode
  ): GainNode => {
    try {
      console.log('[useAudioEffects] Starting effects setup...');
      audioContextRef.current = audioContext;

      // Create all effect nodes
      console.log('[useAudioEffects] Creating effect nodes...');
      const preGain = audioContext.createGain();
      const compressor = audioContext.createDynamicsCompressor();
      console.log('[useAudioEffects] Creating autotune engine...');
      const autotune = new AutotuneEngine(audioContext, source);
      const pitchShifter = audioContext.createBiquadFilter();
      const harmony = audioContext.createGain();
      const reverb = audioContext.createConvolver();
      const reverbGain = audioContext.createGain();
      const delay = audioContext.createDelay(5.0);
      const delayFeedback = audioContext.createGain();
      const delayGain = audioContext.createGain();
      const postGain = audioContext.createGain();

      // EQ (3-band)
      console.log('[useAudioEffects] Creating EQ nodes...');
      const lowEQ = audioContext.createBiquadFilter();
      const midEQ = audioContext.createBiquadFilter();
      const highEQ = audioContext.createBiquadFilter();
      
      lowEQ.type = 'lowshelf';
      lowEQ.frequency.value = 200;
      midEQ.type = 'peaking';
      midEQ.frequency.value = 1000;
      midEQ.Q.value = 0.5;
      highEQ.type = 'highshelf';
      highEQ.frequency.value = 3000;

      // Configure compressor
      console.log('[useAudioEffects] Configuring compressor...');
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Setup reverb
      console.log('[useAudioEffects] Setting up reverb...');
      reverb.buffer = createReverbImpulse(audioContext, 2, 2);
      reverbGain.gain.value = 0;

      // Setup delay
      console.log('[useAudioEffects] Setting up delay...');
      delay.delayTime.value = 0.375; // ~150ms at 120 BPM
      delayFeedback.gain.value = 0;
      delayGain.gain.value = 0;

      // Initial gains
      preGain.gain.value = 1.5;
      postGain.gain.value = 1.0;
      harmony.gain.value = 0;

      // Connect the chain
      console.log('[useAudioEffects] Connecting audio chain...');
      source.connect(analyser);
      
      // Main signal path
      analyser.connect(preGain);
      preGain.connect(compressor);
      compressor.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);
      
      // Reverb send
      highEQ.connect(reverb);
      reverb.connect(reverbGain);
      
      // Delay send
      highEQ.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay); // Feedback loop
      delay.connect(delayGain);
      
      // Mix to output
      highEQ.connect(postGain);
      reverbGain.connect(postGain);
      delayGain.connect(postGain);

      // Chorus setup
      console.log('[useAudioEffects] Setting up chorus...');
      const chorus = audioContext.createDelay(0.05);
      const chorusLFO = audioContext.createOscillator();
      const chorusDepth = audioContext.createGain();
      const chorusWet = audioContext.createGain();
      const chorusDry = audioContext.createGain();

      chorus.delayTime.value = 0.025; // Base delay time (25ms)
      chorusLFO.type = 'sine';
      chorusLFO.frequency.value = 1.5; // LFO frequency
      chorusDepth.gain.value = 0.005; // Depth of the chorus effect
      chorusWet.gain.value = 0; // Start with chorus off
      chorusDry.gain.value = 1.0; // Full dry signal

      // Connect chorus LFO to modulate delay time
      chorusLFO.connect(chorusDepth);
      chorusDepth.connect(chorus.delayTime);
      chorusLFO.start();

      // Connect audio through chorus
      highEQ.connect(chorus);
      chorus.connect(chorusWet);
      highEQ.connect(chorusDry);
      chorusWet.connect(postGain);
      chorusDry.connect(postGain);

      nodesRef.current = {
        preGain,
        compressor,
        autotune,
        pitchShifter,
        harmony,
        reverb,
        reverbGain,
        delay,
        delayFeedback,
        delayGain,
        eq: [lowEQ, midEQ, highEQ],
        postGain,
        chorus,
        chorusLFO,
        chorusDepth,
        chorusWet,
        chorusDry,
      };

      console.log('[useAudioEffects] Effects setup complete!');
      return postGain;
    } catch (error) {
      console.error('[useAudioEffects] Error in setupEffects:', error);
      throw error;
    }
  };

  const updatePreset = (preset: string) => {
    if (!nodesRef.current) return;

    const { reverbGain, delayGain, delayFeedback, delay, eq, preGain, chorusLFO, chorusDepth, chorusWet, chorusDry, autotune } = nodesRef.current;

    switch (preset) {
      case 'simon-le-bon':
        // Energetic new wave with bright reverb
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.3;
        delayFeedback.gain.value = 0.4;
        delay.delayTime.value = 0.375; // Rhythmic delay
        eq[0].gain.value = 2;
        eq[1].gain.value = 3; // Present mids
        eq[2].gain.value = 6; // Bright, energetic highs
        preGain.gain.value = 2.0;
        chorusLFO.frequency.value = 2.0;
        chorusDepth.gain.value = 0.006;
        chorusWet.gain.value = 0.4;
        chorusDry.gain.value = 0.7;
        if (autotune) {
          autotune.setKey('D');
          autotune.setAutotuneAmount(30);
        }
        break;

      case 'dave-gahan':
        // Dark electronic baritone with deep space
        reverbGain.gain.value = 0.55;
        delayGain.gain.value = 0.4;
        delayFeedback.gain.value = 0.5;
        delay.delayTime.value = 0.5; // Long, atmospheric delay
        eq[0].gain.value = 6; // Deep bass for baritone
        eq[1].gain.value = 1;
        eq[2].gain.value = -1; // Darker tone
        preGain.gain.value = 1.9;
        chorusLFO.frequency.value = 1.2;
        chorusDepth.gain.value = 0.007;
        chorusWet.gain.value = 0.35;
        chorusDry.gain.value = 0.75;
        if (autotune) {
          autotune.setKey('A');
          autotune.setAutotuneAmount(20);
        }
        break;

      case 'chris-martin':
        // Soaring arena rock with lush reverb
        reverbGain.gain.value = 0.5;
        delayGain.gain.value = 0.25;
        delayFeedback.gain.value = 0.35;
        delay.delayTime.value = 0.375;
        eq[0].gain.value = 3;
        eq[1].gain.value = 2;
        eq[2].gain.value = 5; // Clear, soaring highs
        preGain.gain.value = 2.1;
        chorusLFO.frequency.value = 1.8;
        chorusDepth.gain.value = 0.005;
        chorusWet.gain.value = 0.3;
        chorusDry.gain.value = 0.8;
        if (autotune) {
          autotune.setKey('G');
          autotune.setAutotuneAmount(25);
        }
        break;

      case 'mark-hollis':
        // Intimate minimalist with natural space
        reverbGain.gain.value = 0.25;
        delayGain.gain.value = 0.1;
        delayFeedback.gain.value = 0.15;
        delay.delayTime.value = 0.3;
        eq[0].gain.value = 2; // Gentle warmth
        eq[1].gain.value = 0; // Natural mids
        eq[2].gain.value = 1; // Subtle air
        preGain.gain.value = 1.5;
        chorusLFO.frequency.value = 1.0;
        chorusDepth.gain.value = 0.003;
        chorusWet.gain.value = 0.15;
        chorusDry.gain.value = 0.9;
        if (autotune) {
          autotune.setKey('C');
          autotune.setAutotuneAmount(5);
        }
        break;

      case 'bernard-sumner':
        // Post-punk electronic with rhythmic delay
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.35;
        delayFeedback.gain.value = 0.45;
        delay.delayTime.value = 0.375; // Synced rhythmic delay
        eq[0].gain.value = 1; // Controlled low end
        eq[1].gain.value = 2; // Present mids
        eq[2].gain.value = 3; // Clear electronic highs
        preGain.gain.value = 1.8;
        chorusLFO.frequency.value = 1.6;
        chorusDepth.gain.value = 0.006;
        chorusWet.gain.value = 0.4;
        chorusDry.gain.value = 0.7;
        if (autotune) {
          autotune.setKey('E');
          autotune.setAutotuneAmount(35);
        }
        break;

      case 'morten-harket':
        // Soaring synth-pop with crystalline highs
        reverbGain.gain.value = 0.45;
        delayGain.gain.value = 0.3;
        delayFeedback.gain.value = 0.4;
        delay.delayTime.value = 0.375;
        eq[0].gain.value = 0; // Clean low end
        eq[1].gain.value = 1; // Clear mids
        eq[2].gain.value = 7; // Very bright, crystalline highs
        preGain.gain.value = 1.9;
        chorusLFO.frequency.value = 2.2;
        chorusDepth.gain.value = 0.007;
        chorusWet.gain.value = 0.45;
        chorusDry.gain.value = 0.65;
        if (autotune) {
          autotune.setKey('A');
          autotune.setAutotuneAmount(40);
        }
        break;

      case 'seal':
        // Rich soulful baritone with smooth warmth
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.18;
        delayFeedback.gain.value = 0.25;
        delay.delayTime.value = 0.3;
        eq[0].gain.value = 5; // Rich, warm bass
        eq[1].gain.value = 2; // Full mids
        eq[2].gain.value = 2; // Smooth, not harsh highs
        preGain.gain.value = 1.9;
        chorusLFO.frequency.value = 1.3;
        chorusDepth.gain.value = 0.004;
        chorusWet.gain.value = 0.25;
        chorusDry.gain.value = 0.85;
        if (autotune) {
          autotune.setKey('F');
          autotune.setAutotuneAmount(15);
        }
        break;

      case 'freddie-mercury':
        // Powerful rock vocals with stadium reverb
        reverbGain.gain.value = 0.5;
        delayGain.gain.value = 0.25;
        delayFeedback.gain.value = 0.35;
        delay.delayTime.value = 0.375;
        eq[0].gain.value = 4; // Boost lows for power
        eq[1].gain.value = 2; // Boost mids for presence
        eq[2].gain.value = 5; // Boost highs for clarity
        preGain.gain.value = 2.2;
        chorusLFO.frequency.value = 1.7;
        chorusDepth.gain.value = 0.005;
        chorusWet.gain.value = 0.35;
        chorusDry.gain.value = 0.75;
        if (autotune) {
          autotune.setKey('C');
          autotune.setAutotuneAmount(10);
        }
        break;

      case 'adele':
        // Rich, emotional studio sound
        reverbGain.gain.value = 0.3;
        delayGain.gain.value = 0.15;
        delayFeedback.gain.value = 0.25;
        delay.delayTime.value = 0.25;
        eq[0].gain.value = 3; // Warmth
        eq[1].gain.value = 1;
        eq[2].gain.value = 3; // Air and clarity
        preGain.gain.value = 1.9;
        chorusLFO.frequency.value = 1.4;
        chorusDepth.gain.value = 0.004;
        chorusWet.gain.value = 0.2;
        chorusDry.gain.value = 0.85;
        if (autotune) {
          autotune.setKey('D');
          autotune.setAutotuneAmount(12);
        }
        break;

      case 'frank-sinatra':
        // Classic warm vintage tone
        reverbGain.gain.value = 0.2;
        delayGain.gain.value = 0.1;
        delayFeedback.gain.value = 0.2;
        delay.delayTime.value = 0.3;
        eq[0].gain.value = 5; // Warm low end
        eq[1].gain.value = 2; // Rich mids
        eq[2].gain.value = -2; // Roll off highs for vintage
        preGain.gain.value = 1.7;
        chorusLFO.frequency.value = 1.0;
        chorusDepth.gain.value = 0.003;
        chorusWet.gain.value = 0.1;
        chorusDry.gain.value = 0.95;
        if (autotune) {
          autotune.setKey('C');
          autotune.setAutotuneAmount(5);
        }
        break;

      case 'beyonce':
        // Modern R&B with vocal layers
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.3;
        delayFeedback.gain.value = 0.15;
        delay.delayTime.value = 0.125; // Short delay for thickness
        eq[0].gain.value = 2;
        eq[1].gain.value = 3; // Strong mids
        eq[2].gain.value = 4; // Bright highs
        preGain.gain.value = 2.0;
        chorusLFO.frequency.value = 1.8;
        chorusDepth.gain.value = 0.006;
        chorusWet.gain.value = 0.35;
        chorusDry.gain.value = 0.75;
        if (autotune) {
          autotune.setKey('G');
          autotune.setAutotuneAmount(45);
        }
        break;

      case 'ed-sheeran':
        // Intimate acoustic with subtle doubling
        reverbGain.gain.value = 0.15;
        delayGain.gain.value = 0.25;
        delayFeedback.gain.value = 0;
        delay.delayTime.value = 0.035; // Very short for doubling
        eq[0].gain.value = 1;
        eq[1].gain.value = 2;
        eq[2].gain.value = 2;
        preGain.gain.value = 1.6;
        chorusLFO.frequency.value = 1.5;
        chorusDepth.gain.value = 0.005;
        chorusWet.gain.value = 0.3;
        chorusDry.gain.value = 0.8;
        if (autotune) {
          autotune.setKey('G');
          autotune.setAutotuneAmount(20);
        }
        break;

      case 'billie-eilish':
        // Whisper-close lo-fi bedroom pop
        reverbGain.gain.value = 0.25;
        delayGain.gain.value = 0.2;
        delayFeedback.gain.value = 0.3;
        delay.delayTime.value = 0.5; // Spacious delay
        eq[0].gain.value = 6; // Heavy bass boost
        eq[1].gain.value = -2; // Reduce mids for intimacy
        eq[2].gain.value = -3; // Darker tone
        preGain.gain.value = 1.4;
        chorusLFO.frequency.value = 1.2;
        chorusDepth.gain.value = 0.008;
        chorusWet.gain.value = 0.5;
        chorusDry.gain.value = 0.6;
        if (autotune) {
          autotune.setKey('A');
          autotune.setAutotuneAmount(60);
        }
        break;

      case 'bruno-mars':
        // Funky retro with compression
        reverbGain.gain.value = 0.2;
        delayGain.gain.value = 0.15;
        delayFeedback.gain.value = 0.25;
        delay.delayTime.value = 0.25;
        eq[0].gain.value = 4; // Warm funk bass
        eq[1].gain.value = 4; // Punchy mids
        eq[2].gain.value = 1; // Controlled highs
        preGain.gain.value = 2.3;
        chorusLFO.frequency.value = 1.6;
        chorusDepth.gain.value = 0.005;
        chorusWet.gain.value = 0.25;
        chorusDry.gain.value = 0.8;
        if (autotune) {
          autotune.setKey('F');
          autotune.setAutotuneAmount(35);
        }
        break;

      case 'ariana-grande':
        // Bright pop with lush reverb
        reverbGain.gain.value = 0.4;
        delayGain.gain.value = 0.2;
        delayFeedback.gain.value = 0.3;
        delay.delayTime.value = 0.375;
        eq[0].gain.value = 1;
        eq[1].gain.value = 2;
        eq[2].gain.value = 6; // Bright, airy highs
        preGain.gain.value = 1.8;
        chorusLFO.frequency.value = 2.0;
        chorusDepth.gain.value = 0.007;
        chorusWet.gain.value = 0.4;
        chorusDry.gain.value = 0.7;
        if (autotune) {
          autotune.setKey('E');
          autotune.setAutotuneAmount(50);
        }
        break;

      default:
        // Fallback to Simon Le Bon
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.3;
        delayFeedback.gain.value = 0.4;
        delay.delayTime.value = 0.375;
        eq[0].gain.value = 2;
        eq[1].gain.value = 3;
        eq[2].gain.value = 6;
        preGain.gain.value = 2.0;
        chorusLFO.frequency.value = 2.0;
        chorusDepth.gain.value = 0.006;
        chorusWet.gain.value = 0.4;
        chorusDry.gain.value = 0.7;
        if (autotune) {
          autotune.setKey('D');
          autotune.setAutotuneAmount(30);
        }
        break;
    }
  };

  const cleanupEffects = () => {
    nodesRef.current = null;
    audioContextRef.current = null;
  };

  const updateChorus = (amount: number) => {
    if (!nodesRef.current) return;
    
    const { chorusWet, chorusDry } = nodesRef.current;
    const wetAmount = amount / 100; // Convert 0-100 to 0-1
    
    chorusWet.gain.value = wetAmount * 0.6; // Max wet at 60%
    chorusDry.gain.value = 1.0 - (wetAmount * 0.3); // Reduce dry slightly as wet increases
  };

  const updateAutotune = (amount: number, detectedPitch: number | null) => {
    if (!nodesRef.current || !nodesRef.current.autotune) return;
    
    nodesRef.current.autotune.setAutotuneAmount(amount);
    nodesRef.current.autotune.setDetectedPitch(detectedPitch);
  };

  const updateAutotuneKey = (key: string) => {
    if (!nodesRef.current || !nodesRef.current.autotune) return;
    
    nodesRef.current.autotune.setKey(key);
  };

  return {
    setupEffects,
    updatePreset,
    updateChorus,
    updateAutotune,
    updateAutotuneKey,
    cleanupEffects,
  };
}