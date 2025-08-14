// Central Limit Theorem Component - Standalone Version
// Converted from React TSX to vanilla JavaScript for embedding

(function() {
    'use strict';
    
    // Create the CLT Component class
    window.CentralLimitTheoremLab = function() {
        
        // ============ Utils (deterministic & numerically stable) ============
        function rngMulberry32(seed) {
            let t = seed >>> 0;
            return function () {
                t += 0x6D2B79F5;
                let r = Math.imul(t ^ (t >>> 15), 1 | t);
                r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
                return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
            };
        }

        function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
        function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN; }

        function varianceUnbiased(a) {
            const n = a.length; 
            if (n < 2) return NaN; 
            const m = mean(a);
            let s2 = 0; 
            for (let i = 0; i < n; i++) s2 += (a[i] - m) ** 2;
            return s2 / (n - 1);
        }

        function robustSD(a) { 
            const v = varianceUnbiased(a); 
            return isFinite(v) && v >= 0 ? Math.sqrt(v) : 0; 
        }

        function med(a) {
            if (!a.length) return NaN; 
            const b = a.slice().sort((x, y) => x - y);
            const m = b.length >> 1; 
            return b.length % 2 ? b[m] : 0.5 * (b[m - 1] + b[m]);
        }

        function normalPdf(x, mu, sigma) { 
            return sigma > 1e-12 ? Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)) : 0; 
        }

        function statLabel(s) { 
            return ({ mean: "x̄", median: "Median", sd: "s", proportion: "p̂" })[s]; 
        }

        function validateSampleSize(n) {
            if (n < 2) return { valid: false, message: "Sample size must be at least 2" };
            if (n > 1000) return { valid: false, message: "Sample size too large (max 1000)" };
            return { valid: true };
        }

        // ============ Constants ============
        const COLS = 60;
        const STAT_BINS = COLS;
        const PAD = 16;
        const TOP_UNITS = 30, MID_UNITS = 24, BOT_UNITS = 36;
        const TOTAL_UNITS = TOP_UNITS + MID_UNITS + BOT_UNITS;
        const COLORS = {
            text: "#001524",
            band: "rgba(0,0,0,0.04)",
            tick: "#EAECEF",
            popFill: "#15616D",
            popTop: "#2199AB",
            midFill: "#FF7D00",
            midTop: "#ff9c33",
            botFill: "#901328",
            botTop: "#B51732",
            flash: "rgba(255,125,0,0.85)",
            theta: "#78290F",
            normal: "#111827",
            sampleMean: "#FF7D00",
            active: "#FF7D00",
            idle: "#15616D",
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444"
        };

        // ============ Engine Class (simplified for standalone) ============
        class Engine {
            constructor(ctx) {
                this.ctx = ctx;
                this.plotW = 960; 
                this.gridW = 0; 
                this.colW = 0; 
                this.BOX = 8; 
                this.gridX0 = 0;
                this.H_TOP = 300; 
                this.H_MID = 240; 
                this.H_BOT = 360; 
                this.marginY = 8;
                this.BOX_TOP_Y = 8; 
                this.BOX_MID_Y = 8; 
                this.BOX_BOT_Y = 8;
                this.popCounts = new Uint16Array(COLS);
                this.midCounts = new Uint16Array(COLS);
                this.botCounts = new Uint32Array(STAT_BINS);
                this.sampleParticles = []; 
                this.statParticles = []; 
                this.popFlashes = [];
                this.gatherParticles = []; 
                this.gatherTarget = null; 
                this.gathering = false;
                this.gatherStart = 0; 
                this.gatherDur = 260; 
                this.emissionPlan = null;
                this.lastSample = []; 
                this.statistic = "mean"; 
                this.threshold = 0.5; 
                this.speed = "normal";
                this.showParamLine = true; 
                this.showNormalFit = false; 
                this.rng = rngMulberry32(1234);
                this.needsRedraw = true;
                this.lastGatheringSample = null;
                this.resetGeometry({});
            }

            resetGeometry({ plotW = 960, topH = 300, midH = 240, botH = 360 }) {
                this.plotW = plotW; 
                const innerW = plotW - 2 * PAD; 
                this.colW = Math.floor(innerW / COLS);
                this.BOX = Math.max(6, this.colW); 
                this.gridW = this.BOX * COLS;
                this.gridX0 = Math.floor((plotW - this.gridW) / 2);
                this.H_TOP = topH; 
                this.H_MID = midH; 
                this.H_BOT = botH;
                this.needsRedraw = true;
            }

            layoutFromViewport(plotW, canvasH) {
                const innerW = Math.max(200, plotW - 2 * PAD);
                const fromWidth = Math.max(6, Math.floor(innerW / COLS));
                const fromHeight = Math.max(6, Math.floor((canvasH - 2 * 16) / TOTAL_UNITS));
                const BOX = Math.min(fromWidth, fromHeight);
                const H_TOP = TOP_UNITS * BOX; 
                const H_MID = MID_UNITS * BOX; 
                const H_BOT = BOT_UNITS * BOX;
                this.resetGeometry({ plotW, topH: H_TOP, midH: H_MID, botH: H_BOT });
            }

            applyGenerator(name) {
                const counts = new Uint16Array(COLS);
                for (let c = 0; c < COLS; c++) {
                    const x = (c + 0.5) / COLS; 
                    let w = 1;
                    if (name === "normal") { 
                        const z = (x - 0.5) / 0.16; 
                        w = Math.exp(-0.5 * z * z); 
                    }
                    else if (name === "uniform") { 
                        w = 1; 
                    }
                    else if (name === "bimodal") { 
                        const z1 = (x - 0.32) / 0.07, z2 = (x - 0.72) / 0.07; 
                        w = 0.55 * Math.exp(-0.5 * z1 * z1) + 0.45 * Math.exp(-0.5 * z2 * z2); 
                    }
                    else if (name === "lognormal") { 
                        const mu = Math.log(0.3), sig = 0.6; 
                        const lx = Math.log(Math.max(1e-4, x)); 
                        const z = (lx - mu) / sig; 
                        w = Math.exp(-0.5 * z * z) / Math.max(x, 1e-4); 
                    }
                    counts[c] = Math.max(0, Math.round(w * 20));
                }
                this.popCounts = counts;
                this.needsRedraw = true;
            }

            get popStats() {
                const pc = this.popCounts; 
                let total = 0, mu = 0;
                for (let c = 0; c < COLS; c++) { 
                    const x = (c + 0.5) / COLS, w = pc[c]; 
                    total += w; 
                    mu += w * x; 
                }
                mu = total ? mu / total : 0.5; 
                let s2 = 0;
                for (let c = 0; c < COLS; c++) { 
                    const x = (c + 0.5) / COLS, w = pc[c]; 
                    s2 += w * (x - mu) * (x - mu); 
                }
                const sdPop = total ? Math.sqrt(s2 / total) : 0;
                let medv = 0.5; 
                if (total) { 
                    let acc = 0, half = total / 2; 
                    for (let c = 0; c < COLS; c++) { 
                        acc += pc[c]; 
                        if (acc >= half) { 
                            medv = (c + 0.5) / COLS; 
                            break; 
                        } 
                    } 
                }
                let greater = 0; 
                for (let c = 0; c < COLS; c++) { 
                    const x = (c + 0.5) / COLS; 
                    if (x > this.threshold) greater += pc[c]; 
                }
                const pthr = total ? greater / total : 0; 
                return { mu, sd: sdPop, med: medv, pthr, total };
            }

            // Simplified draw method for demo
            draw() {
                if (!this.ctx || !this.needsRedraw) return; 
                
                const ctx = this.ctx; 
                const yTop = this.marginY; 
                const yMid = yTop + this.H_TOP; 
                const yBot = yMid + this.H_MID; 
                const totalH = this.H_TOP + this.H_MID + this.H_BOT + 2 * this.marginY;
                ctx.clearRect(0, 0, this.plotW, totalH);

                // Draw placeholder content
                ctx.fillStyle = COLORS.text;
                ctx.font = "600 24px Inter, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Central Limit Theorem Lab", this.plotW / 2, totalH / 2 - 40);
                
                ctx.font = "400 16px Inter, system-ui, sans-serif";
                ctx.fillStyle = "#6B7280";
                ctx.fillText("Interactive simulation coming soon...", this.plotW / 2, totalH / 2);
                
                ctx.fillStyle = COLORS.active;
                ctx.fillText("🚧 Under Construction", this.plotW / 2, totalH / 2 + 30);
                
                this.needsRedraw = false;
            }

            // Simplified methods for demo
            hasActiveAnimations() { return false; }
            tick(dt, now) { /* placeholder */ }
        }

        // ============ Main Component ============
        return {
            mount: function(containerId) {
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('Container not found:', containerId);
                    return;
                }

                // Create the HTML structure
                container.innerHTML = `
                    <div style="
                        min-height: 100vh; 
                        width: 100%; 
                        background: #fff; 
                        color: #001524; 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 1rem;
                    ">
                        <div style="max-width: 1200px; margin: 0 auto;">
                            <div style="text-align: center; margin-bottom: 2rem;">
                                <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                                    Central Limit Theorem Lab
                                </h1>
                                <p style="font-size: 1rem; color: #6B7280;">
                                    Explore how sample statistics behave as sample size changes
                                </p>
                            </div>
                            
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 300px;">
                                    <canvas 
                                        id="clt-canvas" 
                                        style="
                                            width: 100%; 
                                            border-radius: 12px; 
                                            background: #fff; 
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                        "
                                        aria-label="Central Limit Theorem Canvas"
                                    ></canvas>
                                </div>
                                
                                <div style="
                                    width: 300px; 
                                    background: #FFF7EB; 
                                    border-radius: 16px; 
                                    padding: 1rem;
                                ">
                                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
                                        Controls
                                    </h3>
                                    
                                    <div style="margin-bottom: 1rem;">
                                        <label style="display: block; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                            Population Shape
                                        </label>
                                        <select id="distribution-select" style="
                                            width: 100%; 
                                            padding: 0.5rem; 
                                            border-radius: 8px; 
                                            border: 1px solid #cbd5e1;
                                        ">
                                            <option value="normal">Normal</option>
                                            <option value="lognormal">Skewed (lognormal)</option>
                                            <option value="uniform">Uniform</option>
                                            <option value="bimodal">Bimodal</option>
                                        </select>
                                    </div>
                                    
                                    <div style="margin-bottom: 1rem;">
                                        <label style="display: block; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                            Sample Size: <span id="sample-size-display">30</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            id="sample-size-slider" 
                                            min="2" 
                                            max="500" 
                                            value="30" 
                                            style="width: 100%;"
                                        />
                                    </div>
                                    
                                    <button 
                                        id="draw-sample-btn"
                                        style="
                                            width: 100%; 
                                            padding: 0.75rem; 
                                            background: #FF7D00; 
                                            color: white; 
                                            border: none; 
                                            border-radius: 8px; 
                                            font-weight: 600; 
                                            cursor: pointer; 
                                            margin-bottom: 0.5rem;
                                        "
                                    >
                                        Draw Sample
                                    </button>
                                    
                                    <div style="
                                        background: #F0F9FF; 
                                        padding: 0.75rem; 
                                        border-radius: 8px; 
                                        font-size: 0.75rem; 
                                        color: #475569;
                                    ">
                                        <strong>Note:</strong> Full interactive simulation is being integrated. 
                                        This is a preview of the component structure.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Initialize canvas and engine
                const canvas = document.getElementById('clt-canvas');
                const ctx = canvas.getContext('2d');
                const engine = new Engine(ctx);
                
                // Set up canvas dimensions
                canvas.width = 800;
                canvas.height = 600;
                engine.layoutFromViewport(800, 600);
                engine.applyGenerator('normal');
                
                // Set up event listeners
                const distributionSelect = document.getElementById('distribution-select');
                const sampleSizeSlider = document.getElementById('sample-size-slider');
                const sampleSizeDisplay = document.getElementById('sample-size-display');
                const drawSampleBtn = document.getElementById('draw-sample-btn');
                
                distributionSelect.addEventListener('change', function() {
                    engine.applyGenerator(this.value);
                    engine.draw();
                });
                
                sampleSizeSlider.addEventListener('input', function() {
                    sampleSizeDisplay.textContent = this.value;
                });
                
                drawSampleBtn.addEventListener('click', function() {
                    // Placeholder for sample drawing logic
                    console.log('Drawing sample of size:', sampleSizeSlider.value);
                });
                
                // Initial draw
                engine.draw();
                
                // Animation loop (simplified)
                function animate() {
                    if (engine.needsRedraw) {
                        engine.draw();
                    }
                    requestAnimationFrame(animate);
                }
                animate();
                
                return {
                    engine: engine,
                    canvas: canvas
                };
            }
        };
    };
})();