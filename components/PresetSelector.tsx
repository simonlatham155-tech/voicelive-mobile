import { Music } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface PresetSelectorProps {
  currentPreset: string;
  onPresetChange: (preset: string) => void;
}

const presets = [
  { 
    id: 'simon-le-bon', 
    name: 'Simon Le Bon', 
    description: 'Energetic new wave with bright reverb',
  },
  { 
    id: 'dave-gahan', 
    name: 'Dave Gahan', 
    description: 'Dark electronic baritone with deep space',
  },
  { 
    id: 'chris-martin', 
    name: 'Chris Martin', 
    description: 'Soaring arena rock with lush reverb',
  },
  { 
    id: 'mark-hollis', 
    name: 'Mark Hollis', 
    description: 'Intimate minimalist with natural space',
  },
  { 
    id: 'bernard-sumner', 
    name: 'Bernard Sumner', 
    description: 'Post-punk electronic with rhythmic delay',
  },
  { 
    id: 'morten-harket', 
    name: 'Morten Harket', 
    description: 'Soaring synth-pop with crystalline highs',
  },
  { 
    id: 'seal', 
    name: 'Seal', 
    description: 'Rich soulful baritone with smooth warmth',
  },
  { 
    id: 'freddie-mercury', 
    name: 'Freddie Mercury', 
    description: 'Powerful rock vocals with stadium reverb',
  },
  { 
    id: 'adele', 
    name: 'Adele', 
    description: 'Rich, emotional studio sound',
  },
  { 
    id: 'frank-sinatra', 
    name: 'Frank Sinatra', 
    description: 'Classic warm vintage tone',
  },
  { 
    id: 'beyonce', 
    name: 'Beyoncé', 
    description: 'Modern R&B with vocal layers',
  },
  { 
    id: 'ed-sheeran', 
    name: 'Ed Sheeran', 
    description: 'Intimate acoustic with subtle doubling',
  },
  { 
    id: 'billie-eilish', 
    name: 'Billie Eilish', 
    description: 'Whisper-close lo-fi bedroom pop',
  },
  { 
    id: 'bruno-mars', 
    name: 'Bruno Mars', 
    description: 'Funky retro with compression',
  },
  { 
    id: 'ariana-grande', 
    name: 'Ariana Grande', 
    description: 'Bright pop with lush reverb',
  },
];

export function PresetSelector({ currentPreset, onPresetChange }: PresetSelectorProps) {
  const selectedPreset = presets.find(p => p.id === currentPreset);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Music className="w-5 h-5 text-orange-500" />
        <h2 className="text-zinc-400 tracking-wider uppercase">Artist Vocal Presets</h2>
      </div>
      
      <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 p-0.5 rounded-lg shadow-lg">
        <Select value={currentPreset} onValueChange={onPresetChange}>
          <SelectTrigger className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-600 text-zinc-200 shadow-inner h-auto py-4 px-5">
            <SelectValue>
              <div className="text-left py-1">
                <div className="text-sm text-zinc-200">{selectedPreset?.name || 'Select a preset'}</div>
                {selectedPreset && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {selectedPreset.description}
                  </p>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-600">
            {presets.map((preset) => (
              <SelectItem 
                key={preset.id} 
                value={preset.id}
                className="focus:bg-zinc-700 focus:text-white cursor-pointer text-zinc-200 py-3"
              >
                <div className="flex flex-col py-1">
                  <span className="text-sm">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{preset.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}