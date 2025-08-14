// Central Limit Theorem Component - Enhanced Modular Version
// Uses modular engine core, rendering utils, and gesture handling

(function() {
    'use strict';
    
    // Check for required dependencies
    if (!window.StatEngine || !window.RenderUtils || !window.GestureHandler || !window.StatUtils) {
        console.error('CLT Enhanced: Missing required dependencies. Please include engine-core.js, rendering-utils.js, and gesture-handler.js');
        return;
    }
    
    // Extended Engine class with full CLT functionality and enhanced rendering
    class CLTEngine extends StatEngine {
        constructor(ctx, config = {}) {
            super(ctx, config);
            
            // Initialize with CLT-specific settings
            this.updateLines();
        }

        // Override draw method to include enhanced line rendering
        draw() {
            if (!this.ctx || !this.needsRedraw) return; 
            
            const ctx = this.ctx; 
            const yTop = this.marginY; 
            const yMid = yTop + this.H_TOP; 
            const yBot = yMid + this.H_MID; 
            const totalH = this.H_TOP + this.H_MID + this.H_BOT + 2 * this.marginY;
            ctx.clearRect(0, 0, this.plotW, totalH);

            // Calculate scaling factors
            const maxOf = (arr) => arr.reduce((m, v) => (v > m ? v : m), 0);
            const scaleTop = (() => { 
                const need = maxOf(this.popCounts) * this.BOX; 
                return need > 0 ? Math.min(1, (this.H_TOP - 28) / need) : 1; 
            })();
            const scaleMid = (() => { 
                const need = maxOf(this.midCounts) * this.BOX; 
                return need > 0 ? Math.min(1, (this.H_MID - 28) / need) : 1; 
            })();
            const scaleBot = (() => { 
                const need = maxOf(this.botCounts) * this.BOX; 
                return need > 0 ? Math.min(1, (this.H_BOT - 28) / need) : 1; 
            })();
            this.BOX_TOP_Y = this.BOX * scaleTop; 
            this.BOX_MID_Y = this.BOX * scaleMid; 
            this.BOX_BOT_Y = this.BOX * scaleBot;

            // Draw trays
            RenderUtils.drawTray(ctx, this, yTop, this.H_TOP, "Population Distribution");
            RenderUtils.drawTray(ctx, this, yMid, this.H_MID, "Sample Distribution");
            
            // Draw population stacks and flashes
            const topBase = yTop + this.H_TOP - 8; 
            RenderUtils.drawStacks(ctx, this, this.popCounts, topBase, this.BOX_TOP_Y, this.config.colors.popFill, this.config.colors.popTop);
            
            for (const f of this.popFlashes) { 
                const x = this.colLeft(f.col); 
                ctx.fillStyle = this.config.colors.flash; 
                ctx.fillRect(Math.floor(x), Math.floor(f.y - this.BOX_TOP_Y / 2), Math.ceil(this.BOX), Math.ceil(this.BOX_TOP_Y)); 
            }
            
            // Draw population stats
            const { mu, sd: sdPop } = this.popStats; 
            ctx.fillStyle = this.config.colors.text; 
            ctx.font = "600 18px Inter, system-ui, sans-serif"; 
            ctx.textAlign = "right"; 
            ctx.fillText(`μ = ${mu.toFixed(3)}`, this.gridX0 + this.gridW, yTop + 40); 
            ctx.fillText(`σ = ${sdPop.toFixed(3)}`, this.gridX0 + this.gridW, yTop + 60); 
            ctx.textAlign = "left";

            // Draw sample stacks
            const midBase = yMid + this.H_MID - 16; 
            RenderUtils.drawStacks(ctx, this, this.midCounts, midBase, this.BOX_MID_Y, this.config.colors.midFill, this.config.colors.midTop);

            // Draw sample statistics (if any)
            const hasCurrentSample = this.lastSample?.length > 0;
            const hasMidSample = (() => { 
                for (let i = 0; i < this.config.cols; i++) { 
                    if (this.midCounts[i] > 0) return true; 
                } 
                return false; 
            })();
            const isAnimating = this.sampleParticles.length > 0 || this.emissionPlan;
            const showSampleStats = (hasCurrentSample || hasMidSample) && !isAnimating;
            
            if (showSampleStats) {
                let xs = []; 
                let n = 0; 
                let val;
                if (hasCurrentSample) { 
                    xs = this.lastSample; 
                    n = xs.length; 
                } else { 
                    for (let c = 0; c < this.config.cols; c++) {
                        for (let r = 0; r < (this.midCounts[c] || 0); r++) {
                            xs.push((c + 0.5) / this.config.cols); 
                        }
                    }
                    n = xs.length; 
                }
                
                const s = StatUtils.robustSD(xs); 
                const sqn = Math.sqrt(n); 
                const se = s / Math.max(1e-9, sqn);
                const theoreticalSE = this.popStats.sd / Math.max(1e-9, sqn);
                
                if (this.statistic === "mean") val = StatUtils.mean(xs); 
                else if (this.statistic === "median") val = StatUtils.median(xs); 
                else if (this.statistic === "sd") val = StatUtils.robustSD(xs); 
                else val = xs.filter((v) => v > this.threshold).length / xs.length;
                
                ctx.fillStyle = this.config.colors.text; 
                ctx.font = "600 18px Inter, system-ui, sans-serif"; 
                ctx.textAlign = "left"; 
                ctx.fillText(`n = ${n}`, this.gridX0, yMid + 40); 
                ctx.fillText(`√n = ${sqn.toFixed(2)}`, this.gridX0, yMid + 60);
                
                ctx.textAlign = "right"; 
                ctx.fillText(`${StatUtils.statLabel(this.statistic)} = ${val.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 40); 
                ctx.fillText(`s = ${s.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 60); 
                ctx.fillText(`SE(s) = ${se.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 80);
                if (this.statistic === "mean") {
                    ctx.fillText(`SE(σ) = ${theoreticalSE.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 100);
                }
                ctx.textAlign = "left";
            }

            // Draw during gathering
            if (this.gathering && this.lastGatheringSample) {
                const xs = this.lastGatheringSample;
                const n = xs.length;
                const s = StatUtils.robustSD(xs);
                const sqn = Math.sqrt(n);
                const se = s / Math.max(1e-9, sqn);
                const theoreticalSE = this.popStats.sd / Math.max(1e-9, sqn);
                
                let val;
                if (this.statistic === "mean") val = StatUtils.mean(xs); 
                else if (this.statistic === "median") val = StatUtils.median(xs); 
                else if (this.statistic === "sd") val = StatUtils.robustSD(xs); 
                else val = xs.filter((v) => v > this.threshold).length / xs.length;
                
                ctx.fillStyle = this.config.colors.text; 
                ctx.font = "600 18px Inter, system-ui, sans-serif"; 
                ctx.textAlign = "left"; 
                ctx.fillText(`n = ${n}`, this.gridX0, yMid + 40); 
                ctx.fillText(`√n = ${sqn.toFixed(2)}`, this.gridX0, yMid + 60);
                
                ctx.textAlign = "right"; 
                ctx.fillText(`${StatUtils.statLabel(this.statistic)} = ${val.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 40); 
                ctx.fillText(`s = ${s.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 60); 
                ctx.fillText(`SE(s) = ${se.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 80);
                if (this.statistic === "mean") {
                    ctx.fillText(`SE(σ) = ${theoreticalSE.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 100);
                }
                ctx.textAlign = "left";
            }

            // Draw sampling distribution
            const dom = this.statDomain(); 
            let total = 0, m = 0;
            for (let b = 0; b < this.config.statBins; b++) { 
                const w = this.botCounts[b]; 
                total += w; 
                const x01 = (b + 0.5) / this.config.statBins; 
                const val = dom.min + x01 * (dom.max - dom.min); 
                m += w * val; 
            }
            let sHat = 0; 
            if (total) { 
                m /= total; 
                let s2 = 0; 
                for (let b = 0; b < this.config.statBins; b++) { 
                    const w = this.botCounts[b]; 
                    const x01 = (b + 0.5) / this.config.statBins; 
                    const val = dom.min + x01 * (dom.max - dom.min); 
                    s2 += w * (val - m) * (val - m); 
                } 
                sHat = Math.sqrt(Math.max(0, s2 / Math.max(1, total))); 
            }
            
            const bottomTitle = `Sampling Distribution of the ${StatUtils.statLabel(this.statistic)}`;
            const yBotBase = yBot + this.H_BOT - 16; 
            RenderUtils.drawTray(ctx, this, yBot, this.H_BOT, bottomTitle);

            if (total > 0) {
                ctx.fillStyle = this.config.colors.text; 
                ctx.font = "600 18px Inter, system-ui, sans-serif"; 
                ctx.textAlign = "left"; 
                ctx.fillText(`runs = ${total}`, this.gridX0, yBot + 40);
                ctx.textAlign = "right";
                const muLabel = this.statistic === "mean" ? "E[x̄]" : this.statistic === "median" ? "E[Median]" : this.statistic === "sd" ? "E[s]" : "E[p̂]";
                const sigmaLabel = this.statistic === "mean" ? "SD[x̄]" : this.statistic === "median" ? "SD[Median]" : this.statistic === "sd" ? "SD[s]" : "SD[p̂]";
                ctx.fillText(`${muLabel} = ${m.toFixed(3)}`, this.gridX0 + this.gridW, yBot + 40);
                ctx.fillText(`${sigmaLabel} = ${sHat.toFixed(3)}`, this.gridX0 + this.gridW, yBot + 60);
                ctx.textAlign = "left";
            }

            // Draw bottom distribution stacks
            for (let b = 0; b < this.config.statBins; b++) {
                const stack = this.botCounts[b] || 0; 
                if (!stack) continue; 
                const x = this.gridX0 + b * this.BOX + this.BOX / 2;
                for (let r = 0; r < stack; r++) {
                    const y = yBotBase - r * this.BOX_BOT_Y - this.BOX_BOT_Y / 2;
                    RenderUtils.drawRect(ctx, x, y, this.BOX, this.BOX_BOT_Y, this.config.colors.botFill, this.config.colors.botTop);
                }
            }

            // Draw normal fit if enabled
            if (this.showNormalFit && total > 5 && sHat > 1e-6) {
                const maxStack = this.botCounts.reduce((m0, v) => (v > m0 ? v : m0), 0); 
                const maxPix = maxStack * this.BOX_BOT_Y;
                const pdfMax = 1 / (sHat * Math.sqrt(2 * Math.PI)); 
                const scale = (0.9 * maxPix) / pdfMax; 
                
                ctx.beginPath();
                for (let i = 0; i <= 220; i++) { 
                    const x01 = i / 220; 
                    const xVal = dom.min + x01 * (dom.max - dom.min); 
                    const pdf = StatUtils.normalPdf(xVal, m, sHat); 
                    const y = yBotBase - scale * pdf; 
                    const x = this.gridX0 + x01 * (this.BOX * this.config.cols); 
                    if (i === 0) ctx.moveTo(x, y); 
                    else ctx.lineTo(x, y); 
                }
                ctx.strokeStyle = this.config.colors.normal; 
                ctx.lineWidth = 2; 
                ctx.stroke();
            }

            // Draw animated particles
            for (const p of this.sampleParticles) {
                RenderUtils.drawRect(ctx, p.x, p.y, this.BOX, this.BOX_MID_Y, this.config.colors.midFill, this.config.colors.midTop);
            }
            for (const p of this.statParticles) {
                RenderUtils.drawRect(ctx, p.x, p.y, this.BOX, this.BOX_BOT_Y, this.config.colors.botFill, this.config.colors.botTop);
            }
            
            // Draw gathering particles with special highlight
            for (const gp of this.gatherParticles) {
                if (gp.x !== undefined && gp.y !== undefined) {
                    RenderUtils.drawRect(ctx, gp.x, gp.y, this.BOX, this.BOX_MID_Y, this.config.colors.flash, this.config.colors.midTop);
                }
            }

            // Draw enhanced lines with masking and smart positioning
            if (this.showParamLine) {
                RenderUtils.drawEnhancedLines(ctx, this);
            }
            
            this.needsRedraw = false;
        }
    }

    // Main CLT Component
    window.CentralLimitTheoremLab = function() {
        return {
            mount: function(containerId) {
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('Container not found:', containerId);
                    return;
                }

                // Initialize gesture handler
                const gestureHandler = new GestureHandler({
                    breakpoint: 768,
                    panelWidth: 320
                });

                // Create the complete HTML structure with responsive panel
                const panelContent = this.createPanelContent();
                const responsivePanelHTML = gestureHandler.createResponsivePanelHTML(panelContent);

                container.innerHTML = `
                    <div style="
                        min-height: 100vh; 
                        width: 100%; 
                        background: #fff; 
                        color: #001524; 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 0.75rem;
                    ">
                        <div style="max-width: 1400px; margin: 0 auto;">
                            <div style="display: flex; gap: 0.75rem; height: 100%;">
                                <div style="flex: 1; border-radius: 16px; background: #fff;">
                                    <div style="padding: 0.75rem 0.75rem 0.375rem;">
                                        <div style="font-size: 1.375rem; font-weight: 700;">Central Limit Theorem Lab</div>
                                        <div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem;">
                                            Explore how sample statistics behave as sample size changes
                                        </div>
                                    </div>
                                    
                                    <div style="position: relative; padding: 0 0.5rem;">
                                        <canvas 
                                            id="clt-canvas" 
                                            style="
                                                width: 100%; 
                                                border-radius: 12px; 
                                                outline: none; 
                                                touch-action: none; 
                                                background: #fff; 
                                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                            "
                                            aria-label="Central Limit Theorem Canvas"
                                        ></canvas>
                                        
                                        <button
                                            id="erase-toggle"
                                            style="
                                                position: absolute; 
                                                top: 44px; 
                                                left: 16px; 
                                                width: 34px; 
                                                height: 34px; 
                                                border-radius: 9999px; 
                                                background: #15616D; 
                                                color: #fff; 
                                                font-weight: 800; 
                                                font-size: 18px; 
                                                line-height: 34px; 
                                                text-align: center; 
                                                border: 0; 
                                                box-shadow: 0 8px 20px rgba(0,0,0,0.15); 
                                                user-select: none;
                                                transition: all 0.2s ease;
                                                cursor: pointer;
                                            "
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div style="padding: 0.5rem;">
                                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                            <button
                                                id="draw-sample-btn"
                                                style="
                                                    padding: 0.75rem 1rem; 
                                                    border-radius: 8px; 
                                                    background: #FF7D00; 
                                                    color: #fff; 
                                                    font-weight: 600; 
                                                    border: 0; 
                                                    font-size: 1rem; 
                                                    width: 100%;
                                                    cursor: pointer;
                                                "
                                            >
                                                Draw Sample (<span id="sample-size-display">30</span>)
                                            </button>
                                            
                                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                                <button
                                                    id="repeat-10-btn"
                                                    style="
                                                        padding: 0.5rem 0.75rem; 
                                                        border-radius: 8px; 
                                                        background: #15616D; 
                                                        color: #fff; 
                                                        font-weight: 600; 
                                                        border: 0; 
                                                        flex: 1; 
                                                        min-width: 80px;
                                                        cursor: pointer;
                                                    "
                                                >
                                                    ×10
                                                </button>
                                                <button
                                                    id="repeat-1000-btn"
                                                    style="
                                                        padding: 0.5rem 0.75rem; 
                                                        border-radius: 8px; 
                                                        background: #1c7f8d; 
                                                        color: #fff; 
                                                        font-weight: 600; 
                                                        border: 0; 
                                                        flex: 1; 
                                                        min-width: 80px;
                                                        cursor: pointer;
                                                    "
                                                >
                                                    ×1000
                                                </button>
                                                <button
                                                    id="reset-btn"
                                                    style="
                                                        padding: 0.5rem 0.75rem; 
                                                        border-radius: 8px; 
                                                        background: #fff; 
                                                        color: #001524; 
                                                        font-weight: 600; 
                                                        border: 1px solid #cbd5e1; 
                                                        flex: 1; 
                                                        min-width: 80px;
                                                        cursor: pointer;
                                                    "
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Desktop Panel -->
                                <div id="desktop-panel" style="
                                    width: 320px; 
                                    border-radius: 16px; 
                                    background: #FFF7EB; 
                                    padding: 0.75rem; 
                                    height: 100%; 
                                    overflow: auto;
                                ">
                                    ${panelContent}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${responsivePanelHTML}
                `;

                // Initialize engine with enhanced features
                const canvas = document.getElementById('clt-canvas');
                const ctx = canvas.getContext('2d');
                const engine = new CLTEngine(ctx);
                
                // Setup gesture handling
                gestureHandler.attachToContainer(container);
                gestureHandler.attachPanelEventListeners();
                
                // State variables
                let eraseMode = false;
                let n = 30;
                
                // Setup canvas and interactions
                this.setupCanvas(canvas, engine);
                this.setupControls(engine, n, eraseMode);
                this.setupResponsiveDesign(gestureHandler);
                
                // Animation loop
                this.startAnimationLoop(engine);
                
                // Initial setup
                engine.applyGenerator('normal');
                this.updatePopStats(engine);
                
                return {
                    engine: engine,
                    canvas: canvas,
                    gestureHandler: gestureHandler
                };
            },

            createPanelContent: function() {
                return `
                    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Controls</div>
                    
                    <div style="font-size: 0.6875rem; color: #6B7280; margin-bottom: 0.75rem; padding: 0.5rem; background: #F3F4F6; border-radius: 6px;">
                        <strong>Keyboard shortcuts:</strong><br/>
                        Space: Draw Sample • R: Reset • E: Toggle Erase • 1: ×10 • 2: ×1000
                    </div>
                    
                    <div style="display: grid; gap: 0.75rem;">
                        <div>
                            <div style="font-size: 0.875rem;">Population shape</div>
                            <select id="distribution-select" style="
                                width: 100%; 
                                padding: 0.5rem 0.625rem; 
                                border-radius: 8px; 
                                border: 1px solid #cbd5e1; 
                                background: #fff;
                            ">
                                <option value="normal">Normal</option>
                                <option value="lognormal">Skewed (lognormal)</option>
                                <option value="uniform">Uniform</option>
                                <option value="bimodal">Bimodal</option>
                            </select>
                            <div id="pop-stats" style="font-size: 0.75rem; color: #475569; margin-top: 0.25rem;">μ≈0.500 · σ≈0.161</div>
                            <div style="font-size: 0.75rem; color: #475569; margin-top: 0.25rem;">Click/drag on the population to paint your own distribution!</div>
                        </div>
                        
                        <div>
                            <div style="font-size: 0.875rem;">Statistic</div>
                            <select id="statistic-select" style="
                                width: 100%; 
                                padding: 0.5rem 0.625rem; 
                                border-radius: 8px; 
                                border: 1px solid #cbd5e1; 
                                background: #fff;
                            ">
                                <option value="mean">Mean (x̄)</option>
                                <option value="median">Median</option>
                                <option value="sd">Standard Deviation (s)</option>
                                <option value="proportion">Proportion (&gt; threshold)</option>
                            </select>
                            <div id="threshold-controls" style="padding-top: 0.5rem; display: none;">
                                <div style="font-size: 0.75rem;">Threshold</div>
                                <input type="range" id="threshold-slider" min="0.05" max="0.95" step="0.01" value="0.5" style="width: 100%;" />
                                <div id="threshold-display" style="font-size: 0.75rem; color: #475569;">θ = P(X &gt; 0.50)</div>
                            </div>
                        </div>
                        
                        <div>
                            <div style="font-size: 0.875rem;">Sample size (n)</div>
                            <input 
                                type="range" 
                                id="sample-size-slider" 
                                min="2" 
                                max="500" 
                                step="1" 
                                value="30" 
                                style="width: 100%;" 
                            />
                            <div style="font-size: 0.875rem; font-weight: 600; color: #001524;">
                                <span id="sample-size-value">30</span>
                            </div>
                        </div>
                        
                        <div style="display: grid; gap: 0.375rem;">
                            <label style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; cursor: pointer;">
                                <span>Show parameter line (θ)</span>
                                <input type="checkbox" id="param-line-checkbox" checked />
                            </label>
                            
                            <label style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; cursor: pointer;">
                                <span>Show normal fit</span>
                                <input type="checkbox" id="normal-fit-checkbox" />
                            </label>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <div>
                                <div style="font-size: 0.875rem;">Speed</div>
                                <select id="speed-select" style="
                                    width: 100%; 
                                    padding: 0.5rem 0.625rem; 
                                    border-radius: 8px; 
                                    border: 1px solid #cbd5e1; 
                                    background: #fff;
                                ">
                                    <option value="normal">Normal</option>
                                    <option value="fast">Fast</option>
                                </select>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem;">Seed</div>
                                <input 
                                    id="seed-input" 
                                    value="1234" 
                                    style="
                                        width: 100%; 
                                        padding: 0.5rem 0.625rem; 
                                        border: 1px solid #cbd5e1; 
                                        background: #fff; 
                                        border-radius: 8px;
                                    " 
                                />
                            </div>
                        </div>
                        
                        <div style="
                            font-size: 0.75rem; 
                            color: #475569; 
                            padding: 0.5rem; 
                            background: #F0F9FF; 
                            border-radius: 6px;
                        ">
                            <strong>Central Limit Theorem:</strong> SE = σ/√n decreases as n increases. The sampling distribution approaches normal regardless of population shape!
                        </div>
                    </div>
                `;
            },

            setupCanvas: function(canvas, engine) {
                // Canvas setup and interaction
                function resizeCanvas() {
                    const container = canvas.parentElement;
                    const rect = container.getBoundingClientRect();
                    const plotW = Math.max(320, rect.width - 16);
                    const canvasH = Math.max(520, Math.min(800, window.innerHeight * 0.7));
                    
                    canvas.width = plotW;
                    engine.layoutFromViewport(plotW, canvasH);
                    canvas.height = engine.H_TOP + engine.H_MID + engine.H_BOT + 2 * engine.marginY;
                    engine.needsRedraw = true;
                }
                
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
                
                // Canvas interactions
                canvas.addEventListener('pointerdown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const isErase = e.button === 2 || e.ctrlKey || e.metaKey;
                    
                    if (isErase) {
                        engine.altClickPopulation(x, y);
                    } else {
                        engine.clickPopulation(x, y);
                    }
                    this.updatePopStats(engine);
                    e.preventDefault();
                }.bind(this));
                
                canvas.addEventListener('pointermove', (e) => {
                    if (e.buttons === 0) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const isErase = (e.buttons & 2) === 2;
                    
                    if (isErase) {
                        engine.altClickPopulation(x, y);
                    } else {
                        engine.clickPopulation(x, y);
                    }
                    this.updatePopStats(engine);
                }.bind(this));
                
                canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            },

            setupControls: function(engine, n, eraseMode) {
                // All control event listeners
                const controls = {
                    distributionSelect: document.getElementById('distribution-select'),
                    statisticSelect: document.getElementById('statistic-select'),
                    thresholdSlider: document.getElementById('threshold-slider'),
                    thresholdDisplay: document.getElementById('threshold-display'),
                    thresholdControls: document.getElementById('threshold-controls'),
                    sampleSizeSlider: document.getElementById('sample-size-slider'),
                    sampleSizeDisplay: document.getElementById('sample-size-display'),
                    sampleSizeValue: document.getElementById('sample-size-value'),
                    paramLineCheckbox: document.getElementById('param-line-checkbox'),
                    normalFitCheckbox: document.getElementById('normal-fit-checkbox'),
                    speedSelect: document.getElementById('speed-select'),
                    seedInput: document.getElementById('seed-input'),
                    eraseToggle: document.getElementById('erase-toggle'),
                    drawSampleBtn: document.getElementById('draw-sample-btn'),
                    repeat10Btn: document.getElementById('repeat-10-btn'),
                    repeat1000Btn: document.getElementById('repeat-1000-btn'),
                    resetBtn: document.getElementById('reset-btn')
                };

                // Distribution selection
                controls.distributionSelect.addEventListener('change', function() {
                    engine.applyGenerator(this.value);
                    this.updatePopStats(engine);
                }.bind(this));
                
                // Statistic selection
                controls.statisticSelect.addEventListener('change', function() {
                    engine.statistic = this.value;
                    engine.updateLines();
                    if (this.value === 'proportion') {
                        controls.thresholdControls.style.display = 'block';
                    } else {
                        controls.thresholdControls.style.display = 'none';
                    }
                    engine.needsRedraw = true;
                });
                
                // Threshold slider
                controls.thresholdSlider.addEventListener('input', function() {
                    engine.threshold = parseFloat(this.value);
                    controls.thresholdDisplay.textContent = `θ = P(X > ${this.value})`;
                    engine.updateLines();
                    engine.needsRedraw = true;
                });
                
                // Sample size slider
                controls.sampleSizeSlider.addEventListener('input', function() {
                    n = parseInt(this.value);
                    controls.sampleSizeDisplay.textContent = n;
                    controls.sampleSizeValue.textContent = n;
                });
                
                // Parameter line checkbox
                controls.paramLineCheckbox.addEventListener('change', function() {
                    engine.showParamLine = this.checked;
                    engine.needsRedraw = true;
                });
                
                // Normal fit checkbox
                controls.normalFitCheckbox.addEventListener('change', function() {
                    engine.showNormalFit = this.checked;
                    engine.needsRedraw = true;
                });
                
                // Speed selection
                controls.speedSelect.addEventListener('change', function() {
                    engine.speed = this.value;
                });
                
                // Seed input
                controls.seedInput.addEventListener('input', function() {
                    const seed = parseInt(this.value) || 0;
                    engine.rng = StatUtils.rngMulberry32(seed);
                });
                
                // Erase toggle
                controls.eraseToggle.addEventListener('click', function() {
                    eraseMode = !eraseMode;
                    this.textContent = eraseMode ? '−' : '+';
                    this.style.background = eraseMode ? '#FF7D00' : '#15616D';
                });
                
                // Action buttons
                controls.drawSampleBtn.addEventListener('click', function() {
                    const validation = StatUtils.validateSampleSize(n);
                    if (!validation.valid) {
                        alert(validation.message);
                        return;
                    }
                    engine.drawSampleWithAutoCalculate(n, 1200);
                });
                
                controls.repeat10Btn.addEventListener('click', async function() {
                    const validation = StatUtils.validateSampleSize(n);
                    if (!validation.valid) {
                        alert(validation.message);
                        return;
                    }
                    
                    const prevSpeed = engine.speed;
                    const prevGather = engine.gatherDur;
                    engine.speed = "fast";
                    engine.gatherDur = 180;
                    
                    for (let k = 0; k < 10; k++) {
                        engine.drawSampleWithAutoCalculate(n, 600);
                        await new Promise(r => setTimeout(r, 200));
                    }
                    
                    engine.speed = prevSpeed;
                    engine.gatherDur = prevGather;
                });
                
                controls.repeat1000Btn.addEventListener('click', function() {
                    const validation = StatUtils.validateSampleSize(n);
                    if (!validation.valid) {
                        alert(validation.message);
                        return;
                    }
                    engine.handleRepeatTurbo(n);
                });
                
                controls.resetBtn.addEventListener('click', function() {
                    engine.clearTray();
                    engine.resetExperiment();
                });
                
                // Keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
                    
                    switch (e.key) {
                        case ' ':
                            e.preventDefault();
                            controls.drawSampleBtn.click();
                            break;
                        case 'r':
                            e.preventDefault();
                            controls.resetBtn.click();
                            break;
                        case 'e':
                            e.preventDefault();
                            controls.eraseToggle.click();
                            break;
                        case '1':
                            controls.repeat10Btn.click();
                            break;
                        case '2':
                            controls.repeat1000Btn.click();
                            break;
                    }
                });
            },

            setupResponsiveDesign: function(gestureHandler) {
                const desktopPanel = document.getElementById('desktop-panel');
                
                // Handle responsive design changes
                gestureHandler.callbacks.onResponsiveChange = (isDesktop) => {
                    if (desktopPanel) {
                        desktopPanel.style.display = isDesktop ? 'block' : 'none';
                    }
                };
                
                // Initial setup
                gestureHandler.callbacks.onResponsiveChange(gestureHandler.state.isDesktop);
            },

            updatePopStats: function(engine) {
                const stats = engine.popStats;
                const display = document.getElementById('pop-stats');
                if (display) {
                    display.textContent = `μ≈${stats.mu.toFixed(3)} · σ≈${stats.sd.toFixed(3)}`;
                }
            },

            startAnimationLoop: function(engine) {
                let lastTime = performance.now();
                function animate(currentTime) {
                    const dt = Math.min(0.06, (currentTime - lastTime) / 1000);
                    lastTime = currentTime;
                    
                    engine.tick(dt, currentTime);
                    
                    if (engine.needsRedraw || engine.hasActiveAnimations()) {
                        engine.draw();
                    }
                    
                    requestAnimationFrame(animate);
                }
                animate(performance.now());
            }
        };
    };
})();