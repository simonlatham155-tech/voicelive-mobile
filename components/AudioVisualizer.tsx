import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface AudioVisualizerProps {
  level: number;
  isActive: boolean;
  analyser: AnalyserNode | null;
}

export function AudioVisualizer({ level, isActive, analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const hue = (i / bufferLength) * 120 + 200; // Blue to purple
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser]);

  return (
    <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg mb-6">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-lg p-4 shadow-inner">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-zinc-400 tracking-wider uppercase">Audio Input</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
            <div
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs text-zinc-400 tracking-wider uppercase">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Waveform Canvas */}
        <div className="bg-black rounded-lg p-2 border-2 border-zinc-800 shadow-inner mb-3">
          <canvas
            ref={canvasRef}
            width={600}
            height={120}
            className="w-full h-32 rounded"
          />
        </div>

        {/* Level Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 tracking-wider uppercase">Input Level</span>
            <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {Math.round(level * 100)}%
            </span>
          </div>
          <div className="h-3 bg-black rounded-full overflow-hidden border-2 border-zinc-800 shadow-inner">
            <div
              className={`h-full transition-all ${
                level > 0.8
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/50'
                  : level > 0.5
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                  : 'bg-gradient-to-r from-green-600 to-green-500'
              }`}
              style={{ width: `${level * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}