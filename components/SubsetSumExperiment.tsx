
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PCA } from 'ml-pca';
import { generateStressTestAnalysis, StressTestResult } from '../services/geminiService';
import { SimpleMarkdown } from './GeminiAnalysis';
import { useSettings } from '../contexts/SettingsContext';
import { Instability } from '../types';

interface ExperimentProps {
    instability?: Instability;
}

// --- MATH & OPTIMIZER HELPERS ---

const vec = {
  dot: (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0),
  sum: (a: number[]) => a.reduce((sum, val) => sum + val, 0),
  scale: (a: number[], s: number) => a.map(v => v * s),
  add: (a: number[], b: number[]) => a.map((v, i) => v + b[i]),
  sub: (a: number[], b: number[]) => a.map((v, i) => v - b[i]),
  abs: (a: number[]) => a.map(Math.abs),
  clone: (a: number[]) => [...a],
};

const f0z_stabilize = (x: number, epsilon: number = 1e-8): number => {
    if (Math.abs(x) < epsilon) {
        return Math.sign(x) * epsilon || epsilon;
    }
    return x;
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

// Generate a guaranteed solvable instance
const generateProblemInstance = (n: number, range: number = 20): number[] => {
    // 1. Generate n-1 random signed integers
    const subset: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        subset.push(Math.floor(Math.random() * range * 2) - range);
    }
    
    // 2. Select a random subset of these to be the "solution"
    // (Actually, let's just create a set that sums to non-zero, then add the complement)
    // Simpler: Just make random integers, but ensure at least ONE subset sums to 0.
    // Constructive approach: Pick k items, sum them to S. Add -S to the list.
    
    // Approach B: Just random integers. For large N, probability of solution is high?
    // For Falsifiability, we want a GUARANTEED solution so if it fails, it's the optimizer's fault.
    
    const k = Math.floor(n / 2);
    const indices = new Set<number>();
    while(indices.size < k) indices.add(Math.floor(Math.random() * (n-1)));
    
    const partialSum = Array.from(indices).reduce((acc, idx) => acc + subset[idx], 0);
    
    // Add the balancer
    subset.push(-partialSum);
    
    // Shuffle
    for (let i = subset.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [subset[i], subset[j]] = [subset[j], subset[i]];
    }
    
    return subset;
};

// --- CHART COMPONENTS ---

const SvgChart: React.FC<{children: React.ReactNode, title: string}> = ({ children, title }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 h-64 md:h-80 flex flex-col relative overflow-hidden group">
        <h4 className="font-semibold text-slate-300 text-sm mb-2 text-center z-10 relative">{title}</h4>
        <svg width="100%" height="100%" className="flex-grow z-10 relative">
            {children}
        </svg>
    </div>
);

const TrajectoryChart: React.FC<{ data: number[][], tunnelingIndices: number[] }> = ({ data, tunnelingIndices }) => {
    const chartContent = useMemo(() => {
        if (data.length < 2) {
            return <text x="50%" y="50%" fill="gray" textAnchor="middle">Waiting for data...</text>;
        }

        try {
            const pca = new PCA(data);
            const proj = pca.predict(data).to2DArray();

            const xCoords = proj.map(p => p[0]);
            const yCoords = proj.map(p => p[1]);
            const minX = Math.min(...xCoords);
            const maxX = Math.max(...xCoords);
            const minY = Math.min(...yCoords);
            const maxY = Math.max(...yCoords);

            const rangeX = (maxX - minX) || 1;
            const rangeY = (maxY - minY) || 1;

            const points = proj.map(([x, y]) => ({
                x: ((x - minX) / rangeX) * 90 + 5,
                y: 95 - (((y - minY) / rangeY) * 90),
            }));

            return (
                <>
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const next = points[i+1];
                        const progress = i / points.length;
                        const hue = 160 + progress * 160; 
                        return (
                             <line 
                                key={i} 
                                x1={`${p.x}%`} y1={`${p.y}%`} 
                                x2={`${next.x}%`} y2={`${next.y}%`} 
                                stroke={`hsl(${hue}, 80%, 60%)`} 
                                strokeWidth="2" 
                                strokeLinecap="round"
                            />
                        )
                    })}

                     {tunnelingIndices.map((idx, i) => {
                        if (idx >= points.length) return null;
                        const p = points[idx];
                        return (
                            <g key={`tunnel-${i}`}>
                                <circle cx={`${p.x}%`} cy={`${p.y}%`} r="8" fill="rgba(251, 191, 36, 0.1)" stroke="none">
                                     <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                                     <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx={`${p.x}%`} cy={`${p.y}%`} r="2" fill="#FBBF24" />
                            </g>
                        )
                    })}

                    <circle cx={`${points[0].x}%`} cy={`${points[0].y}%`} r="4" fill="#10B981" stroke="white" strokeWidth="1.5" />
                    <circle cx={`${points[points.length-1].x}%`} cy={`${points[points.length-1].y}%`} r="4" fill="#F43F5E" stroke="white" strokeWidth="1.5" />
                     
                    <g transform="translate(10, 20)" fontSize="10">
                        <circle cx="0" cy="0" r="3" fill="#10B981" />
                        <text x="8" y="3" fill="#cbd5e1">Start (Chaos)</text>
                        <circle cx="0" cy="15" r="3" fill="#F43F5E" />
                        <text x="8" y="18" fill="#cbd5e1">Solution</text>
                        <circle cx="0" cy="30" r="3" fill="#FBBF24" />
                        <text x="8" y="33" fill="#cbd5e1">Tunneling</text>
                    </g>
                </>
            );
        } catch (e) {
            console.error("PCA Calculation failed:", e);
            return <text x="50%" y="50%" fill="#f43f5e" textAnchor="middle">Projection Failed</text>;
        }
    }, [data, tunnelingIndices]);

    return (
        <SvgChart title="Homotopy Path (Search Space)">
             {chartContent}
        </SvgChart>
    );
};

const CostChart: React.FC<{ data: number[] }> = ({ data }) => {
     if (data.length < 2) return <SvgChart title="Cost History"><text x="50%" y="50%" fill="gray" textAnchor="middle">Waiting for data...</text></SvgChart>;

    const maxCost = Math.max(...data);
    const points = data.map((cost, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - (cost / maxCost) * 95,
    }));
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
         <SvgChart title="Cost Landscape Descent">
            <path d={pathData} stroke="#06b6d4" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#areaGradient)" stroke="none" />
        </SvgChart>
    );
};

// --- MAIN EXPERIMENT COMPONENT ---

const SubsetSumExperiment: React.FC<ExperimentProps> = ({ instability }) => {
    const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
    const [isRunning, setIsRunning] = useState(false);
    const [log, setLog] = useState<string[]>(['Experiment ready.']);
    const [trajectory, setTrajectory] = useState<number[][]>([]);
    const [costHistory, setCostHistory] = useState<number[]>([]);
    const [tunnelingEvents, setTunnelingEvents] = useState<number[]>([]);
    const [finalResult, setFinalResult] = useState<{ subset: number[], sum: number, cost: number} | null>(null);
    const [analysisResult, setAnalysisResult] = useState<StressTestResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [mode, setMode] = useState<'Standard' | 'Critical'>('Standard');
    
    const logRef = useRef<HTMLDivElement>(null);
    const isCancelledRef = useRef(false);

    const title = instability ? instability.id : 'CS-002';
    const name = instability ? instability.canonicalName : 'The Subset Sum Problem';
    const description = instability 
        ? instability.description 
        : "An interactive FØZ-Optimizer solving an NP-complete problem.";

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log]);

    useEffect(() => {
        return () => {
            isCancelledRef.current = true;
        };
    }, []);
    
    const runSimulation = async (selectedMode: 'Standard' | 'Critical') => {
        setIsRunning(true);
        setMode(selectedMode);
        isCancelledRef.current = false;
        setTrajectory([]);
        setCostHistory([]);
        setTunnelingEvents([]);
        setFinalResult(null);
        setAnalysisResult(null);

        const isCritical = selectedMode === 'Critical';
        setLog([`--- Starting ${isCritical ? 'CRITICAL STRESS TEST' : 'Standard'} FØZ Optimization ---`]);

        try {
            // --- Hyperparameters ---
            // Standard: Small set, easy to visualize
            // Critical: Large set (N=40), High density, larger numbers
            const S = isCritical 
                ? generateProblemInstance(40, 50) 
                : [-7, -3, -2, 5, 8];
                
            const n = S.length;
            
            if (isCritical) {
                setLog(prev => [...prev, `Generated adversarial instance: N=${n}, Range=[-50, 50]`]);
                setLog(prev => [...prev, `Problem Set: [${S.slice(0, 5).join(', ')} ...]`]);
            } else {
                setLog(prev => [...prev, `Problem Set: [${S.join(', ')}]`]);
            }

            const alpha = 0.5;
            const initial_lr = 0.02;
            const min_lr = 1e-6;
            const beta = 0.9;
            // More steps for critical mode
            const steps = isCritical ? 8000 : 5000;
            const tunneling_every = 25;
            const tunneling_rate = 0.06;
            const tunneling_scale = 0.5;
            const langevin_noise_scale = 1e-3;
            const epsilons = { sum: 1e-6, penalty: 1e-6, grad: 1e-8 };

            let x = Array.from({ length: n }, () => Math.random());
            let velocity = Array(n).fill(0);
            let tempTrajectory: number[][] = [];
            let tempCostHistory: number[] = [];
            let tempTunneling: number[] = [];

            // Throttle UI updates for critical mode
            const updateInterval = isCritical ? 400 : 100;

            for (let i = 0; i < steps; i++) {
                if (isCancelledRef.current) return;

                const frac = i / Math.max(1, steps);
                const current_lr = clamp(min_lr + 0.5 * (initial_lr - min_lr) * (1 + Math.cos(Math.PI * frac)), min_lr, initial_lr);

                const subset_sum = vec.dot(x, S);
                const stabilized_cost_sum = f0z_stabilize(Math.abs(subset_sum), epsilons.sum);
                const discreteness_penalty = vec.sum(x.map(xi => xi * (1 - xi)));
                const stabilized_discreteness_penalty = f0z_stabilize(discreteness_penalty, epsilons.penalty);
                const non_empty_penalty = Math.exp(-vec.sum(x));
                const cost = stabilized_cost_sum + alpha * stabilized_discreteness_penalty + non_empty_penalty;

                const grad_sum_part = vec.scale(S, Math.sign(subset_sum));
                const grad_disc_part = x.map(xi => alpha * (1 - 2 * xi));
                const grad_non_empty_part = Array(n).fill(-non_empty_penalty);
                const grad = vec.add(vec.add(grad_sum_part, grad_disc_part), grad_non_empty_part);
                const stabilized_grad = grad.map(g => f0z_stabilize(g, epsilons.grad));
                
                const grad_noise = Array.from({ length: n }, () => (Math.random() * 2 - 1) * langevin_noise_scale * current_lr);
                const v_prev = vec.clone(velocity);
                velocity = vec.sub(vec.scale(velocity, beta), vec.scale(vec.add(stabilized_grad, grad_noise), current_lr));
                x = vec.add(x, vec.add(vec.scale(v_prev, -beta), vec.scale(velocity, 1 + beta)));
                x = x.map(xi => clamp(xi, 0, 1));
                
                if (i % tunneling_every === 0 && Math.random() < tunneling_rate) {
                    const sigma = tunneling_scale * (current_lr / (initial_lr + 1e-12));
                    const proposal = vec.add(x, Array.from({ length: n }, () => (Math.random() * 2 - 1) * sigma)).map(xi => clamp(xi, 0, 1));
                    const cand_subset_sum = vec.dot(proposal, S);
                    const candidate_cost = Math.abs(cand_subset_sum) + alpha * vec.sum(proposal.map(p => p * (1-p))) + Math.exp(-vec.sum(proposal));
                    const delta = candidate_cost - cost;

                    if (delta <= 0 || Math.random() < Math.exp(-delta / clamp(current_lr, 1e-12, 1.0))) {
                        // Only log tunneling in Standard mode or rarely in Critical mode to avoid spam
                        if (!isCritical || i % 500 === 0) {
                            setLog(prev => [...prev, `Step ${i+1}: Tunneling accepted.`]);
                        }
                        x = proposal;
                        tempTunneling.push(Math.floor(i / updateInterval));
                    }
                }
                
                if ((i + 1) % updateInterval === 0) {
                    tempTrajectory = [...tempTrajectory, x];
                    tempCostHistory = [...tempCostHistory, cost];
                    if ((i + 1) % (steps / 5) === 0) {
                        setLog(prev => [...prev, `Step ${i+1}/${steps} | lr=${current_lr.toExponential(2)} | cost=${cost.toFixed(6)}`]);
                    }
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            
            if (isCancelledRef.current) return;

            setLog(prev => [...prev, '--- Optimization Finished ---']);
            setTrajectory(tempTrajectory);
            setCostHistory(tempCostHistory);
            setTunnelingEvents(tempTunneling);
            
            const final_solution_vector = x.map(xi => Math.round(xi));
            const solution_subset = S.filter((s, i) => final_solution_vector[i] === 1);
            const solution_sum = vec.sum(solution_subset);
            const final_cost = tempCostHistory[tempCostHistory.length-1];

            setLog(prev => [...prev, `Final Sum: ${solution_sum}`]);
            setLog(prev => [...prev, `Final Cost: ${final_cost.toFixed(6)}`]);
            if (isCritical) {
                 const subsetStr = solution_subset.length > 10 ? `[${solution_subset.slice(0,10).join(', ')} ...]` : `[${solution_subset.join(', ')}]`;
                 setLog(prev => [...prev, `Subset Found: ${subsetStr}`]);
            }

            const result = { subset: solution_subset, sum: solution_sum, cost: final_cost };
            setFinalResult(result);
            setIsRunning(false);

            // --- Creative Agent Stress Test ---
            setIsGenerating(true);
            setLog(prev => [...prev, '\n--- Applying Falsifiability Stress Test... ---']);
            const status = final_cost < 0.1 && solution_sum === 0 ? 'SUCCESS' : 'FAILURE';
            
            try {
                // Call Structured Analysis Service
                const analysisData = await generateStressTestAnalysis(
                    'SubsetSum', 
                    { finalCost: final_cost, solutionSum: solution_sum, status, steps }, 
                    llmProvider, 
                    { baseUrl: ollamaBaseUrl, model: ollamaModel },
                    { difficulty: selectedMode }
                );
                
                if (!isCancelledRef.current) {
                    setAnalysisResult(analysisData);
                }
            } catch (err) {
                setLog(prev => [...prev, 'Error generating stress test.']);
                console.error(err);
            }
            if (!isCancelledRef.current) setIsGenerating(false);

        } catch (e) {
            console.error("Simulation error:", e);
            setLog(prev => [...prev, '--- Simulation Crashed ---', (e as Error).message]);
            setIsRunning(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-1 text-cyan-400">Experiment {title}</h2>
            <p className="text-xl text-slate-300 mb-4">{name}</p>
            <p className="text-slate-400 mb-6">{description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <TrajectoryChart data={trajectory} tunnelingIndices={tunnelingEvents} />
                <CostChart data={costHistory} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Controls & Log</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex gap-3 mb-4">
                            <button 
                                onClick={() => runSimulation('Standard')}
                                disabled={isRunning}
                                className="flex-1 bg-cyan-600 text-white font-semibold py-2.5 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
                            >
                                Standard Run (N=5)
                            </button>
                            <button 
                                onClick={() => runSimulation('Critical')}
                                disabled={isRunning}
                                className="flex-1 bg-rose-600 text-white font-semibold py-2.5 rounded-lg hover:bg-rose-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            >
                                {isRunning && mode === 'Critical' && <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                Run Critical Experiment
                            </button>
                        </div>
                        
                        <div ref={logRef} className="h-60 bg-slate-950 rounded-md p-3 font-mono text-xs text-slate-400 overflow-y-auto whitespace-pre-wrap break-word border border-slate-800">
                            {log.map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                </div>
                 
                 {/* Falsifiability Analysis Panel */}
                 <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Falsifiability Stress Test
                    </h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex-grow relative overflow-hidden">
                         {isGenerating && (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex flex-col items-center space-y-3 text-slate-400">
                                    <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="text-sm font-mono uppercase tracking-widest text-orange-400/80">Critiquing Results...</span>
                                </div>
                            </div>
                        )}
                        {!isGenerating && analysisResult && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Confidence Score Header */}
                                <div className="flex justify-between items-end border-b border-orange-500/20 pb-3">
                                     <div>
                                         <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Popperian Confidence</h4>
                                         <div className="text-3xl font-bold text-slate-100">{analysisResult.falsifiability.confidence_score}%</div>
                                     </div>
                                     <div className="w-1/2">
                                         <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                             <div 
                                                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-emerald-500" 
                                                style={{ width: `${analysisResult.falsifiability.confidence_score}%` }}
                                             />
                                         </div>
                                     </div>
                                </div>

                                {/* Main Analysis */}
                                <div>
                                    <SimpleMarkdown text={analysisResult.analysis} />
                                </div>

                                {/* Failure Condition */}
                                <div className="bg-orange-900/10 border border-orange-500/20 p-3 rounded">
                                    <h5 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">Failure Condition</h5>
                                    <p className="text-slate-300 text-sm italic">
                                        "{analysisResult.falsifiability.failure_condition}"
                                    </p>
                                </div>

                                {/* Critical Experiment */}
                                <div>
                                    <h5 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        {mode === 'Critical' ? 'Critical Experiment Analysis' : 'Critical Experiment Proposal'}
                                    </h5>
                                    <div className="bg-slate-800 p-3 rounded border border-slate-700 text-sm text-slate-300">
                                        <SimpleMarkdown text={analysisResult.falsifiability.critical_experiment} />
                                    </div>
                                </div>
                            </div>
                        )}
                         {!isGenerating && !analysisResult && !isRunning && (
                             <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                                <span className="text-4xl opacity-20">⚠</span>
                                <p className="text-sm">Run experiment to generate Scientific Critique.</p>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SubsetSumExperiment;
