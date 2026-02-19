## 2024-10-27 - Accessibility for Custom UI Controls
**Learning:** Custom range sliders (using standard `<input type="range">`) often lack context for screen readers when they control abstract values (like "0, 1, 2, 3") that map to specific game states (like "Early", "Perfect", "Late"). Standard `aria-label` provides the "what", but `aria-valuetext` is essential for the "which".
**Action:** When implementing custom settings sliders that map to non-numeric states, always implement `aria-valuetext` dynamic updates alongside the visual label updates to ensure inclusivity.
