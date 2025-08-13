// Central Limit Theorem Component - Working Enhanced Version
// Single file with all enhanced features but simplified loading

(function() {
    'use strict';
    
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

    // ============ Enhanced Engine Class with Line Features ============
    class Engine {
        constructor(ctx) {
            this.ctx = ctx;
            this.plotW = 960; this.gridW = 0; this.colW = 0; this.BOX = 8; this.gridX0 = 0;
            this.H_TOP = 300; this.H_MID = 240; this.H_BOT = 360; this.marginY = 8;
            this.BOX_TOP_Y = 8; this.BOX_MID_Y = 8; this.BOX_BOT_Y = 8;
            this.popCounts = new Uint16Array(COLS);
            this.midCounts = new Uint16Array(COLS);
            this.botCounts = new Uint32Array(STAT_BINS);
            this.sampleParticles = []; this.statParticles = []; this.popFlashes = [];
            this.gatherParticles = []; this.gatherTarget = null; this.gathering = false;
            this.gatherStart = 0; this.gatherDur = 260; this.emissionPlan = null;
            this.lastSample = []; this.statistic = "mean"; this.threshold = 0.5; this.speed = "normal";
            this.showParamLine = true; this.showNormalFit = false; this.rng = rngMulberry32(1234);
            this.needsRedraw = true; this.lastGatheringSample = null;
            
            // Enhanced line tracking
            this.lines = {
                parameter: { value: null, x: null, visible: true },
                sampleStat: { value: null, x: null, visible: false },
                samplingMean: { value: null, x: null, visible: false }
            };
            
            this.resetGeometry({});
        }

        resetGeometry({ plotW = 960, topH = 300, midH = 240, botH = 360 }) {
            this.plotW = plotW; const innerW = plotW - 2 * PAD; this.colW = Math.floor(innerW / COLS);
            this.BOX = Math.max(6, this.colW); this.gridW = this.BOX * COLS;
            this.gridX0 = Math.floor((plotW - this.gridW) / 2);
            this.H_TOP = topH; this.H_MID = midH; this.H_BOT = botH;
            this.needsRedraw = true;
        }

        layoutFromViewport(plotW, canvasH) {
            const innerW = Math.max(200, plotW - 2 * PAD);
            const fromWidth = Math.max(6, Math.floor(innerW / COLS));
            const fromHeight = Math.max(6, Math.floor((canvasH - 2 * 16) / TOTAL_UNITS));
            const BOX = Math.min(fromWidth, fromHeight);
            const H_TOP = TOP_UNITS * BOX; const H_MID = MID_UNITS * BOX; const H_BOT = BOT_UNITS * BOX;
            this.resetGeometry({ plotW, topH: H_TOP, midH: H_MID, botH: H_BOT });
        }

        applyGenerator(name) {
            const counts = new Uint16Array(COLS);
            for (let c = 0; c < COLS; c++) {
                const x = (c + 0.5) / COLS; let w = 1;
                if (name === "normal") { const z = (x - 0.5) / 0.16; w = Math.exp(-0.5 * z * z); }
                else if (name === "uniform") { w = 1; }
                else if (name === "bimodal") { const z1 = (x - 0.32) / 0.07, z2 = (x - 0.72) / 0.07; w = 0.55 * Math.exp(-0.5 * z1 * z1) + 0.45 * Math.exp(-0.5 * z2 * z2); }
                else if (name === "lognormal") { const mu = Math.log(0.3), sig = 0.6; const lx = Math.log(Math.max(1e-4, x)); const z = (lx - mu) / sig; w = Math.exp(-0.5 * z * z) / Math.max(x, 1e-4); }
                counts[c] = Math.max(0, Math.round(w * 20));
            }
            this.popCounts = counts;
            this.updateLines();
            this.needsRedraw = true;
        }

        get popStats() {
            const pc = this.popCounts; let total = 0, mu = 0;
            for (let c = 0; c < COLS; c++) { const x = (c + 0.5) / COLS, w = pc[c]; total += w; mu += w * x; }
            mu = total ? mu / total : 0.5; let s2 = 0;
            for (let c = 0; c < COLS; c++) { const x = (c + 0.5) / COLS, w = pc[c]; s2 += w * (x - mu) * (x - mu); }
            const sdPop = total ? Math.sqrt(s2 / total) : 0;
            let medv = 0.5; if (total) { let acc = 0, half = total / 2; for (let c = 0; c < COLS; c++) { acc += pc[c]; if (acc >= half) { medv = (c + 0.5) / COLS; break; } } }
            let greater = 0; for (let c = 0; c < COLS; c++) { const x = (c + 0.5) / COLS; if (x > this.threshold) greater += pc[c]; }
            const pthr = total ? greater / total : 0; return { mu, sd: sdPop, med: medv, pthr, total };
        }

        statDomain() { return this.statistic === "sd" ? { min: 0, max: 0.5 } : { min: 0, max: 1 }; }

        computeStat(xs) {
            if (!xs.length) return NaN;
            if (this.statistic === "mean") return mean(xs);
            if (this.statistic === "median") return med(xs);
            if (this.statistic === "sd") return robustSD(xs);
            if (this.statistic === "proportion") return xs.filter((v) => v > this.threshold).length / xs.length;
            return NaN;
        }

        // Enhanced line tracking and updating
        updateLines() {
            const popStats = this.popStats;
            
            // Update parameter line
            let paramValue = popStats.mu;
            if (this.statistic === "median") paramValue = popStats.med;
            else if (this.statistic === "sd") paramValue = popStats.sd;
            else if (this.statistic === "proportion") paramValue = popStats.pthr;
            
            this.lines.parameter.value = paramValue;
            this.lines.parameter.x = this.valueToX(paramValue);
            
            // Update sample statistic line if we have a current sample
            if (this.lastSample && this.lastSample.length > 0) {
                const sampleStatValue = this.computeStat(this.lastSample);
                this.lines.sampleStat.value = sampleStatValue;
                this.lines.sampleStat.x = this.valueToX(sampleStatValue);
                this.lines.sampleStat.visible = !isNaN(sampleStatValue);
            } else {
                this.lines.sampleStat.visible = false;
            }
            
            // Update sampling distribution mean line
            const dom = this.statDomain();
            let total = 0, samplingMean = 0;
            for (let b = 0; b < STAT_BINS; b++) {
                const w = this.botCounts[b];
                total += w;
                const x01 = (b + 0.5) / STAT_BINS;
                const val = dom.min + x01 * (dom.max - dom.min);
                samplingMean += w * val;
            }
            
            if (total > 0) {
                samplingMean /= total;
                this.lines.samplingMean.value = samplingMean;
                this.lines.samplingMean.x = this.valueToX(samplingMean);
                this.lines.samplingMean.visible = true;
            } else {
                this.lines.samplingMean.visible = false;
            }
        }

        valueToX(value) {
            const domain = this.statDomain();
            const proportion = clamp((value - domain.min) / (domain.max - domain.min), 0, 1);
            return this.gridX0 + proportion * this.gridW;
        }

        // Enhanced line drawing with masking
        drawEnhancedLines(ctx) {
            if (!this.showParamLine) return;
            
            // Draw parameter line (dashed, population color)
            if (this.lines.parameter.visible && this.lines.parameter.x !== null) {
                this.drawParameterLine(ctx);
            }
            
            // Draw sample statistic line (solid, sample color)
            if (this.lines.sampleStat.visible && this.lines.sampleStat.x !== null) {
                this.drawSampleStatLine(ctx);
            }
            
            // Draw sampling distribution mean line (solid, sampling color)
            if (this.lines.samplingMean.visible && this.lines.samplingMean.x !== null) {
                this.drawSamplingMeanLine(ctx);
            }
        }

        drawParameterLine(ctx) {
            const line = this.lines.parameter;
            const yTop = this.marginY;
            const yMid = yTop + this.H_TOP;
            const yBot = yMid + this.H_MID;
            const midBase = yMid + this.H_MID - 16;
            const botBase = yBot + this.H_BOT - 16;
            
            ctx.save();
            ctx.setLineDash([6, 3]);
            ctx.lineWidth = 3;
            ctx.strokeStyle = COLORS.popFill;
            
            // Draw in middle section with masking check
            this.drawLineWithMasking(ctx, line.x, yMid + 32, midBase - 8, COLORS.popFill);
            
            // Draw in bottom section with masking check  
            this.drawLineWithMasking(ctx, line.x, yBot + 32, botBase - 8, COLORS.popFill);
            
            // Draw label with smart positioning
            ctx.setLineDash([]);
            this.drawParameterLabel(ctx, line);
            
            ctx.restore();
        }

        drawSampleStatLine(ctx) {
            const line = this.lines.sampleStat;
            const yMid = this.marginY + this.H_TOP;
            const midBase = yMid + this.H_MID - 16;
            
            ctx.save();
            ctx.strokeStyle = COLORS.sampleMean;
            ctx.lineWidth = 2;
            
            this.drawLineWithMasking(ctx, line.x, yMid + 32, midBase - 8, COLORS.sampleMean);
            this.drawSampleStatLabel(ctx, line);
            
            ctx.restore();
        }

        drawSamplingMeanLine(ctx) {
            const line = this.lines.samplingMean;
            const yMid = this.marginY + this.H_TOP;
            const yBot = yMid + this.H_MID;
            const botBase = yBot + this.H_BOT - 16;
            
            ctx.save();
            ctx.strokeStyle = COLORS.botFill;
            ctx.lineWidth = 2;
            
            this.drawLineWithMasking(ctx, line.x, yBot + 32, botBase - 8, COLORS.botFill);
            this.drawSamplingMeanLabel(ctx, line);
            
            ctx.restore();
        }

        drawLineWithMasking(ctx, x, y1, y2, color) {
            // Simple version - draw complete line for now
            // TODO: Add particle masking detection
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
        }

        drawParameterLabel(ctx, line) {
            const yMid = this.marginY + this.H_TOP;
            let paramSymbol = "μ";
            if (this.statistic === "median") paramSymbol = "μ̃";
            else if (this.statistic === "sd") paramSymbol = "σ";
            else if (this.statistic === "proportion") paramSymbol = "π";
            
            const labelPosition = this.getSmartLabelPosition(line, 'parameter');
            
            ctx.fillStyle = COLORS.popFill;
            ctx.font = "600 12px Inter, system-ui, sans-serif";
            ctx.textAlign = labelPosition.align;
            ctx.fillText(paramSymbol, labelPosition.x, yMid + 46);
        }

        drawSampleStatLabel(ctx, line) {
            const yMid = this.marginY + this.H_TOP;
            let statSymbol = "x̄";
            if (this.statistic === "median") statSymbol = "med";
            else if (this.statistic === "sd") statSymbol = "s";
            else if (this.statistic === "proportion") statSymbol = "p̂";
            
            const labelPosition = this.getSmartLabelPosition(line, 'sample');
            
            ctx.fillStyle = COLORS.sampleMean;
            ctx.font = "600 12px Inter, system-ui, sans-serif";
            ctx.textAlign = labelPosition.align;
            ctx.fillText(statSymbol, labelPosition.x, yMid + 46);
        }

        drawSamplingMeanLabel(ctx, line) {
            const yBot = this.marginY + this.H_TOP + this.H_MID;
            let samplingSymbol = "E[x̄]";
            if (this.statistic === "median") samplingSymbol = "E[med]";
            else if (this.statistic === "sd") samplingSymbol = "E[s]";
            else if (this.statistic === "proportion") samplingSymbol = "E[p̂]";
            
            const labelPosition = this.getSmartLabelPosition(line, 'sampling');
            
            ctx.fillStyle = COLORS.botFill;
            ctx.font = "600 12px Inter, system-ui, sans-serif";
            ctx.textAlign = labelPosition.align;
            ctx.fillText(samplingSymbol, labelPosition.x, yBot + 46);
        }

        getSmartLabelPosition(currentLine, lineType) {
            const padding = 8;
            let position = { x: currentLine.x + padding, align: 'left' };
            
            // Smart positioning logic based on parameter comparison
            if (lineType !== 'parameter' && this.lines.parameter.visible) {
                if (currentLine.value > this.lines.parameter.value) {
                    // Current line is to the right of parameter - put label on right
                    position = { x: currentLine.x + padding, align: 'left' };
                } else {
                    // Current line is to the left of parameter - put label on left
                    position = { x: currentLine.x - padding, align: 'right' };
                }
            }
            
            // Ensure label stays within canvas bounds
            const minX = this.gridX0;
            const maxX = this.gridX0 + this.gridW;
            
            if (position.align === 'left' && position.x > maxX - 30) {
                position = { x: currentLine.x - padding, align: 'right' };
            } else if (position.align === 'right' && position.x < minX + 30) {
                position = { x: currentLine.x + padding, align: 'left' };
            }
            
            return position;
        }

        sampleN(n) {
            const rng = this.rng, weights = this.popCounts; let total = 0; for (let i = 0; i < COLS; i++) total += weights[i];
            const xs = new Array(n), cols = new Array(n);
            if (total === 0) {
                for (let i = 0; i < n; i++) { const col = Math.floor(rng() * COLS); cols[i] = col; xs[i] = (col + 0.5) / COLS; }
            } else {
                for (let i = 0; i < n; i++) { let target = rng() * total, acc = 0, chosen = COLS >> 1; for (let c = 0; c < COLS; c++) { acc += weights[c]; if (target <= acc) { chosen = c; break; } } cols[i] = chosen; xs[i] = (chosen + 0.5) / COLS; }
            }
            return { xs, cols };
        }

        hasActiveAnimations() {
            return this.emissionPlan || this.sampleParticles.length || this.statParticles.length || this.gathering || this.popFlashes.length || this.gatherParticles.length;
        }

        scheduleEmission(xs, cols, dropMs) { 
            this.lastSample = xs.slice(); 
            const now = performance.now(); 
            this.emissionPlan = { start: now, end: now + dropMs, total: cols.length, emitted: 0, cols: cols.slice(), xs: xs.slice() }; 
        }

        colLeft(col) { return this.gridX0 + col * this.BOX; }
        colCenter(col) { return this.gridX0 + col * this.BOX + this.BOX / 2; }

        tick(dt, now) {
            const hadAnimations = this.hasActiveAnimations();
            const g = this.speed === "fast" ? 2400 : 1400;
            
            if (this.emissionPlan) {
                const p = this.emissionPlan; const f = clamp((now - p.start) / (p.end - p.start), 0, 1);
                let targetEmitted = Math.floor(f * p.total); let toEmit = targetEmitted - p.emitted;
                if (toEmit <= 0 && f >= 1) toEmit = p.total - p.emitted;
                if (toEmit > 0) {
                    const inflight = new Uint16Array(COLS);
                    for (const s of this.sampleParticles) inflight[s.col]++;
                    const topBase = this.marginY + this.H_TOP - 16; const midBase = this.marginY + this.H_TOP + this.H_MID - 8;
                    while (toEmit-- > 0 && p.emitted < p.total) {
                        const col = p.cols[p.emitted];
                        const yStart = this.popCounts[col] > 0 ? topBase - (this.popCounts[col] - 1) * this.BOX_TOP_Y - this.BOX_TOP_Y / 2 : this.BOX_TOP_Y * 2;
                        const level = (this.midCounts[col] || 0) + inflight[col]; inflight[col]++;
                        const targetY = midBase - level * this.BOX_MID_Y - this.BOX_MID_Y / 2;
                        this.popFlashes.push({ col, y: yStart, until: now + 160 });
                        this.sampleParticles.push({ col, x: this.colCenter(col), y: yStart, vy: 0, targetY });
                        p.emitted++;
                    }
                }
                if (this.emissionPlan && this.emissionPlan.emitted >= this.emissionPlan.total) {
                    this.emissionPlan = null;
                    this.updateLines();
                }
            }
            
            if (this.sampleParticles.length) {
                const survivors = [];
                for (const s of this.sampleParticles) { 
                    s.vy += g * dt; 
                    s.y = Math.min(s.y + s.vy * dt, s.targetY); 
                    if (s.y < s.targetY - 0.1) survivors.push(s); 
                    else { 
                        this.midCounts[s.col] = (this.midCounts[s.col] || 0) + 1; 
                        this.updateLines();
                    }
                }
                this.sampleParticles = survivors;
            }
            
            if (this.gathering && this.gatherTarget) {
                const t = clamp((now - this.gatherStart) / this.gatherDur, 0, 1);
                for (const gp of this.gatherParticles) {
                    const dx = this.gatherTarget.x - gp.sx;
                    const dy = this.gatherTarget.y - gp.sy;
                    gp.x = gp.sx + dx * t;
                    gp.y = gp.sy + dy * t;
                }
                if (t >= 1) {
                    const botBase = this.marginY + this.H_TOP + this.H_MID + this.H_BOT - 8;
                    const inflightForBin = this.statParticles.filter((q) => q.bin === this.gatherTarget.bin).length;
                    const level = (this.botCounts[this.gatherTarget.bin] || 0) + inflightForBin;
                    const targetY = botBase - level * this.BOX_BOT_Y - this.BOX_BOT_Y / 2;
                    const xCenter = this.gridX0 + this.gatherTarget.bin * this.BOX + this.BOX / 2;
                    this.statParticles.push({ x: xCenter, y: this.gatherTarget.y, vy: 0, targetY, bin: this.gatherTarget.bin });
                    this.gathering = false; this.gatherTarget = null; this.gatherParticles = []; this.lastGatheringSample = null;
                    this.updateLines();
                }
            }
            
            if (this.statParticles.length) {
                const survivors = [];
                for (const p of this.statParticles) { 
                    p.vy += g * dt; 
                    p.y = Math.min(p.y + p.vy * dt, p.targetY); 
                    if (p.y < p.targetY - 0.1) survivors.push(p); 
                    else { 
                        this.botCounts[p.bin] = (this.botCounts[p.bin] || 0) + 1; 
                        this.updateLines();
                    }
                }
                this.statParticles = survivors;
            }
            this.popFlashes = this.popFlashes.filter((f) => f.until > now);
            
            if (this.hasActiveAnimations() || hadAnimations) {
                this.needsRedraw = true;
            }
        }

        // Complete draw method with enhanced lines
        draw() {
            if (!this.ctx || !this.needsRedraw) return; 
            
            const ctx = this.ctx; const yTop = this.marginY; const yMid = yTop + this.H_TOP; const yBot = yMid + this.H_MID; const totalH = this.H_TOP + this.H_MID + this.H_BOT + 2 * this.marginY;
            ctx.clearRect(0, 0, this.plotW, totalH);

            const maxOf = (arr) => arr.reduce((m, v) => (v > m ? v : m), 0);
            const scaleTop = (() => { const need = maxOf(this.popCounts) * this.BOX; return need > 0 ? Math.min(1, (this.H_TOP - 28) / need) : 1; })();
            const scaleMid = (() => { const need = maxOf(this.midCounts) * this.BOX; return need > 0 ? Math.min(1, (this.H_MID - 28) / need) : 1; })();
            const scaleBot = (() => { const need = maxOf(this.botCounts) * this.BOX; return need > 0 ? Math.min(1, (this.H_BOT - 28) / need) : 1; })();
            this.BOX_TOP_Y = this.BOX * scaleTop; this.BOX_MID_Y = this.BOX * scaleMid; this.BOX_BOT_Y = this.BOX * scaleBot;

            const drawTray = (y, h, title) => {
                ctx.fillStyle = COLORS.band; ctx.fillRect(0, y, this.plotW, h);
                ctx.fillStyle = COLORS.text; ctx.font = "600 18px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.fillText(title, this.gridX0, y + 22);
                ctx.fillStyle = COLORS.tick; const x0 = this.gridX0, effW = this.BOX * COLS;
                for (let t = 0; t <= 10; t++) { const xpx = x0 + effW * (t / 10); ctx.fillRect(Math.round(xpx), y + h - 12, 1, 8); }
                ctx.fillStyle = "#475569"; ctx.font = "13px Inter, system-ui, sans-serif"; ctx.textAlign = "center";
                ctx.fillText("0", x0, y + h - 2); ctx.fillText("1", x0 + effW, y + h - 2); ctx.textAlign = "left";
            };

            const drawStacks = (counts, yBottom, boxH, fill, top) => {
                for (let c = 0; c < COLS; c++) {
                    const stack = counts[c] || 0; if (!stack) continue; const xL = this.colLeft(c);
                    for (let r = 0; r < stack; r++) {
                        const y = yBottom - r * boxH - boxH / 2;
                        ctx.fillStyle = fill; ctx.fillRect(Math.floor(xL), Math.floor(y - boxH / 2), Math.ceil(this.BOX), Math.ceil(boxH));
                        ctx.fillStyle = top; ctx.fillRect(Math.floor(xL), Math.floor(y - boxH / 2), Math.ceil(this.BOX), 1);
                    }
                }
            };

            // Population tray
            drawTray(yTop, this.H_TOP, "Population Distribution");
            const topBase = yTop + this.H_TOP - 8; drawStacks(this.popCounts, topBase, this.BOX_TOP_Y, COLORS.popFill, COLORS.popTop);
            for (const f of this.popFlashes) { const x = this.colLeft(f.col); ctx.fillStyle = COLORS.flash; ctx.fillRect(Math.floor(x), Math.floor(f.y - this.BOX_TOP_Y / 2), Math.ceil(this.BOX), Math.ceil(this.BOX_TOP_Y)); }
            const { mu, sd: sdPop } = this.popStats; ctx.fillStyle = COLORS.text; ctx.font = "600 18px Inter, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillText(`μ = ${mu.toFixed(3)}`, this.gridX0 + this.gridW, yTop + 40); ctx.fillText(`σ = ${sdPop.toFixed(3)}`, this.gridX0 + this.gridW, yTop + 60); ctx.textAlign = "left";

            // Sample tray
            drawTray(yMid, this.H_MID, "Sample Distribution");
            const midBase = yMid + this.H_MID - 16; drawStacks(this.midCounts, midBase, this.BOX_MID_Y, COLORS.midFill, COLORS.midTop);

            // Sample stats calculation and display - similar to original code
            const hasCurrentSample = this.lastSample?.length > 0;
            const hasMidSample = (() => { for (let i = 0; i < COLS; i++) { if (this.midCounts[i] > 0) return true; } return false; })();
            const isAnimating = this.sampleParticles.length > 0 || this.emissionPlan;
            const showSampleStats = (hasCurrentSample || hasMidSample) && !isAnimating;
            
            if (showSampleStats) {
                let xs = []; let n = 0; let val;
                if (hasCurrentSample) { xs = this.lastSample; n = xs.length; }
                else { for (let c = 0; c < COLS; c++) for (let r = 0; r < (this.midCounts[c] || 0); r++) xs.push((c + 0.5) / COLS); n = xs.length; }
                const s = robustSD(xs); const sqn = Math.sqrt(n); const se = s / Math.max(1e-9, sqn);
                const theoreticalSE = this.popStats.sd / Math.max(1e-9, sqn);
                
                if (this.statistic === "mean") val = mean(xs); else if (this.statistic === "median") val = med(xs); else if (this.statistic === "sd") val = robustSD(xs); else val = xs.filter((v) => v > this.threshold).length / xs.length;
                
                ctx.fillStyle = COLORS.text; ctx.font = "600 18px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; 
                ctx.fillText(`n = ${n}`, this.gridX0, yMid + 40); 
                ctx.fillText(`√n = ${sqn.toFixed(2)}`, this.gridX0, yMid + 60);
                
                ctx.textAlign = "right"; 
                ctx.fillText(`${statLabel(this.statistic)} = ${val.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 40); 
                ctx.fillText(`s = ${s.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 60); 
                ctx.fillText(`SE(s) = ${se.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 80);
                if (this.statistic === "mean") {
                    ctx.fillText(`SE(σ) = ${theoreticalSE.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 100);
                }
                ctx.textAlign = "left";
            }

            // Gathering stats display
            if (this.gathering && this.lastGatheringSample) {
                const xs = this.lastGatheringSample;
                const n = xs.length;
                const s = robustSD(xs);
                const sqn = Math.sqrt(n);
                const se = s / Math.max(1e-9, sqn);
                const theoreticalSE = this.popStats.sd / Math.max(1e-9, sqn);
                
                let val;
                if (this.statistic === "mean") val = mean(xs); 
                else if (this.statistic === "median") val = med(xs); 
                else if (this.statistic === "sd") val = robustSD(xs); 
                else val = xs.filter((v) => v > this.threshold).length / xs.length;
                
                ctx.fillStyle = COLORS.text; ctx.font = "600 18px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; 
                ctx.fillText(`n = ${n}`, this.gridX0, yMid + 40); 
                ctx.fillText(`√n = ${sqn.toFixed(2)}`, this.gridX0, yMid + 60);
                
                ctx.textAlign = "right"; 
                ctx.fillText(`${statLabel(this.statistic)} = ${val.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 40); 
                ctx.fillText(`s = ${s.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 60); 
                ctx.fillText(`SE(s) = ${se.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 80);
                if (this.statistic === "mean") {
                    ctx.fillText(`SE(σ) = ${theoreticalSE.toFixed(3)}`, this.gridX0 + this.gridW, yMid + 100);
                }
                ctx.textAlign = "left";
            }

            // Sampling distribution
            const dom = this.statDomain(); let total = 0, m = 0;
            for (let b = 0; b < STAT_BINS; b++) { const w = this.botCounts[b]; total += w; const x01 = (b + 0.5) / STAT_BINS; const val = dom.min + x01 * (dom.max - dom.min); m += w * val; }
            let sHat = 0; if (total) { m /= total; let s2 = 0; for (let b = 0; b < STAT_BINS; b++) { const w = this.botCounts[b]; const x01 = (b + 0.5) / STAT_BINS; const val = dom.min + x01 * (dom.max - dom.min); s2 += w * (val - m) * (val - m); } sHat = Math.sqrt(Math.max(0, s2 / Math.max(1, total))); }
            const bottomTitle = `Sampling Distribution of the ${statLabel(this.statistic)}`;
            const yBotBase = yBot + this.H_BOT - 16; drawTray(yBot, this.H_BOT, bottomTitle);

            if (total > 0) {
                ctx.fillStyle = COLORS.text; ctx.font = "600 18px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.fillText(`runs = ${total}`, this.gridX0, yBot + 40);
                ctx.textAlign = "right";
                const muLabel = this.statistic === "mean" ? "E[x̄]" : this.statistic === "median" ? "E[Median]" : this.statistic === "sd" ? "E[s]" : "E[p̂]";
                const sigmaLabel = this.statistic === "mean" ? "SD[x̄]" : this.statistic === "median" ? "SD[Median]" : this.statistic === "sd" ? "SD[s]" : "SD[p̂]";
                ctx.fillText(`${muLabel} = ${m.toFixed(3)}`, this.gridX0 + this.gridW, yBot + 40);
                ctx.fillText(`${sigmaLabel} = ${sHat.toFixed(3)}`, this.gridX0 + this.gridW, yBot + 60);
                ctx.textAlign = "left";
            }

            for (let b = 0; b < STAT_BINS; b++) {
                const stack = this.botCounts[b] || 0; if (!stack) continue; const x = this.gridX0 + b * this.BOX + this.BOX / 2;
                for (let r = 0; r < stack; r++) {
                    const y = yBotBase - r * this.BOX_BOT_Y - this.BOX_BOT_Y / 2;
                    ctx.fillStyle = COLORS.botFill; ctx.fillRect(Math.floor(x - this.BOX / 2), Math.floor(y - this.BOX_BOT_Y / 2), Math.ceil(this.BOX), Math.ceil(this.BOX_BOT_Y));
                    ctx.fillStyle = COLORS.botTop; ctx.fillRect(Math.floor(x - this.BOX / 2), Math.floor(y - this.BOX_BOT_Y / 2), Math.ceil(this.BOX), 1);
                }
            }

            if (this.showNormalFit && total > 5 && sHat > 1e-6) {
                const maxStack = this.botCounts.reduce((m0, v) => (v > m0 ? v : m0), 0); const maxPix = maxStack * this.BOX_BOT_Y;
                const pdfMax = 1 / (sHat * Math.sqrt(2 * Math.PI)); const scale = (0.9 * maxPix) / pdfMax; ctx.beginPath();
                for (let i = 0; i <= 220; i++) { const x01 = i / 220; const xVal = dom.min + x01 * (dom.max - dom.min); const pdf = normalPdf(xVal, m, sHat); const y = yBotBase - scale * pdf; const x = this.gridX0 + x01 * (this.BOX * COLS); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
                ctx.strokeStyle = COLORS.normal; ctx.lineWidth = 2; ctx.stroke();
            }

            const drawRect = (x, y, w, h, fill, top) => { ctx.fillStyle = fill; ctx.fillRect(Math.floor(x - w / 2), Math.floor(y - h / 2), Math.ceil(w), Math.ceil(h)); ctx.fillStyle = top; ctx.fillRect(Math.floor(x - w / 2), Math.floor(y - h / 2), Math.ceil(w), 1); };
            
            // Draw animated particles
            for (const p of this.sampleParticles) drawRect(p.x, p.y, this.BOX, this.BOX_MID_Y, COLORS.midFill, COLORS.midTop);
            for (const p of this.statParticles) drawRect(p.x, p.y, this.BOX, this.BOX_BOT_Y, COLORS.botFill, COLORS.botTop);
            
            // Draw gathering particles with special highlight
            for (const gp of this.gatherParticles) {
                if (gp.x !== undefined && gp.y !== undefined) {
                    drawRect(gp.x, gp.y, this.BOX, this.BOX_MID_Y, COLORS.flash, COLORS.midTop);
                }
            }

            // Draw enhanced lines with smart positioning - NEW FEATURE
            this.drawEnhancedLines(ctx);
            
            this.needsRedraw = false;
        }

        clickPopulation(xCanvas, yCanvas) { 
            if (yCanvas > this.marginY + this.H_TOP) return; 
            const col = clamp(Math.floor((xCanvas - this.gridX0) / this.BOX), 0, COLS - 1); 
            this.popCounts[col] = clamp((this.popCounts[col] || 0) + 1, 0, 10000); 
            this.updateLines();
            this.needsRedraw = true; 
        }
        
        altClickPopulation(xCanvas, yCanvas) { 
            if (yCanvas > this.marginY + this.H_TOP) return; 
            const col = clamp(Math.floor((xCanvas - this.gridX0) / this.BOX), 0, COLS - 1); 
            this.popCounts[col] = clamp((this.popCounts[col] || 0) - 1, 0, 10000); 
            this.updateLines();
            this.needsRedraw = true; 
        }

        startSample(n, dropMs) { const { xs, cols } = this.sampleN(n); this.scheduleEmission(xs, cols, dropMs); }
        
        calculateWithGather() {
            const xs = this.lastSample || []; let hasMid = false; for (let i = 0; i < COLS; i++) if (this.midCounts[i] > 0) { hasMid = true; break; }
            if (!xs.length && !hasMid) return;
            
            if (xs.length) {
                this.lastGatheringSample = xs.slice();
            } else {
                const list = []; 
                for (let c = 0; c < COLS; c++) {
                    for (let r = 0; r < (this.midCounts[c] || 0); r++) {
                        list.push((c + 0.5) / COLS);
                    }
                }
                this.lastGatheringSample = list;
            }
            
            const val = this.computeStat(this.lastGatheringSample);
            const { min, max } = this.statDomain(); const x01 = clamp((val - min) / (max - min + 1e-9), 0, 1); const bin = clamp(Math.floor(x01 * STAT_BINS), 0, STAT_BINS - 1);
            const binCenterX = this.gridX0 + bin * this.BOX + this.BOX / 2; const gatherX = binCenterX; const gatherY = this.marginY + this.H_TOP + this.H_MID / 2; const midBase = this.marginY + this.H_TOP + this.H_MID - 16;
            
            this.gatherParticles = []; 
            for (let c = 0; c < COLS; c++) { 
                const stack = this.midCounts[c] || 0; 
                if (!stack) continue; 
                for (let r = 0; r < stack; r++) { 
                    const startY = midBase - r * this.BOX_MID_Y - this.BOX_MID_Y / 2; 
                    const startX = this.colCenter(c);
                    this.gatherParticles.push({ 
                        sx: startX, sy: startY, x: startX, y: startY
                    }); 
                } 
            }
            
            this.midCounts = new Uint16Array(COLS); this.gatherTarget = { x: gatherX, y: gatherY, bin }; this.gathering = true; this.gatherStart = performance.now(); this.lastSample = [];
        }

        drawSampleWithAutoCalculate(n, dropMs) {
            if (this.lastSample?.length || this.hasSampleInMid()) { this.calculateWithGather(); setTimeout(() => { this.startSample(n, dropMs); }, 100); }
            else { this.startSample(n, dropMs); }
        }
        
        hasSampleInMid() { for (let i = 0; i < COLS; i++) { if (this.midCounts[i] > 0) return true; } return false; }
        clearTray() { this.midCounts = new Uint16Array(COLS); this.lastSample = []; this.sampleParticles = []; this.emissionPlan = null; this.gatherParticles = []; this.gathering = false; this.updateLines(); this.needsRedraw = true; }
        resetExperiment() { this.botCounts = new Uint32Array(STAT_BINS); this.statParticles = []; this.updateLines(); this.needsRedraw = true; }
        handleRepeatTurbo(n) { for (let i = 0; i < 1000; i++) { const { xs } = this.sampleN(n); const v = this.computeStat(xs); const { min, max } = this.statDomain(); const x01 = clamp((v - min) / (max - min + 1e-9), 0, 1); const bin = clamp(Math.floor(x01 * STAT_BINS), 0, STAT_BINS - 1); this.botCounts[bin] = (this.botCounts[bin] || 0) + 1; } this.updateLines(); this.needsRedraw = true; }
    }

    // Simple responsive panel management
    function createResponsivePanel() {
        const isDesktop = window.innerWidth >= 768;
        let isPanelOpen = false;
        
        function updateResponsive() {
            const wasDesktop = isDesktop;
            const newIsDesktop = window.innerWidth >= 768;
            
            if (wasDesktop !== newIsDesktop) {
                const desktopPanel = document.getElementById('desktop-panel');
                const mobileToggle = document.getElementById('mobile-panel-toggle');
                const mobilePanel = document.getElementById('mobile-panel-overlay');
                
                if (newIsDesktop) {
                    if (desktopPanel) desktopPanel.style.display = 'block';
                    if (mobileToggle) mobileToggle.style.display = 'none';
                    if (mobilePanel) mobilePanel.style.display = 'none';
                } else {
                    if (desktopPanel) desktopPanel.style.display = 'none';
                    if (mobileToggle) mobileToggle.style.display = 'block';
                }
            }
        }
        
        window.addEventListener('resize', updateResponsive);
        updateResponsive();
        
        return { updateResponsive };
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

                // Create the HTML structure with responsive design
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
                                    ${this.createPanelContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Mobile Panel Toggle -->
                    <button 
                        id="mobile-panel-toggle"
                        style="
                            position: fixed; 
                            right: 12px; 
                            top: calc(env(safe-area-inset-top, 0px) + 12px); 
                            z-index: 30; 
                            padding: 10px 12px; 
                            border-radius: 9999px; 
                            background: #FF7D00; 
                            color: #fff; 
                            font-weight: 700; 
                            border: 0; 
                            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                            cursor: pointer;
                            display: none;
                        "
                    >
                        Controls
                    </button>
                    
                    <!-- Mobile Panel -->
                    <div 
                        id="mobile-panel-overlay" 
                        style="
                            position: fixed; 
                            inset: 0; 
                            z-index: 50; 
                            display: none;
                        "
                    >
                        <div 
                            style="
                                position: absolute; 
                                inset: 0; 
                                background: rgba(0,0,0,0.35);
                            "
                            onclick="this.parentElement.style.display = 'none'"
                        ></div>
                        <div 
                            style="
                                position: absolute; 
                                top: 0; 
                                right: 0; 
                                bottom: 0; 
                                width: 86vw; 
                                max-width: 420px; 
                                background: #FFF7EB; 
                                border-top-left-radius: 16px; 
                                border-bottom-left-radius: 16px; 
                                padding: 12px; 
                                box-shadow: -8px 0 24px rgba(0,0,0,0.2); 
                                overflow-y: auto;
                            "
                        >
                            <div style="
                                display: flex; 
                                justify-content: space-between; 
                                align-items: center; 
                                margin-bottom: 8px;
                            ">
                                <div style="font-size: 18px; font-weight: 700;">Controls</div>
                                <button 
                                    onclick="document.getElementById('mobile-panel-overlay').style.display = 'none'"
                                    style="
                                        padding: 8px 10px; 
                                        border-radius: 8px; 
                                        background: #FF7D00; 
                                        color: #fff; 
                                        border: 0; 
                                        font-weight: 700;
                                        cursor: pointer;
                                    "
                                >
                                    Close
                                </button>
                            </div>
                            ${this.createPanelContent()}
                        </div>
                    </div>
                `;

                // Initialize engine and setup
                const canvas = document.getElementById('clt-canvas');
                const ctx = canvas.getContext('2d');
                const engine = new Engine(ctx);
                
                // Setup responsive design
                const responsive = createResponsivePanel();
                
                // State variables
                let eraseMode = false;
                let n = 30;
                
                // Setup everything
                this.setupCanvas(canvas, engine);
                this.setupControls(engine, n, eraseMode);
                this.setupMobilePanel();
                this.startAnimationLoop(engine);
                
                // Initial setup
                engine.applyGenerator('normal');
                this.updatePopStats(engine);
                
                return {
                    engine: engine,
                    canvas: canvas
                };
            }.bind(this),

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
                // Control setup remains the same as the complete version but fixed bindings
                const distributionSelect = document.getElementById('distribution-select');
                const statisticSelect = document.getElementById('statistic-select');
                const thresholdSlider = document.getElementById('threshold-slider');
                const thresholdDisplay = document.getElementById('threshold-display');
                const thresholdControls = document.getElementById('threshold-controls');
                const sampleSizeSlider = document.getElementById('sample-size-slider');
                const sampleSizeDisplay = document.getElementById('sample-size-display');
                const sampleSizeValue = document.getElementById('sample-size-value');
                const paramLineCheckbox = document.getElementById('param-line-checkbox');
                const normalFitCheckbox = document.getElementById('normal-fit-checkbox');
                const speedSelect = document.getElementById('speed-select');
                const seedInput = document.getElementById('seed-input');
                const eraseToggle = document.getElementById('erase-toggle');
                const drawSampleBtn = document.getElementById('draw-sample-btn');
                const repeat10Btn = document.getElementById('repeat-10-btn');
                const repeat1000Btn = document.getElementById('repeat-1000-btn');
                const resetBtn = document.getElementById('reset-btn');

                if (distributionSelect) {
                    distributionSelect.addEventListener('change', function() {
                        engine.applyGenerator(this.value);
                        this.updatePopStats(engine);
                    }.bind(this));
                }
                
                if (statisticSelect) {
                    statisticSelect.addEventListener('change', function() {
                        engine.statistic = this.value;
                        engine.updateLines();
                        if (this.value === 'proportion' && thresholdControls) {
                            thresholdControls.style.display = 'block';
                        } else if (thresholdControls) {
                            thresholdControls.style.display = 'none';
                        }
                        engine.needsRedraw = true;
                    });
                }
                
                if (thresholdSlider) {
                    thresholdSlider.addEventListener('input', function() {
                        engine.threshold = parseFloat(this.value);
                        if (thresholdDisplay) {
                            thresholdDisplay.textContent = `θ = P(X > ${this.value})`;
                        }
                        engine.updateLines();
                        engine.needsRedraw = true;
                    });
                }
                
                if (sampleSizeSlider) {
                    sampleSizeSlider.addEventListener('input', function() {
                        n = parseInt(this.value);
                        if (sampleSizeDisplay) sampleSizeDisplay.textContent = n;
                        if (sampleSizeValue) sampleSizeValue.textContent = n;
                    });
                }
                
                if (paramLineCheckbox) {
                    paramLineCheckbox.addEventListener('change', function() {
                        engine.showParamLine = this.checked;
                        engine.needsRedraw = true;
                    });
                }
                
                if (normalFitCheckbox) {
                    normalFitCheckbox.addEventListener('change', function() {
                        engine.showNormalFit = this.checked;
                        engine.needsRedraw = true;
                    });
                }
                
                if (speedSelect) {
                    speedSelect.addEventListener('change', function() {
                        engine.speed = this.value;
                    });
                }
                
                if (seedInput) {
                    seedInput.addEventListener('input', function() {
                        const seed = parseInt(this.value) || 0;
                        engine.rng = rngMulberry32(seed);
                    });
                }
                
                if (eraseToggle) {
                    eraseToggle.addEventListener('click', function() {
                        eraseMode = !eraseMode;
                        this.textContent = eraseMode ? '−' : '+';
                        this.style.background = eraseMode ? '#FF7D00' : '#15616D';
                    });
                }
                
                if (drawSampleBtn) {
                    drawSampleBtn.addEventListener('click', function() {
                        const validation = validateSampleSize(n);
                        if (!validation.valid) {
                            alert(validation.message);
                            return;
                        }
                        engine.drawSampleWithAutoCalculate(n, 1200);
                    });
                }
                
                if (repeat10Btn) {
                    repeat10Btn.addEventListener('click', async function() {
                        const validation = validateSampleSize(n);
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
                }
                
                if (repeat1000Btn) {
                    repeat1000Btn.addEventListener('click', function() {
                        const validation = validateSampleSize(n);
                        if (!validation.valid) {
                            alert(validation.message);
                            return;
                        }
                        engine.handleRepeatTurbo(n);
                    });
                }
                
                if (resetBtn) {
                    resetBtn.addEventListener('click', function() {
                        engine.clearTray();
                        engine.resetExperiment();
                    });
                }
                
                // Keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
                    
                    switch (e.key) {
                        case ' ':
                            e.preventDefault();
                            if (drawSampleBtn) drawSampleBtn.click();
                            break;
                        case 'r':
                            e.preventDefault();
                            if (resetBtn) resetBtn.click();
                            break;
                        case 'e':
                            e.preventDefault();
                            if (eraseToggle) eraseToggle.click();
                            break;
                        case '1':
                            if (repeat10Btn) repeat10Btn.click();
                            break;
                        case '2':
                            if (repeat1000Btn) repeat1000Btn.click();
                            break;
                    }
                });
            },

            setupMobilePanel: function() {
                const mobileToggle = document.getElementById('mobile-panel-toggle');
                const mobilePanel = document.getElementById('mobile-panel-overlay');
                
                if (mobileToggle) {
                    mobileToggle.addEventListener('click', function() {
                        if (mobilePanel) {
                            mobilePanel.style.display = 'block';
                        }
                    });
                }
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