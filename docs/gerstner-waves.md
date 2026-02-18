# Gerstner Waves, Foam & Wave Animation Fix

## What was built

Replaced the ocean's sinusoidal vertex shader with Gerstner (trochoidal) waves, and added whitecap and shoreline foam in the fragment shader.

### Gerstner waves

Gerstner waves displace vertices *horizontally* toward crests in addition to lifting them vertically, producing the characteristic peaked-crest / flat-trough shape of real ocean waves. Each wave component is:

```
D.x += Q * A * dir.x * cos(dot(dir, p) * k + ω * t + φ)
D.y += Q * A * dir.y * cos(dot(dir, p) * k + ω * t + φ)
D.z += A             * sin(dot(dir, p) * k + ω * t + φ)
```

Where `Q` is steepness (0 = sine wave, 1 = maximum Gerstner peaking), `A` is amplitude, `k` is wavenumber, `ω` is angular frequency, and `φ` is phase offset. Four waves are summed:

| Wave | Direction | Amplitude | k | ω | Q |
|------|-----------|-----------|---|---|---|
| Primary swell | (1.0, 0.3) | 5.0 | 0.008 | 1.2 | 0.60 |
| Cross-wave | (0.7, 0.7) | 3.0 | 0.012 | 1.8 | 0.50 |
| Ripple | (0.2, 1.0) | 2.0 | 0.020 | 2.5 | 0.35 |
| Chop | (-0.4, 0.9) | 1.5 | 0.035 | 3.0 | 0.20 |

Surface normals are computed analytically from partial derivatives (GPU Gems 1, ch. 1) rather than finite differences, giving accurate lighting across the wave surface.

### Foam

A `vFoamMask` varying is passed from vertex to fragment shader. It encodes the horizontal convergence factor at each vertex — highest at steep crests — and drives two foam effects:

- **Whitecap foam**: `smoothstep(0.45, 0.70, vFoamMask)` blends a creamy white over the water color at steep crests.
- **Shoreline foam**: A pulsing sine band appears within 8 world units of the waterline (`WATER_LEVEL = -40`), simulating lapping waves.

### Fragment shader enhancements

- **Fresnel effect**: glancing angles reflect sky; steep angles show water depth.
- **Depth color ramp**: deep navy at wave troughs (y ≈ −52) to teal at crests (y ≈ −28).
- **Specular sun glint**: Blinn-Phong highlight with 256 shininess exponent.
- **Normal perturbation**: two scrolling sine bands add small-scale ripple detail on top of the Gerstner normals.

---

## Root cause bug: `Date.now()` freezes GLSL waves

The wave shader was invisible for weeks due to a float32 precision failure.

**The bug:** The shader's `uTime` uniform was set each frame as:

```js
water.material.uniforms.uTime.value = Date.now() * 0.001;
```

`Date.now() * 0.001` is a Unix timestamp — approximately **1,708,000,000 seconds**. When uploaded to the GPU, that value is stored as GLSL `float` (32-bit). At ~1.7 × 10⁹, a float32 has a precision step (ULP) of **128**. So `sin(uTime * 2.0)` could only change by jumping 256 radians at a time — at wave speed 2.0 rad/s, it took **~128 real seconds** to advance one representable step. The ocean appeared completely flat.

**The fix:**

```js
// game.js — at module level
let waveElapsed = 0;

// inside animate()
waveElapsed += dt;
water.material.uniforms.uTime.value = waveElapsed;
```

`waveElapsed` starts at 0 and grows by ~0.016 per frame. At values below 10,000 seconds, float32 precision is well under 1 ms — `sin()` animates smoothly. The same variable is passed to `getWaveHeight()` for physics (boat bobbing, player swimming) so the visual and physics stay in sync.

**Key lesson:** Never pass `Date.now()` (or any Unix epoch value) directly to a GLSL `float` uniform used in trigonometric functions. Always track time as elapsed seconds from an application-local start point.
