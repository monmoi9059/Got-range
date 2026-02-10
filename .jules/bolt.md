## 2024-03-08 - [Optimized Render Loop]
**Learning:** Precomputing unit circle values in `js/renderer.js` for `drawFuzzyCircle` (16 segments) reduced rendering time by ~73% in a micro-benchmark, as `Math.cos` and `Math.sin` are expensive inside hot loops.
**Action:** Always look for static trigonometric calculations in frame-by-frame loops and cache them in typed arrays.
