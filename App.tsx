import { useState } from 'react';
import { VoiceProcessor } from './components/VoiceProcessor';
import { EffectControls } from './components/EffectControls';
import { PresetSelector } from './components/PresetSelector';
import { Mic, Power } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('simon-le-bon');
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [updateChorusFn, setUpdateChorusFn] = useState<((amount: number) => void) | null>(null);
  const [updateAutotuneFn, setUpdateAutotuneFn] = useState<((amount: number, pitch: number | null) => void) | null>(null);
  const [updateAutotuneKeyFn, setUpdateAutotuneKeyFn] = useState<((key: string) => void) | null>(null);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);

  const handlePowerToggle = async () => {
    if (isStarting) return; // Prevent double-click
    
    setIsStarting(true);
    
    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setIsActive(!isActive);
    if (!hasStarted) {
      setHasStarted(true);
    }
    
    setIsStarting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Metallic Chassis */}
        <div className="bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-700 p-1 rounded-2xl shadow-2xl">
          <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-xl p-6 shadow-inner">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-zinc-600 to-zinc-800 p-3 rounded-lg shadow-lg border border-zinc-500">
                  <Mic className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5 mb-0.5">
                    <span className="text-xs text-zinc-400 tracking-wider">LATHAM</span>
                    <span className="text-xs text-zinc-100 tracking-wider">AUDIO</span>
                  </div>
                  <h1 className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">VoiceLive Mobile</h1>
                  <p className="text-zinc-500 text-sm tracking-wider uppercase">Professional Vocal Processor</p>
                </div>
              </div>
              <button
                onClick={handlePowerToggle}
                className={`relative p-4 rounded-full transition-all shadow-lg border-2 ${
                  isActive
                    ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-500 shadow-red-900/50'
                    : 'bg-gradient-to-br from-zinc-700 to-zinc-800 border-zinc-600'
                }`}
              >
                <Power className="w-6 h-6" />
                {isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {!hasStarted && (
              <div className="mb-6 p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border-2 border-zinc-700 shadow-inner">
                <p className="text-center mb-2 text-zinc-300">👋 Welcome!</p>
                <p className="text-sm text-zinc-400 text-center">
                  Tap the power button above to start and allow microphone access when prompted
                </p>
              </div>
            )}

            {/* Preset Selector */}
            <PresetSelector
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
            />

            {/* Main Processor */}
            <VoiceProcessor
              isActive={isActive}
              currentPreset={currentPreset}
              onUpdateChorus={setUpdateChorusFn}
              onUpdateAutotune={setUpdateAutotuneFn}
              onUpdateAutotuneKey={setUpdateAutotuneKeyFn}
              onPitchDetected={setDetectedPitch}
            />

            {/* Effect Controls */}
            <EffectControls 
              isActive={isActive} 
              updateChorusFn={updateChorusFn} 
              updateAutotuneFn={updateAutotuneFn} 
              updateAutotuneKeyFn={updateAutotuneKeyFn} 
              detectedPitch={detectedPitch}
              currentPreset={currentPreset}
            />

            {/* Footer Info */}
            <div className="mt-6 p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 shadow-inner">
              <p className="text-sm text-zinc-400 text-center tracking-wide">
                {hasStarted 
                  ? 'PROCESSING ACTIVE - ADJUST PRESETS AND EFFECTS ABOVE'
                  : 'CONNECT YOUR iRIG MIC AND TAP THE POWER BUTTON TO START'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}