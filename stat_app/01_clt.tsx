import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// TypeScript-like interfaces for better code documentation
/**
 * @typedef {Object} PopulationStats
 * @property {number} mu - Population mean
 * @property {number} sd - Population standard deviation  
 * @property {number} med - Population median
 * @property {number} pthr - Population proportion above threshold
 * @property {number} total - Total population count
 */

/**
 * @typedef {Object} TouchFeedback
 * @property {number} id - Unique identifier
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} type - 'add' or 'erase'
 * @property {number} timestamp - Creation time
 */

// ---------------- Utils (deterministic & numerically stable) ----------------
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

// Input validation
function validateSampleSize(n) {
  if (n < 2) return { valid: false, message: "Sample size must be at least 2" };
  if (n > 1000) return { valid: false, message: "Sample size too large (max 1000)" };
  return { valid: true };
}

// ---------------- Consts ----------------
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

// ---------------- Engine (draws on a single <canvas>) ----------------
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
    this.needsRedraw = true; // Performance optimization flag
    this.lastGatheringSample = null; // Store sample data during gathering
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

  scheduleEmission(xs, cols, dropMs) { this.lastSample = xs.slice(); const now = performance.now(); this.emissionPlan = { start: now, end: now + dropMs, total: cols.length, emitted: 0, cols: cols.slice(), xs: xs.slice() }; }
  isIdle() { return !this.hasActiveAnimations(); }
  whenIdle() { return new Promise((resolve) => { const check = () => (this.isIdle() ? resolve() : setTimeout(check, 16)); check(); }); }

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
      if (this.emissionPlan && this.emissionPlan.emitted >= this.emissionPlan.total) this.emissionPlan = null;
    }
    
    if (this.sampleParticles.length) {
      const survivors = [];
      for (const s of this.sampleParticles) { s.vy += g * dt; s.y = Math.min(s.y + s.vy * dt, s.targetY); if (s.y < s.targetY - 0.1) survivors.push(s); else this.midCounts[s.col] = (this.midCounts[s.col] || 0) + 1; }
      this.sampleParticles = survivors;
    }
    
    // Enhanced gathering animation
    if (this.gathering && this.gatherTarget) {
      const t = clamp((now - this.gatherStart) / this.gatherDur, 0, 1);
      
      // Animate gather particles moving toward the target
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
      }
    }
    
    if (this.statParticles.length) {
      const survivors = [];
      for (const p of this.statParticles) { p.vy += g * dt; p.y = Math.min(p.y + p.vy * dt, p.targetY); if (p.y < p.targetY - 0.1) survivors.push(p); else this.botCounts[p.bin] = (this.botCounts[p.bin] || 0) + 1; }
      this.statParticles = survivors;
    }
    this.popFlashes = this.popFlashes.filter((f) => f.until > now);
    
    // Only set needsRedraw if we have animations or this is the frame they just stopped
    if (this.hasActiveAnimations() || hadAnimations) {
      this.needsRedraw = true;
    }
  }

  colLeft(col) { return this.gridX0 + col * this.BOX; }
  colCenter(col) { return this.gridX0 + col * this.BOX + this.BOX / 2; }

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

    // Sample stats (if any) - only show when sample is complete, retain during gather
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
      
      // Sample statistic line - snapped to bin center
      const binIndex = Math.round(val * COLS);
      const snappedBin = clamp(binIndex, 0, COLS - 1);
      const sampleStatX = this.gridX0 + snappedBin * this.BOX + this.BOX / 2;
      
      ctx.save(); ctx.strokeStyle = COLORS.sampleMean; ctx.lineWidth = 2; 
      ctx.beginPath(); 
      ctx.moveTo(sampleStatX, yMid + 32); // Start below title
      ctx.lineTo(sampleStatX, midBase - 8); 
      ctx.stroke(); 
      
      // Add sample statistic annotation
      ctx.fillStyle = COLORS.sampleMean;
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      const sampleLabel = this.statistic === "mean" ? "x̄" : this.statistic === "median" ? "med" : this.statistic === "sd" ? "s" : "p̂";
      ctx.fillText(sampleLabel, sampleStatX, yMid + 46);
      
      ctx.restore();
    }

    // Sample stats during gathering - keep visible but don't update
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
      
      // Sample statistic line during gathering
      const binIndex = Math.round(val * COLS);
      const snappedBin = clamp(binIndex, 0, COLS - 1);
      const sampleStatX = this.gridX0 + snappedBin * this.BOX + this.BOX / 2;
      
      ctx.save(); 
      ctx.strokeStyle = COLORS.sampleMean; 
      ctx.lineWidth = 2; 
      ctx.setLineDash([4, 4]); // Dashed during gathering
      ctx.beginPath(); 
      ctx.moveTo(sampleStatX, yMid + 32);
      ctx.lineTo(sampleStatX, midBase - 8); 
      ctx.stroke(); 
      
      // Add sample statistic annotation
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.sampleMean;
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      const sampleLabel = this.statistic === "mean" ? "x̄" : this.statistic === "median" ? "med" : this.statistic === "sd" ? "s" : "p̂";
      ctx.fillText(sampleLabel, sampleStatX, yMid + 46);
      
      ctx.restore();
    }
    if (this.showParamLine) {
      let theta = this.popStats.mu; if (this.statistic === "median") theta = this.popStats.med; else if (this.statistic === "sd") theta = this.popStats.sd; else if (this.statistic === "proportion") theta = this.popStats.pthr;
      
      // Snap to bin center
      const binIndex = Math.round(theta * COLS);
      const snappedBin = clamp(binIndex, 0, COLS - 1);
      const thetaX = this.gridX0 + snappedBin * this.BOX + this.BOX / 2;
      
      const stackCount = this.midCounts[snappedBin] || 0; const stackHeight = stackCount * this.BOX_MID_Y; const midBase2 = yMid + this.H_MID - 16;
      
      // Enhanced parameter line with population color
      ctx.save(); 
      ctx.setLineDash([6, 3]); 
      ctx.lineWidth = 3;
      
      if (stackCount > 0) { 
        ctx.strokeStyle = "#FFFFFF"; 
        ctx.beginPath(); 
        ctx.moveTo(thetaX, midBase2 - 8); 
        ctx.lineTo(thetaX, midBase2 - 8 - stackHeight); 
        ctx.stroke(); 
        ctx.strokeStyle = COLORS.popFill; // Use population color
        ctx.beginPath(); 
        ctx.moveTo(thetaX, midBase2 - 8 - stackHeight); 
        ctx.lineTo(thetaX, yMid + 32); // Start below title
        ctx.stroke(); 
      } else { 
        ctx.strokeStyle = COLORS.popFill; // Use population color
        ctx.beginPath(); 
        ctx.moveTo(thetaX, yMid + 32); // Start below title
        ctx.lineTo(thetaX, midBase2 - 8); 
        ctx.stroke(); 
      }
      
      // Add parameter line label
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.popFill; // Use population color
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      const paramLabel = this.statistic === "mean" ? "μ" : this.statistic === "median" ? "μ̃" : this.statistic === "sd" ? "σ" : "π";
      ctx.fillText(paramLabel, thetaX, yMid + 46);
      ctx.restore();
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
      
      // Sampling distribution mean line - snapped to bin center
      const samplingMeanBinIndex = Math.round(((m - dom.min) / (dom.max - dom.min)) * STAT_BINS);
      const samplingMeanSnappedBin = clamp(samplingMeanBinIndex, 0, STAT_BINS - 1);
      const samplingMeanX = this.gridX0 + samplingMeanSnappedBin * this.BOX + this.BOX / 2;
      
      ctx.save(); 
      ctx.strokeStyle = COLORS.botFill; 
      ctx.lineWidth = 2; 
      ctx.beginPath(); 
      ctx.moveTo(samplingMeanX, yBot + 32); // Start below title
      ctx.lineTo(samplingMeanX, yBotBase - 8); 
      ctx.stroke(); 
      
      // Add sampling distribution mean annotation
      ctx.fillStyle = COLORS.botFill;
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      const samplingLabel = this.statistic === "mean" ? "E[x̄]" : this.statistic === "median" ? "E[med]" : this.statistic === "sd" ? "E[s]" : "E[p̂]";
      ctx.fillText(samplingLabel, samplingMeanX, yBot + 46);
      
      ctx.restore();
    }

    for (let b = 0; b < STAT_BINS; b++) {
      const stack = this.botCounts[b] || 0; if (!stack) continue; const x = this.gridX0 + b * this.BOX + this.BOX / 2;
      for (let r = 0; r < stack; r++) {
        const y = yBotBase - r * this.BOX_BOT_Y - this.BOX_BOT_Y / 2;
        ctx.fillStyle = COLORS.botFill; ctx.fillRect(Math.floor(x - this.BOX / 2), Math.floor(y - this.BOX_BOT_Y / 2), Math.ceil(this.BOX), Math.ceil(this.BOX_BOT_Y));
        ctx.fillStyle = COLORS.botTop; ctx.fillRect(Math.floor(x - this.BOX / 2), Math.floor(y - this.BOX_BOT_Y / 2), Math.ceil(this.BOX), 1);
      }
    }

    const maxStack = this.botCounts.reduce((m0, v) => (v > m0 ? v : m0), 0); const maxPix = maxStack * this.BOX_BOT_Y;
    let theta = this.popStats.mu; if (this.statistic === "median") theta = this.popStats.med; else if (this.statistic === "sd") theta = this.popStats.sd; else if (this.statistic === "proportion") theta = this.popStats.pthr;
    const thetaX = this.gridX0 + clamp((theta - dom.min) / (dom.max - dom.min + 1e-9), 0, 1) * (this.BOX * COLS);

    if (this.showParamLine) {
      const bin = clamp(Math.floor((thetaX - this.gridX0) / this.BOX), 0, STAT_BINS - 1);
      const stackCount = this.botCounts[bin] || 0; const stackHeight = stackCount * this.BOX_BOT_Y;
      ctx.save(); ctx.setLineDash([6, 3]); ctx.lineWidth = 3;
      
      // Snap parameter line to bin center in bottom section too
      const binIndex = Math.round(theta * STAT_BINS);
      const snappedBin = clamp(binIndex, 0, STAT_BINS - 1);
      const snappedThetaX = this.gridX0 + snappedBin * this.BOX + this.BOX / 2;
      const snappedStackCount = this.botCounts[snappedBin] || 0;
      const snappedStackHeight = snappedStackCount * this.BOX_BOT_Y;
      
      if (snappedStackCount > 0) { 
        ctx.strokeStyle = "#FFFFFF"; 
        ctx.beginPath(); 
        ctx.moveTo(snappedThetaX, yBotBase - 8); 
        ctx.lineTo(snappedThetaX, yBotBase - 8 - snappedStackHeight); 
        ctx.stroke(); 
        ctx.strokeStyle = COLORS.popFill; // Use population color
        ctx.beginPath(); 
        ctx.moveTo(snappedThetaX, yBotBase - 8 - snappedStackHeight); 
        ctx.lineTo(snappedThetaX, yBot + 32); // Start below title
        ctx.stroke(); 
      } else { 
        ctx.strokeStyle = COLORS.popFill; // Use population color
        ctx.beginPath(); 
        ctx.moveTo(snappedThetaX, yBot + 32); // Start below title
        ctx.lineTo(snappedThetaX, yBotBase - 8); 
        ctx.stroke(); 
      }
      ctx.restore();
    }

    if (this.showNormalFit && total > 5 && sHat > 1e-6) {
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
    
    this.needsRedraw = false; // Mark as drawn
  }

  clickPopulation(xCanvas, yCanvas) { if (yCanvas > this.marginY + this.H_TOP) return; const col = clamp(Math.floor((xCanvas - this.gridX0) / this.BOX), 0, COLS - 1); this.popCounts[col] = clamp((this.popCounts[col] || 0) + 1, 0, 10000); this.needsRedraw = true; }
  altClickPopulation(xCanvas, yCanvas) { if (yCanvas > this.marginY + this.H_TOP) return; const col = clamp(Math.floor((xCanvas - this.gridX0) / this.BOX), 0, COLS - 1); this.popCounts[col] = clamp((this.popCounts[col] || 0) - 1, 0, 10000); this.needsRedraw = true; }
  startSample(n, dropMs) { const { xs, cols } = this.sampleN(n); this.scheduleEmission(xs, cols, dropMs); }
  calculateWithGather() {
    const xs = this.lastSample || []; let hasMid = false; for (let i = 0; i < COLS; i++) if (this.midCounts[i] > 0) { hasMid = true; break; }
    if (!xs.length && !hasMid) return;
    
    // Store sample data for displaying during gathering
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
    
    // Initialize gather particles with proper starting positions
    this.gatherParticles = []; 
    for (let c = 0; c < COLS; c++) { 
      const stack = this.midCounts[c] || 0; 
      if (!stack) continue; 
      for (let r = 0; r < stack; r++) { 
        const startY = midBase - r * this.BOX_MID_Y - this.BOX_MID_Y / 2; 
        const startX = this.colCenter(c);
        this.gatherParticles.push({ 
          sx: startX, sy: startY,  // Starting position
          x: startX, y: startY     // Current position (starts at starting position)
        }); 
      } 
    }
    
    this.midCounts = new Uint16Array(COLS); this.gatherTarget = { x: gatherX, y: gatherY, bin }; this.gathering = true; this.gatherStart = performance.now(); this.lastSample = [];
  }
  fastFinishPrevious() {
    if (this.statParticles.length) { for (const p of this.statParticles) this.botCounts[p.bin] = (this.botCounts[p.bin] || 0) + 1; this.statParticles = []; }
    let hadSample = (this.lastSample && this.lastSample.length) || this.sampleParticles.length || this.emissionPlan;
    if (!hadSample) { for (let i = 0; i < COLS; i++) if (this.midCounts[i] > 0) { hadSample = true; break; } }
    if (hadSample) {
      let xs = [];
      if (this.lastSample?.length) xs = this.lastSample.slice();
      else { const counts = this.midCounts.slice(); for (const s of this.sampleParticles) counts[s.col] = (counts[s.col] || 0) + 1; for (let c = 0; c < COLS; c++) for (let r = 0; r < (counts[c] || 0); r++) xs.push((c + 0.5) / COLS); }
      const v = this.computeStat(xs); const { min, max } = this.statDomain(); const x01 = clamp((v - min) / (max - min + 1e-9), 0, 1); const bin = clamp(Math.floor(x01 * STAT_BINS), 0, STAT_BINS - 1); this.botCounts[bin] = (this.botCounts[bin] || 0) + 1;
    }
    this.lastSample = []; this.emissionPlan = null; this.sampleParticles = []; this.midCounts = new Uint16Array(COLS); this.popFlashes = []; this.gathering = false; this.gatherTarget = null; this.gatherParticles = []; this.lastGatheringSample = null; this.needsRedraw = true;
  }
  clearTray() { this.midCounts = new Uint16Array(COLS); this.lastSample = []; this.sampleParticles = []; this.emissionPlan = null; this.gatherParticles = []; this.gathering = false; this.needsRedraw = true; }
  resetExperiment() { this.botCounts = new Uint32Array(STAT_BINS); this.statParticles = []; this.needsRedraw = true; }
  drawSampleWithAutoCalculate(n, dropMs) {
    if (this.lastSample?.length || this.hasSampleInMid()) { this.calculateWithGather(); setTimeout(() => { this.startSample(n, dropMs); }, 100); }
    else { this.startSample(n, dropMs); }
  }
  hasSampleInMid() { for (let i = 0; i < COLS; i++) { if (this.midCounts[i] > 0) return true; } return false; }
}

// Progress Bar Component
const ProgressBar = ({ current, total, isRunning }) => {
  if (!isRunning || total === 0) return null;
  
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div style={{ 
      width: "100%", 
      backgroundColor: "#E5E7EB", 
      borderRadius: 8, 
      height: 6, 
      marginBottom: 8,
      overflow: "hidden" 
    }}>
      <div 
        style={{ 
          width: `${percentage}%`, 
          backgroundColor: COLORS.active, 
          height: "100%", 
          borderRadius: 8,
          transition: "width 0.3s ease-in-out"
        }}
      />
      <div style={{ fontSize: 12, color: COLORS.text, marginTop: 4, textAlign: "center" }}>
        {current} / {total} samples
      </div>
    </div>
  );
};

// Tooltip Component
const ConceptTooltip = ({ concept, children, show }) => {
  const tooltipContent = {
    standardError: {
      title: "Standard Error (SE)",
      content: "SE = σ/√n. As sample size increases, the standard error decreases, making sample means cluster more tightly around the population mean μ. This is the key insight of the CLT!"
    },
    parameterLine: {
      title: "Parameter Line (θ)",
      content: "The dashed line shows the true population parameter. According to the CLT, sample statistics should center around this value as we take more samples."
    },
    samplingDistribution: {
      title: "Sampling Distribution",
      content: "This shows the distribution of sample statistics from many repeated samples. The CLT tells us this approaches a normal distribution as sample size increases, regardless of the population shape."
    },
    normalFit: {
      title: "Normal Approximation",
      content: "The CLT predicts that sampling distributions become approximately normal. The fitted curve shows how well our empirical results match this theoretical prediction."
    }
  };

  const tip = tooltipContent[concept];
  if (!show || !tip) return children;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}
      <div style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: COLORS.text,
        color: "white",
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 12,
        width: 200,
        zIndex: 1000,
        marginBottom: 5,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{tip.title}</div>
        <div>{tip.content}</div>
        <div style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `6px solid ${COLORS.text}`
        }} />
      </div>
    </div>
  );
};

// Touch Feedback Component
const TouchFeedback = ({ feedbacks }) => (
  <>
    {feedbacks.map(feedback => (
      <div
        key={feedback.id}
        style={{
          position: "absolute",
          left: feedback.x - 16,
          top: feedback.y - 16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: feedback.type === "add" ? COLORS.active : COLORS.error,
          opacity: Math.max(0, 1 - (Date.now() - feedback.timestamp) / 500),
          transform: `scale(${1 + (Date.now() - feedback.timestamp) / 500})`,
          pointerEvents: "none",
          zIndex: 100,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out"
        }}
      />
    ))}
  </>
);

// ---------------- Component ----------------
export default function CentralLimitTheoremLab() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const engineRef = useRef(null);
  const headerRef = useRef(null);
  const actionsRef = useRef(null);
  const [plotWidth, setPlotWidth] = useState(900);
  const [canvasH, setCanvasH] = useState(520);
  const [seed, setSeed] = useState(1234);
  const [statistic, setStatistic] = useState("mean");
  const [threshold, setThreshold] = useState(0.5);
  const [n, setN] = useState(30);
  const [speed, setSpeed] = useState("normal");
  const [mode, setMode] = useState("normal");
  const [showParamLine, setShowParamLine] = useState(true);
  const [showNormalFit, setShowNormalFit] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [panelDragX, setPanelDragX] = useState(0);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [touchFeedbacks, setTouchFeedbacks] = useState([]);
  const [showTooltip, setShowTooltip] = useState("");
  const [repeatProgress, setRepeatProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [validationError, setValidationError] = useState("");
  
  const DROP_MS = 1200;
  const repeatAbortRef = useRef(false);
  const cancelRepeat = () => { 
    repeatAbortRef.current = true; 
    setRepeatProgress({ current: 0, total: 0, isRunning: false });
  };

  // Input validation
  useEffect(() => {
    const validation = validateSampleSize(n);
    setValidationError(validation.valid ? "" : validation.message);
  }, [n]);

  // Touch feedback cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      setTouchFeedbacks(prev => 
        prev.filter(f => Date.now() - f.timestamp < 500)
      );
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleDrawSample();
          break;
        case 'r':
          e.preventDefault();
          handleReset();
          break;
        case 'e':
          e.preventDefault();
          setEraseMode(prev => !prev);
          break;
        case '1':
          handleRepeat(10);
          break;
        case '2':
          handleRepeatTurbo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [n]);

  // Self-tests
  useEffect(() => {
    try {
      console.assert(mean([1, 2, 3]) === 2, "mean test failed");
      console.assert(Math.abs(robustSD([1, 2, 3]) - 1) < 1e-12, "sd test failed");
      console.assert(med([1, 3, 2]) === 2, "median test failed");
    } catch (_) { /* never throw in UI */ }
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const el = containerRef.current; 
      const w = el.clientWidth || 960; 
      const rect = el.getBoundingClientRect(); 
      const topOffset = rect.top || 0;
      const headerRefAny = headerRef.current; 
      const actionsRefAny = actionsRef.current; 
      const headerH = headerRefAny ? headerRefAny.offsetHeight : 0; 
      const actionsH = actionsRefAny ? actionsRefAny.offsetHeight : 0;
      const padding = 24; 
      const availH = Math.max(300, window.innerHeight - topOffset - headerH - actionsH - padding);
      const rightPane = isDesktop ? 320 : 0; 
      
      // Calculate optimal plot width with aspect ratio constraints
      let plotW = Math.max(320, w - rightPane - 24);
      
      // Maintain reasonable aspect ratio - don't let it get too wide and flat
      const maxWidth = Math.min(plotW, availH * 1.6); // Max 1.6:1 aspect ratio
      const minWidth = Math.max(320, availH * 0.8); // Min 0.8:1 aspect ratio
      plotW = Math.max(minWidth, Math.min(maxWidth, plotW));
      
      setPlotWidth(plotW); 
      setCanvasH(availH);
    });
    ro.observe(containerRef.current); 
    if (headerRef.current) ro.observe(headerRef.current); 
    if (actionsRef.current) ro.observe(actionsRef.current);
    return () => ro.disconnect();
  }, [isDesktop]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const engine = new Engine(ctx || null); engineRef.current = engine; engine.applyGenerator("normal");
  }, []);

  useEffect(() => { const e = engineRef.current, c = canvasRef.current; if (!e || !c) return; c.width = plotWidth; e.layoutFromViewport(plotWidth, canvasH); c.height = e.H_TOP + e.H_MID + e.H_BOT + 2 * e.marginY; }, [plotWidth, canvasH]);
  useEffect(() => { const e = engineRef.current; if (!e) return; e.rng = rngMulberry32(seed >>> 0); }, [seed]);
  useEffect(() => { const e = engineRef.current; if (!e) return; e.statistic = statistic; e.threshold = threshold; e.speed = speed; e.showParamLine = showParamLine; e.showNormalFit = showNormalFit; }, [statistic, threshold, speed, showParamLine, showNormalFit]);

  // Enhanced canvas interaction with touch feedback
  useEffect(() => {
    const c = canvasRef.current, e = engineRef.current; if (!c || !e) return;
    const getPos = (ev) => { const r = c.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    
    const addTouchFeedback = (x, y, type) => {
      const feedback = { id: Date.now() + Math.random(), x, y, type, timestamp: Date.now() };
      setTouchFeedbacks(prev => [...prev, feedback]);
    };
    
    const onDown = (ev) => { 
      cancelRepeat(); 
      const { x, y } = getPos(ev); 
      const erase = ev.button === 2 || ev.ctrlKey || ev.metaKey || eraseMode; 
      if (erase) {
        e.altClickPopulation(x, y);
        addTouchFeedback(x, y, "erase");
      } else {
        e.clickPopulation(x, y);
        addTouchFeedback(x, y, "add");
      }
      ev.preventDefault(); 
    };
    
    const onMove = (ev) => { 
      if (ev.buttons === 0) return; 
      const { x, y } = getPos(ev); 
      const erase = (ev.buttons & 2) === 2 || eraseMode; 
      if (erase) {
        e.altClickPopulation(x, y);
      } else {
        e.clickPopulation(x, y);
      }
    };
    
    const onContext = (e2) => { e2.preventDefault(); };
    c.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); c.addEventListener("contextmenu", onContext);
    return () => { c.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); c.removeEventListener("contextmenu", onContext); };
  }, [eraseMode]);

  useEffect(() => { const e = engineRef.current; if (!e) return; e.applyGenerator(mode); }, [mode]);

  useEffect(() => {
    let last = performance.now(); let raf;
    const step = (now) => { 
      const e = engineRef.current; 
      if (!e) return; 
      const dt = Math.min(0.06, (now - last) / 1000); 
      last = now; 
      e.tick(dt, now); 
      
      // Only draw if needed (performance optimization)
      if (e.needsRedraw || e.hasActiveAnimations()) {
        e.draw(); 
      }
      
      raf = requestAnimationFrame(step); 
    };
    raf = requestAnimationFrame(step); 
    return () => cancelAnimationFrame(raf);
  }, []);

  // Enhanced actions with progress tracking
  const handleDrawSample = () => { 
    if (validationError) return;
    cancelRepeat(); 
    const e = engineRef.current; 
    if (!e) return; 
    e.drawSampleWithAutoCalculate(n, DROP_MS); 
  };
  
  const handleRepeat = async (times) => {
    if (validationError) return;
    const e = engineRef.current; 
    if (!e) return; 
    
    repeatAbortRef.current = false;
    setRepeatProgress({ current: 0, total: times, isRunning: true });
    
    const prevSpeed = e.speed; 
    const prevGather = e.gatherDur; 
    e.speed = "fast"; 
    e.gatherDur = 180;
    
    try {
      for (let k = 0; k < times; k++) { 
        if (repeatAbortRef.current) break; 
        
        setRepeatProgress(prev => ({ ...prev, current: k + 1 }));
        e.drawSampleWithAutoCalculate(n, 600); 
        await new Promise((r) => setTimeout(r, 200)); 
        
        if (repeatAbortRef.current) break; 
      }
    } finally { 
      e.speed = prevSpeed; 
      e.gatherDur = prevGather; 
      setRepeatProgress({ current: 0, total: 0, isRunning: false });
    }
  };
  
  const handleRepeatTurbo = () => { 
    if (validationError) return;
    cancelRepeat(); 
    const e = engineRef.current; 
    if (!e) return; 
    
    for (let i = 0; i < 1000; i++) { 
      const { xs } = e.sampleN(n); 
      const v = e.computeStat(xs); 
      const { min, max } = e.statDomain(); 
      const x01 = clamp((v - min) / (max - min + 1e-9), 0, 1); 
      const bin = clamp(Math.floor(x01 * STAT_BINS), 0, STAT_BINS - 1); 
      e.botCounts[bin] = (e.botCounts[bin] || 0) + 1; 
    } 
    e.needsRedraw = true;
  };
  
  const handleReset = () => { 
    cancelRepeat(); 
    const e = engineRef.current; 
    if (!e) return; 
    e.clearTray(); 
    e.resetExperiment(); 
  };

  const popMu = engineRef.current?.popStats.mu ?? NaN;
  const popSd = engineRef.current?.popStats.sd ?? NaN;

  const RightPanel = (
    <div style={{ width: 320, borderRadius: 16, background: "#FFF7EB", padding: 12, height: "100%", overflow: "auto" }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Controls</div>
      
      {/* Keyboard shortcuts info */}
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12, padding: 8, backgroundColor: "#F3F4F6", borderRadius: 6 }}>
        <strong>Keyboard shortcuts:</strong><br/>
        Space: Draw Sample • R: Reset • E: Toggle Erase • 1: ×10 • 2: ×1000
      </div>
      
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14 }}>Population shape</div>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
            <option value="normal">Normal</option>
            <option value="lognormal">Skewed (lognormal)</option>
            <option value="uniform">Uniform</option>
            <option value="bimodal">Bimodal</option>
          </select>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>μ≈{isFinite(popMu) ? popMu.toFixed(3) : "—"} · σ≈{isFinite(popSd) ? popSd.toFixed(3) : "—"}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Click/drag on the population to paint your own distribution!</div>
        </div>
        
        <div>
          <div style={{ fontSize: 14 }}>Statistic</div>
          <select value={statistic} onChange={(e) => setStatistic(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
            <option value="mean">Mean (x̄)</option>
            <option value="median">Median</option>
            <option value="sd">Standard Deviation (s)</option>
            <option value="proportion">Proportion (&gt; threshold)</option>
          </select>
          {statistic === "proportion" ? (
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontSize: 12 }}>Threshold</div>
              <input type="range" min={0.05} max={0.95} step={0.01} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} style={{ width: "100%" }} />
              <div style={{ fontSize: 12, color: "#475569" }}>θ = P(X &gt; {threshold.toFixed(2)})</div>
            </div>
          ) : null}
        </div>
        
        <div>
          <div style={{ fontSize: 14 }}>Sample size (n)</div>
          <input 
            type="range" 
            min={2} 
            max={500} 
            step={1} 
            value={n} 
            onChange={(e) => setN(parseInt(e.target.value))} 
            style={{ width: "100%" }} 
          />
          <div style={{ fontSize: 14, fontWeight: 600, color: validationError ? COLORS.error : COLORS.text }}>
            {n}
          </div>
          {validationError && (
            <div style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
              {validationError}
            </div>
          )}
        </div>
        
        <div style={{ display: "grid", gap: 6 }}>
          <ConceptTooltip concept="parameterLine" show={showTooltip === "parameterLine"}>
            <label 
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, cursor: "pointer" }}
              onMouseEnter={() => setShowTooltip("parameterLine")}
              onMouseLeave={() => setShowTooltip("")}
            >
              <span>Show parameter line (θ)</span>
              <input type="checkbox" checked={showParamLine} onChange={(e) => setShowParamLine(e.target.checked)} />
            </label>
          </ConceptTooltip>
          
          <ConceptTooltip concept="normalFit" show={showTooltip === "normalFit"}>
            <label 
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, cursor: "pointer" }}
              onMouseEnter={() => setShowTooltip("normalFit")}
              onMouseLeave={() => setShowTooltip("")}
            >
              <span>Show normal fit</span>
              <input type="checkbox" checked={showNormalFit} onChange={(e) => setShowNormalFit(e.target.checked)} />
            </label>
          </ConceptTooltip>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14 }}>Speed</div>
            <select value={speed} onChange={(e) => setSpeed(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
              <option value="normal">Educational</option>
              <option value="fast">Demonstration</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 14 }}>Seed</div>
            <input value={seed} onChange={(e) => setSeed(parseInt(e.target.value || "0") || 0)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 8 }} />
          </div>
        </div>
        
        <ConceptTooltip concept="standardError" show={showTooltip === "standardError"}>
          <div 
            style={{ fontSize: 12, color: "#475569", padding: 8, backgroundColor: "#F0F9FF", borderRadius: 6, cursor: "help" }}
            onMouseEnter={() => setShowTooltip("standardError")}
            onMouseLeave={() => setShowTooltip("")}
          >
            <strong>Central Limit Theorem:</strong> SE = σ/√n decreases as n increases. The sampling distribution approaches normal regardless of population shape!
          </div>
        </ConceptTooltip>
      </div>
    </div>
  );

  // Mobile panel swipe-close helpers
  useEffect(() => {
    if (isDesktop) return;
    const edgeWidth = 24; let startX = 0, startY = 0, tracking = false;
    const onTouchStart = (e) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY; tracking = startX > (window.innerWidth - edgeWidth) && !isPanelOpen; };
    const onTouchMove = (e) => { if (!tracking) return; const t = e.touches[0]; const dx = t.clientX - startX; const dy = t.clientY - startY; if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) && dx < -30) { setIsPanelOpen(true); tracking = false; } };
    const el = containerRef.current; if (!el) return; el.addEventListener("touchstart", onTouchStart, { passive: true }); el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchmove", onTouchMove); };
  }, [isDesktop, isPanelOpen]);

  const panelTouchHandlers = {
    onTouchStart: (e) => { const t = e.touches[0]; setIsDraggingPanel(true); setPanelDragX(0); (panelTouchHandlers).sx = t.clientX; (panelTouchHandlers).sy = t.clientY; },
    onTouchMove: (e) => { if (!isDraggingPanel) return; const t = e.touches[0]; const dx = t.clientX - (panelTouchHandlers).sx; const dy = t.clientY - (panelTouchHandlers).sy; if (Math.abs(dx) > Math.abs(dy) && dx > 0) setPanelDragX(dx); },
    onTouchEnd: () => { if (panelDragX > 60) { setIsPanelOpen(false); } setPanelDragX(0); setIsDraggingPanel(false); }
  };
  const panelTransform = isDraggingPanel ? `translateX(${Math.min(panelDragX, 280)}px)` : "translateX(0)";

  return (
    <div ref={containerRef} style={{ minHeight: "100svh", height: "auto", width: "100%", background: "#fff", color: "#001524", overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}>
      <div style={{ height: "100%", maxWidth: 1400, margin: "0 auto", padding: "12px" }}>
        <div style={{ display: "flex", gap: 12, height: "100%" }}>
          <div style={{ flex: 1, borderRadius: 16, background: "#fff" }}>
            <div ref={headerRef} style={{ padding: "12px 12px 6px" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Central Limit Theorem Lab</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                Explore how sample statistics behave as sample size changes
              </div>
            </div>
            
            <div ref={canvasWrapRef} style={{ position: "relative", padding: "0 8px" }}>
              <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 12, outline: "none", touchAction: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} aria-label="Central Limit Theorem Canvas" />

              {/* Clean +/- toggle */}
              <button
                aria-label={eraseMode ? "Erase mode" : "Add mode"}
                title={eraseMode ? "Erase (tap to switch)" : "Add (tap to switch)"}
                onClick={() => setEraseMode((v) => !v)}
                aria-pressed={eraseMode}
                style={{ 
                  position: "absolute", 
                  top: 44, 
                  left: 16, 
                  width: 34, 
                  height: 34, 
                  borderRadius: 9999, 
                  background: eraseMode ? COLORS.active : COLORS.idle, 
                  color: "#fff", 
                  fontWeight: 800, 
                  fontSize: 18, 
                  lineHeight: "34px", 
                  textAlign: "center", 
                  border: 0, 
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)", 
                  userSelect: "none",
                  transition: "all 0.2s ease"
                }}
              >
                {eraseMode ? "−" : "+"}
              </button>

              <TouchFeedback feedbacks={touchFeedbacks} />
            </div>

            <div ref={actionsRef} style={{ padding: 8 }}>
              <ProgressBar {...repeatProgress} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={handleDrawSample}
                  disabled={!!validationError}
                  style={{ 
                    padding: "12px 16px", 
                    borderRadius: 8, 
                    background: validationError ? "#9CA3AF" : "#FF7D00", 
                    color: "#fff", 
                    fontWeight: 600, 
                    border: 0, 
                    fontSize: 16, 
                    width: "100%",
                    cursor: validationError ? "not-allowed" : "pointer"
                  }}
                >
                  Draw Sample ({n}) {validationError ? "⚠️" : ""}
                </button>
                
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleRepeat(10)}
                    disabled={!!validationError}
                    style={{ 
                      padding: "8px 12px", 
                      borderRadius: 8, 
                      background: validationError ? "#9CA3AF" : "#15616D", 
                      color: "#fff", 
                      fontWeight: 600, 
                      border: 0, 
                      flex: 1, 
                      minWidth: 80,
                      cursor: validationError ? "not-allowed" : "pointer"
                    }}
                  >
                    ×10
                  </button>
                  <button
                    onClick={handleRepeatTurbo}
                    disabled={!!validationError}
                    style={{ 
                      padding: "8px 12px", 
                      borderRadius: 8, 
                      background: validationError ? "#9CA3AF" : "#1c7f8d", 
                      color: "#fff", 
                      fontWeight: 600, 
                      border: 0, 
                      flex: 1, 
                      minWidth: 80,
                      cursor: validationError ? "not-allowed" : "pointer"
                    }}
                  >
                    ×1000
                  </button>
                  <button
                    onClick={handleReset}
                    style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", color: "#001524", fontWeight: 600, border: "1px solid #cbd5e1", flex: 1, minWidth: 80 }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isDesktop ? RightPanel : null}
        </div>
      </div>

      {!isDesktop && (
        <>
          <button onClick={() => setIsPanelOpen(true)} aria-label="Open controls" style={{ position: "fixed", right: 12, top: 'calc(env(safe-area-inset-top, 0px) + 12px)', zIndex: 30, padding: "10px 12px", borderRadius: 9999, background: "#FF7D00", color: "#fff", fontWeight: 700, border: 0, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}>Controls</button>
          {isPanelOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
              <div onClick={() => setIsPanelOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
              <div {...panelTouchHandlers} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "86vw", maxWidth: 420, background: "#FFF7EB", borderTopLeftRadius: 16, borderBottomLeftRadius: 16, transform: panelTransform, transition: isDraggingPanel ? "none" : "transform 220ms ease-in-out", padding: 12, boxShadow: "-8px 0 24px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Controls</div>
                  <button onClick={() => setIsPanelOpen(false)} aria-label="Close controls" style={{ padding: "8px 10px", borderRadius: 8, background: "#FF7D00", color: "#fff", border: 0, fontWeight: 700 }}>Close</button>
                </div>
                {RightPanel}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}