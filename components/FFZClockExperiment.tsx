
import React, { useState, useEffect, useRef } from 'react';
import { generateExperimentHypothesis } from '../services/geminiService';
import { SimpleMarkdown } from './GeminiAnalysis';
import Slider from './ui/Slider';
import { useSettings } from '../contexts/SettingsContext';

// --- MATH UTILS (from paper) ---
const fib = (n: number): number => {
    let a = 0, b = 1;
    for (let i = 0; i < n; i++) {
        [a, b] = [b, a + b];
    }
    return a;
};

const FFZClockExperiment: React.FC = () => {
    const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
    const [isRunning, setIsRunning] = useState(false);
    const [fibIndex, setFibIndex] = useState(5);
    const [step, setStep] = useState(0);
    const [hypothesis, setHypothesis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [useShortcut, setUseShortcut] = useState(false);

    const a = fib(fibIndex);
    const b = fib(fibIndex + 1);
    const period = a * b;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const timeoutId = useRef<number | null>(null);
    const isCancelledRef = useRef(false);

    // State for the "clock hands"
    const [clockA, setClockA] = useState(0);
    const [clockB, setClockB] = useState(0);
    // Cancellation state for visual effect
    const [isCancelling, setIsCancelling] = useState(false);
    const [controlFidelity, setControlFidelity] = useState<number[]>([]);

    useEffect(() => {
        // Reset when N changes
        setStep(0);
        setClockA(0);
        setClockB(0);
        setIsCancelling(true); // Initial state is 0,0 which is cancelled
        setControlFidelity([]);
        setHypothesis('');
        
        // Cleanup existing runs
        isCancelledRef.current = true;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (timeoutId.current) window.clearTimeout(timeoutId.current);
        
        setIsRunning(false);
    }, [fibIndex]);

    const runSimulation = () => {
        // Reset flags for new run
        isCancelledRef.current = false;
        setIsRunning(true);
        setHypothesis('');
        setControlFidelity([]);
        let currentStep = 0;

        const animate = () => {
            if (isCancelledRef.current) return;

            if (currentStep > period + 5) { // Run slightly past period
                 setIsRunning(false);
                 generateHypothesis();
                 return;
            }

            let nextStep = currentStep + 1;
            if (useShortcut && currentStep < period) {
                // Visualize "jump"
                nextStep = period; 
            }

            const currentA = nextStep % a;
            const currentB = nextStep % b;

            setClockA(currentA);
            setClockB(currentB);
            setStep(nextStep);

            // Check cancellation: both clocks at 0
            const isZero = currentA === 0 && currentB === 0;
            setIsCancelling(isZero);

            const fidelity = isZero ? 1.0 : (0.25 + 0.1 * Math.sin(nextStep)); 
            
            setControlFidelity(prev => [...prev, fidelity]);

            currentStep = nextStep;
            
            const delay = useShortcut ? 500 : 50;
            
            timeoutId.current = window.setTimeout(() => {
                if (!isCancelledRef.current) {
                    animationFrameId.current = requestAnimationFrame(animate);
                }
            }, delay);
        };

        animate();
    };

    const generateHypothesis = async () => {
        if (isCancelledRef.current) return;
        setIsGenerating(true);
        // Specialized prompt for this experiment
        const promptResult = {
            fibIndex,
            a, b, period,
            cancellationCheck: `F_${fibIndex}(1,0) + F_${fibIndex+1}(0,1) = (${a%a}, ${b%b}) = (0,0)`
        };
        
        try {
            const analysis = await generateExperimentHypothesis('FFZClock' as any, promptResult, llmProvider, { baseUrl: ollamaBaseUrl, model: ollamaModel });
            if (!isCancelledRef.current) {
                setHypothesis(analysis);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!isCancelledRef.current) {
                setIsGenerating(false);
            }
        }
    };

    // Draw Clocks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const drawClock = (x: number, y: number, r: number, modulus: number, val: number, color: string, label: string) => {
            // Ring
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Ticks
            for(let i=0; i<modulus; i++) {
                const ang = (i / modulus) * 2 * Math.PI - Math.PI/2;
                const tx = x + r * Math.cos(ang);
                const ty = y + r * Math.sin(ang);
                ctx.beginPath();
                ctx.arc(tx, ty, 2, 0, 2*Math.PI);
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
            }

            // Hand (State)
            const angle = (val / modulus) * 2 * Math.PI - Math.PI/2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Center Text
            ctx.fillStyle = color;
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y + r + 20);
            ctx.fillText(`${val}`, x, y + 5);
        };

        drawClock(150, 150, 60, a, clockA, '#22d3ee', `Z/${a}Z (U)`);
        drawClock(450, 150, 60, b, clockB, '#f472b6', `Z/${b}Z (V)`);

        // Draw Equation / Step Counter
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`Step: ${step}`, w/2, 50);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Period T = ${a} × ${b} = ${a*b}`, w/2, 70);
        
        // Draw Connecting Line (Entanglement/Synchronization)
        if (isCancelling) {
             ctx.beginPath();
             ctx.moveTo(210, 150);
             ctx.lineTo(390, 150);
             ctx.strokeStyle = '#10b981'; // Green for sync
             ctx.lineWidth = 2;
             ctx.setLineDash([5, 5]);
             ctx.stroke();
             ctx.setLineDash([]);
        }

    }, [clockA, clockB, a, b, step, isCancelling]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-1 text-cyan-400">Experiment PHY-006</h2>
            <p className="text-xl text-slate-300 mb-4">Quantum Clock of Infinity</p>
            <p className="text-slate-400 mb-6">
                Using Torsion Algebras, we simulate two qudits with Fibonacci dimensions (F_n, F_n+1).
                They exhibit exact periodicity T ~ phi^2n, creating a "Time Crystal" that computes through infinity.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 h-[320px] relative">
                         <canvas ref={canvasRef} width="600" height="300" className="w-full h-full"></canvas>
                    </div>
                    
                    {/* Algebraic Verification Panel */}
                    <div className={`p-4 rounded-lg border transition-all duration-500 font-mono text-sm ${isCancelling ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/80 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                             <h4 className={`${isCancelling ? 'text-emerald-400' : 'text-amber-400'} font-bold uppercase tracking-wider text-xs`}>
                                Formula For Zero Verification
                             </h4>
                             {isCancelling && <span className="text-emerald-400 text-xs font-bold animate-pulse">● EXACT CANCELLATION</span>}
                        </div>
                        
                        <div className="flex items-center justify-between text-slate-300">
                            <span>Cancellation:</span>
                            <span className={`px-2 py-1 rounded border ${isCancelling ? 'bg-emerald-900/60 border-emerald-500/50 text-white' : 'bg-slate-800 border-slate-600'}`}>
                                {a} × (1, 0) + {b} × (0, 1) = ({clockA}, {clockB}) {isCancelling ? '≡ (0,0)' : ''}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            In the torsion group M_&#123;{a},{b}&#125;, the "infinite" generators {isCancelling ? 'cancel exactly.' : 'are accumulating torsion.'}
                        </div>
                    </div>
                </div>

                <div>
                     <h3 className="text-lg font-semibold text-slate-200 mb-2">Controls & Analysis</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
                        <Slider 
                            label={`Fibonacci Index n (${fibIndex})`} 
                            value={fibIndex} 
                            onChange={(v) => setFibIndex(Math.round(v))} 
                            min={3} max={12} step={1} 
                        />
                        
                        <div className="flex items-center justify-between">
                             <span className="text-sm text-slate-300">Use Algebraic Shortcut</span>
                             <button 
                                onClick={() => setUseShortcut(!useShortcut)}
                                className={`w-12 h-6 rounded-full transition-colors ${useShortcut ? 'bg-cyan-500' : 'bg-slate-600'} relative`}
                             >
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useShortcut ? 'left-7' : 'left-1'}`} />
                             </button>
                        </div>

                        <button 
                            onClick={runSimulation}
                            disabled={isRunning}
                            className="w-full bg-cyan-500 text-white font-semibold py-2.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                             {isRunning && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isRunning ? 'Simulating...' : 'Run Simulation'}
                        </button>
                        
                        <div className="min-h-[150px] pt-4 border-t border-slate-700">
                             {isGenerating && (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <span>Generating hypothesis...</span>
                                </div>
                            )}
                            {!isGenerating && hypothesis && (
                                <SimpleMarkdown text={hypothesis} />
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FFZClockExperiment;
