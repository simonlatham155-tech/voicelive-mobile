import { useState, useEffect } from 'react';
import { Waves, Clock, Sparkles, Sliders, Radio, Music2 } from 'lucide-react';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EffectControlsProps {
  isActive: boolean;
  updateChorusFn: ((amount: number) => void) | null;
  updateAutotuneFn: ((amount: number, pitch: number | null) => void) | null;
  updateAutotuneKeyFn: ((key: string) => void) | null;
  detectedPitch: number | null;
  currentPreset: string;
}

export function EffectControls({ 
  isActive, 
  updateChorusFn, 
  updateAutotuneFn, 
  updateAutotuneKeyFn, 
  detectedPitch,
  currentPreset 
}: EffectControlsProps) {
  const [reverb, setReverb] = useState(30);
  const [delay, setDelay] = useState(0);
  const [chorus, setChorus] = useState(0);
  const [autotune, setAutotune] = useState(0);
  const [autotuneKey, setAutotuneKey] = useState('C');
  const [harmony, setHarmony] = useState(0);
  const [compression, setCompression] = useState(50);

  // Import preset configs
  useEffect(() => {
    import('./presetConfigs').then(({ presetConfigs }) => {
      const config = presetConfigs[currentPreset];
      if (config) {
        setReverb(config.reverb);
        setDelay(config.delay);
        setChorus(config.chorus);
        setAutotune(config.autotune);
        setAutotuneKey(config.autotuneKey);
        setHarmony(config.harmony);
        setCompression(config.compression);
        
        // Update audio with preset values
        if (updateChorusFn) {
          updateChorusFn(config.chorus);
        }
        if (updateAutotuneFn) {
          updateAutotuneFn(config.autotune, detectedPitch);
        }
        if (updateAutotuneKeyFn) {
          updateAutotuneKeyFn(config.autotuneKey);
        }
      }
    });
  }, [currentPreset]);

  const handleChorusChange = (value: number) => {
    setChorus(value);
    if (updateChorusFn) {
      updateChorusFn(value);
    }
  };

  const handleAutotuneChange = (value: number) => {
    setAutotune(value);
    if (updateAutotuneFn) {
      updateAutotuneFn(value, detectedPitch);
    }
  };

  const handleAutotuneKeyChange = (key: string) => {
    setAutotuneKey(key);
    if (updateAutotuneKeyFn) {
      updateAutotuneKeyFn(key);
    }
  };

  const musicalKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sliders className="w-4 h-4 text-orange-500" />
        <h2 className="text-zinc-400 text-sm tracking-wider uppercase">Effect Controls</h2>
      </div>

      {/* Autotune */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-pink-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Autotune</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={autotuneKey} onValueChange={handleAutotuneKeyChange} disabled={!isActive}>
                <SelectTrigger className="h-7 w-16 bg-zinc-950 border-zinc-700 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {musicalKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{autotune}%</span>
            </div>
          </div>
          <Slider
            value={[autotune]}
            onValueChange={(value) => handleAutotuneChange(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
        </div>
      </div>

      {/* Reverb */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Reverb</span>
            </div>
            <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{reverb}%</span>
          </div>
          <Slider
            value={[reverb]}
            onValueChange={(value) => setReverb(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
        </div>
      </div>

      {/* Delay */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Delay</span>
            </div>
            <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{delay}%</span>
          </div>
          <Slider
            value={[delay]}
            onValueChange={(value) => setDelay(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
        </div>
      </div>

      {/* Chorus */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Chorus</span>
            </div>
            <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{chorus}%</span>
          </div>
          <Slider
            value={[chorus]}
            onValueChange={(value) => handleChorusChange(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
        </div>
      </div>

      {/* Harmony */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Harmony</span>
            </div>
            <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{harmony}%</span>
          </div>
          <Slider
            value={[harmony]}
            onValueChange={(value) => setHarmony(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
          <p className="text-xs text-zinc-600 mt-2">
            Note: Full harmony requires advanced pitch shifting
          </p>
        </div>
      </div>

      {/* Compression */}
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-green-500" />
              <span className="text-sm text-zinc-300 tracking-wider uppercase">Compression</span>
            </div>
            <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700">{compression}%</span>
          </div>
          <Slider
            value={[compression]}
            onValueChange={(value) => setCompression(value[0])}
            max={100}
            step={1}
            disabled={!isActive}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}