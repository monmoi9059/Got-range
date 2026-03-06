# Test Cases for `getBounds(points)`

The `getBounds` function calculates the bounding box of a set of points.

## Scenarios

1. **Empty Array**
   - **Input:** `[]`
   - **Expected Output:** `{minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity}`
   - **Rationale:** Verifies initial values when no points are provided.

2. **Single Point**
   - **Input:** `[{x: 10, y: 20}]`
   - **Expected Output:** `{minX: 10, minY: 20, maxX: 10, maxY: 20}`
   - **Rationale:** The bounding box of a single point is the point itself.

3. **Multiple Points (Positive Coordinates)**
   - **Input:** `[{x: 0, y: 0}, {x: 10, y: 10}, {x: 5, y: 5}]`
   - **Expected Output:** `{minX: 0, minY: 0, maxX: 10, maxY: 10}`
   - **Rationale:** Standard happy path.

4. **Multiple Points (Mixed Positive and Negative Coordinates)**
   - **Input:** `[{x: -5, y: 20}, {x: 15, y: -10}, {x: 0, y: 5}]`
   - **Expected Output:** `{minX: -5, minY: -10, maxX: 15, maxY: 20}`
   - **Rationale:** Ensures the function correctly handles negative values.

5. **Duplicate Points**
   - **Input:** `[{x: 5, y: 5}, {x: 5, y: 5}]`
   - **Expected Output:** `{minX: 5, minY: 5, maxX: 5, maxY: 5}`
   - **Rationale:** Redundant points should not affect the result.

6. **Horizontal Line**
   - **Input:** `[{x: 0, y: 5}, {x: 10, y: 5}]`
   - **Expected Output:** `{minX: 0, minY: 5, maxX: 10, maxY: 5}`
   - **Rationale:** Minimum and maximum Y should be equal.

7. **Vertical Line**
   - **Input:** `[{x: 5, y: 0}, {x: 5, y: 10}]`
   - **Expected Output:** `{minX: 5, minY: 0, maxX: 5, maxY: 10}`
   - **Rationale:** Minimum and maximum X should be equal.
