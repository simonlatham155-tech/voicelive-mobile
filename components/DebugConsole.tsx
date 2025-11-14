import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LogEntry {
  id: number;
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [logId, setLogId] = useState(0);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const timestamp = new Date().toLocaleTimeString();
      
      setLogs(prev => {
        const newLogs = [...prev, { id: logId, type, message, timestamp }];
        // Keep only last 50 logs
        return newLogs.slice(-50);
      });
      setLogId(prev => prev + 1);
    };

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      addLog('log', args);
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      addLog('error', args);
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      addLog('warn', args);
    };

    // Restore original methods on cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [logId]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50"
      >
        Show Debug Console
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-black/95 border-2 border-orange-500 rounded-lg shadow-2xl z-50 max-h-96 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-orange-500/30 bg-orange-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-sm text-orange-400 tracking-wider">DEBUG CONSOLE</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="overflow-y-auto p-3 space-y-2 flex-1 min-h-0">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-500">No logs yet...</p>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className={`text-xs p-2 rounded border ${
                log.type === 'error'
                  ? 'bg-red-900/20 border-red-500/30 text-red-300'
                  : log.type === 'warn'
                  ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`uppercase tracking-wider ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warn' ? 'text-yellow-400' :
                  'text-zinc-500'
                }`}>
                  {log.type}
                </span>
                <span className="text-zinc-500">{log.timestamp}</span>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono">
                {log.message}
              </pre>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-orange-500/30 bg-orange-500/10">
        <button
          onClick={() => setLogs([])}
          className="w-full text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
