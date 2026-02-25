    var BallRenderer = {
    _projResult: {x:0, y:0, z:0},

    projectIso: function(p, r, cosR, sinR) {
        var ry = p.y * cosR - p.z * sinR;
        var rz = p.y * sinR + p.z * cosR;
        this._projResult.x = p.x * r;
        this._projResult.y = ry * r;
        this._projResult.z = rz;
    },

        draw: function(ctx, x, y, scale, rotation, ball, phys) {
            // phys: {x, y, z, rotationX, rotationY, rotationZ}
            if (phys && playerData.graphics === 'HIGH') {
                this.draw3D(ctx, ball, phys);
                return;
            }

            var radius = 25 * scale;
            if (radius < 1) return; // Cull if too small

            ctx.save();
            ctx.translate(x, y);

            // Clip to sphere
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.clip();

            this.drawBackground(ctx, radius, ball);
            this.drawPattern(ctx, radius, rotation, ball);
            this.drawLighting(ctx, radius, ball);

            // Border
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
            ctx.lineWidth = 1 * scale;
            if(ctx.lineWidth < 1) ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();

            ctx.restore();
        },

        rotatePoint: function(p, rx, ry, rz) {
            var x = p.x, y = p.y, z = p.z;
            // X Rotation
            var cx = Math.cos(rx), sx = Math.sin(rx);
            var ty = y*cx - z*sx; var tz = y*sx + z*cx; y=ty; z=tz;
            // Y Rotation
            var cy = Math.cos(ry), sy = Math.sin(ry);
            var tx = x*cy + z*sy; tz = -x*sy + z*cy; x=tx; z=tz;
            // Z Rotation
            var cz = Math.cos(rz), sz = Math.sin(rz);
            tx = x*cz - y*sz; ty = x*sz + y*cz; x=tx; y=ty;
            return {x:x, y:y, z:z};
        },

        draw3D: function(ctx, ball, phys) {
            // 1. Draw Mesh Base
            var verts = Geometry.sphere.vertices;
            var faces = Geometry.sphere.faces;
            var tVerts = [];

            // Transform Vertices
            var radius = 8; // Match legacy visual size (roughly)
            for(var i=0; i<verts.length; i++) {
                var r = this.rotatePoint(verts[i], phys.rotationX, phys.rotationY, phys.rotationZ);
                var wx = phys.x + r.x * radius;
                var wy = phys.y + r.y * radius;
                var wz = phys.z + r.z * radius;
                var proj = project(wx, wy, wz, g_camCache);
                tVerts.push({x: proj?proj.x:0, y: proj?proj.y:0, z: proj?proj.depth:0, valid: !!proj, normal: r});
            }

            // Prepare Faces
            var drawFaces = [];
            var camX = g_camCache.x; var camY = g_camCache.y; var camZ = 0; // Approx
            // Actually view vector is (phys.x - camX, ...).
            // Simplified Backface Culling: Dot product of Normal and Camera Vector
            // Camera Vector in World Space: (camX - phys.x, camY - phys.y, -phys.z) roughly?
            // Actually, we rotated the normal.
            // Let's use screen space culling (winding order)

            for(var i=0; i<faces.length; i++) {
                var f = faces[i];
                var v0 = tVerts[f[0]], v1 = tVerts[f[1]], v2 = tVerts[f[2]];
                if(!v0.valid || !v1.valid || !v2.valid) continue;

                // Screen Space Winding (Cross Product)
                var cp = (v1.x - v0.x)*(v2.y - v0.y) - (v1.y - v0.y)*(v2.x - v0.x);
                if (cp > 0) continue; // Cull (Assume standard CCW or CW, check sign)
                // With standard coordinates, positive might be back facing or front depending on axis.
                // Let's test. Usually < 0 is front for canvas Y-down.

                // Lighting (Gouraud approximation on centroid)
                // Light Source: Sun at (700, 80, 200)?
                // Directional Light
                var nx = (v0.normal.x + v1.normal.x + v2.normal.x) / 3;
                var ny = (v0.normal.y + v1.normal.y + v2.normal.y) / 3;
                var nz = (v0.normal.z + v1.normal.z + v2.normal.z) / 3;
                // Normalize
                var nl = Math.sqrt(nx*nx + ny*ny + nz*nz); nx/=nl; ny/=nl; nz/=nl;

                // Light Dir (Top-Left-Front)
                var lx = 0.5, ly = -0.5, lz = 0.7; // Normalized approx
                var dot = nx*lx + ny*ly + nz*lz;
                var light = 0.5 + Math.max(0, dot) * 0.5;

                drawFaces.push({f:f, z: v0.z + v1.z + v2.z, light: light});
            }
            drawFaces.sort(function(a,b){ return b.z - a.z; });

            // Draw Base Mesh
            var type = ball.type || 'basketball';
            var baseColor = ball.color1;
            if (type === 'soccer' || type === 'baseball' || type === 'golf') baseColor = ball.color1;
            else if (type === 'earth') baseColor = '#0000FF';
            else if (type === 'watermelon') baseColor = '#155e15'; // Dark stripes base?
            else if (type === 'beach') baseColor = '#FFF'; // Base white?

            // Helper to darken color
            var shadeColor = function(color, percent) {
                var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
                return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
            };

            for(var i=0; i<drawFaces.length; i++) {
                var df = drawFaces[i];
                var f = df.f;
                var v0 = tVerts[f[0]], v1 = tVerts[f[1]], v2 = tVerts[f[2]];

                ctx.fillStyle = baseColor;
                // Apply lighting
                // Since baseColor might be name or complex, simple opacity overlay?
                // Or shading function if hex.
                if (baseColor.startsWith('#')) {
                    // Simple shading
                    ctx.fillStyle = shadeColor(baseColor, (df.light - 1.0) * 0.5); // Darken
                } else {
                    // Gradient or special color, skip shading or use overlay
                }

                if (type === 'basketball' && ball.color2) {
                    // Basketball has gradient look.
                    // Simulate with lighting?
                    // Just use shaded color1.
                }

                ctx.beginPath();
                ctx.moveTo(v0.x, v0.y);
                ctx.lineTo(v1.x, v1.y);
                ctx.lineTo(v2.x, v2.y);
                ctx.closePath();
                ctx.fill();
                // Fix seams
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 2. Draw Patterns (3D)
            this.drawPattern3D(ctx, ball, phys);
        },

        drawPattern3D: function(ctx, ball, phys) {
            var type = ball.type || 'basketball';
            var self = this;
            var radius = 8; // Match draw3D radius

            var projectPoint = function(p) {
                var r = self.rotatePoint(p, phys.rotationX, phys.rotationY, phys.rotationZ);
                // Visibility Check (Front Facing)
                // Dot product of rotated normal (which is just r for unit sphere) and View Vector.

                var wx = phys.x + r.x * radius;
                var wy = phys.y + r.y * radius;
                var wz = phys.z + r.z * radius;

                // DistSq to Camera
                // camX/Y from g_camCache. camZ = cameraHeight.
                // This is heavy.
                // Alternative: Rotated vector `r`.
                // View Vector is (phys.x - camX, phys.y - camY, phys.z - camZ).
                // Normalize.
                // Dot(r, ViewVec) < 0 means facing camera (if ViewVec points FROM eye TO obj).
                // Or > 0 if TO eye.

                var vx = g_camCache.x - phys.x;
                var vy = g_camCache.y - phys.y;
                var vz = g_camCache.cameraHeight - phys.z;

                if ((r.x*vx + r.y*vy + r.z*vz) <= 0) return null; // Backface

                return project(wx, wy, wz, g_camCache);
            };

            if (type === 'basketball') {
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                // Scale line width by average depth scale
                // Estimate scale from center
                var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                var s = centerProj ? centerProj.scale : 1;
                ctx.lineWidth = 2 * s * 1.5; // Adjusted thickness

                ctx.beginPath();
                var first = true;
                for(var i=0; i<Geometry.basketball.length; i++) {
                     if (i % 33 === 0) { ctx.stroke(); ctx.beginPath(); first=true; }
                     var proj = projectPoint(Geometry.basketball[i]);
                     if (proj) {
                         if (first) { ctx.moveTo(proj.x, proj.y); first=false; }
                         else ctx.lineTo(proj.x, proj.y);
                     } else {
                         first = true;
                     }
                }
                ctx.stroke();
            }
            else if (type === 'soccer') {
                ctx.fillStyle = ball.color2; // Black pentagons
                for(var i=0; i<Geometry.soccer.length; i++) {
                    var face = Geometry.soccer[i];
                    var projPoints = [];
                    var valid = true;
                    for(var j=0; j<face.length; j++) {
                        var p = projectPoint(face[j]);
                        if(!p) { valid = false; break; }
                        projPoints.push(p);
                    }
                    if (valid) {
                        ctx.beginPath();
                        ctx.moveTo(projPoints[0].x, projPoints[0].y);
                        for(var k=1; k<5; k++) ctx.lineTo(projPoints[k].x, projPoints[k].y);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
            else if (type === 'bille8') {
                var proj = projectPoint({x:0, y:0, z:1});
                if (proj) {
                    var s = proj.scale;
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.arc(proj.x, proj.y, 25 * s * 0.45, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold ' + (25 * s * 0.6) + 'px Arial';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('8', proj.x, proj.y);
                }
            }
            else if (type === 'bowling') {
                 var holes = [{x:0.2, y:0.2, z:0.9}, {x:-0.2, y:0.2, z:0.9}, {x:0, y:-0.15, z:0.95}];
                 ctx.fillStyle = '#111';
                 holes.forEach(function(h) {
                     var proj = projectPoint(h);
                     if (proj) {
                         ctx.beginPath(); ctx.arc(proj.x, proj.y, 25 * proj.scale * 0.12, 0, Math.PI*2); ctx.fill();
                     }
                 });
            }
            else if (type === 'eyeball') {
                var proj = projectPoint({x:0, y:0, z:1});
                if (proj) {
                    var s = proj.scale;
                    ctx.fillStyle = ball.color2;
                    ctx.beginPath(); ctx.arc(proj.x, proj.y, 25 * s * 0.5, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(proj.x, proj.y, 25 * s * 0.25, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.beginPath(); ctx.arc(proj.x - 25*s*0.15, proj.y - 25*s*0.15, 25 * s * 0.12, 0, Math.PI*2); ctx.fill();
                }
            }
            else if (type === 'donut') {
                 var icingCenter = projectPoint({x:0, y:-0.9, z:0});
                 if (icingCenter) {
                     var s = icingCenter.scale;
                     ctx.fillStyle = ball.color1;
                     ctx.beginPath(); ctx.arc(icingCenter.x, icingCenter.y, 25 * s * 0.85, 0, Math.PI*2); ctx.fill();

                     var sprinkleColors = ['#FFF', '#FF0', '#0FF'];
                     for(var i=0; i<8; i++) {
                         var ang = (i/8)*Math.PI*2;
                         var r = 0.5;
                         var sx = Math.cos(ang)*r; var sy = -0.9 + Math.sin(ang)*r*0.2; var sz = Math.sin(ang)*r;
                         var p = projectPoint({x:sx, y:sy, z:sz});
                         if(p) {
                             ctx.fillStyle = sprinkleColors[i%3];
                             ctx.fillRect(p.x, p.y, 4*p.scale, 2*p.scale);
                         }
                     }
                 }
                 var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                 if(centerProj) {
                     ctx.fillStyle = '#222';
                     ctx.beginPath(); ctx.arc(centerProj.x, centerProj.y, 25*centerProj.scale*0.25, 0, Math.PI*2); ctx.fill();
                 }
            }
            else if (type === 'watermelon') {
                 ctx.strokeStyle = '#155e15';
                 var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                 var s = centerProj ? centerProj.scale : 1;
                 ctx.lineWidth = 4 * s;
                 for(var sIdx=0; sIdx<Geometry.watermelon.length; sIdx++) {
                     ctx.beginPath();
                     var first = true;
                     var line = Geometry.watermelon[sIdx];
                     for(var i=0; i<line.length; i++) {
                         var proj = projectPoint(line[i]);
                         if(proj) {
                             if(first) { ctx.moveTo(proj.x, proj.y); first=false; }
                             else ctx.lineTo(proj.x, proj.y);
                         } else first = true;
                     }
                     ctx.stroke();
                 }
            }
            else if (type === 'camo') {
                ctx.fillStyle = ball.color2;
                var patches = [1,2,3,4];
                patches.forEach(function(i) {
                    var p = {x: Math.sin(i), y: Math.cos(i*2), z: Math.sin(i*3)};
                    var l = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z); p.x/=l; p.y/=l; p.z/=l;
                    var proj = projectPoint(p);
                    if (proj) {
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, 25 * proj.scale * 0.4, 0, Math.PI*2);
                        ctx.fill();
                    }
                });
            }
            else if (type === 'earth') {
                 ctx.fillStyle = '#228B22'; // Land
                 var continents = [0, 2, 4];
                 continents.forEach(function(i) {
                    var p = {x: Math.cos(i), y: Math.sin(i), z: Math.cos(i*1.5)};
                    var l = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z); p.x/=l; p.y/=l; p.z/=l;
                    var proj = projectPoint(p);
                     if (proj) {
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, 25 * proj.scale * 0.5, 0, Math.PI*2);
                        ctx.fill();
                    }
                 });
            }
            else if (type === 'baseball' || type === 'tennis') {
                ctx.strokeStyle = (type === 'baseball') ? '#FF0000' : '#FFF';
                var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                var s = centerProj ? centerProj.scale : 1;
                ctx.lineWidth = 3 * s;
                if (type === 'baseball') ctx.setLineDash([4*s, 3*s]);

                ctx.beginPath();
                var first = true;
                for(var i=0; i<Geometry.seam.length; i++) {
                    var proj = projectPoint(Geometry.seam[i]);
                    if (proj) {
                        if (first) { ctx.moveTo(proj.x, proj.y); first=false; }
                        else ctx.lineTo(proj.x, proj.y);
                    } else {
                        first = true;
                    }
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
            else if (type === 'beach') {
                var colors = ['#FFFF00', '#0000FF', '#FF0000', '#FFFF00', '#0000FF', '#FF0000'];
                var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                var s = centerProj ? centerProj.scale : 1;

                for(var k=0; k<6; k++) {
                     ctx.fillStyle = colors[k];
                     // Beach ball segments are essentially slices.
                     // Geometry.beach contains lines. We want to FILL them for 3D look.
                     // But we have a mesh.
                     // The mesh is white.
                     // We can draw filled polygons for segments.
                     // Or just thick lines for now to match 2D style.
                     // Let's stick to lines but thick.
                     ctx.strokeStyle = colors[k];
                     ctx.lineWidth = 25 * s * 0.5; // Very thick to simulate color
                     ctx.lineCap = 'round';

                     ctx.beginPath();
                     var line = Geometry.beach[k];
                     var first = true;
                     for(var i=0; i<line.length; i++) {
                         var proj = projectPoint(line[i]);
                         if (proj) {
                             if(first) { ctx.moveTo(proj.x, proj.y); first=false; }
                             else ctx.lineTo(proj.x, proj.y);
                         } else first = true;
                     }
                     ctx.stroke();
                }
                // White Cap
                var capProj = projectPoint({x:0, y:-0.9, z:0});
                if(capProj) {
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.arc(capProj.x, capProj.y, 25*s*0.2, 0, Math.PI*2); ctx.fill();
                }
            }
            // Other types (golf, simple ones) will just rely on the mesh shading for now or simple points
            else if (type === 'golf') {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                var centerProj = project(phys.x, phys.y, phys.z, g_camCache);
                var s = centerProj ? centerProj.scale : 1;
                for(var i=0; i<Geometry.dimples.length; i++) {
                    var proj = projectPoint(Geometry.dimples[i]);
                    if (proj) {
                        ctx.beginPath(); ctx.arc(proj.x, proj.y, 25 * s * 0.06, 0, Math.PI*2); ctx.fill();
                    }
                }
            }
        },

        drawBackground: function(ctx, r, ball) {
            var type = ball.type || 'basketball';

            if (type === 'soccer' || type === 'baseball' || type === 'golf') ctx.fillStyle = ball.color1;
            else if (type === 'tennis') ctx.fillStyle = ball.color1;
            else if (type === 'eyeball') ctx.fillStyle = '#EEE';
            else if (type === 'bille8') ctx.fillStyle = '#000';
            else if (type === 'donut') ctx.fillStyle = '#D2691E';
            else if (type === 'watermelon') ctx.fillStyle = '#228B22';
            else if (type === 'earth') ctx.fillStyle = '#0000FF';
            else {
                // Gradient default
                var grad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.2, 0, 0, r);
                grad.addColorStop(0, ball.color1);
                grad.addColorStop(1, ball.color2);
                ctx.fillStyle = grad;
            }
            ctx.fillRect(-r, -r, r*2, r*2);

            // Texture Noise
            if (ball.texture === 'leather' || ball.texture === 'fuzzy') {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                // Reduce noise count for performance
                var count = 10;
                for(var i=0; i<count; i++) {
                    ctx.fillRect((Math.random()-0.5)*2*r, (Math.random()-0.5)*2*r, 2, 2);
                }
            }
        },

        drawPattern: function(ctx, r, rot, ball) {
            var type = ball.type || 'basketball';
            var cosR = Math.cos(rot);
            var sinR = Math.sin(rot);
            var self = this;

            if (type === 'basketball') {
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 2 * (r/25);

                // Draw Geometry.basketball
                ctx.beginPath();
                var first = true;
                for(var i=0; i<Geometry.basketball.length; i++) {
                     if (i % 33 === 0) { ctx.stroke(); ctx.beginPath(); first=true; }
                     this.projectIso(Geometry.basketball[i], r, cosR, sinR);
                     if (first) { ctx.moveTo(this._projResult.x, this._projResult.y); first=false; }
                     else ctx.lineTo(this._projResult.x, this._projResult.y);
                }
                ctx.stroke();
            }
            else if (type === 'soccer') {
                ctx.fillStyle = ball.color2;
                for(var i=0; i<Geometry.soccer.length; i++) {
                    var face = Geometry.soccer[i];
                    var avgZ = 0;
                    // First pass: Z check
                    for(var j=0; j<face.length; j++) {
                        this.projectIso(face[j], r, cosR, sinR);
                        avgZ += this._projResult.z;
                    }

                    if (avgZ > 0) {
                        ctx.beginPath();
                        // Second pass: Draw
                        for(var k=0; k<face.length; k++) {
                            this.projectIso(face[k], r, cosR, sinR);
                            if (k === 0) ctx.moveTo(this._projResult.x, this._projResult.y);
                            else ctx.lineTo(this._projResult.x, this._projResult.y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
            else if (type === 'baseball' || type === 'tennis') {
                ctx.strokeStyle = (type === 'baseball') ? '#FF0000' : '#FFF';
                ctx.lineWidth = 3 * (r/25);
                if (type === 'baseball') ctx.setLineDash([4, 3]);

                ctx.beginPath();
                var first = true;
                for(var i=0; i<Geometry.seam.length; i++) {
                    this.projectIso(Geometry.seam[i], r, cosR, sinR);
                    if (this._projResult.z > -0.5) {
                        if (first) { ctx.moveTo(this._projResult.x, this._projResult.y); first=false; }
                        else ctx.lineTo(this._projResult.x, this._projResult.y);
                    } else {
                        first = true;
                    }
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
            else if (type === 'golf') {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                for(var i=0; i<Geometry.dimples.length; i++) {
                    this.projectIso(Geometry.dimples[i], r, cosR, sinR);
                    if (this._projResult.z > 0) {
                        ctx.beginPath(); ctx.arc(this._projResult.x, this._projResult.y, r * 0.06, 0, Math.PI*2); ctx.fill();
                    }
                }
            }
            else if (type === 'bille8') {
                this.projectIso({x:0, y:0, z:1}, r, cosR, sinR);
                if (this._projResult.z > 0) {
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.arc(this._projResult.x, this._projResult.y, r * 0.45, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold ' + (r*0.6) + 'px Arial';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('8', this._projResult.x, this._projResult.y);
                }
            }
            else if (type === 'bowling') {
                 var holes = [{x:0.2, y:0.2, z:0.9}, {x:-0.2, y:0.2, z:0.9}, {x:0, y:-0.15, z:0.95}];
                 ctx.fillStyle = '#111';
                 holes.forEach(function(h) {
                     self.projectIso(h, r, cosR, sinR);
                     if (self._projResult.z > 0) {
                         ctx.beginPath(); ctx.arc(self._projResult.x, self._projResult.y, r * 0.12, 0, Math.PI*2); ctx.fill();
                     }
                 });
            }
            else if (type === 'eyeball') {
                this.projectIso({x:0, y:0, z:1}, r, cosR, sinR);
                if (this._projResult.z > 0) {
                    ctx.fillStyle = ball.color2;
                    ctx.beginPath(); ctx.arc(this._projResult.x, this._projResult.y, r * 0.5, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(this._projResult.x, this._projResult.y, r * 0.25, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.beginPath(); ctx.arc(this._projResult.x - r*0.15, this._projResult.y - r*0.15, r * 0.12, 0, Math.PI*2); ctx.fill();
                }
            }
            else if (type === 'beach') {
                var colors = ['#FFFF00', '#0000FF', '#FF0000', '#FFFF00', '#0000FF', '#FF0000'];
                for(var s=0; s<6; s++) {
                     ctx.strokeStyle = colors[s];
                     ctx.lineWidth = r * 0.8;
                     ctx.lineCap = 'round';
                     var first = true;
                     ctx.beginPath();
                     var line = Geometry.beach[s];
                     for(var i=0; i<line.length; i++) {
                         this.projectIso(line[i], r, cosR, sinR);
                         if (this._projResult.z > -0.2) {
                             if(first) { ctx.moveTo(this._projResult.x, this._projResult.y); first=false; }
                             else ctx.lineTo(this._projResult.x, this._projResult.y);
                         } else first = true;
                     }
                     ctx.stroke();
                }
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(0, -r*0.9, r*0.2, 0, Math.PI*2); ctx.fill();
            }
            else if (type === 'donut') {
                 this.projectIso({x:0, y:-0.9, z:0}, r, cosR, sinR);
                 var cx = this._projResult.x; var cy = this._projResult.y; var cz = this._projResult.z;
                 if (cz > -r) {
                     ctx.fillStyle = ball.color1;
                     ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI*2); ctx.fill();
                     // Sprinkles
                     var sprinkleColors = ['#FFF', '#FF0', '#0FF'];
                     for(var i=0; i<8; i++) {
                         ctx.fillStyle = sprinkleColors[i%3];
                         ctx.fillRect(cx + Math.cos(i)*r*0.5, cy + Math.sin(i)*r*0.5, 4, 2);
                     }
                 }
                 ctx.fillStyle = '#222';
                 ctx.beginPath(); ctx.arc(0, 0, r*0.25, 0, Math.PI*2); ctx.fill();
            }
            else if (type === 'watermelon') {
                 ctx.strokeStyle = '#155e15'; ctx.lineWidth = 4 * (r/25);
                 for(var s=0; s<Geometry.watermelon.length; s++) {
                     ctx.beginPath();
                     var first = true;
                     var line = Geometry.watermelon[s];
                     for(var i=0; i<line.length; i++) {
                         this.projectIso(line[i], r, cosR, sinR);
                         if(this._projResult.z > -0.2) {
                             if(first) { ctx.moveTo(this._projResult.x, this._projResult.y); first=false; }
                             else ctx.lineTo(this._projResult.x, this._projResult.y);
                         } else first = true;
                     }
                     ctx.stroke();
                 }
            }
            else if (type === 'camo') {
                ctx.fillStyle = ball.color2;
                var patches = [1,2,3,4];
                patches.forEach(function(i) {
                    var p = {x: Math.sin(i), y: Math.cos(i*2), z: Math.sin(i*3)};
                    self.projectIso(p, r, cosR, sinR);
                    if (self._projResult.z > 0) {
                        ctx.beginPath();
                        ctx.arc(self._projResult.x, self._projResult.y, r * 0.4, 0, Math.PI*2);
                        ctx.fill();
                    }
                });
            }
            else if (type === 'earth') {
                 ctx.fillStyle = '#228B22';
                 var continents = [0, 2, 4];
                 continents.forEach(function(i) {
                    var p = {x: Math.cos(i), y: Math.sin(i), z: Math.cos(i*1.5)};
                    self.projectIso(p, r, cosR, sinR);
                     if (self._projResult.z > 0) {
                        ctx.beginPath();
                        ctx.arc(self._projResult.x, self._projResult.y, r * 0.5, 0, Math.PI*2);
                        ctx.fill();
                    }
                 });
            }
        },

        drawLighting: function(ctx, r, ball) {
            var shininess = ball.shininess || 0.3;
            var grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, -r*0.3, -r*0.3, r*1.2);
            grad.addColorStop(0, 'rgba(255,255,255,' + shininess + ')');
            grad.addColorStop(0.5, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fill();

            var shadow = ctx.createRadialGradient(0, 0, r*0.8, 0, 0, r);
            shadow.addColorStop(0, 'rgba(0,0,0,0)');
            shadow.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = shadow;
            ctx.fill();
        }
    };
    function drawShotMeter(cx, cy, radius, s, progress, greenStart, shape, greenEnd) {
        if (greenEnd === undefined) greenEnd = 1.0;
        ctx.lineCap = 'round';
        let color = '#FF4500';
        if (progress >= greenStart && progress <= greenEnd) color = '#00FF00';
        else if (progress > 0.6) color = '#FFFF00';

        if (shape === 'vertical') {
            const h = radius * 3;
            const w = 15 * s;
            const x = cx + radius;
            const y = cy - h/2;
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = w; ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,0,0.4)'; ctx.lineWidth = w;
            ctx.moveTo(x, y + h * (1-greenStart)); ctx.lineTo(x, y + h * (1-greenEnd)); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = w * 0.8; ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * (1-progress)); ctx.stroke();
        }
        else if (shape === 'horizontal') {
            const w = radius * 3;
            const h = 15 * s;
            const x = cx - w/2;
            const y = cy + radius;
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = h; ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,0,0.4)'; ctx.lineWidth = h;
            ctx.moveTo(x + w * greenStart, y); ctx.lineTo(x + w * greenEnd, y); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = h * 0.8; ctx.moveTo(x, y); ctx.lineTo(x + w * progress, y); ctx.stroke();
        }
        else if (shape === 'orb') {
            ctx.lineWidth = 6 * s;
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,0,0.3)';
            ctx.arc(cx, cy, radius, -Math.PI/2 + (Math.PI*2*greenStart), -Math.PI/2 + (Math.PI*2*greenEnd), false); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = color; ctx.arc(cx, cy, radius, -Math.PI/2, -Math.PI/2 + (Math.PI*2*progress), false); ctx.stroke();
        }
        else if (shape === 'triangle') {
            const h = radius * 2.5; const w = radius * 2;
            const x = cx + radius * 1.5; const y = cy + h/2;
            ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+w/2, y-h); ctx.lineTo(x-w/2, y-h); ctx.fill();
            const fh = h * progress; const fw = w * progress;
            ctx.fillStyle = color; ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + fw/2, y - fh); ctx.lineTo(x - fw/2, y - fh); ctx.fill();
            // Band
            const gy1 = y - h * greenStart;
            const gy2 = y - h * greenEnd;
            ctx.fillStyle = 'rgba(0,255,0,0.5)'; ctx.beginPath();
            // Trapezoid logic? Triangle width at height h is w * (h/totalH).
            const w1 = w * greenStart; const w2 = w * greenEnd;
            ctx.moveTo(x - w1/2, gy1); ctx.lineTo(x + w1/2, gy1);
            ctx.lineTo(x + w2/2, gy2); ctx.lineTo(x - w2/2, gy2);
            ctx.fill();
        }
        else if (shape === 'diamond') {
            const size = radius * 1.2;
            const x = cx + size * 1.5; const y = cy;
            ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI/4);
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-size, -size, size*2, size*2);
            ctx.fillStyle = color;
            const s2 = size * progress;
            ctx.fillRect(-s2, -s2, s2*2, s2*2);
            const mid = size * ((greenStart + greenEnd)/2);
            const thick = Math.max(2, size * (greenEnd - greenStart));
            ctx.strokeStyle = 'rgba(0,255,0,0.5)'; ctx.lineWidth=thick; ctx.strokeRect(-mid, -mid, mid*2, mid*2);
            ctx.restore();
        }
        else if (shape === 'ring') {
            ctx.lineWidth = 8 * s;
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = color;
            ctx.arc(cx, cy, radius, -Math.PI/2, -Math.PI/2 + (Math.PI*2*progress), false); ctx.stroke();
            const a1 = -Math.PI/2 + (Math.PI*2*greenStart);
            const a2 = -Math.PI/2 + (Math.PI*2*greenEnd);
            ctx.beginPath(); ctx.strokeStyle = '#00FF00'; ctx.lineWidth=4*s;
            ctx.arc(cx, cy, radius*1.2, a1, a2); ctx.stroke();
        }
        else if (shape === 'chevron') {
            const w = radius * 2; const h = radius * 0.8;
            const x = cx + radius; const y = cy + radius;
            const gap = 5*s;
            const count = 5;
            for(let i=0; i<count; i++) {
                const pct = (i+1)/count;
                const py = y - (i * (h+gap));
                ctx.fillStyle = (progress >= pct) ? color : 'rgba(255,255,255,0.2)';
                const mid = (i+0.5)/count;
                if (mid >= greenStart && mid <= greenEnd) ctx.fillStyle = 'rgba(0,255,0,0.5)';
                ctx.beginPath();
                ctx.moveTo(x, py); ctx.lineTo(x + w/2, py - h); ctx.lineTo(x, py - h*0.5); ctx.lineTo(x - w/2, py - h);
                ctx.fill();
            }
        }
        else {
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 10*s;
            ctx.arc(cx, cy, radius, 0, -Math.PI / 2, true); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,0,0.4)'; ctx.lineWidth = 10*s;
            ctx.arc(cx, cy, radius, -Math.PI/2 * Math.max(0, greenStart), -Math.PI/2 * greenEnd, true); ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 8*s;
            ctx.arc(cx, cy, radius, 0, -Math.PI/2 * progress, true); ctx.stroke();
        }
    }

    let _lastScaleDist = -1;
    let _lastScaleObj = null;
    function getScaleObject(dist) {
        if (dist === _lastScaleDist) return _lastScaleObj;
        _lastScaleDist = dist;
        _lastScaleObj = SCALE_OBJECTS.find(o => dist < o.limit) || SCALE_OBJECTS[SCALE_OBJECTS.length-1];
        return _lastScaleObj;
    }

    let _lastCourtDist = -1;
    let _lastCourtObj = null;
    function getCourtDetails(dist) {
        if (dist === _lastCourtDist) return _lastCourtObj;
        _lastCourtDist = dist;
        _lastCourtObj = COURT_ZONES.find(z => dist < z.limit) || COURT_ZONES[COURT_ZONES.length-1];
        return _lastCourtObj;
    }

    function getJoint(x, y, length, angle) { return { x: x + Math.cos(angle) * length, y: y + Math.sin(angle) * length }; }
    function invalidateBackgroundCache() {
        bgCache = null;
        if(mountainLayers) mountainLayers.forEach(l => l.gradient = null);
    }

    function resizeGame() {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        // Target 16:9 ratio (1066x600)
        // If we want NO gap, we should cover. But "filling up" often implies "contain" without bars if ratio matches.
        // The user said "16:9 equivalent ... no distortion ... filling up screen".
        // Since most phones are wider than 16:9, we should stick to CONTAIN logic (Math.min) to ensure everything is visible.
        // However, removing the 0.95 margin (done previously) is key.
        const scale = Math.min(winW / 1066, winH / 600);
        container.style.transform = `translate(-50%, -50%) scale(${scale})`;
        invalidateBackgroundCache();
    }
    window.addEventListener('resize', resizeGame);

    var g_projPool = [];
    var g_projPoolIdx = 0;
    // Ring buffer size 2048 to safely handle all transient projections per frame
    for(var i=0; i<2048; i++) g_projPool.push({ x: 0, y: 0, scale: 0, depth: 0 });

    function project(x, y, z, cache) {
        let rotation, sinRot, cosRot;

        if (cache) {
            rotation = cache.rotation;
            sinRot = cache.sinRot;
            cosRot = cache.cosRot;
            cameraZoom = cache.cameraZoom;
            cameraHeight = cache.cameraHeight;
        } else if (g_camCache) {
            rotation = g_camCache.rotation;
            sinRot = g_camCache.sinRot;
            cosRot = g_camCache.cosRot;
            cameraZoom = g_camCache.cameraZoom;
            cameraHeight = g_camCache.cameraHeight;
        } else {
            const dxToHoop = HOOP_POS.x - player3D.x;
            const dyToHoop = HOOP_POS.y - player3D.y;
            cameraZoom = 698;
            cameraHeight = 130000 / cameraZoom;
            const angleToHoop = Math.atan2(dyToHoop, dxToHoop);
            rotation = -angleToHoop - Math.PI/2;
            sinRot = Math.sin(rotation);
            cosRot = Math.cos(rotation);
        }

        let camX = player3D.x;
        let camY = player3D.y;
        if (cache && cache.x !== undefined) { camX = cache.x; camY = cache.y; }
        else if (g_camCache && g_camCache.x !== undefined) { camX = g_camCache.x; camY = g_camCache.y; }

        const dx = x - camX; const dy = y - camY;
        const rx = dx * cosRot - dy * sinRot;
        const ry = dx * sinRot + dy * cosRot;
        const cameraOffset = 550; const depth = cameraOffset - ry;
        if (depth <= 0) return null;
        const scale = cameraZoom / depth;
        const vpW = (g_viewport && g_viewport.w) ? g_viewport.w : canvas.width;
        const vpH = (g_viewport && g_viewport.h) ? g_viewport.h : canvas.height;
        const screenX = vpW / 2 + (rx * scale);
        const horizonY = (vpH - 120) * 0.38;
        const screenY = horizonY + (cameraHeight - z) * scale;

        var ret = g_projPool[g_projPoolIdx];
        g_projPoolIdx = (g_projPoolIdx + 1) & 2047;
        ret.x = screenX; ret.y = screenY; ret.scale = scale; ret.depth = depth;
        return ret;
    }

    // --- 4. DRAWING FUNCTIONS ---
    // Weather System
    class WeatherSystem {
        constructor() {
            this.particles = [];
            this.type = 'NONE'; // 'NONE', 'RAIN', 'SNOW'
            this.intensity = 0;
        }

        update(dt) {
            // Determine weather type based on court zone
            if (playerData.graphics === 'LOW') { this.type = 'NONE'; this.particles = []; return; }

            const dist = 10 + (distanceLevel * 5);
            const court = getCourtDetails(dist);

            // Logic for weather type
            let targetType = 'NONE';
            if (court.name.includes("PATINOIRE") || court.name.includes("MONT") || court.name.includes("ANTARCTIQUE") || court.name.includes("BORÉALE")) {
                targetType = 'SNOW';
            } else if (court.name.includes("FLEUVE") || court.name.includes("PLUIE")) {
                targetType = 'RAIN';
            }

            // Space levels have stars instead (handled in background)
            if (court.type === 'space') targetType = 'NONE';

            this.type = targetType;

            if (this.type === 'NONE') { this.particles = []; return; }

            // Spawn Particles
            const spawnRate = (this.type === 'RAIN') ? 2 : 0.5;
            if (Math.random() < spawnRate * dt) {
                for(let i=0; i<3; i++) {
                    this.particles.push({
                        x: (Math.random() - 0.5) * 3000 + player3D.x,
                        y: (Math.random() - 0.5) * 3000 + player3D.y,
                        z: 1000 + Math.random() * 500,
                        vx: (this.type === 'RAIN') ? 20 : 5,
                        vy: (this.type === 'RAIN') ? 10 : 2,
                        vz: (this.type === 'RAIN') ? -150 : -30,
                        life: 100
                    });
                }
            }

            // Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;

                // Ground collision
                if (p.z <= 0) {
                    p.z = 0;
                    this.particles[i] = this.particles[this.particles.length - 1];
                    this.particles.pop();
                    continue;
                }

                // Cull far
                if (p.z < 0 || Math.abs(p.x - player3D.x) > 2000) {
                    this.particles[i] = this.particles[this.particles.length - 1];
                    this.particles.pop();
                }
            }
        }

        draw(projFunc) {
            if (this.type === 'NONE' || playerData.graphics === 'LOW') return;

            ctx.lineWidth = (this.type === 'RAIN') ? 2 : 0;
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = 'rgba(180, 200, 255, 0.6)';

            for (let p of this.particles) {
                // Optimization: Simple 3D projection inline or use cache?
                // Weather particles are many, let's use the provided projFunc or simplified version.
                // We reuse the global project function but need to be careful about performance.
                const proj = projFunc(p.x, p.y, p.z, g_camCache);
                if (!proj) continue;

                if (this.type === 'RAIN') {
                    // Draw line for streak
                    const proj2 = projFunc(p.x - p.vx*2, p.y - p.vy*2, p.z - p.vz*2, g_camCache);
                    if (proj2) {
                        ctx.beginPath();
                        ctx.moveTo(proj.x, proj.y);
                        ctx.lineTo(proj2.x, proj2.y);
                        ctx.stroke();
                    }
                } else if (this.type === 'SNOW') {
                    const s = proj.scale;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 4 * s, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }
    }

    const weather = new WeatherSystem();

    function drawBroadcastLowerThird() {
        const h = 120;
        const y = canvas.height - h;

        // 1. Background Bar (Glossy Dark)
        const bgGrad = ctx.createLinearGradient(0, y, 0, canvas.height);
        bgGrad.addColorStop(0, '#2a2a2a');
        bgGrad.addColorStop(0.5, '#151515');
        bgGrad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, y, canvas.width, h);

        // Top Border (Gold)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, y, canvas.width, 4);

        // NBA Logo (Bottom Left Corner)
        // Red/Blue/Silhouette
        const lX = 20; const lY = canvas.height - 40;
        const lW = 15; const lH = 30;

        ctx.fillStyle = '#C9082A'; // Red
        ctx.fillRect(lX, lY - lH/2, lW, lH);
        ctx.fillStyle = '#17408B'; // Blue
        ctx.fillRect(lX + lW, lY - lH/2, lW, lH);
        // Silhouette (Simple curve)
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(lX + lW + 2, lY + lH/2 - 2);
        ctx.lineTo(lX + lW - 4, lY - lH/2 + 5);
        ctx.quadraticCurveTo(lX + lW, lY - lH/2, lX + lW + 5, lY - lH/2 + 5);
        ctx.lineTo(lX + lW + 2, lY + lH/2 - 2);
        ctx.fill();
        ctx.beginPath(); ctx.arc(lX + lW + 6, lY - lH/2 + 8, 2, 0, Math.PI*2); ctx.fill(); // Ball

        // 2. Content Logic
        const dist = 10 + (distanceLevel * 5);
        const scaleObj = getScaleObject(dist);

        // Fonts (using Canvas fonts that match CSS imports)
        const fontTitle = "bold 14px 'Roboto Condensed', 'Arial Narrow', sans-serif";
        const fontValue = "bold 36px 'Russo One', 'Impact', sans-serif";
        const fontIcon = "50px Arial";

        // Center Separator
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(canvas.width / 2, y + 20); ctx.lineTo(canvas.width / 2, canvas.height - 20); ctx.stroke();

        if (currentGameMode === 'CLASSIC') {
            // LEFT SIDE: Record & Current Distance
            // Record
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RECORD", canvas.width / 2 - 250, y + 45);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(playerData.highScore + " ft", canvas.width / 2 - 250, y + 85);

            // Current Distance
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("CURRENT DISTANCE", canvas.width / 2 - 25, y + 45);
            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText(dist + " ft", canvas.width / 2 - 25, y + 85);

            // RIGHT SIDE: Comparison
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCALE EQUIVALENT", canvas.width / 2 + 25, y + 45);

            // Icon
            ctx.textAlign = "center"; ctx.font = fontIcon;
            const iconX = canvas.width / 2 + 65;
            ctx.fillText(scaleObj.icon, iconX, y + 90);

            // Name
            ctx.textAlign = "left";
            ctx.fillStyle = "#FFD700"; // Gold
            ctx.font = "bold 24px 'Roboto Condensed', sans-serif";
            ctx.fillText(scaleObj.name.toUpperCase(), iconX + 40, y + 85);
        }
        else if (currentGameMode === 'CONTEST') {
            const time = Math.ceil(contestData.timer);

            // LEFT SIDE: TIME & SCORE
            // Time
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("TIME", canvas.width / 2 - 250, y + 45);
            ctx.fillStyle = time <= 10 ? "#D32F2F" : "#fff"; ctx.font = fontValue;
            ctx.fillText(time, canvas.width / 2 - 250, y + 85);

            // Score
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCORE", canvas.width / 2 - 25, y + 45);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(contestData.score, canvas.width / 2 - 25, y + 85);

            // RIGHT SIDE: RACK
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RACK", canvas.width / 2 + 25, y + 45);

            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText(contestData.rack + " / 5", canvas.width / 2 + 25, y + 85);
        }
        else if (currentGameMode === 'TIME_ATTACK') {
            const time = Math.ceil(timeAttackData.timer);

            // LEFT SIDE: TIME & SCORE
            // Time
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("TIME", canvas.width / 2 - 250, y + 45);
            ctx.fillStyle = time <= 10 ? "#D32F2F" : "#fff"; ctx.font = fontValue;
            ctx.fillText(time, canvas.width / 2 - 250, y + 85);

            // Score
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCORE", canvas.width / 2 - 25, y + 45);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(timeAttackData.score, canvas.width / 2 - 25, y + 85);

            // RIGHT SIDE: RECORD
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RECORD", canvas.width / 2 + 25, y + 45);

            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText((playerData.timeAttackHighScore || 0), canvas.width / 2 + 25, y + 85);
        }

        // Live Indicator
        ctx.fillStyle = "#D32F2F"; ctx.fillRect(20, y + 20, 8, 8);
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left";
        ctx.fillText("LIVE", 35, y + 28);
    }

    function drawBallSprite(x, y, scale, isFire, rotation, phys) {
        if (isFire === undefined) isFire = false;
        if (rotation === undefined) rotation = 0;

        // Determine Ball Object
        var ballObj = null;
        if(currentGameMode === 'CONTEST' && contestData.ballsInRack === 4) {
            ballObj = BALLS_DB.find(function(b) { return b.id === 'ball_money'; });
        } else {
            var ballId = playerData.currentBall || 'ball_classic';
            ballObj = BALLS_DB.find(function(b) { return b.id === ballId; });
        }
        if (!ballObj) ballObj = BALLS_DB[0];

        // Draw High Quality Ball (Scale adjusted: The old function used 8*scale radius, BallRenderer uses 25*scale.
        // We need to match visual size.
        // 8 * scale was the visual radius.
        // BallRenderer.draw uses radius = 25 * passedScale.
        // So passedScale should be scale * (8/25) = scale * 0.32.

        BallRenderer.draw(ctx, x, y, scale * 0.32, rotation, ballObj, phys);

        // Fire Effect Glow (Overlay)
        if (isFire) {
            ctx.save();
            ctx.translate(x, y);
            var r = 8 * scale; // Match visual radius
            var glow = ctx.createRadialGradient(0, 0, r, 0, 0, r * 2.0);
            var hue = (typeof getStreakFireHue === 'function') ? getStreakFireHue(currentStreak || 10) : 30;
            glow.addColorStop(0, 'hsla('+hue+', 100%, 50%, 0.6)');
            glow.addColorStop(1, 'hsla('+hue+', 100%, 50%, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(0, 0, r * 2.0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }

    function drawBall(p, ballRef) {
        if (!p) return;
        const targetBall = ballRef || ball; // Fallback for safety

        // Draw Trail (High Graphics)
        if (targetBall.isFire && targetBall.trail && targetBall.trail.length > 1 && playerData.graphics === 'HIGH') {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < targetBall.trail.length - 1; i++) {
                const pt1 = targetBall.trail[i];
                const pt2 = targetBall.trail[i+1];

                // Project both points
                const proj1 = project(pt1.x, pt1.y, pt1.z, g_camCache);
                const proj2 = project(pt2.x, pt2.y, pt2.z, g_camCache);

                if (proj1 && proj2) {
                    const ratio = i / targetBall.trail.length; // 0 (oldest) to 1 (newest)
                    const alpha = ratio * 0.6;
                    ctx.lineWidth = (5 + 15 * ratio) * proj1.scale;

                    // Fire Gradient color
                    // Newest: Yellow/White, Middle: Orange, Oldest: Red/Trans
                    let r = 255;
                    let g = Math.floor(ratio * 200); // 0 to 200
                    let b = 0;
                    if(ratio > 0.8) { g = 255; b = Math.floor((ratio-0.8)*5 * 255); } // White hot tip

                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

                    // Add glow to trail
                    ctx.shadowColor = `rgba(${r}, ${Math.floor(g/2)}, 0, 1)`;
                    ctx.shadowBlur = 10 * proj1.scale;

                    ctx.beginPath();
                    ctx.moveTo(proj1.x, proj1.y);
                    ctx.lineTo(proj2.x, proj2.y);
                    ctx.stroke();

                    ctx.shadowBlur = 0;
                }
            }
        }

        drawBallSprite(p.x, p.y, p.scale, targetBall.isFire, targetBall.rotationX, targetBall);
    }

    function getTempBallPhys(sx, sy, p) {
        if (playerData.graphics !== 'HIGH') return null;

        const vpW = (g_viewport && g_viewport.w) ? g_viewport.w : canvas.width;
        const vpH = (g_viewport && g_viewport.h) ? g_viewport.h : canvas.height;
        const horizonY = (vpH - 120) * 0.38;

        const wz = g_camCache.cameraHeight - (sy - horizonY) / p.scale;
        const rx = (sx - vpW/2) / p.scale;
        const ry = 550 - p.depth;

        const dx = rx * g_camCache.cosRot + ry * g_camCache.sinRot;
        const dy = -rx * g_camCache.sinRot + ry * g_camCache.cosRot;

        const wx = g_camCache.x + dx;
        const wy = g_camCache.y + dy;

        return {
            x: wx, y: wy, z: wz,
            rotationX: 0, rotationY: 0, rotationZ: 0
        };
    }

    function drawDetachedBall(p, s, torsoY, bodyH, headY) {
         try {
             const isDetachedStyle = ['airbud', 'telekinesis'].includes(playerData.currentStyle);
             if (isDetachedStyle && state !== 'SHOOTING' && state !== 'GAMEOVER') {
                 let bx = p.x;
                 let by = torsoY + bodyH * 0.5;

                 let lift = 0;
                 if (state === 'JUMPING') {
                     const sObj = getCurrentStyle();
                     const maxVz = (sObj.modifiers.jumpVelocity !== undefined) ? sObj.modifiers.jumpVelocity : 8.0;
                     const div = (maxVz < 1) ? 8.0 : maxVz;
                     lift = Math.min(1.0, Math.max(0, (div - getCurrentVz()) / div));
                 }

                 if (playerData.currentStyle === 'airbud') {
                     const startX = p.x + (playerData.isLefty ? -10*s : 10*s);
                     const startY = torsoY + bodyH * 0.5;
                     const endX = p.x;
                     const endY = headY - 80*s;

                     bx = startX + (endX - startX) * lift;
                     by = startY + (endY - startY) * lift;
                     // 135*s ensures a high lob that peaks ~160 units above the head, visually falling onto the nose
                     by -= Math.sin(lift * Math.PI) * 135 * s;
                 }
                 else if (playerData.currentStyle === 'telekinesis') {
                     const startY = torsoY + bodyH * 0.2;
                     const endY = headY - 45*s;
                     bx = p.x;
                     by = startY + (endY - startY) * lift;
                     if (lift > 0.8) {
                         bx += (Math.random() - 0.5) * 4 * s;
                         by += (Math.random() - 0.5) * 4 * s;
                     }
                 }

                 var phys = getTempBallPhys(bx, by, p);
                 drawBallSprite(bx, by, s, (currentStreak >= 5), 0, phys);
             }
         } catch(e) {
             console.error("Error drawing detached ball:", e);
         }
    }

    function drawSmoke(p, alpha, color) {
        const s = p.scale;
        ctx.fillStyle = color || `rgba(220, 220, 220, ${alpha * 0.6})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 15 * s, 0, Math.PI*2); ctx.fill();
    }

    // --- FUR & ANATOMY HELPERS ---
    function drawSketchyPath(ctx, points, color, width, seed, close) {
        ctx.beginPath();
        const fuzz = 1.5;
        let idxX = (seed * 100) & (NOISE_LUT_SIZE - 1);
        let idxY = (seed * 100 + 5000) & (NOISE_LUT_SIZE - 1);

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            if (!close && i === points.length - 1) break;

            const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
            const segments = Math.max(2, Math.floor(dist / 5));

            if (i === 0) ctx.moveTo(p1.x, p1.y);

            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const tx = p1.x + (p2.x - p1.x) * t;
                const ty = p1.y + (p2.y - p1.y) * t;

                idxX = (idxX + 1) & (NOISE_LUT_SIZE - 1);
                idxY = (idxY + 1) & (NOISE_LUT_SIZE - 1);
                const nx = (g_noiseLUT[idxX] - 0.5) * fuzz;
                const ny = (g_noiseLUT[idxY] - 0.5) * fuzz;
                ctx.lineTo(tx + nx, ty + ny);
            }
        }
        if (close) ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function drawSketchyFill(ctx, points, color, seed) {
        ctx.beginPath();
        const fuzz = 1.0;
        let idxX = (seed * 50) & (NOISE_LUT_SIZE - 1);
        let idxY = (seed * 50 + 2000) & (NOISE_LUT_SIZE - 1);

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
            const segments = Math.max(2, Math.floor(dist / 8));

            if (i === 0) ctx.moveTo(p1.x, p1.y);

            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const tx = p1.x + (p2.x - p1.x) * t;
                const ty = p1.y + (p2.y - p1.y) * t;
                idxX = (idxX + 13) & (NOISE_LUT_SIZE - 1);
                idxY = (idxY + 17) & (NOISE_LUT_SIZE - 1);
                ctx.lineTo(tx + (g_noiseLUT[idxX]-0.5)*fuzz, ty + (g_noiseLUT[idxY]-0.5)*fuzz);
            }
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawSketchyCircle(ctx, x, y, r, color, seed, fill) {
        const points = [];
        const segs = 24;
        const irregularity = 0.05;
        let idx = (seed * 150) & (NOISE_LUT_SIZE - 1);

        for (let i = 0; i < segs; i++) {
            const angle = (i / segs) * Math.PI * 2;
            idx = (idx + 1) & (NOISE_LUT_SIZE - 1);
            const rMod = r * (1.0 + (g_noiseLUT[idx] - 0.5) * irregularity);
            points.push({
                x: x + Math.cos(angle) * rMod,
                y: y + Math.sin(angle) * rMod
            });
        }

        if (fill) {
            drawSketchyFill(ctx, points, color, seed);
        } else {
            drawSketchyPath(ctx, points, color, 2, seed, true);
        }
    }

    function drawFuzzyPath(points, color, scale, close = true, seed = 1, justPath = false) {
        if(points.length < 2) return;
        ctx.beginPath();
        const fuzz = 3 * scale;

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            if (!close && i === points.length - 1) break;

            const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
            const segments = Math.max(2, Math.floor(dist / (4 * scale)));

            if(i===0) ctx.moveTo(p1.x, p1.y);

            // Using LUT for performance optimization
            let idxX = (seed + i * 100) & (NOISE_LUT_SIZE - 1);
            let idxY = (seed + i * 100 + 5000) & (NOISE_LUT_SIZE - 1);

            for(let j=1; j<=segments; j++) {
                const t = j / segments;
                const tx = p1.x + (p2.x - p1.x) * t;
                const ty = p1.y + (p2.y - p1.y) * t;

                // Advance LUT indices
                idxX = (idxX + 1) & (NOISE_LUT_SIZE - 1);
                idxY = (idxY + 1) & (NOISE_LUT_SIZE - 1);

                const noiseX = (g_noiseLUT[idxX] - 0.5) * fuzz;
                const noiseY = (g_noiseLUT[idxY] - 0.5) * fuzz;
                ctx.lineTo(tx + noiseX, ty + noiseY);
            }
        }
        if(close) ctx.closePath();

        if (justPath) return;

        ctx.fillStyle = color;
        ctx.fill();
        // Add texture
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1 * scale;
        const b = getBounds(points);
        const area = (b.maxX - b.minX) * (b.maxY - b.minY);
        const dens = Math.floor(area / (100 * scale * scale)); // Approximate density
        ctx.beginPath();

        const rangeX = b.maxX - b.minX;
        const rangeY = b.maxY - b.minY;

        // LUT indices for texture
        let lutIdx1 = (seed + 200) & (NOISE_LUT_SIZE - 1);
        let lutIdx2 = (seed + 300) & (NOISE_LUT_SIZE - 1);
        let lutIdx3 = (seed + 400) & (NOISE_LUT_SIZE - 1);

        for(let k=0; k<dens; k++) {
            const r1 = g_noiseLUT[lutIdx1];
            const r2 = g_noiseLUT[lutIdx2];

            // Prime steps to avoid sync
            lutIdx1 = (lutIdx1 + 13) & (NOISE_LUT_SIZE - 1);
            lutIdx2 = (lutIdx2 + 17) & (NOISE_LUT_SIZE - 1);

            const rx = b.minX + r1 * rangeX;
            const ry = b.minY + r2 * rangeY;

            ctx.moveTo(rx, ry);
            const r3 = g_noiseLUT[lutIdx3];
            lutIdx3 = (lutIdx3 + 19) & (NOISE_LUT_SIZE - 1);
            ctx.lineTo(rx + (r3-0.5)*5*scale, ry + 5*scale);
        }
        ctx.stroke();
        ctx.restore();
    }

    function getBounds(points) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        points.forEach(p => { if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y; if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y; });
        return {minX, minY, maxX, maxY};
    }

    // --- OPTIMIZATION: Render Pools ---
    const CIRCLE_SEGS = 16;
    const g_circlePoints = [];
    for(let i=0; i<CIRCLE_SEGS; i++) { g_circlePoints.push({x: 0, y: 0}); }

    const g_limbPoints = [{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}];

    const drawFuzzyCircle = (cx, cy, r, c, seed = 50, scale = 1.0, furry = true, applyShading = true) => {
        if(!furry) {
            if (applyShading) {
                // Apply simple 3D shading even for smooth circles
                const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
                grad.addColorStop(0, '#FFFFFF'); // Highlight
                grad.addColorStop(0.2, c);
                grad.addColorStop(1, '#000000'); // Shadow
                // Blend with base color to avoid white/black takeover
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill();

                // Overlay gradient
                const gradOverlay = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
                gradOverlay.addColorStop(0, 'rgba(255,255,255,0.3)');
                gradOverlay.addColorStop(0.5, 'rgba(0,0,0,0)');
                gradOverlay.addColorStop(1, 'rgba(0,0,0,0.3)');
                ctx.fillStyle = gradOverlay; ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill();
            }
            return;
        }

        for(let i=0; i<CIRCLE_SEGS; i++) {
            const a = (i/CIRCLE_SEGS)*Math.PI*2;
            const p = g_circlePoints[i];
            p.x = cx + Math.cos(a)*r;
            p.y = cy + Math.sin(a)*r;
        }
        drawFuzzyPath(g_circlePoints, c, scale, true, seed);

        if (applyShading) {
            // Radial Shading Overlay
            const grad = ctx.createRadialGradient(cx - r*0.2, cy - r*0.2, r*0.2, cx, cy, r);
            grad.addColorStop(0, 'rgba(255,255,255,0.15)'); // Subtle Highlight
            grad.addColorStop(0.6, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.4)'); // Shadow edge

            ctx.save();
            ctx.beginPath();
            // Re-trace fuzzy path to clip the shadow
            ctx.moveTo(g_circlePoints[0].x, g_circlePoints[0].y);
            for(let i=1; i<CIRCLE_SEGS; i++) ctx.lineTo(g_circlePoints[i].x, g_circlePoints[i].y);
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }
    };

    function drawFuzzyLimb(x1, y1, x2, y2, width, color, scale, isFurry, seed = 1, endWidth = null) {
        if(!isFurry) {
            // Apply 3D shading even for non-furry (e.g. robot/skin) if requested
            drawLimb(x1, y1, x2, y2, width, color);
            return;
        }
        // Construct polygon for limb (Tapered support)
        const w1 = width / 2;
        const w2 = (endWidth !== null) ? endWidth / 2 : w1;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);

        const dx1 = sinA * w1; const dy1 = cosA * w1;
        const dx2 = sinA * w2; const dy2 = cosA * w2;

        // Use Pool
        const p1 = g_limbPoints[0]; p1.x = x1 - dx1; p1.y = y1 + dy1;
        const p2 = g_limbPoints[1]; p2.x = x2 - dx2; p2.y = y2 + dy2;
        const p3 = g_limbPoints[2]; p3.x = x2 + dx2; p3.y = y2 - dy2;
        const p4 = g_limbPoints[3]; p4.x = x1 + dx1; p4.y = y1 - dy1;

        // 1. Draw Base Fur
        drawFuzzyPath(g_limbPoints, color, scale, true, seed);

        // 2. Apply 3D Shading (Cylinder effect)
        // We use a linear gradient perpendicular to the limb axis
        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);
        const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);

        // Gradient: Dark edges, lighter center
        const grad3d = ctx.createLinearGradient(0, -w1, 0, w1);
        grad3d.addColorStop(0, 'rgba(0,0,0,0.5)'); // Dark Edge
        grad3d.addColorStop(0.3, 'rgba(0,0,0,0.1)');
        grad3d.addColorStop(0.5, 'rgba(255,255,255,0.15)'); // Highlight Center
        grad3d.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        grad3d.addColorStop(1, 'rgba(0,0,0,0.5)'); // Dark Edge

        ctx.fillStyle = grad3d;
        ctx.beginPath();
        ctx.moveTo(0, -w1);
        ctx.lineTo(len, -w2);
        ctx.lineTo(len, w2);
        ctx.lineTo(0, w1);
        ctx.fill();
        ctx.restore();

        // 3. Axial Shadow (Depth along length)
        // Kept for joint shading
        ctx.save();
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
        ctx.clip();
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad; ctx.fill();
        ctx.restore();
    }

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

        const drawPatterns = () => {
             const pat = options.pattern;
             const s = scale;

             // Patterns logic refactored from drawPlayer and clipped
             if(pat === 'tiger_stripes') {
                 ctx.strokeStyle = '#000'; ctx.lineWidth = 2*s;
                 ctx.beginPath(); ctx.moveTo(cx - w/2, topY + 10*s); ctx.lineTo(cx - w/4, topY + 15*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx + w/2, topY + 10*s); ctx.lineTo(cx + w/4, topY + 15*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx - w/2, topY + 25*s); ctx.lineTo(cx - w/4, topY + 30*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx + w/2, topY + 25*s); ctx.lineTo(cx + w/4, topY + 30*s); ctx.stroke();
             }
             if(pat === 'cow_spots') {
                 ctx.fillStyle = (options.skinId === 'cow_strawberry') ? '#FF69B4' : '#000';
                 ctx.beginPath(); ctx.arc(cx - 5*s, topY + 10*s, 6*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx + 8*s, topY + 25*s, 5*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx - 2*s, topY + 30*s, 4*s, 0, Math.PI*2); ctx.fill();
             }
             if(options.hasSpots) {
                 ctx.fillStyle = options.spotColor || '#000';
                 ctx.beginPath(); ctx.arc(cx, topY + 20*s, 4*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx - w*0.3, topY + 30*s, 3*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx + w*0.3, topY + 10*s, 3*s, 0, Math.PI*2); ctx.fill();
             }
             if(options.isTabby) {
                 ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2*s;
                 ctx.beginPath(); ctx.moveTo(cx-5*s, topY+10*s); ctx.lineTo(cx+5*s, topY+10*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx-7*s, topY+20*s); ctx.lineTo(cx+7*s, topY+20*s); ctx.stroke();
             }
             if(pat === 'plaid') {
                 ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
                 ctx.beginPath(); ctx.moveTo(cx-w/2, topY+10*s); ctx.lineTo(cx+w/2, topY+10*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx-w/2, topY+20*s); ctx.lineTo(cx+w/2, topY+20*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx-w/2, topY+30*s); ctx.lineTo(cx+w/2, topY+30*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx, topY+h); ctx.stroke();
             }
             else if(pat === 'stripes') {
                 ctx.fillStyle = '#000';
                 ctx.fillRect(cx-5*s, topY, 10*s, h); // Center stripe
                 ctx.fillRect(cx-15*s, topY, 5*s, h); // Left stripe
                 ctx.fillRect(cx+10*s, topY, 5*s, h); // Right stripe
             }
             else if(pat === 'suit') {
                 ctx.fillStyle = '#000';
                 ctx.beginPath(); ctx.arc(cx, topY + 15*s, 2*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx, topY + 25*s, 2*s, 0, Math.PI*2); ctx.fill();
                 // Bowtie
                 ctx.fillStyle = 'red';
                 ctx.beginPath(); ctx.moveTo(cx, topY+5*s); ctx.lineTo(cx-5*s, topY+2*s); ctx.lineTo(cx-5*s, topY+8*s); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(cx, topY+5*s); ctx.lineTo(cx+5*s, topY+2*s); ctx.lineTo(cx+5*s, topY+8*s); ctx.fill();
             }
             else if(pat === 'suit_jacket') {
                 ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1*s;
                 // Center seam (Vent)
                 ctx.beginPath(); ctx.moveTo(cx, topY + h * 0.7); ctx.lineTo(cx, topY + h); ctx.stroke();
                 // Shoulder seams
                 ctx.beginPath();
                 ctx.moveTo(cx - w/2 + 5*s, topY + 5*s);
                 ctx.quadraticCurveTo(cx, topY + 8*s, cx + w/2 - 5*s, topY + 5*s);
                 ctx.stroke();
             }
             else if(pat === 'spartan_tattoo') {
                ctx.strokeStyle = '#8B0000'; // Blood Red
                ctx.lineWidth = 3*s;
                ctx.beginPath();
                ctx.moveTo(cx + w/2, topY);
                ctx.lineTo(cx - w/2, topY + h);
                ctx.stroke();
             }
             else if (pat === 'grid') {
                 ctx.strokeStyle = '#000000'; ctx.lineWidth = 1*s;
                 ctx.beginPath();
                 for(let i=0; i<w; i+=8*s) { ctx.moveTo(cx - w/2 + i, topY); ctx.lineTo(cx - w/2 + i, topY + h); }
                 for(let j=0; j<h; j+=8*s) { ctx.moveTo(cx - w/2, topY + j); ctx.lineTo(cx + w/2, topY + j); }
                 ctx.stroke();
             }
             else if (pat === 'armor') {
                 ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
                 ctx.strokeRect(cx - w*0.3, topY + h*0.2, w*0.6, h*0.4);
                 ctx.fillStyle = '#EEE'; ctx.fillRect(cx - w*0.2, topY + h*0.25, w*0.4, h*0.3);
             }
        };

        if (isFurry) {
            // Draw base fuzzy shape
            drawFuzzyPath(points, color, scale, true, seed);

            // Clip for Patterns & Shading
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i=1; i<points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.clip();

            drawPatterns();

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
                ctx.lineWidth = w * 0.25;
                ctx.lineCap = 'round';

                ctx.beginPath();
                // Over Left Shoulder (Back View Left)
                ctx.moveTo(cx - w*0.5, topY - h*0.1);
                ctx.quadraticCurveTo(cx - w*0.1, topY + h*0.4, cx - w*0.6, topY + h*0.8);
                ctx.stroke();

                ctx.restore();
            }

            // Muscle Definition (High Graphics) - BACK VIEW
            if (!options.isJersey && playerData.graphics === 'HIGH' && !isFurry) {
                 const animal = options.animal || 'human';
                 ctx.fillStyle = 'rgba(0,0,0,0.1)';
                 ctx.strokeStyle = 'rgba(0,0,0,0.1)';

                 if (animal === 'dino') {
                     // Dino: Spine Ridge (Protruding vertebrae)
                     ctx.beginPath();
                     ctx.moveTo(cx, topY + h * 0.1);
                     ctx.lineTo(cx, topY + h * 0.9);
                     ctx.lineWidth = w * 0.08;
                     ctx.strokeStyle = 'rgba(0,0,0,0.2)'; // Darker spine
                     ctx.stroke();

                     // Horizontal Skin Folds
                     ctx.lineWidth = w * 0.04;
                     ctx.beginPath(); ctx.moveTo(cx - w*0.3, topY + h*0.3); ctx.lineTo(cx + w*0.3, topY + h*0.35); ctx.stroke();
                     ctx.beginPath(); ctx.moveTo(cx - w*0.3, topY + h*0.5); ctx.lineTo(cx + w*0.3, topY + h*0.55); ctx.stroke();
                     ctx.beginPath(); ctx.moveTo(cx - w*0.3, topY + h*0.7); ctx.lineTo(cx + w*0.3, topY + h*0.75); ctx.stroke();
                 }
                 else if (animal === 'elephant') {
                     // Elephant: Deep Spine Indent + Wrinkles
                     ctx.lineWidth = w * 0.05;
                     ctx.beginPath(); ctx.moveTo(cx, topY + h * 0.1); ctx.lineTo(cx, topY + h * 0.9); ctx.stroke();

                     // Wrinkles
                     ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                     ctx.lineWidth = w * 0.02;
                     for(let i=1; i<5; i++) {
                         let y = topY + h * (0.2 * i);
                         ctx.beginPath();
                         ctx.moveTo(cx - w*0.4, y);
                         ctx.quadraticCurveTo(cx, y + h*0.05, cx + w*0.4, y);
                         ctx.stroke();
                     }
                 }
                 else if (animal === 'frog') {
                     // Frog: Angular Spine hump
                     ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                     ctx.lineWidth = w * 0.06;
                     ctx.beginPath(); ctx.moveTo(cx, topY + h * 0.2); ctx.lineTo(cx, topY + h * 0.8); ctx.stroke();
                     // Hip Bumps
                     ctx.fillStyle = 'rgba(0,0,0,0.1)';
                     ctx.beginPath(); ctx.arc(cx - w*0.3, topY + h*0.3, w*0.1, 0, Math.PI*2); ctx.fill();
                     ctx.beginPath(); ctx.arc(cx + w*0.3, topY + h*0.3, w*0.1, 0, Math.PI*2); ctx.fill();
                 }
                 else if (animal === 'penguin') {
                     // Smooth, just faint spine
                     ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                     ctx.lineWidth = w * 0.03;
                     ctx.beginPath(); ctx.moveTo(cx, topY + h * 0.2); ctx.lineTo(cx, topY + h * 0.8); ctx.stroke();
                 }
                 else if (animal === 'human' || animal === 'monkey') {
                     // Human / Monkey (Scapula)
                     // Spine Indentation
                     ctx.beginPath();
                     ctx.moveTo(cx, topY + h * 0.2);
                     ctx.lineTo(cx, topY + h * 0.8);
                     ctx.lineWidth = w * 0.05;
                     ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                     ctx.stroke();

                     // Shoulder Blades (Scapula)
                     const scapY = topY + h * 0.25;

                     // Left Scapula
                     ctx.beginPath();
                     ctx.moveTo(cx - w*0.15, scapY);
                     ctx.quadraticCurveTo(cx - w*0.35, scapY + h*0.1, cx - w*0.2, scapY + h*0.25);
                     ctx.lineWidth = w * 0.03;
                     ctx.stroke();

                     // Right Scapula
                     ctx.beginPath();
                     ctx.moveTo(cx + w*0.15, scapY);
                     ctx.quadraticCurveTo(cx + w*0.35, scapY + h*0.1, cx + w*0.2, scapY + h*0.25);
                     ctx.stroke();

                     // Trapezius / Upper Back shading
                     ctx.fillStyle = 'rgba(0,0,0,0.05)';
                     ctx.beginPath();
                     ctx.moveTo(cx, topY + h*0.1);
                     ctx.lineTo(cx - w*0.3, topY + h*0.2);
                     ctx.lineTo(cx, topY + h*0.4);
                     ctx.lineTo(cx + w*0.3, topY + h*0.2);
                     ctx.fill();
                 }
                 // Turtles and others get no muscle definition (shell or smooth)
            }

            // Rim Light
            ctx.save();
            ctx.clip();
            const rimGrad = ctx.createLinearGradient(cx - w, 0, cx + w, 0);
            rimGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
            rimGrad.addColorStop(0.8, 'rgba(255,255,255,0.0)');
            rimGrad.addColorStop(1, 'rgba(255,255,255,0.3)');
            ctx.fillStyle = rimGrad;
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        }

        if (options.chestStripeColor) {
            ctx.save();
            if (isFurry) {
                drawFuzzyPath(points, null, scale, true, seed, true);
            } else {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                if (roundness > 0) {
                    const rOffset = w * roundness;
                    ctx.quadraticCurveTo(cx + wW/2 + rOffset, (shoulderY + waistY)/2, points[2].x, points[2].y);
                    ctx.quadraticCurveTo(cx + hW/2 + rOffset*0.5, (waistY + hipY)/2, points[3].x, points[3].y);
                    ctx.lineTo(points[4].x, points[4].y);
                    ctx.quadraticCurveTo(cx - hW/2 - rOffset*0.5, (waistY + hipY)/2, points[5].x, points[5].y);
                    ctx.quadraticCurveTo(cx - wW/2 - rOffset, (shoulderY + waistY)/2, points[0].x, points[0].y);
                } else {
                    points.forEach((p, i) => { if(i>0) ctx.lineTo(p.x, p.y); });
                }
                ctx.closePath();
            }
            ctx.clip();
            ctx.fillStyle = options.chestStripeColor;
            ctx.fillRect(cx - w*2, topY, w*4, h * 0.25);
            ctx.restore();
        }
    }


    function drawLimb(x1, y1, x2, y2, width, color) {
        const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2 - y1, x2 - x1);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Base Color
        ctx.fillStyle = color;

        ctx.beginPath();

        if (playerData.graphics === 'HIGH') {
            // Curvy "Muscle" Limb
            const bulge = width * 0.15;

            // Start (Shoulder/Hip)
            ctx.arc(0, 0, width/2, Math.PI/2, -Math.PI/2);
            // Top Edge (Bicep/Quad bulge)
            ctx.quadraticCurveTo(len*0.5, -width/2 - bulge, len, -width*0.4);
            // End Cap (Elbow/Knee - narrower)
            ctx.arc(len, 0, width*0.4, -Math.PI/2, Math.PI/2);
            // Bottom Edge
            ctx.quadraticCurveTo(len*0.5, width/2 + bulge*0.5, 0, width/2);
        } else {
            ctx.arc(0, 0, width/2, Math.PI/2, -Math.PI/2);
            ctx.lineTo(len, -width/2);
            ctx.arc(len, 0, width/2, -Math.PI/2, Math.PI/2);
            ctx.lineTo(0, width/2);
        }
        ctx.fill();

        // Cylindrical Shading Overlay
        const grad = ctx.createLinearGradient(0, -width/2, 0, width/2);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(0.2, 'rgba(255,255,255,0.1)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0)');
        grad.addColorStop(0.9, 'rgba(0,0,0,0.4)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.restore();
    }

    function drawJoint(x, y, radius, color, isMechanical) {
        if (!isMechanical) return;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI*2);
        ctx.fillStyle = color;
        ctx.fill();

        const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Slight Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawRoundedRect(x, y, w, h, r, color) {
        const cacheKey = `rounded_rect_${color}`;
        const fillStyle = getCachedPattern(cacheKey, (gradCtx, size) => {
            gradCtx.fillStyle = color;
            gradCtx.fillRect(0, 0, size, size);
            const grad = gradCtx.createRadialGradient(size/2, size/2, 5, size/2, size/2, size/2);
            grad.addColorStop(0, 'rgba(255,255,255,0.2)');
            grad.addColorStop(1, 'rgba(0,0,0,0.3)');
            gradCtx.fillStyle = grad;
            gradCtx.fillRect(0, 0, size, size);
        });

        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.arcTo(x+w, y, x+w, y+h, r);
        ctx.arcTo(x+w, y+h, x, y+h, r);
        ctx.arcTo(x, y+h, x, y, r);
        ctx.arcTo(x, y, x+w, y, r);
        ctx.closePath();

        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawDecor(p, type, variant, seed) {
        if (!p) return;
        const s = p.scale;
        if(type === 'grass') {
             // Realistic Grass Tuft
             // Base Shadow
             ctx.fillStyle = 'rgba(0,0,0,0.2)';
             ctx.beginPath(); ctx.ellipse(p.x, p.y, 15*s, 5*s, 0, 0, Math.PI*2); ctx.fill();

             // Blades
             ctx.strokeStyle = '#32CD32';
             ctx.lineWidth = 2 * s;
             ctx.lineCap = 'round';
             ctx.beginPath();
             for(let i=0; i<5; i++) {
                 const angle = -Math.PI/2 + (i-2)*0.3;
                 const len = 15 * s + Math.random() * 10 * s;
                 const bx = p.x + (i-2)*3*s;
                 const by = p.y;
                 ctx.moveTo(bx, by);
                 ctx.quadraticCurveTo(bx + Math.cos(angle)*5*s, by - len*0.5, bx + Math.cos(angle)*len, by - len);
             }
             ctx.stroke();

             // Small Flower
             if (seed > 0.7) {
                 ctx.fillStyle = '#FFF';
                 ctx.beginPath(); ctx.arc(p.x, p.y - 15*s, 3*s, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = '#FFD700';
                 ctx.beginPath(); ctx.arc(p.x, p.y - 15*s, 1.5*s, 0, Math.PI*2); ctx.fill();
             }
        }
        else if(type === 'tree') {
            const isHigh = playerData.graphics === 'HIGH';

            if (variant === 'pine') {
                // Realistic Pine
                ctx.fillStyle = '#3E2723'; // Trunk
                ctx.fillRect(p.x - 4*s, p.y, 8*s, -20*s);

                const drawLayer = (yBase, w, h, color) => {
                    if (isHigh) {
                        const grad = ctx.createLinearGradient(p.x, yBase - h, p.x, yBase);
                        grad.addColorStop(0, color); // Top lighter
                        grad.addColorStop(1, '#1B5E20'); // Bottom darker
                        ctx.fillStyle = grad;
                    } else {
                        ctx.fillStyle = color;
                    }

                    ctx.beginPath();
                    ctx.moveTo(p.x - w, yBase);
                    ctx.lineTo(p.x, yBase - h);
                    ctx.lineTo(p.x + w, yBase);
                    // Jagged bottom
                    for(let i=1; i<=4; i++) {
                        ctx.lineTo(p.x + w - (2*w*(i/4)), yBase - (i%2==0 ? 0 : 5*s));
                    }
                    ctx.closePath();
                    ctx.fill();
                };

                drawLayer(p.y - 15*s, 30*s, 60*s, '#2E7D32'); // Bottom
                drawLayer(p.y - 45*s, 25*s, 50*s, '#388E3C'); // Mid
                drawLayer(p.y - 70*s, 15*s, 40*s, '#4CAF50'); // Top
            } else {
                // Realistic Oak
                ctx.fillStyle = '#5D4037'; // Trunk
                // Trunk Shading
                if (isHigh) {
                    const tGrad = ctx.createLinearGradient(p.x - 6*s, 0, p.x + 6*s, 0);
                    tGrad.addColorStop(0, '#3E2723'); tGrad.addColorStop(0.5, '#5D4037'); tGrad.addColorStop(1, '#3E2723');
                    ctx.fillStyle = tGrad;
                }

                ctx.beginPath();
                ctx.moveTo(p.x - 6*s, p.y);
                ctx.lineTo(p.x - 6*s, p.y - 30*s);
                ctx.lineTo(p.x + 6*s, p.y - 30*s);
                ctx.lineTo(p.x + 6*s, p.y);
                ctx.fill();

                // Roots
                ctx.beginPath(); ctx.moveTo(p.x - 6*s, p.y); ctx.lineTo(p.x - 10*s, p.y + 5*s); ctx.lineTo(p.x, p.y); ctx.fill();
                ctx.beginPath(); ctx.moveTo(p.x + 6*s, p.y); ctx.lineTo(p.x + 10*s, p.y + 5*s); ctx.lineTo(p.x, p.y); ctx.fill();

                // Canopy (Clustered)
                const drawLeafCircle = (dx, dy, r, color) => {
                    ctx.fillStyle = color;
                    ctx.beginPath(); ctx.arc(p.x + dx*s, p.y - 30*s + dy*s, r*s, 0, Math.PI*2); ctx.fill();
                    // Shadow arc
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2*s;
                    ctx.beginPath(); ctx.arc(p.x + dx*s, p.y - 30*s + dy*s, r*s, 0.5, 2.5); ctx.stroke();
                };

                drawLeafCircle(-20, -10, 25, '#228B22');
                drawLeafCircle(20, -10, 25, '#228B22');
                drawLeafCircle(0, -40, 30, '#32CD32');
                drawLeafCircle(0, -10, 25, '#2E8B57'); // Front center
            }
        }
        else if (type === 'water') {
             ctx.fillStyle = '#1E90FF';
             ctx.beginPath();
             const r = 20 * s;
             ctx.moveTo(p.x + r, p.y);
             for(let i=1; i<8; i++) {
                 const angle = (i/8) * Math.PI * 2;
                 const varR = r * (0.8 + 0.4 * Math.sin(seed * 10 + i * 132));
                 ctx.lineTo(p.x + Math.cos(angle)*varR, p.y + Math.sin(angle)*varR * 0.3);
             }
             ctx.closePath();
             ctx.fill();
             ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, p.y - 2*s); ctx.lineTo(p.x - 5*s, p.y - 2*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x + 2*s, p.y + 2*s); ctx.lineTo(p.x + 8*s, p.y + 2*s); ctx.stroke();
        }
        else if (type === 'castle') { // Now Residential Houses
            const wallColors = ['#F5F5DC', '#FFFACD', '#E0FFFF', '#FFC0CB', '#98FB98', '#D3D3D3', '#F0E68C', '#ADD8E6'];
            const roofColors = ['#8B4513', '#A52A2A', '#2F4F4F', '#696969', '#800000', '#556B2F'];

            // Deterministic selection
            const wallColor = wallColors[Math.floor(Math.abs(Math.sin(seed * 1234)) * wallColors.length)];
            const roofColor = roofColors[Math.floor(Math.abs(Math.sin(seed * 5678)) * roofColors.length)];

            const w = 50 * s;
            const h = 50 * s;

            // Body
            ctx.fillStyle = wallColor;
            ctx.fillRect(p.x - w/2, p.y - h, w, h);

            // Roof (Pitched)
            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(p.x - w/2 - 5*s, p.y - h);
            ctx.lineTo(p.x + w/2 + 5*s, p.y - h);
            ctx.lineTo(p.x, p.y - h - 30*s);
            ctx.fill();

            // Door
            ctx.fillStyle = '#4E342E';
            ctx.fillRect(p.x - 8*s, p.y - 20*s, 16*s, 20*s);
            // Knob
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(p.x + 4*s, p.y - 10*s, 1.5*s, 0, Math.PI*2); ctx.fill();

            // Windows
            ctx.fillStyle = '#87CEEB';
            // Window 1
            ctx.fillRect(p.x - w/2 + 5*s, p.y - h + 10*s, 12*s, 12*s);
            // Window 2
            ctx.fillRect(p.x + w/2 - 17*s, p.y - h + 10*s, 12*s, 12*s);

            // Window Frames
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1*s;
            // Cross 1
            ctx.beginPath(); ctx.moveTo(p.x - w/2 + 11*s, p.y - h + 10*s); ctx.lineTo(p.x - w/2 + 11*s, p.y - h + 22*s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x - w/2 + 5*s, p.y - h + 16*s); ctx.lineTo(p.x - w/2 + 17*s, p.y - h + 16*s); ctx.stroke();
            // Cross 2
            ctx.beginPath(); ctx.moveTo(p.x + w/2 - 11*s, p.y - h + 10*s); ctx.lineTo(p.x + w/2 - 11*s, p.y - h + 22*s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x + w/2 - 17*s, p.y - h + 16*s); ctx.lineTo(p.x + w/2 - 5*s, p.y - h + 16*s); ctx.stroke();
        }
        else if (type === 'mountain') {
            ctx.fillStyle = '#757575';
            ctx.beginPath();
            ctx.moveTo(p.x - 25*s, p.y);
            ctx.lineTo(p.x - 15*s, p.y - 40*s);
            ctx.lineTo(p.x, p.y - 60*s);
            ctx.lineTo(p.x + 20*s, p.y - 30*s);
            ctx.lineTo(p.x + 30*s, p.y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(p.x - 11*s, p.y - 50*s);
            ctx.lineTo(p.x, p.y - 60*s);
            ctx.lineTo(p.x + 7*s, p.y - 50*s);
            ctx.lineTo(p.x, p.y - 45*s);
            ctx.fill();
        }
        else if (type === 'space') {
            // Grounded objects (Rocks & Craters) replacing floating planets
            if (seed > 0.6) {
                // Craters
                ctx.fillStyle = '#333'; // Inner dark hole
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 25*s, 6*s, 0, 0, Math.PI*2);
                ctx.fill();

                // Rim
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 2*s;
                ctx.stroke();

            } else {
                // Space Rocks (Grounded)
                const isRed = (seed > 0.3 && seed < 0.45);
                ctx.fillStyle = isRed ? '#8B4513' : '#696969'; // Mars-ish or Grey

                ctx.beginPath();
                const r = 20 * s;
                const segments = 7;
                // Draw a jagged dome sitting on the ground (p.y)
                for(let i=0; i<=segments; i++) {
                    const theta = Math.PI + (i/segments) * Math.PI; // PI (Left) to 2PI (Right)
                    const noise = 0.8 + 0.4 * Math.sin(seed * 50 + i * 13);
                    const d = r * noise;

                    const px = p.x + Math.cos(theta) * d;
                    const py = p.y + Math.sin(theta) * d * 0.7; // Flattened y-axis

                    if(i===0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath(); // Closes bottom flat
                ctx.fill();

                // Shadow/Texture detail
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(p.x - 5*s, p.y - 8*s, 5*s, 0, Math.PI*2);
                ctx.fill();
            }
        }
        else if (type === 'tacocat') {
             const s = p.scale;
             // Taco Shell
             ctx.fillStyle = '#F4C430';
             ctx.beginPath(); ctx.arc(p.x, p.y - 10*s, 25*s, 0, Math.PI, true); ctx.fill(); // Shell
             ctx.strokeStyle = '#D4A017'; ctx.lineWidth = 2*s; ctx.stroke();

             // Cat Head (Peeking out)
             const hy = p.y - 25*s;
             ctx.fillStyle = '#808080';
             ctx.beginPath(); ctx.arc(p.x, hy, 12*s, 0, Math.PI*2); ctx.fill();
             // Ears
             ctx.beginPath(); ctx.moveTo(p.x-10*s, hy-5*s); ctx.lineTo(p.x-15*s, hy-18*s); ctx.lineTo(p.x-4*s, hy-10*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x+10*s, hy-5*s); ctx.lineTo(p.x+15*s, hy-18*s); ctx.lineTo(p.x+4*s, hy-10*s); ctx.fill();
             // Face
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.arc(p.x-4*s, hy-2*s, 3*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x+4*s, hy-2*s, 3*s, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#000';
             ctx.beginPath(); ctx.arc(p.x-4*s, hy-2*s, 1.5*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x+4*s, hy-2*s, 1.5*s, 0, Math.PI*2); ctx.fill();

             // Fillings (Foreground)
             ctx.fillStyle = '#8B4513'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 10*s, 20*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#32CD32';
             ctx.beginPath(); ctx.arc(p.x-10*s, p.y-12*s, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x+10*s, p.y-12*s, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, p.y-14*s, 6*s, 0, Math.PI*2); ctx.fill();
        }
        else if (type === 'crowd') {
             const s = p.scale;
             const w = 200 * s;
             const h = 80 * s;

             // Simple Grandstand
             ctx.fillStyle = '#222';
             ctx.fillRect(p.x - w/2, p.y - h, w, h);
             ctx.strokeStyle = '#444'; ctx.lineWidth = 2*s; ctx.strokeRect(p.x - w/2, p.y - h, w, h);

             // Crowd Blobs
             const dens = variant.density || 0.5;
             const rows = 3 + Math.floor(dens * 4);
             const cols = 8;

             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.font = `${12 * s}px Arial`;

             for(let r=0; r<rows; r++) {
                 for(let c=0; c<cols; c++) {
                     // Deterministic "Random" based on seed and position
                     const cellSeed = (seed * 1000) + (r * 31) + (c * 17);
                     const rand = Math.abs(Math.sin(cellSeed)); // 0..1 deterministic

                     if (rand > 0.8) continue; // Deterministic gap

                     const hx = (p.x - w/2) + (c * (w/cols)) + ((Math.cos(cellSeed)*5)*s); // Static X offset

                     // Bounce ONLY if cheering
                     let bounce = 0;
                     if (crowdCheerTimer > 0) {
                         const time = Date.now() * 0.02;
                         bounce = Math.sin(time + rand * 10) * 5 * s;
                     }
                     const hy = (p.y - h) + (r * (h/rows)) + bounce;

                     // Emoji
                     const emojiIndex = Math.floor(rand * CROWD_EMOJIS.length);
                     ctx.fillText(CROWD_EMOJIS[emojiIndex], hx, hy);
                 }
             }
        }

        else if (type.startsWith('landmark_')) {
             const s = p.scale;
             const color = variant.color || '#888';
             ctx.fillStyle = color;

             if (type === 'landmark_pyramid') {
                 const w = 400 * s; const h = 300 * s;
                 ctx.fillStyle = '#D2B48C';
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w/2, p.y); ctx.lineTo(p.x - w/2, p.y); ctx.fill();
                 // Shadow side
                 ctx.fillStyle = 'rgba(0,0,0,0.2)';
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w/2, p.y); ctx.lineTo(p.x, p.y); ctx.fill();
             }
             else if (type === 'landmark_tower') { // Eiffel
                 const w = 150 * s; const h = 500 * s;
                 ctx.strokeStyle = '#555'; ctx.lineWidth = 5*s;
                 ctx.beginPath(); ctx.moveTo(p.x - w/2, p.y); ctx.quadraticCurveTo(p.x, p.y - h*0.6, p.x, p.y - h); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(p.x + w/2, p.y); ctx.quadraticCurveTo(p.x, p.y - h*0.6, p.x, p.y - h); ctx.stroke();
                 // Levels
                 ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(p.x - w*0.4, p.y - h*0.3); ctx.lineTo(p.x + w*0.4, p.y - h*0.3); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(p.x - w*0.2, p.y - h*0.6); ctx.lineTo(p.x + w*0.2, p.y - h*0.6); ctx.stroke();
             }
             else if (type === 'landmark_building' || type === 'landmark_needle') { // Skyscraper/Needle
                 const w = (type==='landmark_needle'?60:150) * s;
                 const h = (type==='landmark_needle'?600:800) * s;

                 ctx.fillRect(p.x - w/2, p.y - h, w, h);
                 // Windows
                 if(type === 'landmark_building') {
                     ctx.fillStyle = 'rgba(255,255,255,0.3)';
                     for(let i=0; i<20; i++) {
                         for(let j=0; j<4; j++) {
                             // Deterministic Windows
                             const winSeed = Math.sin(seed * 999 + i * 13 + j * 7);
                             if(winSeed > 0) ctx.fillRect(p.x - w/2 + 10*s + j*30*s, p.y - h + 20*s + i*40*s, 15*s, 20*s);
                         }
                     }
                 } else {
                     // Needle Top
                     ctx.fillStyle = color;
                     ctx.beginPath(); ctx.ellipse(p.x, p.y - h*0.8, w*2, 20*s, 0, 0, Math.PI*2); ctx.fill();
                 }
             }
             else if (type === 'landmark_leaning') { // Pisa
                 const w = 100 * s; const h = 400 * s;
                 ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.1); // Lean
                 ctx.fillStyle = '#EEE'; ctx.fillRect(-w/2, -h, w, h);
                 // Arches
                 ctx.fillStyle = '#CCC';
                 for(let i=0; i<8; i++) ctx.fillRect(-w/2, -h + i*50*s, w, 5*s);
                 ctx.restore();
             }
             else if (type === 'landmark_statue') { // Liberty
                 const h = 300 * s;
                 ctx.fillStyle = '#2E8B57';
                 ctx.fillRect(p.x - 40*s, p.y - h, 80*s, h); // Body
                 ctx.beginPath(); ctx.arc(p.x, p.y - h - 30*s, 30*s, 0, Math.PI*2); ctx.fill(); // Head
                 // Arm
                 ctx.lineWidth = 15*s; ctx.strokeStyle = '#2E8B57';
                 ctx.beginPath(); ctx.moveTo(p.x + 20*s, p.y - h); ctx.lineTo(p.x + 60*s, p.y - h - 80*s); ctx.stroke();
                 // Torch
                 ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(p.x + 60*s, p.y - h - 90*s, 10*s, 0, Math.PI*2); ctx.fill();
             }
             else if (type === 'landmark_castle') {
                 // Reuse simple castle logic but bigger?
                 const w = 300 * s; const h = 200 * s;
                 ctx.fillStyle = '#A52A2A';
                 ctx.fillRect(p.x - w/2, p.y - h/2, w, h/2); // Base
                 ctx.fillRect(p.x - w/2, p.y - h, w/4, h); // Tower L
                 ctx.fillRect(p.x + w/4, p.y - h, w/4, h); // Tower R
                 ctx.fillStyle = '#8B0000'; // Roofs
                 ctx.beginPath(); ctx.moveTo(p.x - w/2 - 20*s, p.y - h); ctx.lineTo(p.x - w/2 + w/4 + 20*s, p.y - h); ctx.lineTo(p.x - w/2 + w/8, p.y - h - 50*s); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(p.x + w/4 - 20*s, p.y - h); ctx.lineTo(p.x + w/4 + w/4 + 20*s, p.y - h); ctx.lineTo(p.x + w/4 + w/8, p.y - h - 50*s); ctx.fill();
             }
             else if (type === 'carnival_tent') {
                 const s = p.scale;
                 const w = 250 * s; const h = 180 * s;
                 // Base
                 ctx.fillStyle = '#FFF';
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w/2, p.y); ctx.lineTo(p.x - w/2, p.y); ctx.fill();
                 // Stripes
                 ctx.fillStyle = '#FF0000';
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + 20*s, p.y); ctx.lineTo(p.x - 20*s, p.y); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w/2, p.y); ctx.lineTo(p.x + w/2 - 40*s, p.y); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x - w/2, p.y); ctx.lineTo(p.x - w/2 + 40*s, p.y); ctx.fill();
             }
             else if (type === 'arena_bleachers') {
                 const s = p.scale;
                 const w = 400 * s; const h = 250 * s;
                 // Structure
                 ctx.fillStyle = '#1a1a1a';
                 ctx.fillRect(p.x - w/2, p.y - h, w, h);
                 // Rows
                 ctx.fillStyle = '#2a2a2a';
                 for(let i=0; i<6; i++) {
                     ctx.fillRect(p.x - w/2, p.y - h + i*40*s, w, 20*s);
                 }
                 // Crowd Noise (Visual)
                 ctx.fillStyle = '#555';
                 for(let i=0; i<100; i++) {
                     if(Math.random() > 0.5) ctx.fillStyle = '#EEE'; else ctx.fillStyle = '#333';
                     ctx.fillRect(p.x - w/2 + Math.random()*w, p.y - h + Math.random()*h, 4*s, 6*s);
                 }
             }
        }
    }

    var ShadowSystem = {
        canvas: null,
        ctx: null,
        init: function() {
            if (this.canvas) return;
            this.canvas = document.createElement('canvas');
            this.canvas.width = 512;
            this.canvas.height = 512;
            this.ctx = this.canvas.getContext('2d');
        },
        render: function(drawFn, x, y) {
            this.init();

            // Clear
            this.ctx.clearRect(0, 0, 512, 512);

            // Swap global ctx
            var originalCtx = ctx;
            ctx = this.ctx;

            ctx.save();
            // Center drawing at 256, 400
            // The drawFn expects to draw at coordinates (x, y).
            // We translate so that (x, y) maps to (256, 400)
            ctx.translate(256 - x, 400 - y);

            try {
                drawFn();
            } catch(e) {
                console.error(e);
            }

            ctx.restore();

            // Restore global ctx
            ctx = originalCtx;

            // Convert to Silhouette
            this.ctx.globalCompositeOperation = 'source-in';
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, 512, 512);
            this.ctx.globalCompositeOperation = 'source-over';

            return this.canvas;
        }
    };

    function drawRealisticShadow(obj, type) {
        if (!obj) return;

        // Quality check
        if (playerData.graphics === 'LOW') {
             // Fallback to simple blob if needed
             ctx.fillStyle = 'rgba(0,0,0,0.3)';
             ctx.beginPath();
             ctx.ellipse(obj.x, obj.y, 25 * obj.scale, 8 * obj.scale, 0, 0, Math.PI * 2);
             ctx.fill();
             return;
        }

        var z = 0;
        if (type === 'player') z = player3D.z;
        if (type === 'ball') z = obj.ballRef ? obj.ballRef.z : 0;

        // Calculate opacity and blur based on Z
        var alpha = Math.max(0.05, 0.4 - (z / 800));
        var blur = Math.min(10, 2 + (z / 50));

        // Render Silhouette
        var sCanvas = ShadowSystem.render(function() {
            if (type === 'player') {
                drawPlayer(obj);
            } else if (type === 'ball') {
                drawBall(obj, obj.ballRef);
            }
        }, obj.x, obj.y);

        ctx.save();
        ctx.translate(obj.x, obj.y);

        // Directional Skew (Sun at Top-Right -> Shadow to Bottom-Left)
        // Shear X by -0.6, Scale Y by 0.3 (Flatten)
        ctx.transform(1, 0, -0.6, 0.3, 0, 0);

        ctx.globalAlpha = alpha;

        // Blur
        if (ctx.filter) {
            ctx.filter = 'blur(' + blur + 'px)';
        }

        ctx.drawImage(sCanvas, -256, -400);

        ctx.restore();
    }


    var g_cachedHoopGeometry = null;

    function drawHoop(p) {
        if (!p) return;

        // --- 3D Hoop Constants ---
        const rimZ = HOOP_POS.z;
        const rimY = HOOP_POS.y;
        const rimX = HOOP_POS.x;

        // Orientation: Forward Vector towards Classic Start (433, 300) from Hoop (733, 150)
        // Dynamic Orientation based on player position
        let dx = player3D.x - HOOP_POS.x;
        let dy = player3D.y - HOOP_POS.y;

        if (currentGameMode === 'CONTEST') {
            // Fix angle to face "Top" (Rack 3) position
            // Rack 3 is at (420, 306). HOOP at (733, 150).
            dx = 420 - 733;
            dy = 306 - 150;
        }

        let len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) { dx = -300; dy = 150; len = Math.sqrt(dx*dx + dy*dy); } // Fallback

        const fX = dx / len;
        const fY = dy / len;
        // Right Vector: (fY, -fX)
        const rX = fY;
        const rY = -fX;

        // Geometry Dimensions
        const bbDist = 40; // Backboard behind rim
        const bbCX = rimX - fX * bbDist;
        const bbCY = rimY - fY * bbDist;
        const bbCZ = rimZ + 30;
        const bbW = 60; // Half Width
        const bbH = 45; // Half Height

        const rimRadius = 25; // Matching ball radius approx

        // --- Generate Vertices ---

        // Backboard Corners
        const bbVerts = [
            { x: bbCX - rX * bbW, y: bbCY - rY * bbW, z: bbCZ + bbH }, // TL
            { x: bbCX + rX * bbW, y: bbCY + rY * bbW, z: bbCZ + bbH }, // TR
            { x: bbCX + rX * bbW, y: bbCY + rY * bbW, z: bbCZ - bbH }, // BR
            { x: bbCX - rX * bbW, y: bbCY - rY * bbW, z: bbCZ - bbH }  // BL
        ];

        // Inner Square (Target) - On Surface
        const isW = 20; const isH = 15; const isYOffset = -15;
        const isVerts = [
            { x: bbCX - rX * isW, y: bbCY - rY * isW, z: bbCZ + isYOffset + isH },
            { x: bbCX + rX * isW, y: bbCY + rY * isW, z: bbCZ + isYOffset + isH },
            { x: bbCX + rX * isW, y: bbCY + rY * isW, z: bbCZ + isYOffset - isH },
            { x: bbCX - rX * isW, y: bbCY - rY * isW, z: bbCZ + isYOffset - isH }
        ];

        // Rim Circle & Net Points (Cached)
        if (!g_cachedHoopGeometry) {
            const rPts = [];
            const segs = 24;
            for(let i=0; i<segs; i++) {
                const a = (i/segs) * Math.PI * 2;
                const rx = Math.cos(a) * rimRadius;
                const ry = Math.sin(a) * rimRadius;
                rPts.push({ x: rimX + rx, y: rimY + ry, z: rimZ });
            }

            const nPts = [];
            const netLen = 35;
            const netBotRad = 12;
            const netSegs = 12;
            for(let i=0; i<netSegs; i++) {
                 const a = (i/netSegs) * Math.PI * 2;
                 nPts.push({
                     x: rimX + Math.cos(a)*netBotRad,
                     y: rimY + Math.sin(a)*netBotRad,
                     z: rimZ - netLen
                 });
            }
            g_cachedHoopGeometry = { rimPoints: rPts, netPointsBot: nPts, segs: segs, netSegs: netSegs };
        }

        const { rimPoints, netPointsBot, segs, netSegs } = g_cachedHoopGeometry;

        // Pole
        const poleX = bbCX - fX * 20;
        const poleY = bbCY - fY * 20;

        // --- Project & Cull ---
        // Using global project() which uses g_camCache

        const projBB = bbVerts.map(v => project(v.x, v.y, v.z));
        const projIS = isVerts.map(v => project(v.x, v.y, v.z));
        const projRim = rimPoints.map(v => project(v.x, v.y, v.z));
        const projNetBot = netPointsBot.map(v => project(v.x, v.y, v.z));
        const projPoleTop = project(poleX, poleY, bbCZ);
        const projPoleBot = project(poleX, poleY, 0);

        if (projBB.some(v => !v) || projRim.some(v => !v)) return; // Occluded behind camera

        // --- Sorting ---
        const camX = g_camCache.x; const camY = g_camCache.y;
        const distBB = Math.sqrt((bbCX-camX)**2 + (bbCY-camY)**2);
        const distRim = Math.sqrt((rimX-camX)**2 + (rimY-camY)**2);

        // --- Draw Functions ---
        const drawPole = () => {
            if(projPoleTop && projPoleBot) {
                ctx.strokeStyle = '#333'; ctx.lineWidth = 15 * projPoleTop.scale;
                ctx.beginPath(); ctx.moveTo(projPoleBot.x, projPoleBot.y); ctx.lineTo(projPoleTop.x, projPoleTop.y); ctx.stroke();
            }
        };

        const drawBackboard = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2 * projBB[0].scale;
            ctx.beginPath();
            ctx.moveTo(projBB[0].x, projBB[0].y);
            for(let i=1; i<4; i++) ctx.lineTo(projBB[i].x, projBB[i].y);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Inner Square
            ctx.strokeStyle = '#CE1126'; ctx.lineWidth = 2 * projBB[0].scale;
            ctx.beginPath();
            ctx.moveTo(projIS[0].x, projIS[0].y);
            for(let i=1; i<4; i++) ctx.lineTo(projIS[i].x, projIS[i].y);
            ctx.closePath();
            ctx.stroke();
        };

        const drawRimAndNet = () => {
            const s = projRim[0].scale;
            // Net (White Lines)
            ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1 * s;

            // Vertical(ish) Lines
            for(let i=0; i<segs; i+=2) {
                const rimP = projRim[i];
                const botIdx = Math.floor((i / segs) * netSegs);
                const netP = projNetBot[botIdx];
                if(rimP && netP) {
                    ctx.beginPath(); ctx.moveTo(rimP.x, rimP.y); ctx.lineTo(netP.x, netP.y); ctx.stroke();
                }
            }
            // Bottom Ring
            ctx.beginPath();
            let first=true;
            projNetBot.forEach(pt => { if(!pt) return; if(first) { ctx.moveTo(pt.x, pt.y); first=false; } else ctx.lineTo(pt.x, pt.y); });
            ctx.closePath(); ctx.stroke();

            // Rim (Orange Thick Loop)
            ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 4 * s;
            ctx.beginPath();
            first = true;
            projRim.forEach(pt => { if(first) { ctx.moveTo(pt.x, pt.y); first=false; } else ctx.lineTo(pt.x, pt.y); });
            ctx.closePath(); ctx.stroke();
        };

        // Render Order (Painter's Algorithm)
        drawPole();
        if (distBB > distRim) {
            drawBackboard();
            drawRimAndNet();
        } else {
            drawRimAndNet();
            drawBackboard();
        }
    }
    // Cached objects for drawMuscleLimb optimization
    var g_muscleGradientPattern = null;
    var g_muscleMatrix = (typeof DOMMatrix !== 'undefined') ? new DOMMatrix() : null;

    function drawMuscleLimb(x1, y1, x2, y2, width, color, type, s, hasTattoos) {
        // type: 'thigh' or 'calf' or 'standard'
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        const w = width / 2;
        let startW = w;
        let endW = w;

        if (type === 'thigh') {
            endW = w * 0.7;
        } else if (type === 'calf') {
            startW = w * 0.7;
            endW = w * 0.5;
        }

        ctx.beginPath();

        // Start Cap
        ctx.arc(0, 0, startW, Math.PI/2, -Math.PI/2);

        if (type === 'thigh') {
            if (playerData.graphics === 'HIGH') {
                 // Enhanced Quadriceps
                 ctx.bezierCurveTo(len*0.3, -w*1.5, len*0.7, -w*1.5, len, -endW);
                 ctx.arc(len, 0, endW, -Math.PI/2, Math.PI/2);
                 ctx.bezierCurveTo(len*0.7, w*1.3, len*0.3, w*1.3, 0, startW);
            } else {
                 ctx.lineTo(len, -endW);
                 ctx.arc(len, 0, endW, -Math.PI/2, Math.PI/2);
                 ctx.lineTo(0, startW);
            }
        } else if (type === 'calf') {
            if (playerData.graphics === 'HIGH') {
                 // Defined Calf
                 ctx.bezierCurveTo(len*0.25, -w*1.6, len*0.6, -w*1.3, len, -endW);
                 ctx.arc(len, 0, endW, -Math.PI/2, Math.PI/2);
                 ctx.bezierCurveTo(len*0.5, w*1.2, len*0.2, w*1.2, 0, startW);
            } else {
                ctx.quadraticCurveTo(len * 0.3, -w * 1.4, len, -endW);
                ctx.arc(len, 0, endW, -Math.PI/2, Math.PI/2);
                ctx.quadraticCurveTo(len * 0.3, w * 1.4, 0, startW);
            }
        } else {
            ctx.lineTo(len, -endW);
            ctx.arc(len, 0, endW, -Math.PI/2, Math.PI/2);
            ctx.lineTo(0, startW);
        }
        ctx.closePath();

        // 1. Base Color Fill
        ctx.fillStyle = color;
        ctx.fill();

        // 2. 3D Volume Gradient (Cylinder Effect)
        if (playerData.graphics === 'HIGH') {
            if (g_muscleMatrix && ctx.createPattern) {
                // Optimization: Reuse CanvasPattern and DOMMatrix
                if (!g_muscleGradientPattern) {
                    const gradCanvas = document.createElement('canvas');
                    gradCanvas.width = 1;
                    gradCanvas.height = 256;
                    const gCtx = gradCanvas.getContext('2d');
                    const grad = gCtx.createLinearGradient(0, 0, 0, 256);
                    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
                    grad.addColorStop(0.2, 'rgba(0,0,0,0.1)');
                    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)'); // Sharp Highlight (Wet skin)
                    grad.addColorStop(0.55, 'rgba(255,255,255,0.05)');
                    grad.addColorStop(0.85, 'rgba(0,0,0,0.3)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
                    gCtx.fillStyle = grad;
                    gCtx.fillRect(0, 0, 1, 256);
                    g_muscleGradientPattern = ctx.createPattern(gradCanvas, 'repeat-x');
                }

                // Update Matrix: Scale 256px height to 2*w height, translate to -w
                // Target Y range: -w to w. Source Y range: 0 to 256.
                // y_new = y_old * scale + translate
                // 0 -> -w  => translate = -w
                // 256 -> w => 256 * scale - w = w => 256 * scale = 2w => scale = 2w / 256
                g_muscleMatrix.a = 1; g_muscleMatrix.b = 0;
                g_muscleMatrix.c = 0; g_muscleMatrix.d = (2 * w) / 256;
                g_muscleMatrix.e = 0; g_muscleMatrix.f = -w;

                g_muscleGradientPattern.setTransform(g_muscleMatrix);
                ctx.fillStyle = g_muscleGradientPattern;
            } else {
                // Fallback for environments without DOMMatrix
                const grad = ctx.createLinearGradient(0, -w, 0, w);
                grad.addColorStop(0, 'rgba(0,0,0,0.6)');
                grad.addColorStop(0.2, 'rgba(0,0,0,0.1)');
                grad.addColorStop(0.35, 'rgba(255,255,255,0.35)'); // Sharp Highlight (Wet skin)
                grad.addColorStop(0.55, 'rgba(255,255,255,0.05)');
                grad.addColorStop(0.85, 'rgba(0,0,0,0.3)');
                grad.addColorStop(1, 'rgba(0,0,0,0.6)');
                ctx.fillStyle = grad;
            }
            ctx.fill();

            // 3. Tattoos Overlay
            if (hasTattoos) {
                 ctx.fillStyle = 'rgba(0,0,0,0.3)';
                 // Tribal pattern - repeated along limb
                 for(let i=0; i<3; i++) {
                     const tx = (len * 0.2) + (i * (len * 0.25));
                     ctx.beginPath();
                     ctx.moveTo(tx, -startW*0.4);
                     ctx.lineTo(tx + (len*0.1), 0);
                     ctx.lineTo(tx, startW*0.4);
                     ctx.lineTo(tx - (len*0.05), 0);
                     ctx.fill();
                 }
                 // Crosshatch
                 ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.moveTo(len*0.1, -startW); ctx.lineTo(len*0.9, startW);
                 ctx.moveTo(len*0.1, startW); ctx.lineTo(len*0.9, -startW);
                 ctx.stroke();
            }

            // 4. Muscle Definition Highlights
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = w * 0.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(len * 0.2, -w * 0.5);
            ctx.quadraticCurveTo(len * 0.5, -w * 0.8, len * 0.8, -w * 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawRealisticShoe(x, y, w, h, color, isRight) {
        // Detailed sneaker
        // Sole
        ctx.fillStyle = '#DDD';
        ctx.beginPath();
        ctx.ellipse(x, y + h*0.2, w, h*0.4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#999'; ctx.lineWidth=1; ctx.stroke();

        // Upper
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - h*0.2, w*0.9, 0, Math.PI*2); // Main foot
        ctx.fill();

        // Detail lines (laces area)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.moveTo(x - w*0.5, y - h*0.5); ctx.lineTo(x + w*0.5, y - h*0.5); ctx.stroke();
    }

    // --- OPTIMIZATION: Gradient Caching ---
    const GRAD_CANVAS_SIZE = 64; // Power of 2 for performance
    const g_gradientCache = {};

    function getCachedPattern(key, generator) {
        if (g_gradientCache[key]) {
            return g_gradientCache[key];
        }

        const gradCanvas = document.createElement('canvas');
        gradCanvas.width = GRAD_CANVAS_SIZE;
        gradCanvas.height = GRAD_CANVAS_SIZE;
        const gradCtx = gradCanvas.getContext('2d');

        generator(gradCtx, GRAD_CANVAS_SIZE);

        const pattern = ctx.createPattern(gradCanvas, 'repeat');
        g_gradientCache[key] = pattern;
        return pattern;
    }

    function drawJersey(cx, topY, w, h, scale, skinObj, anchors = null) {
        // V-Taper Jersey
        const color = skinObj.jerseyColor || '#FFF';

        let slX, srX, sY, blX, brX, bY;

        if (anchors && anchors.shoulders) {
            // Narrow shoulders by 10% for the jersey fabric
            slX = cx + (anchors.shoulders.left.x - cx) * 0.9;
            srX = cx + (anchors.shoulders.right.x - cx) * 0.9;
            sY = anchors.shoulders.left.y;

            // For bottom, use hips if available, otherwise calculate from width
            // Jersey tucks into shorts, so align with hip joints
            if (anchors.hips) {
                blX = anchors.hips.left.x;
                brX = anchors.hips.right.x;
                bY = anchors.hips.left.y; // Assuming roughly level
            } else {
                const waistW = w * 0.9;
                blX = cx - waistW/2;
                brX = cx + waistW/2;
                bY = topY + h;
            }
        } else {
            const shoulderW = w * 1.6;
            const waistW = w * 0.9;
            slX = cx - shoulderW/2;
            srX = cx + shoulderW/2;
            sY = topY;
            blX = cx - waistW/2;
            brX = cx + waistW/2;
            bY = topY + h;
        }

        const shoulderW = srX - slX;
        const waistW = brX - blX;
        const bottomY = bY;
        const armpitY = sY + h * 0.4;

        ctx.beginPath();
        ctx.moveTo(slX, sY);
        // Gentle neck curve (High back collar)
        ctx.quadraticCurveTo(cx, sY - (shoulderW * 0.05), srX, sY);

        // Right side
        ctx.lineTo(srX, armpitY);
        // Curve from armpit to bottom right (hip)
        ctx.quadraticCurveTo(cx + (srX-cx)*0.8, (armpitY+bY)/2, brX, bY);

        // Bottom curve (Tuck)
        ctx.quadraticCurveTo(cx, bY + 3*scale, blX, bY);

        // Left side
        ctx.quadraticCurveTo(cx - (srX-cx)*0.8, (armpitY+bY)/2, slX, armpitY);
        ctx.lineTo(slX, sY);

        ctx.closePath();

        // Fill
        const grad = ctx.createLinearGradient(cx - shoulderW/2, topY, cx + shoulderW/2, topY);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, color);

        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';

        // High Graphics Folds
        if (playerData.graphics === 'HIGH') {
             ctx.save();
             ctx.clip();

             // Spine Indent (Deeper)
             ctx.fillStyle = 'rgba(0,0,0,0.2)';
             ctx.beginPath();
             ctx.moveTo(cx, topY + 5*scale);
             ctx.lineTo(cx + 3*scale, bottomY);
             ctx.lineTo(cx - 3*scale, bottomY);
             ctx.fill();

             // Tension Lines (Wrinkles)
             ctx.strokeStyle = 'rgba(0,0,0,0.15)';
             ctx.lineWidth = 1.5 * scale;
             ctx.lineCap = 'round';

             // Radiating from armpits
             for(let i=0; i<3; i++) {
                 // Left
                 ctx.beginPath();
                 ctx.moveTo(cx - shoulderW/2 + 2*scale, armpitY + i*4*scale);
                 ctx.quadraticCurveTo(cx - waistW*0.3, armpitY + 10*scale + i*5*scale, cx - waistW*0.2, bottomY - 10*scale);
                 ctx.stroke();

                 // Right
                 ctx.beginPath();
                 ctx.moveTo(cx + shoulderW/2 - 2*scale, armpitY + i*4*scale);
                 ctx.quadraticCurveTo(cx + waistW*0.3, armpitY + 10*scale + i*5*scale, cx + waistW*0.2, bottomY - 10*scale);
                 ctx.stroke();
             }

             // Horizontal crunch at waist
             ctx.beginPath();
             ctx.moveTo(cx - waistW*0.3, bottomY - 5*scale);
             ctx.quadraticCurveTo(cx, bottomY - 8*scale, cx + waistW*0.3, bottomY - 5*scale);
             ctx.stroke();

             ctx.restore();
        }

        // --- PATTERNS ---
        // Pinstripes
        if(skinObj.pinstripesColor) {
            ctx.strokeStyle = skinObj.pinstripesColor;
            ctx.lineWidth = 1 * scale;
            const step = 4 * scale;
            for(let dx = -shoulderW/2; dx <= shoulderW/2; dx += step) {
                if(Math.abs(dx) < 2*scale) continue; // Skip spine
                ctx.beginPath();
                ctx.moveTo(cx + dx, sY);
                ctx.lineTo(cx + dx * 0.7, bottomY); // Taper in
                ctx.stroke();
            }
        }

        // Side Panels
        if(skinObj.sideStripesColor) {
            ctx.fillStyle = skinObj.sideStripesColor;
            const stripeW = 3 * scale;

            // Left Panel
            ctx.beginPath();
            ctx.moveTo(cx - shoulderW/2, armpitY);
            ctx.quadraticCurveTo(cx - waistW*0.6, (armpitY+bottomY)/2, cx - waistW/2, bottomY);
            ctx.lineTo(cx - waistW/2 + stripeW, bottomY);
            ctx.quadraticCurveTo(cx - waistW*0.6 + stripeW, (armpitY+bottomY)/2, cx - shoulderW/2 + stripeW, armpitY);
            ctx.fill();

            // Right Panel
            ctx.beginPath();
            ctx.moveTo(cx + shoulderW/2, armpitY);
            ctx.quadraticCurveTo(cx + waistW*0.6, (armpitY+bottomY)/2, cx + waistW/2, bottomY);
            ctx.lineTo(cx + waistW/2 - stripeW, bottomY);
            ctx.quadraticCurveTo(cx + waistW*0.6 - stripeW, (armpitY+bottomY)/2, cx + shoulderW/2 - stripeW, armpitY);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';

        // Spine/Back Detail
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(cx, topY + h*0.2);
        ctx.lineTo(cx + 1*scale, topY + h*0.7);
        ctx.lineTo(cx - 1*scale, topY + h*0.7);
        ctx.fill();

        // Mesh Texture
        ctx.save();
        ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=0; i<h; i+=4*scale) {
            if (i%8===0) ctx.fillRect(cx - shoulderW, topY + i, shoulderW*2, 1*scale);
        }
        ctx.restore();

        // --- TRIM (Over Texture) ---
        if(skinObj.trimColor || skinObj.trimColors) {
            const colors = skinObj.trimColors || [skinObj.trimColor];
            const lineWidth = 2 * scale;

            colors.forEach((col, i) => {
                ctx.strokeStyle = col;
                ctx.lineWidth = lineWidth;
                const offset = i * lineWidth;

                // Neck (Horizontal-ish)
                ctx.beginPath();
                ctx.moveTo(cx - shoulderW/2 + offset, sY + offset);
                ctx.lineTo(cx + shoulderW/2 - offset, sY + offset);
                ctx.stroke();

                // Armholes (Vertical-ish)
                // Left
                ctx.beginPath();
                ctx.moveTo(cx - shoulderW/2 + offset, sY + offset);
                ctx.lineTo(cx - shoulderW/2 + offset, armpitY - offset);
                ctx.stroke();
                // Right
                ctx.beginPath();
                ctx.moveTo(cx + shoulderW/2 - offset, sY + offset);
                ctx.lineTo(cx + shoulderW/2 - offset, armpitY - offset);
                ctx.stroke();
            });
        }

        // Tuck Shadow at bottom
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(cx - waistW/2, bottomY);
        ctx.quadraticCurveTo(cx, bottomY + 3*scale, cx + waistW/2, bottomY);
        ctx.lineTo(cx + waistW/2, bottomY - 4*scale);
        ctx.quadraticCurveTo(cx, bottomY - 1*scale, cx - waistW/2, bottomY - 4*scale);
        ctx.fill();
    }

    function drawLinkTunic(cx, topY, w, h, scale, skinObj, anchors = null) {
        const color = skinObj.jerseyColor || '#00A000';
        const beltColor = '#8B4513';

        // Extended length for tunic
        const tunicLen = h * 1.2;
        let slX, srX, sY, wlX, wrX, wY, bY;
        let shoulderW, waistW;

        if (anchors && anchors.shoulders) {
            slX = anchors.shoulders.left.x;
            srX = anchors.shoulders.right.x;
            sY = anchors.shoulders.left.y;
            wY = sY + h * 0.55;
            bY = sY + tunicLen;

            // Waist width relative to hips
            let hipW = w;
            if (anchors.hips) {
                hipW = (anchors.hips.right.x - anchors.hips.left.x);
            }
            wlX = cx - hipW*0.6;
            wrX = cx + hipW*0.6;

            shoulderW = srX - slX;
            waistW = wrX - wlX;
        } else {
            shoulderW = w * 1.6;
            waistW = w * 1.0;
            slX = cx - shoulderW/2;
            srX = cx + shoulderW/2;
            sY = topY;
            wY = topY + h * 0.55;
            bY = topY + tunicLen;
            wlX = cx - waistW/2;
            wrX = cx + waistW/2;
        }

        const waistY = wY; // Alias for belt position
        const bottomW = (wrX - wlX) * 1.3; // Flare

        // Main Tunic Shape
        ctx.beginPath();
        ctx.moveTo(slX, sY);
        ctx.lineTo(srX, sY);

        // Sides to waist
        ctx.lineTo(wrX, wY);
        // Flared bottom (Skirt part of tunic)
        ctx.lineTo(cx + bottomW/2, bY);
        ctx.lineTo(cx - bottomW/2, bY);
        ctx.lineTo(wlX, wY);
        ctx.lineTo(slX, sY);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Shading
        const grad = ctx.createLinearGradient(cx - shoulderW/2, topY, cx + shoulderW/2, topY);
        grad.addColorStop(0, 'rgba(0,0,0,0.1)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Belt
        ctx.fillStyle = beltColor;
        ctx.fillRect(cx - waistW*0.55, waistY - 5*scale, waistW*1.1, 10*scale);
        // Buckle (silver)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(cx - 5*scale, waistY - 5*scale, 10*scale, 10*scale);

        // Collar (Back)
        ctx.fillStyle = '#EEE'; // White undershirt collar
        ctx.beginPath();
        ctx.moveTo(cx - 10*scale, topY);
        ctx.quadraticCurveTo(cx, topY + 5*scale, cx + 10*scale, topY);
        ctx.lineTo(cx + 8*scale, topY - 2*scale);
        ctx.quadraticCurveTo(cx, topY + 3*scale, cx - 8*scale, topY - 2*scale);
        ctx.fill();
    }

    function drawShorts(cx, waistY, w, h, scale, skinObj) {
        if (skinObj.shortsType === 'kilt') {
             const color = skinObj.shortsColor || '#5D4037'; // Leather
             const beltH = 5 * scale;
             const stripCount = 5;
             const stripW = w / stripCount;

             // Belt
             ctx.fillStyle = '#3E2723';
             ctx.fillRect(cx - w/2, waistY, w, beltH);
             // Gold Buckle
             ctx.fillStyle = '#FFD700';
             ctx.fillRect(cx - w*0.1, waistY, w*0.2, beltH);

             // Pteruges (Strips)
             for(let i=0; i<stripCount; i++) {
                 const sx = (cx - w/2) + i*stripW;
                 ctx.fillStyle = color;
                 // Main Strip
                 ctx.fillRect(sx + 1*scale, waistY + beltH, stripW - 2*scale, h - beltH);

                 // Shadow/Edge
                 ctx.fillStyle = 'rgba(0,0,0,0.2)';
                 ctx.fillRect(sx + 1*scale, waistY + beltH, 1*scale, h - beltH);

                 // Stud Detail
                 ctx.fillStyle = '#C0C0C0';
                 ctx.beginPath(); ctx.arc(sx + stripW/2, waistY + h - 5*scale, 2*scale, 0, Math.PI*2); ctx.fill();
             }
             return;
        }

        // Baggy Shorts
        const color = skinObj.shortsColor || '#FFF';
        const waistW = w * 1.0;
        const hipW = w * 1.3;
        const legW = w * 0.6; // Width of one leg hole

        const bottomY = waistY + h;
        const crotchY = waistY + h * 0.45;

        // --- Get Base Pattern (Color + Shading) ---
        const cacheKey = `shorts_base_${color}`;
        let fillStyle = getCachedPattern(cacheKey, (gradCtx, size) => {
            // Base Color
            gradCtx.fillStyle = color;
            gradCtx.fillRect(0, 0, size, size);
            // Gradient Overlay
            const grad = gradCtx.createLinearGradient(0, 0, size, 0);
            grad.addColorStop(0, 'rgba(0,0,0,0.1)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            grad.addColorStop(1, 'rgba(0,0,0,0.1)');
            gradCtx.fillStyle = grad;
            gradCtx.fillRect(0, 0, size, size);
        });
        if (!fillStyle) fillStyle = color;

        // --- Draw Main Shape ---
        ctx.beginPath();
        ctx.moveTo(cx - waistW/2, waistY); ctx.lineTo(cx + waistW/2, waistY);
        ctx.quadraticCurveTo(cx + hipW/2, waistY + h*0.2, cx + hipW/2, bottomY);

        // Ripped Bottom Edge?
        if (skinObj.shortsPattern === 'ripped') {
            const jagSize = 3 * scale;
            const drawJaggedLine = (xStart, xEnd, yBase) => {
                let currX = xStart;
                const dist = Math.abs(xEnd - xStart);
                const steps = Math.floor(dist / jagSize);
                const stepX = (xEnd - xStart) / steps;

                for(let i=0; i<steps; i++) {
                    currX += stepX;
                    const yOff = (i % 2 === 0) ? -jagSize : jagSize;
                    ctx.lineTo(currX, yBase + yOff);
                }
                ctx.lineTo(xEnd, yBase);
            };

            drawJaggedLine(cx + hipW/2, cx + hipW/2 - legW, bottomY); // Right Leg Bottom

            ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx, crotchY);
            ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx - hipW/2 + legW, bottomY);

            drawJaggedLine(cx - hipW/2 + legW, cx - hipW/2, bottomY); // Left Leg Bottom

        } else {
            ctx.lineTo(cx + hipW/2 - legW, bottomY);
            ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx, crotchY);
            ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx - hipW/2 + legW, bottomY);
            ctx.lineTo(cx - hipW/2, bottomY);
        }

        ctx.quadraticCurveTo(cx - hipW/2, waistY + h*0.2, cx - waistW/2, waistY);
        ctx.closePath();

        ctx.fillStyle = fillStyle;
        ctx.fill();

        // --- Draw Stripes Dynamically (to preserve curves) ---
        if(skinObj.sideStripesColor) {
            ctx.save();
            ctx.clip(); // Clip to the shorts path just drawn

            ctx.fillStyle = skinObj.sideStripesColor;
            const stripeW = 4 * scale;

            // Left Stripe Path
            ctx.beginPath();
            ctx.moveTo(cx - hipW/2, waistY);
            ctx.quadraticCurveTo(cx - hipW/2, waistY + h*0.5, cx - hipW/2, bottomY);
            ctx.lineTo(cx - hipW/2 + stripeW, bottomY);
            ctx.quadraticCurveTo(cx - hipW/2 + stripeW, waistY + h*0.5, cx - hipW/2 + stripeW, waistY);
            ctx.closePath();
            ctx.fill();

            // Right Stripe Path
            ctx.beginPath();
            ctx.moveTo(cx + hipW/2, waistY);
            ctx.quadraticCurveTo(cx + hipW/2, waistY + h*0.5, cx + hipW/2, bottomY);
            ctx.lineTo(cx + hipW/2 - stripeW, bottomY);
            ctx.quadraticCurveTo(cx + hipW/2 - stripeW, waistY + h*0.5, cx + hipW/2 - stripeW, waistY);
            ctx.closePath();
            ctx.fill();

            ctx.restore(); // Remove clipping mask
        }

        // --- SPECIAL PATTERNS (Bulls/Wizards) ---
        if (skinObj.shortsPattern === 'bulls' || skinObj.shortsPattern === 'wizards') {
             ctx.save();
             // Clip to shorts shape
             ctx.beginPath();
             ctx.moveTo(cx - waistW/2, waistY); ctx.lineTo(cx + waistW/2, waistY);
             ctx.quadraticCurveTo(cx + hipW/2, waistY + h*0.2, cx + hipW/2, bottomY);
             ctx.lineTo(cx + hipW/2 - legW, bottomY);
             ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx, crotchY);
             ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx - hipW/2 + legW, bottomY);
             ctx.lineTo(cx - hipW/2, bottomY);
             ctx.quadraticCurveTo(cx - hipW/2, waistY + h*0.2, cx - waistW/2, waistY);
             ctx.closePath();
             ctx.clip();

             if (skinObj.shortsPattern === 'bulls') {
                 // Iconic Diamond on side
                 const dH = h * 0.4;
                 const dW = 12 * scale; // Width of diamond
                 const dCy = waistY + h * 0.55;
                 const dCxL = cx - hipW/2 + 2*scale; // Centered on stripe roughly
                 const dCxR = cx + hipW/2 - 2*scale;

                 // Outline (White or Contrast)
                 ctx.strokeStyle = skinObj.shortsColor === '#CE1141' ? '#FFF' : '#CE1141';
                 ctx.lineWidth = 1.5 * scale;
                 ctx.fillStyle = skinObj.trimColor || '#000'; // Black center

                 const drawDiamond = (dx, dy) => {
                     ctx.beginPath();
                     ctx.moveTo(dx, dy - dH/2);
                     ctx.lineTo(dx + dW/2, dy);
                     ctx.lineTo(dx, dy + dH/2);
                     ctx.lineTo(dx - dW/2, dy);
                     ctx.closePath();
                     ctx.fill();
                     ctx.stroke();
                 };

                 drawDiamond(dCxL, dCy);
                 drawDiamond(dCxR, dCy);
             }
             else if (skinObj.shortsPattern === 'wizards') {
                 // Wizards Stripe Blocks (DC Era)
                 // Horizontal bar across the side stripe area
                 const barH = h * 0.6;
                 const barW = 8 * scale;
                 const bCy = waistY + h * 0.5;
                 const bLx = cx - hipW/2;
                 const bRx = cx + hipW/2 - barW;

                 // Left Side
                 ctx.fillStyle = '#E31837'; // Red
                 ctx.fillRect(bLx, bCy - barH/2, barW, barH/2);
                 ctx.fillStyle = '#C4CED4'; // Silver/White
                 ctx.fillRect(bLx, bCy, barW, barH/2);

                 // Right Side
                 ctx.fillStyle = '#E31837';
                 ctx.fillRect(bRx, bCy - barH/2, barW, barH/2);
                 ctx.fillStyle = '#C4CED4';
                 ctx.fillRect(bRx, bCy, barW, barH/2);
             }

             ctx.restore();
        }

        // --- Details (on top of everything) ---
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(cx - waistW/2, waistY, waistW, 5*scale);

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1*scale;
        ctx.beginPath(); ctx.moveTo(cx - hipW/2, waistY); ctx.quadraticCurveTo(cx - hipW/2, waistY + h*0.5, cx - hipW/2, bottomY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + hipW/2, waistY); ctx.quadraticCurveTo(cx + hipW/2, waistY + h*0.5, cx + hipW/2, bottomY); ctx.stroke();

        // FOLDS (High Graphics)
        if (playerData.graphics === 'HIGH' && skinObj.shortsType !== 'kilt') {
             ctx.save();
             // Re-trace path for clipping
             ctx.beginPath();
             ctx.moveTo(cx - waistW/2, waistY); ctx.lineTo(cx + waistW/2, waistY);
             ctx.quadraticCurveTo(cx + hipW/2, waistY + h*0.2, cx + hipW/2, bottomY);
             ctx.lineTo(cx + hipW/2 - legW, bottomY);
             ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx, crotchY);
             ctx.quadraticCurveTo(cx, crotchY + h*0.2, cx - hipW/2 + legW, bottomY);
             ctx.lineTo(cx - hipW/2, bottomY);
             ctx.quadraticCurveTo(cx - hipW/2, waistY + h*0.2, cx - waistW/2, waistY);
             ctx.closePath();
             ctx.clip();

             ctx.globalCompositeOperation = 'source-over';
             // Crotch Creases
             ctx.strokeStyle = 'rgba(0,0,0,0.15)';
             ctx.lineWidth = 1.5 * scale;
             ctx.lineCap = 'round';

             ctx.beginPath();
             ctx.moveTo(cx, crotchY);
             ctx.quadraticCurveTo(cx - hipW*0.2, crotchY + h*0.1, cx - hipW*0.3, bottomY - 5*scale);
             ctx.stroke();

             ctx.beginPath();
             ctx.moveTo(cx, crotchY);
             ctx.quadraticCurveTo(cx + hipW*0.2, crotchY + h*0.1, cx + hipW*0.3, bottomY - 5*scale);
             ctx.stroke();

             // Side Bunching
             ctx.beginPath();
             ctx.moveTo(cx - waistW/2, waistY + 10*scale);
             ctx.lineTo(cx - waistW/2 + 10*scale, waistY + 15*scale);
             ctx.stroke();

             ctx.beginPath();
             ctx.moveTo(cx + waistW/2, waistY + 10*scale);
             ctx.lineTo(cx + waistW/2 - 10*scale, waistY + 15*scale);
             ctx.stroke();

             ctx.restore();
        }

        if(skinObj.trimColor) {
            ctx.strokeStyle = skinObj.trimColor;
            ctx.lineWidth = 2 * scale;
            ctx.beginPath(); ctx.moveTo(cx - hipW/2, bottomY); ctx.lineTo(cx - hipW/2 + legW, bottomY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + hipW/2 - legW, bottomY); ctx.lineTo(cx + hipW/2, bottomY); ctx.stroke();
        }
    }

    function drawHybridHead(p, headY, headRadius, s, type, skinObj) {
        const skinTone = skinObj.skinTone || skinObj.furColor || '#8d5524';
        const furColor = skinObj.furColor || skinTone;

        if (type === 'bull') {
            drawFuzzyCircle(p.x, headY, headRadius * 1.2, furColor, 200, s, true);
            ctx.fillStyle = '#3E2723';
            ctx.beginPath(); ctx.ellipse(p.x, headY + 5*s, 8*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x - 20*s, headY - 10*s, p.x - 15*s, headY - 25*s); ctx.lineTo(p.x - 12*s, headY - 5*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x + 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x + 20*s, headY - 10*s, p.x + 15*s, headY - 25*s); ctx.lineTo(p.x + 12*s, headY - 5*s); ctx.fill();
            ctx.fillStyle = furColor;
            ctx.beginPath(); ctx.ellipse(p.x - 15*s, headY, 6*s, 3*s, 0.2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + 15*s, headY, 6*s, 3*s, -0.2, 0, Math.PI*2); ctx.fill();
        }
        else if (type === 'jackal') {
            ctx.fillStyle = furColor;
            ctx.beginPath(); ctx.moveTo(p.x - 5*s, headY - 10*s); ctx.lineTo(p.x - 15*s, headY - 25*s); ctx.lineTo(p.x - 15*s, headY - 5*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x + 5*s, headY - 10*s); ctx.lineTo(p.x + 15*s, headY - 25*s); ctx.lineTo(p.x + 15*s, headY - 5*s); ctx.fill();
            drawFuzzyCircle(p.x, headY, headRadius, furColor, 201, s, true);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p.x, headY + 5*s, 4*s, 0, Math.PI*2); ctx.fill();
        }
        else if (type === 'bandicoot') {
            ctx.fillStyle = furColor;
            ctx.beginPath(); ctx.moveTo(p.x - 5*s, headY - 10*s); ctx.lineTo(p.x - 12*s, headY - 20*s); ctx.lineTo(p.x - 10*s, headY); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x + 5*s, headY - 10*s); ctx.lineTo(p.x + 12*s, headY - 20*s); ctx.lineTo(p.x + 10*s, headY); ctx.fill();
            drawFuzzyCircle(p.x, headY - 2*s, headRadius, furColor, 202, s, true);
            ctx.fillStyle = '#FF00FF';
            for(let i=0; i<4; i++) {
                ctx.beginPath(); ctx.arc(p.x, headY - 15*s - i*5*s, 5*s, 0, Math.PI*2); ctx.fill();
            }
        }
        else if (type === 'yeti') {
            drawFuzzyCircle(p.x, headY, headRadius * 1.3, '#FFF', 203, s, true);
            ctx.fillStyle = '#ADD8E6';
            ctx.beginPath(); ctx.arc(p.x, headY, 8*s, 0, Math.PI*2); ctx.fill();
        }
        else if (type === 'cyclops') {
            ctx.fillStyle = skinTone;
            ctx.beginPath(); ctx.arc(p.x, headY, headRadius * 1.2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(p.x - 15*s, headY - 5*s, 30*s, 5*s);
        }
    }

    function isTwoHandedStyle(styleId) {
        if (!styleId) return true; // Default classic
        // List of styles that are NOT standard two-handed jump shots
        const nonTwoHanded = [
            'granny', 'bowling', 'hadouken', 'tpose', 'airbud', 'telekinesis', 'peekaboo',
            'soccer', 'shot_put', 'dab', 'helicopter', 'prayer', 'spirit_bomb', 'kareem',
            'hook', 'one_hand'
        ];
        return !nonTwoHanded.includes(styleId);
    }

    function calculateBallPosition(wristX, wristY, s, fAngle, wristAngle) {
        const theta = fAngle + wristAngle;
        return {
            x: wristX - Math.sin(theta) * 5 * s,
            y: wristY + Math.cos(theta) * 5 * s
        };
    }

    function solveIK(sx, sy, tx, ty, l1, l2, isLefty) {
        const dx = tx - sx;
        const dy = ty - sy;
        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);

        if (dist >= l1 + l2 - 0.01) {
            const angle = Math.atan2(dx, dy); // 0 is down
            return { uAngle: angle, fAngle: angle };
        }

        const cosAlpha = (l1*l1 + distSq - l2*l2) / (2 * l1 * dist);
        const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
        const baseAngle = Math.atan2(dx, dy);

        // Choose bend direction.
        // For standard basketball stance, elbows usually flare OUT.
        // If Right Hand Shooter: Left Arm (Guide) is 'behind' or 'left'. Elbow points Left (-X).
        // If Left Hand Shooter: Right Arm (Guide) is 'behind' or 'right'. Elbow points Right (+X).
        // Base Vector (Shoulder -> Ball) is usually Up/Forward.
        // If Righty: Left Shoulder to Ball. Vector is Up/Right.
        // We want Elbow to be "Left" of that vector.
        // Cross Product check or just try +/- alpha.
        // -Alpha usually rotates counter-clockwise (Left in standard math, but here 0 is down... confusing).
        // Let's stick with -alpha and see.

        let theta = baseAngle - alpha;
        if (isLefty) theta = baseAngle + alpha; // Flip for lefty shooter's guide arm (Right arm)?

        // Elbow position
        const ex = sx + Math.sin(theta) * l1;
        const ey = sy + Math.cos(theta) * l1;

        const fAngle = Math.atan2(tx - ex, ty - ey);

        return { uAngle: theta, fAngle: fAngle };
    }

    // --- SEEDED RANDOM HELPER ---
    // --- HAIR RENDERER HELPERS ---
    function adjustColor(color, percent) {
        if (!color) return color;
        if (color.startsWith('#')) {
            let hex = color.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            const num = parseInt(hex, 16);
            const amt = Math.round(2.55 * percent);
            let R = (num >> 16) + amt;
            let G = (num >> 8 & 0x00FF) + amt;
            let B = (num & 0x0000FF) + amt;
            R = (R<255)?((R<0)?0:R):255;
            G = (G<255)?((G<0)?0:G):255;
            B = (B<255)?((B<0)?0:B):255;
            return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
        }
        return color;
    }

    function createHairGradient(ctx, x, y, r, color) {
         if (!color || !color.startsWith('#')) return color;
         const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
         grad.addColorStop(0, adjustColor(color, 40));
         grad.addColorStop(0.5, color);
         grad.addColorStop(1, adjustColor(color, -20));
         return grad;
    }

    // A simple hash function for strings to numbers
    function stringToSeed(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    function seededRandom(seed) {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
