        }
        else if (options.bodyShape === 'penguin') {
             // Tear drop
             const topW = w * 0.5;
             const botW = w * 1.5;
             points = [
                 {x: cx - topW/2, y: shoulderY},
                 {x: cx + topW/2, y: shoulderY},
                 {x: cx + botW/2, y: hipY - h*0.2},
                 {x: cx, y: hipY + h*0.1}, // Pointy tail/bottom
                 {x: cx - botW/2, y: hipY - h*0.2}
             ];
        }
        else {
            // Default Humanoid (Hourglass/Trapezoid)
            points = [
                {x: cx - sW/2, y: shoulderY},     // 0: Top Left
                {x: cx + sW/2, y: shoulderY},     // 1: Top Right
                {x: cx + wW/2, y: waistY},        // 2: Waist Right
                {x: cx + hW/2, y: hipY},          // 3: Hip Right
                {x: cx - hW/2, y: hipY},          // 4: Hip Left
                {x: cx - wW/2, y: waistY}         // 5: Waist Left
            ];

            if (isFurry && roundness > 0) {
                 const rOffset = w * roundness;
                 const midR1 = { x: cx + wW/2 + rOffset, y: (shoulderY + waistY)/2 };
                 const midR2 = { x: cx + hW/2 + rOffset*0.5, y: (waistY + hipY)/2 };
                 const midL1 = { x: cx - hW/2 - rOffset*0.5, y: (waistY + hipY)/2 };
                 const midL2 = { x: cx - wW/2 - rOffset, y: (shoulderY + waistY)/2 };
                 points = [ points[0], points[1], midR1, points[2], midR2, points[3], points[4], midL1, points[5], midL2 ];
            }
        }

        if (isFurry) {
            // Draw base fuzzy shape
            drawFuzzyPath(points, color, scale, true, seed);

            // Apply 3D Volume Gradient (Universal)
            // Use clipping on the polygon
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i=1; i<points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.clip();

            // Cylindrical Shading (Horizontal gradient)
            const grad = ctx.createLinearGradient(cx - w/2, topY, cx + w/2, topY);
            grad.addColorStop(0, 'rgba(0,0,0,0.5)'); // Dark side
            grad.addColorStop(0.2, 'rgba(0,0,0,0.1)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.1)'); // Highlight center (spine)
            grad.addColorStop(0.8, 'rgba(0,0,0,0.1)');
            grad.addColorStop(1, 'rgba(0,0,0,0.5)'); // Dark side
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.beginPath();

            // Generic Polygon Path for Custom Shapes (Animals)
            if (options.bodyShape && options.bodyShape !== 'human') {
                ctx.moveTo(points[0].x, points[0].y);
                for(let i=1; i<points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            } else {
                // Humanoid Bezier Logic (Hourglass/Trapezoid specific)
                ctx.moveTo(points[0].x + 10*scale, points[0].y);
                ctx.lineTo(points[1].x - 10*scale, points[1].y);
                ctx.quadraticCurveTo(points[1].x, points[1].y, points[1].x, points[1].y + 10*scale);

                // Right
                if (roundness > 0) {
                    const rOffset = w * roundness;
                    ctx.quadraticCurveTo(cx + wW/2 + rOffset, (shoulderY + waistY)/2, points[2].x, points[2].y);
                    ctx.quadraticCurveTo(cx + hW/2 + rOffset*0.5, (waistY + hipY)/2, points[3].x, points[3].y - 10*scale);
                } else {
                    ctx.lineTo(points[2].x, points[2].y);
                    ctx.lineTo(points[3].x, points[3].y - 10*scale);
                }
                ctx.quadraticCurveTo(points[3].x, points[3].y, points[3].x - 10*scale, points[3].y);
                ctx.lineTo(points[4].x + 10*scale, points[4].y);
                ctx.quadraticCurveTo(points[4].x, points[4].y, points[4].x, points[4].y - 10*scale);

                // Left
                if (roundness > 0) {
                    const rOffset = w * roundness;
                    ctx.quadraticCurveTo(cx - hW/2 - rOffset*0.5, (waistY + hipY)/2, points[5].x, points[5].y);
                    ctx.quadraticCurveTo(cx - wW/2 - rOffset, (shoulderY + waistY)/2, points[0].x, points[0].y + 10*scale);
                } else {
                    ctx.lineTo(points[5].x, points[5].y);
                    ctx.lineTo(points[0].x, points[0].y + 10*scale);
                }
                ctx.quadraticCurveTo(points[0].x, points[0].y, points[0].x + 10*scale, points[0].y);
            }

            ctx.closePath();

            let fillStyle = color;
            if (options.isJersey) {
                 const meshKey = `mesh_${color}`;
                 fillStyle = getCachedPattern(meshKey, (c, size) => {
                      c.fillStyle = color;
                      c.fillRect(0,0,size,size);
                      c.fillStyle = 'rgba(0,0,0,0.15)';
                      const spacing = 4;
                      for(let y=0; y<size; y+=spacing) {
                          for(let x=0; x<size; x+=spacing) {
                              if ((Math.floor(x/spacing) + Math.floor(y/spacing)) % 2 === 0) c.fillRect(x,y,1,1);
                          }
                      }
                      // Gradient overlay
                      const grad = c.createLinearGradient(0,0,size,0);
                      grad.addColorStop(0, 'rgba(0,0,0,0.2)');
                      grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
                      grad.addColorStop(1, 'rgba(0,0,0,0.2)');
                      c.fillStyle = grad;
                      c.fillRect(0,0,size,size);
                 });

                 // Apply pattern transform
                 if (fillStyle.setTransform && typeof DOMMatrix !== 'undefined') {
                     const matrix = new DOMMatrix();
                     matrix.translateSelf(cx, topY);
                     fillStyle.setTransform(matrix);
                }
            } else {
                 const cacheKey = `anatomic_body_${color}`;
                 fillStyle = getCachedPattern(cacheKey, (gradCtx, size) => {
                    gradCtx.fillStyle = color;
                    gradCtx.fillRect(0, 0, size, size);
                    const grad = gradCtx.createRadialGradient(size/2, size/2, 5, size/2, size/2, size/2);
                    grad.addColorStop(0, 'rgba(255,255,255,0.1)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                    gradCtx.fillStyle = grad;
                    gradCtx.fillRect(0, 0, size, size);
                });
            }

            ctx.fillStyle = fillStyle;
            ctx.fill();

            if (options.pattern === 'spartan_tattoo') {
                ctx.save();
                ctx.clip(); // Clip to body shape

                ctx.strokeStyle = '#8B0000'; // Blood Red
