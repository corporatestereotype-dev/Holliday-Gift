
import React, { useState, useEffect, useRef } from 'react';
import { generateExperimentHypothesis } from '../services/geminiService';
import { SimpleMarkdown } from './GeminiAnalysis';
import Slider from './ui/Slider';
import { useSettings } from '../contexts/SettingsContext';

const BlackHoleExperiment: React.FC = () => {
    const { llmProvider, ollamaBaseUrl, ollamaModel } = useSettings();
    const [isRunning, setIsRunning] = useState(false);
    const [epsilon, setEpsilon] = useState(0.5);
    const [hypothesis, setHypothesis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [finalDistance, setFinalDistance] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const runSimulation = () => {
        setIsRunning(true);
        setHypothesis('');
        setFinalDistance(0);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const width = rect.width;
        const height = rect.height;
        
        const center = { x: width / 2, y: height / 2 };
        const scale = 100; // Visual scale factor

        // Initial Conditions
        // Start from top-left quadrant, moving towards center but with angular momentum
        let p_classical = { x: width / 2 - 150, y: height / 2 - 50, vx: 1.2, vy: 0.5 };
        let p_foz = { ...p_classical };
        
        let classical_path: {x:number, y:number}[] = [];
        let foz_path: {x:number, y:number}[] = [];
        let classical_done = false;
        let foz_done = false;
        let step = 0;
        const maxSteps = 1000;

        const animate = () => {
            step++;
            ctx.clearRect(0, 0, width, height);

            // 1. Draw Environment
            
            // Draw FØZ Stabilization Field (Gradient)
            const coreRadius = epsilon * scale;
            const coreGradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, coreRadius * 2.5);
            coreGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)'); // Center glow
            coreGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.1)');
            coreGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(center.x, center.y, coreRadius * 2.5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw Black Hole / Singularity
            const bhGradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 20);
            bhGradient.addColorStop(0, 'white');
            bhGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            bhGradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
            bhGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bhGradient;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 20, 0, 2 * Math.PI);
            ctx.fill();

            // Draw FØZ Core Boundary
            ctx.beginPath();
            ctx.arc(center.x, center.y, coreRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // Cyan
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            if (step < 50) { // Only show text initially to reduce clutter
                ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
                ctx.textAlign = 'center';
                ctx.font = '10px Inter';
                ctx.fillText(`FØZ Core (ε=${epsilon})`, center.x, center.y - coreRadius - 5);
            }

            // 2. Physics Update
            
            // Classical Physics
            if (!classical_done) {
                const dx = center.x - p_classical.x;
                const dy = center.y - p_classical.y;
                const r2 = dx * dx + dy * dy;
                const r = Math.sqrt(r2);
                
                // Singularity condition
                if (r < 5) {
                    classical_done = true;
                    // Draw crash
                    ctx.beginPath();
                    ctx.arc(p_classical.x, p_classical.y, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();
                } else {
                    // Newton's Gravity: F = G*M*m / r^2
                    const forceStrength = 1500; // G*M*m proxy
                    const ax = (forceStrength / r2) * (dx / r);
                    const ay = (forceStrength / r2) * (dy / r);
                    
                    p_classical.vx += ax;
                    p_classical.vy += ay;
                    p_classical.x += p_classical.vx;
                    p_classical.y += p_classical.vy;
                    classical_path.push({x: p_classical.x, y: p_classical.y});
                }
            }

            // FØZ Physics
            if (!foz_done) {
                const dx = center.x - p_foz.x;
                const dy = center.y - p_foz.y;
                let r2 = dx * dx + dy * dy;
                
                // FØZ Stabilization Logic: Limit the curvature
                // Effectively creates a potential floor
                const minR2 = (epsilon * scale) ** 2;
                if (r2 < minR2) r2 = minR2;
                
                const r = Math.sqrt(r2);
                const forceStrength = 1500;
                
                const ax = (forceStrength / r2) * (dx / r);
                const ay = (forceStrength / r2) * (dy / r);
                
                p_foz.vx += ax;
                p_foz.vy += ay;
                p_foz.x += p_foz.vx;
                p_foz.y += p_foz.vy;
                foz_path.push({x: p_foz.x, y: p_foz.y});

                if (step > maxSteps) {
                     foz_done = true;
                     const final_r = Math.sqrt((center.x - p_foz.x)**2 + (center.y - p_foz.y)**2) / scale;
                     setFinalDistance(final_r);
                }
            }

            // 3. Draw Paths & Particles
            
            // Helper
            const drawTrace = (path: {x:number, y:number}[], color: string) => {
                if (path.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                for (let i = 0; i < path.length - 1; i++) {
                    ctx.moveTo(path[i].x, path[i].y);
                    ctx.lineTo(path[i+1].x, path[i+1].y);
                }
                ctx.stroke();
            };

            // Classical
            drawTrace(classical_path, 'rgba(239, 68, 68, 0.6)');
            if (!classical_done) {
                ctx.beginPath();
                ctx.arc(p_classical.x, p_classical.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.fillText("Classical", p_classical.x + 8, p_classical.y);
            }

            // FØZ
            drawTrace(foz_path, 'rgba(34, 211, 238, 0.8)');
            if (!foz_done) {
                ctx.beginPath();
                ctx.arc(p_foz.x, p_foz.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#22d3ee';
                ctx.fill();
                 ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#22d3ee';
                ctx.fillText("FØZ", p_foz.x + 8, p_foz.y);
            }

            // 4. Draw Potential Graph Overlay
            const graphW = 240;
            const graphH = 150;
            const graphX = width - graphW - 20;
            const graphY = height - graphH - 20;

            // Background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(graphX, graphY, graphW, graphH);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(51, 65, 85, 1)';
            ctx.strokeRect(graphX, graphY, graphW, graphH);

            // Labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText("Potential Well V(r)", graphX + 10, graphY + 20);
            
            // Legend
            const legendX = graphX + 130;
            ctx.font = '10px Inter';
            ctx.fillStyle = '#ef4444';
            ctx.fillText("Classical", legendX, graphY + 20);
            ctx.fillStyle = '#22d3ee';
            ctx.fillText("FØZ (Stabilized)", legendX, graphY + 34);

            // Axes
            const originX = graphX + 20;
            const axisTop = graphY + 30;
            const axisBottom = graphY + graphH - 20;
            const axisRight = graphX + graphW - 10;
            
            ctx.beginPath();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.moveTo(originX, axisTop);
            ctx.lineTo(originX, axisBottom); // Y axis (V)
            ctx.lineTo(axisRight, axisBottom); // X axis (r)
            ctx.stroke();
            
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText("Distance r", (originX + axisRight)/2, axisBottom + 12);

            // Plot Curves
            // V(r) ~ -1/r. We map this to pixels.
            const rScale = 2.0; // r_pixels = x_graph * rScale
            const vScale = 2500; // Visual scaling factor for potential
            
            ctx.lineWidth = 2;
            
            // Classical Curve (Red)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            for (let px = 1; px < graphW - 40; px+=2) {
                const r = px * rScale;
                const V = -vScale / r; 
                let py = axisBottom + V;
                if (py < axisTop) py = axisTop; 
                if (px === 1) ctx.moveTo(originX + px, py);
                else ctx.lineTo(originX + px, py);
            }
            ctx.stroke();

            // FØZ Curve (Cyan)
            ctx.beginPath();
            ctx.strokeStyle = '#22d3ee';
            const epsSim = epsilon * 100; // Matches simulation scale
            for (let px = 0; px < graphW - 40; px+=2) {
                const r = px * rScale;
                // Softened potential V = -1 / sqrt(r^2 + e^2)
                const V = -vScale / Math.sqrt(r*r + epsSim*epsSim);
                let py = axisBottom + V;
                if (py < axisTop) py = axisTop;
                if (px === 0) ctx.moveTo(originX + px, py);
                else ctx.lineTo(originX + px, py);
            }
            ctx.stroke();

            // Highlight Finite Limit
            const maxDepthV = -vScale / epsSim;
            let maxDepthPy = axisBottom + maxDepthV;
            if (maxDepthPy < axisTop) maxDepthPy = axisTop;

            if (maxDepthPy > axisTop) {
                 ctx.beginPath();
                 ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
                 ctx.setLineDash([2, 4]);
                 ctx.moveTo(originX, maxDepthPy);
                 ctx.lineTo(axisRight, maxDepthPy);
                 ctx.stroke();
                 ctx.setLineDash([]);
                 
                 ctx.fillStyle = '#22d3ee';
                 ctx.font = '9px monospace';
                 ctx.textAlign = 'left';
                 ctx.fillText(`V_min ~ -1/${epsilon.toFixed(1)}`, originX + 5, maxDepthPy - 4);
            }
            
            // Draw Particle Positions on Potential Graph
            const drawParticleOnGraph = (p: {x: number, y: number}, color: string, isFoz: boolean) => {
                const dx = p.x - center.x;
                const dy = p.y - center.y;
                const r_sim = Math.sqrt(dx*dx + dy*dy);
                const px = r_sim / rScale;
                
                if (px < graphW - 40 && px >= 0) {
                    let V = 0;
                    if (isFoz) {
                        const epsSim = epsilon * 100;
                        V = -vScale / Math.sqrt(r_sim*r_sim + epsSim*epsSim);
                    } else {
                        // Prevent div by zero for classical particle at r=0
                        V = -vScale / Math.max(0.1, r_sim);
                    }
                    
                    let py = axisBottom + V;
                    if (py < axisTop) py = axisTop;
                    if (py > axisBottom) py = axisBottom;
            
                    ctx.beginPath();
                    ctx.arc(originX + px, py, 3, 0, 2*Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            if (!classical_done) drawParticleOnGraph(p_classical, '#ef4444', false);
            if (!foz_done) drawParticleOnGraph(p_foz, '#22d3ee', true);

            if (classical_done && foz_done) {
                setIsRunning(false);
                if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                }
                generateHypothesis();
            } else {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };
        
        animate();
    };

    const generateHypothesis = async () => {
        setIsGenerating(true);
        const analysis = await generateExperimentHypothesis('BlackHole', { finalDistance, epsilon }, llmProvider, { baseUrl: ollamaBaseUrl, model: ollamaModel });
        setHypothesis(analysis);
        setIsGenerating(false);
    };

    useEffect(() => {
        // Initial Draw
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                 const dpr = window.devicePixelRatio || 1;
                 const rect = canvas.getBoundingClientRect();
                 canvas.width = rect.width * dpr;
                 canvas.height = rect.height * dpr;
                 ctx.scale(dpr, dpr);
                 
                 // Placeholder graphic
                 ctx.fillStyle = '#1e293b';
                 ctx.fillRect(0,0, rect.width, rect.height);
                 ctx.fillStyle = '#475569';
                 ctx.textAlign = 'center';
                 ctx.font = '16px Inter';
                 ctx.fillText("Press 'Run Experiment' to simulate", rect.width/2, rect.height/2);
            }
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-1 text-cyan-400">Experiment PHY-001</h2>
            <p className="text-xl text-slate-300 mb-4">Black Hole Singularity</p>
            <p className="text-slate-400 mb-6">This experiment simulates a particle's trajectory in a classical `1/r` potential versus a FØZ-stabilized potential `stab(1/r, ε)`. The graph overlay demonstrates how the singularity is regularized into a finite potential well.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 p-4 rounded-lg border border-slate-700 min-h-[400px]">
                    <canvas 
                        ref={canvasRef} 
                        style={{ width: '100%', height: '400px' }}
                        className="bg-slate-950 rounded-md cursor-crosshair"
                    ></canvas>
                </div>
                <div>
                     <h3 className="text-lg font-semibold text-slate-200 mb-2">Controls & Analysis</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
                        <Slider label="Stabilization ε (Core Size)" value={epsilon} onChange={setEpsilon} min={0.1} max={1.0} step={0.1} />
                        <p className="text-xs text-slate-500">
                            The parameter ε defines the depth of the potential well. A larger ε means a shallower, safer core.
                        </p>
                        
                        <button 
                            onClick={runSimulation}
                            disabled={isRunning}
                            className="w-full bg-cyan-500 text-white font-semibold py-2.5 rounded-lg hover:bg-cyan-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                             {isRunning && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isRunning ? 'Simulating...' : 'Run Experiment'}
                        </button>
                         <div className="min-h-[150px] pt-4 border-t border-slate-700">
                             {isGenerating && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex items-center space-x-2 text-slate-400">
                                        <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Generating hypothesis...</span>
                                    </div>
                                </div>
                            )}
                            {!isGenerating && hypothesis && (
                                <SimpleMarkdown text={hypothesis} />
                            )}
                             {!isGenerating && !hypothesis && (
                                <p className="text-slate-500 text-sm text-center italic mt-4">Run simulation to generate FØZ Analysis.</p>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlackHoleExperiment;
