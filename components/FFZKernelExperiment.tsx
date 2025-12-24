
import React, { useState, useMemo } from 'react';
import { generateExperimentHypothesis } from '../services/geminiService';
import { SimpleMarkdown } from './GeminiAnalysis';
import Slider from './ui/Slider';
import { useSettings } from '../contexts/SettingsContext';

type SeriesType = 'Grandi' | 'AlternatingNatural' | 'RandomDivergence';

const FFZKernelExperiment: React.FC = () => {
    const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
    const [epsilon, setEpsilon] = useState(0.1);
    const [seriesType, setSeriesType] = useState<SeriesType>('Grandi');
    const [hypothesis, setHypothesis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate Data based on Series and Epsilon
    const data = useMemo(() => {
        const points = 50;
        const classical = [];
        const kernel = [];
        let classicalSum = 0;
        let kernelSum = 0;
        let randomSeed = 0.5; // simple pseudo-random for determinism in render

        for (let n = 1; n <= points; n++) {
            let term = 0;
            switch (seriesType) {
                case 'Grandi':
                    // 1, -1, 1, -1...
                    term = (n % 2 !== 0) ? 1 : -1;
                    break;
                case 'AlternatingNatural':
                    // 1, -2, 3, -4...
                    term = (n % 2 !== 0) ? n : -n;
                    break;
                case 'RandomDivergence':
                    // Oscillating random walk
                    randomSeed = (randomSeed * 9301 + 49297) % 233280;
                    const r = (randomSeed / 233280) * 2 - 1; // -1 to 1
                    term = r * n * 0.5;
                    break;
            }

            classicalSum += term;
            // FFZ Kernel: Abel summation weight e^(-epsilon * n)
            // Note: In strict Abel summation, we sum a_n * x^n where x -> 1.
            // Here x = e^-epsilon.
            kernelSum += term * Math.exp(-epsilon * n);

            classical.push({ n, val: classicalSum });
            kernel.push({ n, val: kernelSum });
        }
        return { classical, kernel, lastKernel: kernelSum };
    }, [seriesType, epsilon]);

    const generateAnalysis = async () => {
        setIsGenerating(true);
        setHypothesis('');
        let classicalBehavior = '';
        if (seriesType === 'Grandi') classicalBehavior = 'Oscillating between 0 and 1';
        if (seriesType === 'AlternatingNatural') classicalBehavior = 'Oscillating with diverging amplitude';
        if (seriesType === 'RandomDivergence') classicalBehavior = 'Unpredictable divergence';

        const analysis = await generateExperimentHypothesis('FFZKernel', {
            seriesType,
            classicalBehavior,
            convergedValue: data.lastKernel,
            epsilon
        }, llmProvider, { baseUrl: ollamaBaseUrl, model: ollamaModel });
        
        setHypothesis(analysis);
        setIsGenerating(false);
    };

    // Chart Rendering Helper
    const maxY = Math.max(
        ...data.classical.map(d => Math.abs(d.val)), 
        ...data.kernel.map(d => Math.abs(d.val))
    ) * 1.1 || 1;
    
    // Scale y to 0-100%, handling negatives. 0 is at 50%
    const scaleY = (val: number) => 50 - (val / maxY) * 45;
    const scaleX = (n: number) => ((n - 1) / (data.classical.length - 1)) * 100;

    const classicalPath = data.classical.map((d, i) => `${i===0?'M':'L'} ${scaleX(d.n)} ${scaleY(d.val)}`).join(' ');
    const kernelPath = data.kernel.map((d, i) => `${i===0?'M':'L'} ${scaleX(d.n)} ${scaleY(d.val)}`).join(' ');

    return (
        <div>
            <h2 className="text-3xl font-bold mb-1 text-cyan-400">Experiment MATH-004</h2>
            <p className="text-xl text-slate-300 mb-4">The FFZ-Kernel: Canceling Infinities</p>
            <p className="text-slate-400 mb-6">
                Demonstrating how the FFZ-Kernel (an algebraic regulator) assigns stable, finite values to divergent processes by smoothing the summation path.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 h-[350px] flex flex-col relative overflow-hidden">
                        <h4 className="text-center text-slate-400 text-sm mb-2">Partial Sums: Classical vs FFZ-Stabilized</h4>
                        
                        <div className="absolute top-1/2 left-0 w-full border-t border-slate-700 border-dashed z-0"></div>

                        <svg className="w-full h-full z-10" preserveAspectRatio="none">
                            {/* Classical Path */}
                            <path d={classicalPath} stroke="#f43f5e" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" strokeDasharray="4 2" />
                            
                            {/* Kernel Path */}
                            <path d={kernelPath} stroke="#06b6d4" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" />
                            
                            {/* End Points */}
                            <circle cx={`${scaleX(data.classical[data.classical.length-1].n)}%`} cy={`${scaleY(data.classical[data.classical.length-1].val)}%`} r="4" fill="#f43f5e" />
                            <circle cx={`${scaleX(data.kernel[data.kernel.length-1].n)}%`} cy={`${scaleY(data.kernel[data.kernel.length-1].val)}%`} r="4" fill="#06b6d4" />
                        </svg>

                        <div className="absolute bottom-2 right-4 flex space-x-4 text-xs font-bold">
                             <span className="text-rose-500">--- Classical Divergence</span>
                             <span className="text-cyan-400">── FFZ Stabilized</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-center">
                             <div className="text-xs text-slate-500 uppercase">Classical Result</div>
                             <div className="text-xl font-mono text-rose-400 mt-1">
                                {Math.abs(data.classical[data.classical.length-1].val) > 10 ? '∞ DIVERGENT' : 'OSCILLATING'}
                             </div>
                         </div>
                         <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-center">
                             <div className="text-xs text-slate-500 uppercase">FFZ Result (Limit)</div>
                             <div className="text-xl font-mono text-cyan-400 mt-1">
                                {data.lastKernel.toFixed(5)}
                             </div>
                         </div>
                    </div>
                </div>

                <div>
                     <h3 className="text-lg font-semibold text-slate-200 mb-2">Kernel Settings</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-6">
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Divergent Series Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => setSeriesType('Grandi')}
                                    className={`px-3 py-2 rounded text-sm text-left transition-colors ${seriesType === 'Grandi' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    Grandi (1 - 1 + 1...)
                                </button>
                                <button 
                                    onClick={() => setSeriesType('AlternatingNatural')}
                                    className={`px-3 py-2 rounded text-sm text-left transition-colors ${seriesType === 'AlternatingNatural' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    Alt. Natural (1 - 2 + 3...)
                                </button>
                                 <button 
                                    onClick={() => setSeriesType('RandomDivergence')}
                                    className={`px-3 py-2 rounded text-sm text-left transition-colors ${seriesType === 'RandomDivergence' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    Random Chaos
                                </button>
                            </div>
                        </div>

                        <Slider 
                            label="Kernel Strength (ε)" 
                            value={epsilon} 
                            onChange={setEpsilon} 
                            min={0.01} max={1.0} step={0.01} 
                        />
                        <p className="text-xs text-slate-500">
                            Higher ε smooths aggressively but introduces bias. <br/>
                            Lower ε approximates the "true" infinite sum.
                        </p>

                        <button 
                            onClick={generateAnalysis}
                            disabled={isGenerating}
                            className="w-full bg-cyan-500 text-white font-semibold py-2.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                             {isGenerating && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isGenerating ? 'Analyzing...' : 'Analyze Convergence'}
                        </button>
                        
                        <div className="min-h-[100px] pt-4 border-t border-slate-700">
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

export default FFZKernelExperiment;
