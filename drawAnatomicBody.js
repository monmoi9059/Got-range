    function drawAnatomicBody(cx, topY, w, h, scale, color, isFurry, seed = 1, options = {}, anchors = null) {
        const waistScale = options.waistScale || 0.85;
        const roundness = options.roundness || 0;

        // Hourglass / Tapered shape
        const sW = w * 1.1;
        const hW = w * 1.0; // Hips
        const wW = w * waistScale; // Waist

        const shoulderY = topY;
        const waistY = topY + h * 0.55;
        const hipY = topY + h;

        let points = [];

        if (anchors && anchors.shoulders && anchors.hips) {
            const sl = anchors.shoulders.left;
            const sr = anchors.shoulders.right;
            const hl = anchors.hips.left;
            const hr = anchors.hips.right;

            if (options.bodyShape === 'bear_new') {
                 const bellyY = topY + h * 0.55;
                 const hipY_adj = hr.y - h*0.05;
                 const bellyW = w * 1.45;

                 points = [];
                 points.push(sl);
                 points.push(sr);
                 // Right Curve
                 points.push({x: sr.x + (bellyW/2 - (sr.x-cx))*0.25, y: sr.y + (bellyY - sr.y)*0.3});
                 points.push({x: cx + bellyW/2, y: bellyY});
                 points.push({x: hr.x + (bellyW/2 - (hr.x-cx))*0.2, y: hr.y - (hr.y - bellyY)*0.5});
                 points.push({x: hr.x, y: hipY_adj});
                 // Bottom Round
                 points.push({x: cx + (hr.x-cx)*0.5, y: hr.y});
                 points.push({x: cx + (hl.x-cx)*0.5, y: hl.y});
                 points.push({x: hl.x, y: hipY_adj});
                 // Left Curve
                 points.push({x: hl.x - (Math.abs(hl.x-cx) - bellyW/2)*0.2, y: hl.y - (hl.y - bellyY)*0.5});
                 points.push({x: cx - bellyW/2, y: bellyY});
                 points.push({x: sl.x - (Math.abs(sl.x-cx) - bellyW/2)*0.25, y: sl.y + (bellyY - sl.y)*0.3});
            } else if (options.bodyShape === 'round') {
                 const bellyW = w * 1.9;
                 const bellyY = topY + h * 0.7;
                 points = [
                     sl, sr,
                     {x: cx + w*0.8, y: topY + h*0.3},
                     {x: cx + bellyW/2, y: bellyY},
                     hr, hl,
                     {x: cx - bellyW/2, y: bellyY},
                     {x: cx - w*0.8, y: topY + h*0.3}
                 ];
            } else if (options.bodyShape === 'giraffe') {
                 // Giraffe: Sloping shoulders
                 points = [
                     {x: sl.x, y: sl.y + h*0.1}, // Sloped down
                     {x: cx, y: sl.y}, // Neck connect point
                     {x: sr.x, y: sr.y + h*0.1}, // Sloped down
                     hr, hl
                 ];
            } else if (options.bodyShape === 'heavy') {
                 // Elephant: Wide belly
                 const bellyW = w * 1.4;
                 points = [
                     sl, sr,
                     {x: cx + bellyW/2, y: topY + h*0.5},
                     hr, hl,
                     {x: cx - bellyW/2, y: topY + h*0.5}
                 ];
            } else if (options.bodyShape === 'penguin') {
                 // Tear drop
                 const botW = w * 1.5;
                 points = [
                     sl, sr,
                     {x: cx + botW/2, y: hl.y - h*0.2},
                     {x: cx, y: hl.y + h*0.1}, // Pointy tail/bottom
                     {x: cx - botW/2, y: hl.y - h*0.2}
                 ];
            } else {
                 // Default / Athletic / Oval
                 const midY = (sl.y + hl.y) / 2;
                 let midWScale = 1.0;
                 if (options.bodyShape === 'oval') midWScale = 1.2;
                 else if (options.bodyShape === 'athletic_animal') midWScale = 0.9;
                 const midR = { x: cx + (w*midWScale)/2, y: midY };
                 const midL = { x: cx - (w*midWScale)/2, y: midY };
                 points = [sl, sr, midR, hr, hl, midL];
            }
        }
        else if (options.bodyShape === 'bear_new') {
             // "Big Tall Oval" - Human-like but fat
             const shoulderW = w * 1.1; // Wide square shoulders
             const bellyW = w * 1.45; // Fat belly
             const hipW = w * 1.25; // Rounded bottom
             const bellyY = topY + h * 0.55;
             const hipY_adj = hipY - h*0.05; // Slightly up to round bottom

             // Dense Points for Smoothness (Fuzzy & Poly fallback)
             points = [];
             // Top (Flat)
             points.push({x: cx - shoulderW/2, y: shoulderY});
             points.push({x: cx + shoulderW/2, y: shoulderY});

             // Right Curve (Shoulder -> Belly -> Hip)
             points.push({x: cx + shoulderW/2 + (bellyW - shoulderW)*0.25, y: shoulderY + (bellyY - shoulderY)*0.3});
             points.push({x: cx + shoulderW/2 + (bellyW - shoulderW)*0.7, y: shoulderY + (bellyY - shoulderY)*0.7});
             points.push({x: cx + bellyW/2, y: bellyY}); // Apex
             points.push({x: cx + bellyW/2 - (bellyW - hipW)*0.2, y: bellyY + (hipY_adj - bellyY)*0.5});
             points.push({x: cx + hipW/2, y: hipY_adj});

             // Bottom Round
             points.push({x: cx + hipW/4, y: hipY});
             points.push({x: cx - hipW/4, y: hipY});
             points.push({x: cx - hipW/2, y: hipY_adj});

             // Left Curve (Hip -> Belly -> Shoulder)
             points.push({x: cx - bellyW/2 + (bellyW - hipW)*0.2, y: bellyY + (hipY_adj - bellyY)*0.5});
             points.push({x: cx - bellyW/2, y: bellyY}); // Apex
             points.push({x: cx - shoulderW/2 - (bellyW - shoulderW)*0.7, y: shoulderY + (bellyY - shoulderY)*0.7});
             points.push({x: cx - shoulderW/2 - (bellyW - shoulderW)*0.25, y: shoulderY + (bellyY - shoulderY)*0.3});
        }
        else if (options.bodyShape === 'round') {
             // Pig/Cow Shape: Narrow shoulders, wide belly/hips (Pear / Triangle)
             const shoulderW = w * 0.6;
             const bellyW = w * 1.9;
             const hipW = w * 1.8;
             const bellyY = topY + h * 0.7;

             points = [
                 {x: cx - shoulderW/2, y: shoulderY}, // Top Left
                 {x: cx + shoulderW/2, y: shoulderY}, // Top Right
                 // Right Side (Sloping down to belly)
                 {x: cx + w*0.8, y: topY + h*0.3}, // Chest tuck
                 {x: cx + bellyW/2, y: bellyY},
                 {x: cx + hipW/2, y: hipY},
                 // Bottom
                 {x: cx - hipW/2, y: hipY},
                 // Left Side
                 {x: cx - bellyW/2, y: bellyY},
                 {x: cx - w*0.8, y: topY + h*0.3} // Chest tuck
             ];
        }
        else if (options.bodyShape === 'oval') {
             // Small Animal (Rat, Cat, etc.) - Simple Ovalish body
             const shoulderW = w * 0.9;
             const midW = w * 1.2;
             const hipW = w * 1.0;
             const midY = topY + h * 0.5;

             points = [
                 {x: cx - shoulderW/2, y: shoulderY},
                 {x: cx + shoulderW/2, y: shoulderY},
                 {x: cx + midW/2, y: midY},
                 {x: cx + hipW/2, y: hipY},
                 {x: cx - hipW/2, y: hipY},
                 {x: cx - midW/2, y: midY}
             ];
        }
        else if (options.bodyShape === 'athletic_animal') {
             // Dog, Wolf, Lion - V-Shape but softer than human
             points = [
                {x: cx - w*0.6, y: shoulderY},
                {x: cx + w*0.6, y: shoulderY},
                {x: cx + w*0.5, y: waistY},
                {x: cx + w*0.55, y: hipY},
                {x: cx - w*0.55, y: hipY},
                {x: cx - w*0.5, y: waistY}
            ];
        }
        else if (options.bodyShape === 'giraffe') {
             // Sloping shoulders, narrow chest
             const shoulderW = w * 0.8;
             const hipW = w * 0.9;
             points = [
                 {x: cx - shoulderW/2, y: shoulderY + h*0.1}, // Sloped down
                 {x: cx, y: shoulderY}, // Neck connect point (virtual)
                 {x: cx + shoulderW/2, y: shoulderY + h*0.1}, // Sloped down
                 {x: cx + hipW/2, y: hipY},
                 {x: cx - hipW/2, y: hipY}
             ];
        }
        else if (options.bodyShape === 'heavy') {
             // Elephant/Hippo - Boxy and wide
             const shoulderW = w * 1.3;
             const bellyW = w * 1.4;
             const hipW = w * 1.3;
             points = [
                 {x: cx - shoulderW/2, y: shoulderY},
                 {x: cx + shoulderW/2, y: shoulderY},
                 {x: cx + bellyW/2, y: topY + h*0.5},
                 {x: cx + hipW/2, y: hipY},
                 {x: cx - hipW/2, y: hipY},
                 {x: cx - bellyW/2, y: topY + h*0.5}
             ];
