
import React, { useState, useEffect, useRef } from 'react';
import Slider from './ui/Slider';
import ToggleButton from './ui/ToggleButton';
import { generateExperimentHypothesis } from '../services/geminiService';
import { SimpleMarkdown } from './GeminiAnalysis';
import { useSettings } from '../contexts/SettingsContext';

const TorsionCancellationDemo: React.FC = () => {
    const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
    const [modulusA, setModulusA] = useState(5);
    const [modulusB, setModulusB] = useState(7);
    const [isStrictified, setIsStrictified] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hypothesis, setHypothesis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const animationRef = useRef<number | null>(null);

    // Reset when changing modes
    useEffect(() => {
        setProgress(0);
        setIsAnimating(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }, [modulusA, modulusB, isStrictified]);

    const startAnimation = () => {
        setIsAnimating(true);
        setHypothesis('');
        setProgress(0);
        
        let startTime: number | null = null;
        const duration = 3000; // 3 seconds per cycle

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const rawProgress = (time - startTime) / duration;
            
            // Allow it to run for multiple cycles if strictified to show closure
            // Or just one long run for linear to show divergence.
            
            if (rawProgress >= 1 && !isStrictified) {
                 // For linear, just stop after "diverging"
                 setIsAnimating(false);
                 generateAnalysis('LinearDivergence');
                 return;
            }

            if (rawProgress >= 1 && isStrictified) {
                 // For strictified, stop exactly at 1 (representing full cycle return)
                 setProgress(1);
                 setIsAnimating(false);
                 generateAnalysis('TorsionCancellation');
                 return;
            }

            setProgress(rawProgress);
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    const generateAnalysis = async (type: 'LinearDivergence' | 'TorsionCancellation') => {
        setIsGenerating(true);
        const analysis = await generateExperimentHypothesis('TorsionCancellation' as any, { 
            type, 
            modA: modulusA, 
            modB: modulusB 
        }, llmProvider, { baseUrl: ollamaBaseUrl, model: ollamaModel });
        setHypothesis(analysis);
        setIsGenerating(false);
    };

    // --- VISUALIZATION HELPERS ---

    // SVG for a Linear Path (Diverging)
    const LinearPath: React.FC<{ color: string, value: number, label: string }> = ({ color, value, label }) => {
        const x = value * 250; // Scale for visual
        return (
            <div className="relative h-12 w-full border-b border-slate-700 mt-8">
                <div className="absolute left-0 bottom-0 h-2 w-2 rounded-full bg-slate-500 transform translate-y-1/2"></div>
                {/* Arrow Head */}
                <div 
                    className="absolute bottom-0 h-4 w-4 transform translate-y-1/2 transition-all duration-75"
                    style={{ left: `${Math.min(x, 100)}%`, backgroundColor: color, borderRadius: '50%' }}
                >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-mono" style={{ color }}>
                        {label} = {Math.round(value * 100)}
                    </div>
                </div>
                {/* Trail */}
                <div 
                    className="absolute left-0 bottom-0 h-0.5"
                    style={{ width: `${Math.min(x, 100)}%`, backgroundColor: color }}
                ></div>
                
                <div className="absolute right-0 bottom-2 text-xs text-slate-500">∞</div>
            </div>
        );
    };

    // SVG for Torsion Cycle
    const TorsionCycle: React.FC<{ modulus: number, color: string, value: number, label: string }> = ({ modulus, color, value, label }) => {
        const radius = 40;
        const center = 50;
        
        // Calculate position based on progress * modulus (how many full turns)
        // If progress is 0->1, we want to traverse the circle 'modulus' times? 
        // No, 'Strictification' means we map the line x to x mod N.
        // So if the linear particle travelled distance D, the cyclic particle is at angle (D % N) / N * 360.
        // But for cancellation demonstration, we usually want to show them completing a full period.
        // Let's say the 'Input Energy' corresponds to 'modulus' steps.
        
        const angle = (value * modulus) * 2 * Math.PI - Math.PI/2;
        const cx = center + radius * Math.cos(angle);
        const cy = center + radius * Math.sin(angle);

        // Generate polygon points
        const points = [];
        for(let i=0; i<modulus; i++) {
            const a = (i / modulus) * 2 * Math.PI - Math.PI/2;
            points.push(`${center + radius * Math.cos(a)},${center + radius * Math.sin(a)}`);
        }

        return (
            <div className="flex flex-col items-center">
                <svg width="100" height="100" className="overflow-visible">
                    {/* Polygon Track */}
                    <polygon points={points.join(' ')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    
                    {/* Vertices */}
                    {points.map((p, i) => (
                        <circle key={i} cx={p.split(',')[0]} cy={p.split(',')[1]} r="2" fill="rgba(255,255,255,0.3)" />
                    ))}
                    
                    {/* Moving Particle */}
                    <circle cx={cx} cy={cy} r="4" fill={color} />
                    
                    {/* Center Label */}
                    <text x="50" y="55" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">
                        Z/{modulus}
                    </text>
                </svg>
                <div className="mt-2 text-xs font-mono" style={{ color }}>
                    {label} ≈ {((value * modulus) % modulus).toFixed(1)}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-1 text-cyan-400">Experiment MATH-006</h2>
            <p className="text-xl text-slate-300 mb-4">The Infinity Cancellation Mechanism</p>
            <p className="text-slate-400 mb-6">
                Visualizing the "Strictification" of infinite divergences into finite torsion cycles.
                See how linear instabilities (which fly off to infinity) can be wrapped into algebraic loops that sum to zero.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* VISUALIZATION PANEL */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 min-h-[300px] flex flex-col justify-between">
                    
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <span className="text-sm font-semibold text-slate-400">Topological View: {isStrictified ? 'COMPACT (TORSION)' : 'NON-COMPACT (LINEAR)'}</span>
                        {isStrictified && progress >= 0.99 && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded animate-pulse">
                                EXACT CANCELLATION
                            </span>
                        )}
                    </div>

                    <div className="flex-grow flex flex-col justify-center space-y-8 relative">
                         {!isStrictified ? (
                            // LINEAR MODE
                            <>
                                <LinearPath color="#f472b6" value={progress * 2} label="Div_A" />
                                <LinearPath color="#22d3ee" value={progress * 3} label="Div_B" />
                                <div className="text-center text-xs text-rose-400 mt-4 font-mono opacity-70">
                                    Limit(t → ∞) = UNDEFINED
                                </div>
                            </>
                         ) : (
                            // STRICTIFIED MODE
                            <div className="flex justify-around items-center">
                                <TorsionCycle modulus={modulusA} color="#f472b6" value={progress} label="Gen_A" />
                                <div className="text-2xl text-slate-600 font-bold">+</div>
                                <TorsionCycle modulus={modulusB} color="#22d3ee" value={progress} label="Gen_B" />
                                <div className="text-2xl text-slate-600 font-bold">=</div>
                                <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-500 ${progress >= 0.99 ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-700 bg-slate-800/50'}`}>
                                    <span className={`text-xl font-bold ${progress >= 0.99 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {progress >= 0.99 ? '0' : '...'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-1">NET SUM</span>
                                </div>
                            </div>
                         )}
                    </div>
                </div>

                {/* CONTROLS PANEL */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Strictification Controls</h3>
                        
                        <ToggleButton 
                            label="Apply Strictification (R → S1)" 
                            enabled={isStrictified} 
                            setEnabled={setIsStrictified} 
                            className="mb-6"
                        />

                        <div className="space-y-6 opacity-90">
                            <Slider 
                                label={`Group A Order (N=${modulusA})`} 
                                value={modulusA} 
                                min={3} max={12} step={1} 
                                onChange={setModulusA} 
                            />
                            <Slider 
                                label={`Group B Order (N=${modulusB})`} 
                                value={modulusB} 
                                min={3} max={12} step={1} 
                                onChange={setModulusB} 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={startAnimation}
                        disabled={isAnimating}
                        className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 ${
                            isAnimating 
                            ? 'bg-slate-700 text-slate-400 cursor-wait' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                        }`}
                    >
                        {isAnimating ? 'Computing Flow...' : isStrictified ? 'DEMONSTRATE CANCELLATION' : 'SIMULATE DIVERGENCE'}
                    </button>

                    {/* AI ANALYSIS OUTPUT */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 min-h-[120px]">
                         {isGenerating && (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Interpreting topology...
                            </div>
                        )}
                        {!isGenerating && hypothesis && (
                            <SimpleMarkdown text={hypothesis} />
                        )}
                        {!isGenerating && !hypothesis && (
                             <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">
                                Run the simulation to generate FØZ analysis.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TorsionCancellationDemo;
