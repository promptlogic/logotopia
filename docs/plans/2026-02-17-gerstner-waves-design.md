# Gerstner Waves + Foam — Design

**Date:** 2026-02-17
**Status:** Approved

## Goal

Replace the existing sinusoidal ocean waves with Gerstner (trochoidal) waves for sharper crests and flatter troughs, and add whitecap foam at steep crests plus shoreline foam where water meets land.

## Background

The current water shader uses 4 summed sine waves for vertex displacement and a finite-difference normal. Gerstner waves are the standard real-time upgrade: they displace vertices horizontally toward crests as well as vertically, producing the classic peaked-crest / flat-trough shape of real ocean waves. Foam is a pure fragment-shader addition with no new geometry or textures.

## Vertex Shader — Gerstner Displacement

For each wave component `i` with steepness `Q`, amplitude `A`, direction `dir`, wavenumber `k`, angular frequency `ω`, and phase `φ`:

```
D.x += Q * A * dir.x * cos(dot(dir, xz) * k + ω * t + φ)
D.z += Q * A * dir.z * cos(dot(dir, xz) * k + ω * t + φ)
D.y += A             * sin(dot(dir, xz) * k + ω * t + φ)
```

Analytic surface normal (partial derivatives, no finite-difference eps):

```
N.x = -sum(dir.x * k * A * cos(...))
N.z = -sum(dir.z * k * A * cos(...))
N.y =  1 - sum(Q * k * A * sin(...))
```

Varyings passed to fragment shader:
- `vWorldPos` — world-space displaced position (already exists)
- `vWorldNormal` — analytic normal (already exists, now computed analytically)
- `vFoamMask` — sum of `Q * k * A * cos(...)` per component, indicating horizontal convergence / steepness at the vertex

## Fragment Shader — Whitecaps + Shoreline Foam

Two additive foam layers on top of the existing Fresnel + depth color + specular:

**Whitecap foam** (activates at steep crests):
```glsl
float whitecap = smoothstep(0.55, 0.75, vFoamMask);
color = mix(color, vec3(1.0, 0.98, 0.95), whitecap * 0.85);
```

**Shoreline foam** (lapping band at waterline):
```glsl
float shoreDepth = clamp((vWorldPos.y - (-40.0)) / 8.0, 0.0, 1.0); // 0 at -40, 1 at -32
float shorePulse = sin(vWorldPos.x * 0.05 + vWorldPos.z * 0.03 - uTime * 2.5) * 0.5 + 0.5;
float shoreFoam  = (1.0 - shoreDepth) * shorePulse * 0.7;
color = mix(color, vec3(1.0, 1.0, 1.0), shoreFoam);
```

## Wave Parameters — Bigger Amplitudes

| # | Direction | Amplitude | k (freq) | ω (speed) | Q (steepness) | Phase |
|---|-----------|-----------|----------|-----------|---------------|-------|
| 0 | (1.0, 0.3) | 5.0 | 0.008 | 1.2 | 0.60 | 0.0 |
| 1 | (0.7, 0.7) | 3.0 | 0.012 | 1.8 | 0.50 | 2.0 |
| 2 | (0.2, 1.0) | 2.0 | 0.020 | 2.5 | 0.35 | 4.5 |
| 3 | (-0.4, 0.9)| 1.5 | 0.035 | 3.0 | 0.20 | 1.3 |

Peak vertical displacement ≈ ±11.5 units (up from ≈±8).

## JS Physics — `getWaveHeight()` Update

Gerstner vertical displacement is still `A * sin(...)` — same as current sine waves. Update amplitudes and parameter names to match the new values. Horizontal Gerstner displacement does not affect the height sampling used for buoyancy/collision, so boat bobbing and player swimming remain correct.

```js
const waves = [
  { dirX: 1.0, dirY: 0.3,  amp: 5.0, freq: 0.008, speed: 1.2, phase: 0   },
  { dirX: 0.7, dirY: 0.7,  amp: 3.0, freq: 0.012, speed: 1.8, phase: 2.0 },
  { dirX: 0.2, dirY: 1.0,  amp: 2.0, freq: 0.020, speed: 2.5, phase: 4.5 },
  { dirX:-0.4, dirY: 0.9,  amp: 1.5, freq: 0.035, speed: 3.0, phase: 1.3 },
];
```

## Files Changed

- `game.js` — water shader (vertex + fragment), `waves` array, `getWaveHeight()`

## Out of Scope

- FFT/Tessendorf ocean
- Additional water bodies (rivers, waterfalls)
- Underwater caustics
