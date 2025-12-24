
import React, { useState, useEffect, useRef } from 'react';
import { Instability, FozAnalysisResult } from '../types';
import { analyzeInstability, runUniversalSimulation, SimulationResult } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

interface GeminiAnalysisProps {
  instability: Instability;
  onAnalysisLoad?: (analysis: FozAnalysisResult) => void;
}

export const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-700 text-amber-300 rounded px-1 py-0.5">$1</code>')
        .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-2">$1</li>')
        .replace(/(\n<li>.*<\/li>)/gs, '<ul>$1\n</ul>');
        
    return <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
};

const SimulationTerminal: React.FC<{ result: SimulationResult | null, isRunning: boolean, onRun: () => void }> = ({ result, isRunning, onRun }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    
    // Typewriter effect for logs
    useEffect(() => {
        if (result && result.logs) {
            setDisplayedLogs([]);
            let i = 0;
            const interval = setInterval(() => {
                if (i < result.logs.length) {
                    setDisplayedLogs(prev => [...prev, result.logs[i]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 600); // Delay between log lines
            return () => clearInterval(interval);
        }
    }, [result]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [displayedLogs]);

    return (
        <div className="mt-3 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden font-mono text-xs shadow-inner">
            <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Run_Critical_Experiment.exe</span>
                {result?.verdict && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.verdict === 'PASS' ? 'bg-emerald-900 text-emerald-400' : 'bg-rose-900 text-rose-400'}`}>
                        {result.verdict === 'PASS' ? 'HYPOTHESIS ROBUST' : 'HYPOTHESIS FALSIFIED'}
                    </span>
                )}
            </div>
            <div ref={scrollRef} className="p-3 h-48 overflow-y-auto space-y-1">
                {!isRunning && !result && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                        <button 
                            onClick={onRun}
                            className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-600/50 px-4 py-2 rounded transition-colors"
                        >
                            RUN SIMULATION
                        </button>
                    </div>
                )}
                {isRunning && !result && (
                    <div className="text-cyan-400 animate-pulse">Initializing Universal Simulator...</div>
                )}
                {displayedLogs.map((log, i) => (
                    <div key={i} className="text-slate-300">
                        <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                    </div>
                ))}
                {result && displayedLogs.length === result.logs.length && (
                    <div className="mt-4 pt-2 border-t border-slate-800">
                        <span className="text-slate-500 block mb-1">FINAL OUTCOME:</span>
                        <span className={result.verdict === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>{result.outcome}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ instability, onAnalysisLoad }) => {
  const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
  const [analysis, setAnalysis] = useState<FozAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    // Reset simulation when instability changes
    setSimResult(null);
    setIsSimulating(false);

    const getAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      try {
        const result = await analyzeInstability(instability, llmProvider, { baseUrl: ollamaBaseUrl, model: ollamaModel });
        setAnalysis(result);
        if (onAnalysisLoad) {
            onAnalysisLoad(result);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    getAnalysis();
  }, [instability, llmProvider, ollamaBaseUrl, ollamaModel, onAnalysisLoad]);

  const handleRunSimulation = async () => {
      if (!analysis?.falsifiability?.critical_experiment) return;
      setIsSimulating(true);
      setSimResult(null);
      
      try {
          const result = await runUniversalSimulation(
              instability.canonicalName, 
              analysis.falsifiability.critical_experiment, 
              llmProvider, 
              { baseUrl: ollamaBaseUrl, model: ollamaModel }
          );
          setSimResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSimulating(false);
      }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-1 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        {llmProvider.charAt(0).toUpperCase() + llmProvider.slice(1)} FØZ Analysis
      </h3>
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 min-h-[150px]">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-slate-400">
                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Applying FØZ Axiomatic Workflow...</span>
            </div>
          </div>
        )}
        {error && <div className="text-rose-400">{error}</div>}
        {!isLoading && !error && analysis && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-rose-400 text-sm mb-2">Classical Diagnosis</h4>
              <div className="bg-rose-500/10 p-3 rounded-md border border-rose-500/20">
                  <SimpleMarkdown text={analysis.diagnosis} />
              </div>
            </div>

            {analysis.foz_proposal && (
                <div>
                    <h4 className="font-semibold text-amber-400 text-sm mb-2">FØZ Stabilized Proposal</h4>
                    <div className="bg-amber-500/10 p-4 rounded-md border border-amber-500/20 space-y-4">
                        {analysis.foz_proposal.stabilizer_form && <div>
                            <h5 className="font-medium text-amber-300 text-xs uppercase tracking-wider">Stabilizer Form (λ-Term)</h5>
                            <div className="mt-1 border-l-2 border-amber-400/30 pl-3">
                                <SimpleMarkdown text={analysis.foz_proposal.stabilizer_form} />
                            </div>
                        </div>}
                         {analysis.foz_proposal.ffz_algebra_action && <div>
                            <h5 className="font-medium text-amber-300 text-xs uppercase tracking-wider">FFZ-Algebra Action</h5>
                            <div className="mt-1 border-l-2 border-amber-400/30 pl-3">
                                <SimpleMarkdown text={analysis.foz_proposal.ffz_algebra_action} />
                            </div>
                        </div>}
                    </div>
                </div>
            )}

            {/* Falsifiability Section */}
            {analysis.falsifiability && (
                <div className="mt-6 border-t border-slate-700 pt-4">
                    <h4 className="font-semibold text-orange-400 text-sm mb-2 flex items-center gap-2">
                         <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                         </svg>
                        Falsifiability Stress Test (Popperian Analysis)
                    </h4>
                    <div className="bg-orange-500/5 p-4 rounded-md border border-orange-500/20 space-y-4">
                        <div className="flex justify-between items-center border-b border-orange-500/10 pb-2">
                             <span className="text-xs uppercase font-bold text-orange-300/70">Confidence Score</span>
                             <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-500 to-green-500" 
                                        style={{ width: `${analysis.falsifiability.confidence_score}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-mono text-orange-200">{analysis.falsifiability.confidence_score}%</span>
                             </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-orange-200 text-xs uppercase tracking-wider mb-1">Failure Condition</h5>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {analysis.falsifiability.failure_condition}
                            </p>
                        </div>
                        <div>
                            <h5 className="font-medium text-orange-200 text-xs uppercase tracking-wider mb-1">Critical Experiment</h5>
                            <div className="bg-slate-900/50 p-3 rounded border border-orange-500/10 text-sm">
                                <SimpleMarkdown text={analysis.falsifiability.critical_experiment} />
                            </div>
                            
                            {/* Universal Simulation Runner */}
                            <SimulationTerminal 
                                result={simResult} 
                                isRunning={isSimulating} 
                                onRun={handleRunSimulation} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Grounding Sources */}
            {analysis.groundingSources && analysis.groundingSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="font-semibold text-slate-400 text-sm mb-2 flex items-center gap-2">
                         <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        Sources & Citations (Google Search)
                    </h4>
                    <ul className="space-y-1">
                        {analysis.groundingSources.map((source, idx) => (
                            <li key={idx} className="text-xs truncate">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 hover:underline flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0"></span>
                                    {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAnalysis;
