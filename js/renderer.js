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

    // Boat System
    class BoatSystem {
        constructor() {
            this.boats = [];
            this.timer = 0;
            // Pre-populate
            for(let i=0; i<5; i++) this.spawnBoat(true);
        }

        spawnBoat(randomX = false) {
            const isLeft = Math.random() > 0.5;
            const u = randomX ? Math.random() : (isLeft ? -0.1 : 1.1);
            const v = Math.random(); // 0 (horizon) to 1 (pole)
            const speed = (0.05 + Math.random() * 0.05) * (isLeft ? 1 : -1);

            const types = ['sailboat', 'canoe', 'duck'];
            const type = types[Math.floor(Math.random() * types.length)];

            this.boats.push({
                u: u,
                v: v,
                speed: speed,
                type: type,
                wobbleOffset: Math.random() * Math.PI * 2
            });
        }

        update(dt) {
            this.timer += dt;
            if (this.timer > 120) {
                if (Math.random() < 0.3) this.spawnBoat();
                this.timer = 0;
            }

            for (let i = this.boats.length - 1; i >= 0; i--) {
                let b = this.boats[i];
                b.u += b.speed * 0.005 * dt;
                if (b.u < -0.2 || b.u > 1.2) {
                    this.boats.splice(i, 1);
                }
            }
        }

        draw(ctx, horizonY, riverBottomY, vpW) {
            const riverH = riverBottomY - horizonY;
            if (riverH <= 0) return;

            // Draw River Base
            const grad = ctx.createLinearGradient(0, horizonY, 0, riverBottomY);
            grad.addColorStop(0, '#87CEEB');
            grad.addColorStop(1, '#1E90FF');
            ctx.fillStyle = grad;
            ctx.fillRect(0, horizonY, vpW, riverH);

            // Sparkles
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for(let i=0; i<10; i++) {
                const time = Date.now() * 0.001;
                const x = (Math.sin(i * 132 + time) * 0.5 + 0.5) * vpW;
                const y = horizonY + (Math.cos(i * 54 + time) * 0.5 + 0.5) * riverH;
                if (Math.random() > 0.95) ctx.fillRect(x, y, 2, 2);
            }

            const sorted = this.boats.slice().sort(function(a,b){ return a.v - b.v; });

            sorted.forEach(function(b) {
                const y = horizonY + b.v * riverH;
                const x = b.u * vpW;
                const scale = 0.3 + b.v * 0.7;
                const size = 30 * scale;
                const wobble = Math.sin(Date.now() * 0.005 + b.wobbleOffset) * 2 * scale;
                const by = y + wobble;

                ctx.save();
                ctx.translate(x, by);
                if (b.speed < 0) ctx.scale(-1, 1);

                if (b.type === 'sailboat') {
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.moveTo(-size/2, 0); ctx.quadraticCurveTo(0, size/2, size/2, 0); ctx.fill();
                    ctx.fillStyle = '#EEE';
                    ctx.beginPath(); ctx.moveTo(0, -size/4); ctx.lineTo(0, -size); ctx.lineTo(size/2, -size/3); ctx.fill();
                    ctx.strokeStyle = '#555'; ctx.lineWidth = 1*scale;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -size); ctx.stroke();
                } else if (b.type === 'canoe') {
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath(); ctx.ellipse(0, 0, size/2, size/6, 0, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(0, -size/6, size/8, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath(); ctx.ellipse(0, 0, size/3, size/5, 0, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(size/4, -size/6, size/6, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = 'orange';
                    ctx.beginPath(); ctx.moveTo(size/3, -size/6); ctx.lineTo(size/2, -size/6); ctx.stroke(); // Beak
                }
                ctx.restore();
            });
        }
    }

    const boatSystem = new BoatSystem();

    function drawBroadcastLowerThird() {
        const h = 60; // Reduced height
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

        // NBA Logo (Bottom Left Corner) - Scaled down
        const lX = 20; const lY = canvas.height - 30;
        const lW = 10; const lH = 20;

        ctx.fillStyle = '#C9082A'; // Red
        ctx.fillRect(lX, lY - lH/2, lW, lH);
        ctx.fillStyle = '#17408B'; // Blue
        ctx.fillRect(lX + lW, lY - lH/2, lW, lH);

        // Silhouette (Simple curve) - Adjusted for smaller size
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(lX + lW + 1, lY + lH/2 - 1);
        ctx.lineTo(lX + lW - 2, lY - lH/2 + 3);
        ctx.quadraticCurveTo(lX + lW, lY - lH/2, lX + lW + 3, lY - lH/2 + 3);
        ctx.lineTo(lX + lW + 1, lY + lH/2 - 1);
        ctx.fill();
        ctx.beginPath(); ctx.arc(lX + lW + 4, lY - lH/2 + 5, 1.5, 0, Math.PI*2); ctx.fill(); // Ball

        // 2. Content Logic
        const dist = 10 + (distanceLevel * 5);
        const scaleObj = getScaleObject(dist);

        // Fonts (using Canvas fonts that match CSS imports)
        const fontTitle = "bold 10px 'Roboto Condensed', 'Arial Narrow', sans-serif";
        const fontValue = "bold 22px 'Russo One', 'Impact', sans-serif";
        const fontIcon = "28px Arial";

        // Center Separator
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(canvas.width / 2, y + 10); ctx.lineTo(canvas.width / 2, canvas.height - 10); ctx.stroke();

        const rowTitleY = y + 20;
        const rowValueY = y + 48;

        if (currentGameMode === 'CLASSIC') {
            // LEFT SIDE: Record & Current Distance
            // Record
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RECORD", canvas.width / 2 - 180, rowTitleY);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(playerData.highScore + " ft", canvas.width / 2 - 180, rowValueY);

            // Current Distance
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("CURRENT DISTANCE", canvas.width / 2 - 25, rowTitleY);
            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText(dist + " ft", canvas.width / 2 - 25, rowValueY);

            // RIGHT SIDE: Comparison
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCALE EQUIVALENT", canvas.width / 2 + 25, rowTitleY);

            // Icon
            ctx.textAlign = "center"; ctx.font = fontIcon;
            const iconX = canvas.width / 2 + 45;
            ctx.fillText(scaleObj.icon, iconX, rowValueY);

            // Name
            ctx.textAlign = "left";
            ctx.fillStyle = "#FFD700"; // Gold
            ctx.font = "bold 18px 'Roboto Condensed', sans-serif";
            ctx.fillText(scaleObj.name.toUpperCase(), iconX + 25, rowValueY - 2);
        }
        else if (currentGameMode === 'CONTEST') {
            const time = Math.ceil(contestData.timer);

            // LEFT SIDE: TIME & SCORE
            // Time
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("TIME", canvas.width / 2 - 180, rowTitleY);
            ctx.fillStyle = time <= 10 ? "#D32F2F" : "#fff"; ctx.font = fontValue;
            ctx.fillText(time, canvas.width / 2 - 180, rowValueY);

            // Score
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCORE", canvas.width / 2 - 25, rowTitleY);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(contestData.score, canvas.width / 2 - 25, rowValueY);

            // RIGHT SIDE: RACK
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RACK", canvas.width / 2 + 25, rowTitleY);

            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText(contestData.rack + " / 5", canvas.width / 2 + 25, rowValueY);
        }
        else if (currentGameMode === 'TIME_ATTACK') {
            const time = Math.ceil(timeAttackData.timer);

            // LEFT SIDE: TIME & SCORE
            // Time
            ctx.textAlign = "right";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("TIME", canvas.width / 2 - 180, rowTitleY);
            ctx.fillStyle = time <= 10 ? "#D32F2F" : "#fff"; ctx.font = fontValue;
            ctx.fillText(time, canvas.width / 2 - 180, rowValueY);

            // Score
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("SCORE", canvas.width / 2 - 25, rowTitleY);
            ctx.fillStyle = "#FFD700"; ctx.font = fontValue;
            ctx.fillText(timeAttackData.score, canvas.width / 2 - 25, rowValueY);

            // RIGHT SIDE: RECORD
            ctx.textAlign = "left";
            ctx.fillStyle = "#aaa"; ctx.font = fontTitle;
            ctx.fillText("RECORD", canvas.width / 2 + 25, rowTitleY);

            ctx.fillStyle = "#fff"; ctx.font = fontValue;
            ctx.fillText((playerData.timeAttackHighScore || 0), canvas.width / 2 + 25, rowValueY);
        }

        // Live Indicator
        ctx.fillStyle = "#D32F2F"; ctx.fillRect(20, y + 10, 6, 6);
        ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "left";
        ctx.fillText("LIVE", 30, y + 16);
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
    function drawFuzzyPath(points, color, scale, close = true, seed = 1, justPath = false) {
        if(points.length < 2) return;
        ctx.beginPath();
        const fuzz = 3 * scale;

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            if (!close && i === points.length - 1) break;

            const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
            const segments = Math.max(2, Math.floor(dist / (8 * scale)));

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
    // Precomputed unit circle for performance (replaces trig in drawFuzzyCircle)
    const g_circleCos = new Float32Array(CIRCLE_SEGS);
    const g_circleSin = new Float32Array(CIRCLE_SEGS);
    for(let i=0; i<CIRCLE_SEGS; i++) {
        g_circlePoints.push({x: 0, y: 0});
        const a = (i/CIRCLE_SEGS)*Math.PI*2;
        g_circleCos[i] = Math.cos(a);
        g_circleSin[i] = Math.sin(a);
    }

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
            // Use precomputed lookup (faster than Math.cos/sin)
            const p = g_circlePoints[i];
            p.x = cx + g_circleCos[i]*r;
            p.y = cy + g_circleSin[i]*r;
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

    var ShadowCache = {
        entries: {},
        keys: [],
        MAX_ENTRIES: 128,
        get: function(key) {
            var entry = this.entries[key];
            if (entry) {
                // Move to end of keys for LRU-ish behavior
                var idx = this.keys.indexOf(key);
                if (idx > -1) {
                    this.keys.splice(idx, 1);
                    this.keys.push(key);
                }
                return entry;
            }
            return null;
        },
        set: function(key, canvas) {
            if (this.entries[key]) return;
            if (this.keys.length >= this.MAX_ENTRIES) {
                var oldKey = this.keys.shift();
                delete this.entries[oldKey];
            }
            this.entries[key] = canvas;
            this.keys.push(key);
        }
    };

    function getShadowKey(type, obj) {
        if (type === 'player') {
            var skin = playerData.currentSkin;
            var variant = (playerData.skinVariants && playerData.skinVariants[skin]) ? playerData.skinVariants[skin] : 0;
            var anim = g_animState;
            var q = 20; // Quantization factor
            var key = 'p_' + skin + '_v' + variant + '_' + (playerData.isLefty ? 'L' : 'R') + '_' +
                Math.round(anim.la * q) + '_' + Math.round(anim.ra * q) + '_' +
                Math.round(anim.lfa * q) + '_' + Math.round(anim.rfa * q) + '_' +
                Math.round(anim.w * q) + '_' + Math.round(anim.la_z * q) + '_' +
                Math.round(anim.ra_z * q) + '_' + Math.round(anim.lfa_z * q) + '_' +
                Math.round(anim.rfa_z * q) + '_' + Math.round(obj.scale * 50);
            return key;
        } else if (type === 'ball') {
            var targetBall = obj.ballRef || ball;
            var ballId = targetBall.id || 'classic';
            var rot = targetBall.rotationX || 0;
            var key = 'b_' + ballId + '_' + Math.round(rot * 10) + '_' + Math.round(obj.scale * 50);
            return key;
        }
        return null;
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
        render: function(drawFn, x, y, cacheKey) {
            if (cacheKey) {
                var cached = ShadowCache.get(cacheKey);
                if (cached) return cached;
            }

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

            if (cacheKey) {
                var cachedCanvas = document.createElement('canvas');
                cachedCanvas.width = 512;
                cachedCanvas.height = 512;
                cachedCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
                ShadowCache.set(cacheKey, cachedCanvas);
                return cachedCanvas;
            }

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
        var cacheKey = getShadowKey(type, obj);
        var sCanvas = ShadowSystem.render(function() {
            if (type === 'player') {
                drawPlayer(obj);
            } else if (type === 'ball') {
                drawBall(obj, obj.ballRef);
            }
        }, obj.x, obj.y, cacheKey);

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

        // Rim Circle
        const rimPoints = [];
        const segs = 24;
        for(let i=0; i<segs; i++) {
            const a = (i/segs) * Math.PI * 2;
            const rx = Math.cos(a) * rimRadius;
            const ry = Math.sin(a) * rimRadius;
            rimPoints.push({ x: rimX + rx, y: rimY + ry, z: rimZ });
        }

        // Net Bottom Ring
        const netPointsBot = [];
        const netLen = 35;
        const netBotRad = 12;
        const netSegs = 12;
        for(let i=0; i<netSegs; i++) {
             const a = (i/netSegs) * Math.PI * 2;
             netPointsBot.push({
                 x: rimX + Math.cos(a)*netBotRad,
                 y: rimY + Math.sin(a)*netBotRad,
                 z: rimZ - netLen
             });
        }

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
            const grad = ctx.createLinearGradient(0, -w, 0, w);
            grad.addColorStop(0, 'rgba(0,0,0,0.6)');
            grad.addColorStop(0.2, 'rgba(0,0,0,0.1)');
            grad.addColorStop(0.35, 'rgba(255,255,255,0.35)'); // Sharp Highlight (Wet skin)
            grad.addColorStop(0.55, 'rgba(255,255,255,0.05)');
            grad.addColorStop(0.85, 'rgba(0,0,0,0.3)');
            grad.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = grad;
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

    function drawRealisticShoe(x, y, w, h, color, isRight, type, detailColor, shiny) {
        // Defaults
        type = type || 'sneakers';
        const soleColor = (type === 'boots' || type === 'dress') ? '#111' : '#DDD';

        ctx.save();
        ctx.translate(x, y);
        if(!isRight) ctx.scale(-1, 1); // Mirror for left foot if asymmetrical, but feet are usually symmetric in back view

        // 1. SOLE
        if(type !== 'socks' && type !== 'bare') {
            ctx.fillStyle = soleColor;
            if(type === 'cleats') ctx.fillStyle = '#FFF';

            ctx.beginPath();
            if(type === 'heels') {
                ctx.ellipse(0, h*0.4, w*0.3, h*0.3, 0, 0, Math.PI*2); // Heel
                ctx.fill();
                ctx.beginPath(); ctx.ellipse(0, h*0.1, w*0.9, h*0.3, 0, 0, Math.PI*2); // Sole
            } else {
                ctx.ellipse(0, h*0.2, w, h*0.4, 0, 0, Math.PI*2);
            }
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
        }

        // 2. UPPER
        ctx.fillStyle = color;

        if (type === 'sandals' || type === 'slides') {
            // Straps only
            // Foot skin should be drawn by drawLowerLeg beforehand?
            // drawLowerLeg draws the "ankle/foot" blob if shoesColor is passed.
            // But if we have sandals, we want skin visible.
            // Current drawLowerLeg logic: if(shoesColor) drawRealisticShoe... else drawFuzzyCircle(paw).
            // We'll handle skin in drawLowerLeg update. Here we just draw straps.

            ctx.fillStyle = color;
            if(type === 'slides') {
                ctx.fillRect(-w*0.8, -h*0.3, w*1.6, h*0.6); // Strap across
            } else {
                // Sandals
                ctx.beginPath(); ctx.rect(-w*0.8, -h*0.2, w*1.6, h*0.3); ctx.fill();
                ctx.beginPath(); ctx.rect(-w*0.2, -h*0.5, w*0.4, h); ctx.fill();
            }
        }
        else if (type === 'boots') {
            // High top
            ctx.beginPath();
            ctx.moveTo(-w*0.7, -h*1.2);
            ctx.lineTo(w*0.7, -h*1.2);
            ctx.lineTo(w*0.9, h*0.2);
            ctx.lineTo(-w*0.9, h*0.2);
            ctx.fill();
        }
        else if (type === 'hightop') {
            // High sneakers (Jordan style)
            ctx.beginPath();
            ctx.moveTo(-w*0.6, -h*1.0);
            ctx.lineTo(w*0.6, -h*1.0);
            ctx.quadraticCurveTo(w*1.0, 0, w*0.8, h*0.2);
            ctx.quadraticCurveTo(0, h*0.4, -w*0.8, h*0.2);
            ctx.quadraticCurveTo(-w*1.0, 0, -w*0.6, -h*1.0);
            ctx.fill();

            // Detail (Swoosh/Logo)
            if (detailColor) {
                ctx.fillStyle = detailColor;
                ctx.beginPath(); ctx.arc(w*0.3, -h*0.2, w*0.2, 0, Math.PI*2); ctx.fill();
            }
        }
        else if (type === 'heels') {
            // Pointy
            ctx.beginPath();
            ctx.moveTo(-w*0.5, -h*0.5);
            ctx.lineTo(w*0.5, -h*0.5);
            ctx.lineTo(0, h*0.3);
            ctx.fill();
        }
        else {
            // Standard Sneakers / Dress / Clogs
            ctx.beginPath();
            ctx.arc(0, -h*0.1, w*0.9, 0, Math.PI*2);
            ctx.fill();

            if(type === 'clogs') {
                // Holes
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.arc(-w*0.3, -h*0.2, w*0.1, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(w*0.3, -h*0.2, w*0.1, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(0, 0, w*0.1, 0, Math.PI*2); ctx.fill();
            }
        }

        // Laces / Details
        if (type === 'sneakers' || type === 'hightop' || type === 'boots' || type === 'cleats') {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-w*0.4, -h*0.4); ctx.lineTo(w*0.4, -h*0.4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-w*0.4, -h*0.2); ctx.lineTo(w*0.4, -h*0.2); ctx.stroke();
        }

        // Shine
        if (shiny) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.ellipse(-w*0.3, -h*0.4, w*0.2, h*0.1, -0.5, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
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

    function drawBeard(ctx, p, headY, headRadius, s, skinObj) {
        if (!skinObj.beard) return;

        const beardColor = skinObj.beardColor || skinObj.hairColor || '#000';
        const isBig = skinObj.beardBig; // For Harden
        const seed = stringToSeed(skinObj.id || 'beard');

        // Improved Beard Geometry: Smooth, Full, Groomed
        let lengthMult = 1.3;
        let widthMult = 1.1;

        if (isBig) {
            widthMult = 1.35;
            lengthMult = 1.6;
        }

        const beardW = headRadius * widthMult;
        const beardLen = headRadius * lengthMult;
        const jawY = headY + headRadius * 0.6;

        ctx.fillStyle = beardColor;
        ctx.beginPath();

        // 1. Left Sideburn (Top)
        ctx.moveTo(p.x - headRadius * 0.9, headY);

        // 2. Left Jaw Curve (Fullness)
        // Bulge out slightly before curving in
        ctx.quadraticCurveTo(p.x - beardW, jawY, p.x - beardW * 0.6, headY + beardLen * 0.85);

        // 3. Chin (Rounded bottom)
        ctx.quadraticCurveTo(p.x, headY + beardLen, p.x + beardW * 0.6, headY + beardLen * 0.85);

        // 4. Right Jaw Curve
        ctx.quadraticCurveTo(p.x + beardW, jawY, p.x + headRadius * 0.9, headY);

        // 5. Close Top (Behind Head)
        ctx.quadraticCurveTo(p.x, headY - 10*s, p.x - headRadius * 0.9, headY);

        ctx.fill();

        // Internal Texture (Fullness/Noise) - Clipped
        ctx.save();
        ctx.clip();

        // Shading Gradient (Bottom darker)
        const grad = ctx.createLinearGradient(0, headY, 0, headY + beardLen);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Noise Texture
        ctx.fillStyle = adjustColor(beardColor, 20); // Lighter dots for texture
        const density = 20;
        for(let i=0; i<density; i++) {
            const rx = (seededRandom(seed + i) - 0.5) * beardW * 2;
            const ry = (seededRandom(seed + i + 100)) * beardLen;
            // Simple check if inside approx box
            if (Math.abs(rx) < beardW && ry > 0) {
                ctx.beginPath(); ctx.arc(p.x + rx, headY + ry, 1*s, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    }

    function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        let hairColor = skinObj.hairColor || '#000';
        let style = skinObj.hairStyle;
        const hairScale = skinObj.hairScale || 1.0;

        // Lift hair by 20% of head radius
        headY -= headRadius * 0.2;

        // Custom Hairstyle Override (Gameplay)
        if (typeof playerData !== 'undefined' && playerData.customHairstyle && playerData.customHairstyle !== 'default') {
            style = playerData.customHairstyle;
        }

        // Shop Preview Override
        if (typeof state !== 'undefined' && state === 'SHOP' && typeof viewingHairstyleIndex !== 'undefined' && typeof HAIRSTYLES !== 'undefined') {
             const preview = HAIRSTYLES[viewingHairstyleIndex];
             if (preview && preview.id !== 'default') {
                 style = preview.id;
             }
        }

        // Derive a stable seed from the skin ID and render position (optional, but skin ID is best for static texture)
        let baseSeed = stringToSeed(skinObj.id || 'default');

        // Apply Hair Size Modifier to rendering radius
        const modRadius = headRadius * hairScale;

        // Common base for most styles (scalp coverage)
        // Note: 'p.x' is center X. 'headY' is center Y of skull.

        if (style === 'bald') {
             // Shiny scalp
             if (hairColor && hairColor !== '#000' && hairColor !== skinObj.skinTone) {
                 ctx.fillStyle = hairColor;
                 ctx.globalAlpha = 0.2;
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();
                 ctx.globalAlpha = 1.0;
             }
             const shine = ctx.createRadialGradient(p.x + headRadius*0.3, headY - headRadius*0.4, 0, p.x + headRadius*0.3, headY - headRadius*0.4, headRadius*0.4);
             shine.addColorStop(0, 'rgba(255,255,255,0.4)');
             shine.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = shine;
             ctx.beginPath();
             ctx.ellipse(p.x + headRadius*0.3, headY - headRadius*0.4, headRadius*0.3, headRadius*0.2, -0.5, 0, Math.PI*2);
             ctx.fill();
             return;
        }

        if (style === 'short') {
             // Modern Fade: Sharp top, faded sides/back
             const r = modRadius * 1.02;
             // Vertical Gradient for fade
             const fadeGrad = ctx.createLinearGradient(0, headY - r, 0, headY + r * 1.2);
             fadeGrad.addColorStop(0, hairColor);
             fadeGrad.addColorStop(0.5, hairColor);
             fadeGrad.addColorStop(1, 'rgba(0,0,0,0)'); // Fade to transparent

             ctx.fillStyle = fadeGrad;
             ctx.beginPath();

             // Textured Top (Subtle bumps for buzz cut)
             const numBumps = 30; // More bumps = smoother/tighter for straight hair
             for(let i=0; i<=numBumps; i++) {
                 const angle = Math.PI + (i / numBumps) * Math.PI;
                 const rnd = seededRandom(baseSeed + i);
                 const nr = r + (rnd * 0.8 * s); // Smaller variation than curly
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = (headY - 2*s) + Math.sin(angle) * nr;
                 if (i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }

             // Tapered sides
             ctx.lineTo(p.x + r, headY + 3*s);
             ctx.quadraticCurveTo(p.x + r, headY + 8*s, p.x + r * 0.6, headY + 8*s); // Sideburn curve in
             // Neckline - Lowered and Rounded (Natural "U")
             ctx.quadraticCurveTo(p.x, headY + 9*s, p.x - r * 0.6, headY + 8*s);
             ctx.quadraticCurveTo(p.x - r, headY + 8*s, p.x - r, headY + 3*s);
             ctx.lineTo(p.x - r, headY - 2*s);
             ctx.fill();

             // Internal Texture (Stubble Dots)
             ctx.fillStyle = adjustColor(hairColor, 15);
             for(let i=0; i<40; i++) { // Dense stubble
                 const rnd1 = seededRandom(baseSeed + 300 + i);
                 const rnd2 = seededRandom(baseSeed + 400 + i);
                 const tx = p.x + (rnd1-0.5) * r * 1.8;
                 const ty = headY - 2*s + (rnd2-0.5) * r * 1.2;
                 // Clip circle check
                 if (Math.sqrt((tx-p.x)**2 + (ty-(headY-2*s))**2) < r) {
                     ctx.beginPath(); ctx.arc(tx, ty, 0.8*s, 0, Math.PI*2); ctx.fill();
                 }
             }
             return;
        }







        if (style === 'cornrows') {
             // Tight braids logic (Allen Iverson Style - Close to Scalp)
             // Cornrows don't scale much outwards, but we can scale pattern
             const r = modRadius * 1.0;

             // Base scalp (darkened skin or hair color base)
             ctx.fillStyle = adjustColor(hairColor, -10);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             const numRows = 7;
             const braidWidth = 3 * s;

             for(let i=0; i<numRows; i++) {
                 // Perspective: Rows converge towards the neck slightly
                 const t = (i / (numRows - 1)) * 2 - 1; // -1 to 1 (Left to Right)
                 const absT = Math.abs(t);

                 // Top Point (Spread out) - Rounded Dome Profile
                 // Start X spread across the top
                 const startX = p.x + t * (r * 0.9);

                 // Start Y calculated using circular arc to ensure roundness (no triangle)
                 // x^2 + y^2 = r^2 -> y = sqrt(r^2 - x^2)
                 // We lift it slightly (1.05) to sit on top of the skull
                 const xOffset = t * (r * 0.9);
                 const yDist = Math.sqrt(Math.max(0, (r * 1.05)**2 - xOffset**2));
                 const startY = headY - yDist;

                 // Bottom Point (Converging at nape)
                 const endX = p.x + t * (r * 0.3); // Converge tighter
                 const endY = headY + r * 0.95;

                 // Control Points - follow head sphere closely
                 // CP1 (Upper Head): Keep tight to skull surface, NO outward flare
                 const cp1x = p.x + t * (r * 0.95);
                 const cp1y = headY - r * 0.3; // Upper back of head

                 // CP2 (Lower Head/Nape): Taper in
                 const cp2x = p.x + t * (r * 0.6);
                 const cp2y = headY + r * 0.6;

                 // Draw Braid Path
                 // Shadow/Gap
                 ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                 ctx.lineWidth = braidWidth + 1*s;
                 ctx.lineCap = 'round';
                 ctx.beginPath(); ctx.moveTo(startX, startY); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();

                 // Braid Body
                 ctx.strokeStyle = hairColor;
                 ctx.lineWidth = braidWidth;
                 ctx.beginPath(); ctx.moveTo(startX, startY); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();

                 // Braid Texture
                 ctx.fillStyle = adjustColor(hairColor, 30); // Highlight
                 const steps = 12;
                 for(let j=0; j<=steps; j++) {
                     const tt = j/steps;
                     const inv = 1 - tt;
                     const bx = inv*inv*inv*startX + 3*inv*inv*tt*cp1x + 3*inv*tt*tt*cp2x + tt*tt*tt*endX;
                     const by = inv*inv*inv*startY + 3*inv*inv*tt*cp1y + 3*inv*tt*tt*cp2y + tt*tt*tt*endY;
                     ctx.beginPath(); ctx.arc(bx, by, 1*s, 0, Math.PI*2); ctx.fill();
                 }
             }

             // Headband (Team Color)
             const bandColor = skinObj.headbandColor || skinObj.jerseyColor || '#FFF';
             const bandY = headY - 1*s; // Lower
             const bandH = 3*s; // Thinner

             ctx.fillStyle = bandColor;
             ctx.beginPath();
             // Band follows curvature around back of head (over braids)
             ctx.ellipse(p.x, bandY, r + 2*s, bandH, 0, 0, Math.PI*2);
             ctx.fill();

             // Texture/Detail on headband
             ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.ellipse(p.x, bandY, r + 2*s, bandH, 0, 0, Math.PI*2); ctx.stroke();

             return;
        }

        if (style === 'mohawk') {
             // Shaved sides (Fade) - Draw fading scalp first
             const r = headRadius * 1.0;
             const fadeGrad = ctx.createLinearGradient(0, headY - r, 0, headY + r);
             fadeGrad.addColorStop(0, adjustColor(skinObj.skinTone, -10));
             fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.fillStyle = fadeGrad;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             // Draw Central Strip
             const stripW = 8 * s;
             const stripTopY = headY - headRadius * 1.4;
             const stripBotY = headY + headRadius * 1.0;

             // Strip Gradient
             const grad = ctx.createLinearGradient(0, stripTopY, 0, stripBotY);
             grad.addColorStop(0, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -20));
             ctx.fillStyle = grad;

             ctx.beginPath();
             // Top Texture
             const numSpikes = 10;
             for(let i=0; i<=numSpikes; i++) {
                 const angle = Math.PI + (i/numSpikes)*Math.PI; // Top arc
                 const rnd = seededRandom(baseSeed + i);
                 const nr = (stripW/2) + (rnd * 2 * s);
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = stripTopY + Math.sin(angle) * (stripW/4); // Flattened top
                 if(i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }
             ctx.lineTo(p.x + stripW/2, stripBotY);
             // Rounded bottom
             ctx.arc(p.x, stripBotY, stripW/2, 0, Math.PI);
             ctx.lineTo(p.x - stripW/2, stripTopY); // Close loop
             ctx.fill();

             // Internal Texture
             ctx.fillStyle = adjustColor(hairColor, 20);
             for(let i=0; i<10; i++) {
                 const rnd = seededRandom(baseSeed + 700 + i);
                 const tx = p.x + (rnd-0.5) * stripW;
                 const ty = stripTopY + (seededRandom(baseSeed+800+i) * (stripBotY - stripTopY));
                 ctx.beginPath(); ctx.arc(tx, ty, 1*s, 0, Math.PI*2); ctx.fill();
             }
             return;
        }

        if (style === 'straight' || style === 'long') {
             // Straight hair falling down
             const len = (style === 'long') ? 25*s : 10*s;
             const w = headRadius * 1.1;

             const grad = ctx.createLinearGradient(0, headY - headRadius, 0, headY + len);
             grad.addColorStop(0, adjustColor(hairColor, 20));
             grad.addColorStop(1, adjustColor(hairColor, -20));
             ctx.fillStyle = grad;

             ctx.beginPath();
             // Texture Top (Raised to cover skull)
             const numStrands = 20;
             const topY = headY - headRadius * 0.3; // Higher anchor
             for(let i=0; i<=numStrands; i++) {
                 const angle = Math.PI + (i/numStrands)*Math.PI;
                 const rnd = seededRandom(baseSeed + i);
                 const nr = w + (rnd * 1 * s);
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = topY + Math.sin(angle) * nr * 0.7; // Taller arc
                 if(i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }

             ctx.lineTo(p.x + w, headY + len); // Right side down
             // Bottom edge (Ragged)
             for(let i=0; i<=10; i++) {
                 const t = i/10;
                 const tx = (p.x + w)*(1-t) + (p.x - w)*t;
                 const ty = headY + len + (seededRandom(baseSeed+900+i)*4*s);
                 ctx.lineTo(tx, ty);
             }
             ctx.lineTo(p.x - w, topY); // Left side up
             ctx.fill();

             // Strand lines (Randomized Lengths)
             ctx.strokeStyle = adjustColor(hairColor, -30);
             ctx.lineWidth = 1*s;
             ctx.beginPath();
             // Increase density for natural look
             for(let i=0; i<15; i++) {
                 const x = p.x + (seededRandom(baseSeed+1000+i)-0.5) * w * 1.6;
                 if (Math.abs(x - p.x) > w * 0.9) continue;

                 // Vary start and length
                 const startOffset = seededRandom(baseSeed + 2000 + i) * len * 0.4; // Start anywhere in top 40%
                 const lineLen = len * 0.4 + (seededRandom(baseSeed + 3000 + i) * len * 0.5); // Random length

                 const startY = topY + 5*s + startOffset;
                 let endY = startY + lineLen;

                 // Clip end to hair bottom
                 if (endY > headY + len - 2*s) endY = headY + len - 2*s;

                 ctx.moveTo(x, startY);
                 ctx.lineTo(x, endY);
             }
             ctx.stroke();
             return;
        }

        if (style === 'curly_long') {
             // Dirk/Weird Al style
             const len = 20*s;
             const w = headRadius * 1.3;

             ctx.fillStyle = createHairGradient(ctx, p.x, headY, w, hairColor);

             ctx.beginPath();
             // Top Bumps (Raised)
             const numBumps = 15;
             const topY = headY - headRadius * 0.5;
             for(let i=0; i<=numBumps; i++) {
                 const angle = Math.PI + (i/numBumps)*Math.PI;
                 const rnd = seededRandom(baseSeed + i);
                 const nr = w + (rnd * 3 * s);
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = topY + Math.sin(angle) * nr * 0.8; // Rounder top
                 if(i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }

             // Right Side (Wavy)
             ctx.bezierCurveTo(p.x + w*1.2, headY, p.x + w*0.8, headY + len/2, p.x + w, headY + len);
             // Bottom
             ctx.quadraticCurveTo(p.x, headY + len + 5*s, p.x - w, headY + len);
             // Left Side (Wavy)
             ctx.bezierCurveTo(p.x - w*0.8, headY + len/2, p.x - w*1.2, headY, p.x - w, topY); // Connect back to start
             ctx.fill();

             // Internal Curls (Twisting Lines)
             ctx.strokeStyle = adjustColor(hairColor, -20);
             ctx.lineWidth = 1.5*s;
             ctx.beginPath();
             for(let i=0; i<12; i++) {
                 // Static seed positions
                 const rndX = seededRandom(baseSeed + 1100 + i);
                 const startX = p.x + (rndX-0.5) * w * 1.6;
                 const startY = topY + (seededRandom(baseSeed + 1200 + i) * len * 0.8);

                 // Strict Clipping: Keep inside drawn width
                 if (Math.abs(startX - p.x) > w * 0.85) continue;

                 const curlLen = 8 * s + seededRandom(baseSeed + 1300 + i) * 8 * s;
                 // Ensure end point is also somewhat contained
                 if (startY + curlLen > headY + len) continue;

                 const waveW = 3 * s; // Reduced wave width

                 ctx.moveTo(startX, startY);
                 // Draw S-Curve
                 ctx.bezierCurveTo(
                     startX + waveW, startY + curlLen * 0.3,
                     startX - waveW, startY + curlLen * 0.6,
                     startX, startY + curlLen
                 );
             }
             ctx.stroke();
             return;
        }

        if (style === 'headband') {
             const hbColor = skinObj.hairColor || '#000';
             ctx.fillStyle = createHairGradient(ctx, p.x, headY - 2*s, headRadius, hbColor);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();

             const bandColor = skinObj.headbandColor || '#FFF';
             ctx.strokeStyle = bandColor; ctx.lineWidth = 4*s;
             ctx.beginPath(); ctx.moveTo(p.x-11*s, headY-5*s); ctx.lineTo(p.x+11*s, headY-5*s); ctx.stroke();

             // Highlight on band
             ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.moveTo(p.x-11*s, headY-6*s); ctx.lineTo(p.x+11*s, headY-6*s); ctx.stroke();
             return;
        }

        if (style === 'spikes') {
             const baseGrad = createHairGradient(ctx, p.x, headY - 1*s, headRadius * 1.3, hairColor);
             ctx.fillStyle = baseGrad;
             ctx.beginPath(); ctx.arc(p.x, headY - 1*s, headRadius * 1.1, 0, Math.PI*2); ctx.fill();

             const numSpikes = 7;
             for(let i=0; i<numSpikes; i++) {
                 const angle = Math.PI + (i / (numSpikes-1)) * Math.PI;
                 const sx = p.x + Math.cos(angle) * 10*s;
                 const sy = (headY - 2*s) + Math.sin(angle) * 10*s;
                 const ex = p.x + Math.cos(angle) * 25*s;
                 const ey = (headY - 2*s) + Math.sin(angle) * 25*s;

                 ctx.beginPath();
                 ctx.moveTo(sx + Math.cos(angle+1.5)*6*s, sy + Math.sin(angle+1.5)*6*s);
                 ctx.lineTo(ex, ey);
                 ctx.lineTo(sx + Math.cos(angle-1.5)*6*s, sy + Math.sin(angle-1.5)*6*s);
                 ctx.fill();
             }
             return;
        }

        if (style === 'fade') {
             // Standard Fade (Similar to short but tighter sides)
             const r = headRadius * 1.02;
             const fadeGrad = ctx.createLinearGradient(0, headY - r, 0, headY + r);
             fadeGrad.addColorStop(0, hairColor);
             fadeGrad.addColorStop(0.4, hairColor);
             fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');

             ctx.fillStyle = fadeGrad;
             ctx.beginPath();
             // Top
             const numBumps = 20;
             for(let i=0; i<=numBumps; i++) {
                 const angle = Math.PI + (i / numBumps) * Math.PI;
                 const rnd = seededRandom(baseSeed + i);
                 const nr = r + (rnd * 0.5 * s);
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = (headY - 2*s) + Math.sin(angle) * nr;
                 if (i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }
             // Sides (High fade)
             ctx.lineTo(p.x + r, headY); // Cut in early
             ctx.quadraticCurveTo(p.x + r * 0.9, headY + 4*s, p.x + r * 0.5, headY + 4*s);
             ctx.quadraticCurveTo(p.x, headY + 5*s, p.x - r * 0.5, headY + 4*s);
             ctx.quadraticCurveTo(p.x - r * 0.9, headY + 4*s, p.x - r, headY);
             ctx.lineTo(p.x - r, headY - 2*s);
             ctx.fill();
             return;
        }

        if (style === 'flat_top') {
             // Boxy Silhouette - Updated to be taller (High Top Fade)
             const w = headRadius * 1.15;
             const h = headRadius * 1.6; // Much taller to cover head fully
             const topY = headY - h;

             ctx.fillStyle = createHairGradient(ctx, p.x, headY, w, hairColor);
             ctx.beginPath();
             // Flat Top
             ctx.moveTo(p.x - w*0.8, topY);
             ctx.lineTo(p.x + w*0.8, topY);
             // Sides (Vertical with slight taper)
             ctx.lineTo(p.x + w*0.85, headY - 2*s);
             ctx.lineTo(p.x + w*0.6, headY + 6*s); // Taper in at neck
             // Neck
             ctx.quadraticCurveTo(p.x, headY + 8*s, p.x - w*0.6, headY + 6*s);
             ctx.lineTo(p.x - w*0.85, headY - 2*s);
             ctx.lineTo(p.x - w*0.8, topY);
             ctx.fill();
             return;
        }

        if (style === 'dreads') {
             // Thick hanging strands (Jimmy Butler style)
             const w = headRadius * 1.1;
             const len = 15 * s;

             // Base scalp
             ctx.fillStyle = adjustColor(hairColor, -10);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();

             // Draw Strands
             ctx.lineCap = 'round';
             ctx.strokeStyle = hairColor;
             ctx.lineWidth = 4 * s;

             const numDreads = 12;
             for(let i=0; i<numDreads; i++) {
                 const t = i / (numDreads-1); // 0 to 1
                 const angle = Math.PI + t * Math.PI; // Top arc
                 const sx = p.x + Math.cos(angle) * (w*0.8);
                 const sy = (headY - 2*s) + Math.sin(angle) * (w*0.8);

                 // Randomize length/direction slightly
                 const rndLen = len * (0.8 + 0.4 * seededRandom(baseSeed + i));
                 const curl = (seededRandom(baseSeed + i + 100) - 0.5) * 10 * s;

                 ctx.beginPath();
                 ctx.moveTo(sx, sy);
                 ctx.quadraticCurveTo(sx + curl, sy + rndLen * 0.5, sx, sy + rndLen);
                 ctx.stroke();

                 // Highlight
                 ctx.lineWidth = 1 * s;
                 ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                 ctx.stroke();
                 ctx.lineWidth = 4 * s; // Reset
                 ctx.strokeStyle = hairColor;
             }
             return;
        }

        if (style === 'hat') {
             const hColor = skinObj.hairColor || '#3c2415';
             const capColor = skinObj.hatColor || '#F00';

             // Hair sticking out bottom
             ctx.fillStyle = hColor;
             ctx.beginPath();
             ctx.arc(p.x, headY + 4*s, headRadius * 1.05, Math.PI, 0, true); // Bottom half
             ctx.fill();

             // Cap
             const capGrad = createHairGradient(ctx, p.x, headY - 2*s, headRadius * 1.2, capColor);
             ctx.fillStyle = capGrad;
             ctx.beginPath();
             ctx.arc(p.x, headY - 2*s, headRadius * 1.15, Math.PI, 0); // Top
             ctx.lineTo(p.x + headRadius * 1.15, headY + 2*s);
             ctx.quadraticCurveTo(p.x, headY + 6*s, p.x - headRadius * 1.15, headY + 2*s);
             ctx.lineTo(p.x - headRadius * 1.15, headY - 2*s);
             ctx.fill();
             return;
        }

        if (style === 'snakes') {
             ctx.lineWidth = 3*s;
             ctx.lineCap = 'round';
             const numSnakes = 8;
             for(let i=0; i<numSnakes; i++) {
                 // Static snakes!
                 const rndAngle = seededRandom(baseSeed + i*10);
                 const rndCp1 = seededRandom(baseSeed + i*10 + 1);
                 const rndCp2 = seededRandom(baseSeed + i*10 + 2);

                 const angle = Math.PI + (i / (numSnakes-1)) * Math.PI;
                 const sx = p.x + Math.cos(angle) * 8*s;
                 const sy = (headY - 5*s) + Math.sin(angle) * 8*s;

                 const cp1x = sx + Math.cos(angle) * 10*s + rndCp1*5*s;
                 const cp1y = sy + Math.sin(angle) * 10*s;
                 const cp2x = sx + Math.cos(angle) * 20*s - rndCp2*5*s;
                 const cp2y = sy + Math.sin(angle) * 20*s;
                 const ex = sx + Math.cos(angle) * 25*s;
                 const ey = sy + Math.sin(angle) * 25*s;

                 ctx.strokeStyle = adjustColor(hairColor, -30);
                 ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey); ctx.stroke();

                 ctx.strokeStyle = hairColor;
                 ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey); ctx.stroke();
             }
             return;
        }

        if (style === 'braids_back') {
             // Harden/Butler style: Straight rows going back
             const r = headRadius * 1.0;
             // Scalp base
             ctx.fillStyle = adjustColor(hairColor, -10);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             const numRows = 6;
             const braidW = 3 * s;
             ctx.lineCap = 'round';

             for(let i=0; i<numRows; i++) {
                 const t = (i / (numRows - 1)) * 2 - 1; // -1 to 1
                 const xOff = t * (r * 0.8);
                 const yTop = headY - Math.sqrt(r*r - xOff*xOff) * 0.9;
                 const yBot = headY + r * 0.8;

                 ctx.lineWidth = braidW + 1*s;
                 ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                 ctx.beginPath(); ctx.moveTo(p.x + xOff, yTop); ctx.lineTo(p.x + xOff * 0.8, yBot); ctx.stroke();

                 ctx.lineWidth = braidW;
                 ctx.strokeStyle = hairColor;
                 ctx.beginPath(); ctx.moveTo(p.x + xOff, yTop); ctx.lineTo(p.x + xOff * 0.8, yBot); ctx.stroke();

                 // Texture (Segments)
                 ctx.fillStyle = adjustColor(hairColor, 20);
                 const len = yBot - yTop;
                 const segs = 8;
                 for(let j=0; j<segs; j++) {
                     const segT = j/segs;
                     const sx = p.x + xOff * (1 - segT*0.2); // Taper x in slightly
                     const sy = yTop + len * segT;
                     ctx.beginPath(); ctx.arc(sx, sy, 1.2*s, 0, Math.PI*2); ctx.fill();
                 }
             }
             return;
        }

        if (style === 'short_afro') {
             // Tighter, smaller afro (Rookie Kobe/AI)
             // Reuse Afro logic but forced small params
             const w = headRadius * 1.15; // Smaller than normal afro (1.3+)
             const h = headRadius * 1.15;

             const grad = ctx.createRadialGradient(p.x, headY - 2*s, w*0.5, p.x, headY - 2*s, w);
             grad.addColorStop(0, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -10));
             ctx.fillStyle = grad;

             // Circular shape with fuzz
             ctx.beginPath();
             const numBumps = 24;
             for(let i=0; i<=numBumps; i++) {
                 const angle = (i / numBumps) * Math.PI * 2;
                 const rnd = seededRandom(baseSeed + i);
                 const rOffset = (rnd * 2 * s);
                 const cx = p.x + Math.cos(angle) * (w - rOffset);
                 const cy = (headY - 2*s) + Math.sin(angle) * (h - rOffset);
                 if(i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }
             ctx.fill();

             // Texture dots
             ctx.fillStyle = 'rgba(0,0,0,0.3)';
             for(let i=0; i<30; i++) {
                 const rndR = seededRandom(baseSeed + 500 + i) * w * 0.8;
                 const rndA = seededRandom(baseSeed + 600 + i) * Math.PI * 2;
                 ctx.beginPath(); ctx.arc(p.x + Math.cos(rndA)*rndR, (headY - 2*s) + Math.sin(rndA)*rndR, 1.5*s, 0, Math.PI*2); ctx.fill();
             }
             return;
        }

        // Fallback: Generic Hair (Pompadour style mostly)

























                if (style === 'luka_fade') {
             // Modern Luka: Cartoonish "Swoosh" volume on top, clean sides
             // View: Back/Top.
             const r = headRadius * 1.1; // Volume radius
             const topOffset = 8*s; // How high the hair goes above the skull line

             // 1. Draw the Main Mass with Volume Gradient
             const volumeGrad = ctx.createLinearGradient(0, headY - r - topOffset, 0, headY);
             volumeGrad.addColorStop(0, adjustColor(hairColor, 40)); // High light top
             volumeGrad.addColorStop(0.4, hairColor); // Mid tone
             volumeGrad.addColorStop(1, adjustColor(hairColor, -30)); // Shadow base
             ctx.fillStyle = volumeGrad;

             ctx.beginPath();
             // Top Volume
             ctx.moveTo(p.x - r * 0.9, headY - 5*s);
             ctx.bezierCurveTo(
                 p.x - r * 0.8, headY - r - topOffset,
                 p.x + r * 0.5, headY - r - topOffset * 1.2,
                 p.x + r * 0.9, headY - 5*s
             );
             // Sides & Nape
             ctx.quadraticCurveTo(p.x + r, headY + 5*s, p.x + r * 0.7, headY + 8*s);
             ctx.quadraticCurveTo(p.x, headY + 10*s, p.x - r * 0.7, headY + 8*s);
             ctx.quadraticCurveTo(p.x - r, headY + 5*s, p.x - r * 0.9, headY - 5*s);
             ctx.fill();

             // 2. Specular Highlight (The "Pomade" shine)
             const shineGrad = ctx.createRadialGradient(p.x + r*0.3, headY - r*0.8, 2*s, p.x + r*0.3, headY - r*0.8, 15*s);
             shineGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
             shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = shineGrad;
             ctx.fill();

             return;
        }

        if (style === 'luka_shaggy') {
             // "Wonderboy": Messy "Mop" look. Smooth layers, no jaggy noise.
             const r = headRadius * 1.2;

             // 1. Shadow Layer (Behind the main mass)
             ctx.fillStyle = adjustColor(hairColor, -30);
             ctx.beginPath();
             ctx.arc(p.x, headY + 2*s, r * 0.95, 0, Math.PI*2);
             ctx.fill();

             // 2. Main Volume (Spherical gradient)
             const grad = ctx.createRadialGradient(p.x, headY - 5*s, r*0.2, p.x, headY, r);
             grad.addColorStop(0, adjustColor(hairColor, 30)); // Crown highlight
             grad.addColorStop(0.6, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -10));
             ctx.fillStyle = grad;

             ctx.beginPath();
             // Top of head
             ctx.arc(p.x, headY - 2*s, r * 0.9, Math.PI, 0);

             // Sides (Flowing down, smooth curves)
             ctx.bezierCurveTo(p.x + r * 1.1, headY + 2*s, p.x + r * 1.0, headY + 10*s, p.x + r * 0.6, headY + 12*s); // Right side

             // Nape (Uneven but smooth)
             ctx.quadraticCurveTo(p.x + r * 0.3, headY + 14*s, p.x, headY + 13*s); // Center dip
             ctx.quadraticCurveTo(p.x - r * 0.3, headY + 14*s, p.x - r * 0.6, headY + 12*s); // Left side

             // Left side up
             ctx.bezierCurveTo(p.x - r * 1.0, headY + 10*s, p.x - r * 1.1, headY + 2*s, p.x - r * 0.9, headY - 2*s);

             ctx.fill();
             return;
        }

        if (style === 'crew_cut') {
             // Jokic: "The Joker" - Clean buzz.
             // Depth via radial gradient on the scalp.
             const r = headRadius * 1.05;

             // 1. Scalp/Fade Base
             const baseGrad = ctx.createRadialGradient(p.x, headY - 5*s, r * 0.2, p.x, headY, r);
             baseGrad.addColorStop(0, adjustColor(hairColor, 20)); // Top light
             baseGrad.addColorStop(0.7, hairColor);
             baseGrad.addColorStop(1, adjustColor(hairColor, -30)); // Dark edge/fade
             ctx.fillStyle = baseGrad;

             ctx.beginPath();
             // Top Boxy-Round shape
             const topW = r * 0.9;
             const topY = headY - 4*s;

             ctx.moveTo(p.x - topW, topY);
             // Smooth top arch
             ctx.bezierCurveTo(p.x - topW, headY - r - 2*s, p.x + topW, headY - r - 2*s, p.x + topW, topY);

             // Sides fade down
             ctx.quadraticCurveTo(p.x + r, headY + 5*s, p.x + r * 0.6, headY + 6*s);
             ctx.quadraticCurveTo(p.x, headY + 7*s, p.x - r * 0.6, headY + 6*s);
             ctx.quadraticCurveTo(p.x - r, headY + 5*s, p.x - topW, topY);

             ctx.fill();
             return;
        }

        if (style === 'dirk_shaggy') {
             // Dirk: Long blonde, smooth flow.
             const r = headRadius * 1.2;

             // Gradient for depth
             const grad = ctx.createLinearGradient(0, headY - r, 0, headY + 15*s);
             grad.addColorStop(0, adjustColor(hairColor, 30));
             grad.addColorStop(0.5, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -20));
             ctx.fillStyle = grad;

             ctx.beginPath();
             // Top center part logic (implied by slight dip)
             ctx.moveTo(p.x, headY - r);

             // Right side flow
             ctx.bezierCurveTo(p.x + r*0.8, headY - r, p.x + r*1.2, headY, p.x + r*1.1, headY + 8*s);
             ctx.quadraticCurveTo(p.x + r, headY + 14*s, p.x + r*0.5, headY + 15*s); // Tip

             // Bottom
             ctx.quadraticCurveTo(p.x, headY + 13*s, p.x - r*0.5, headY + 15*s); // Left Tip

             // Left side flow
             ctx.quadraticCurveTo(p.x - r, headY + 14*s, p.x - r*1.1, headY + 8*s);
             ctx.bezierCurveTo(p.x - r*1.2, headY, p.x - r*0.8, headY - r, p.x, headY - r);

             ctx.fill();
             return;
        }

        if (style === 'afro') {
             // Afro: Smooth Sphere with 3D Shading (No noise)
             const sizeMult = skinObj.afroSize || 1.2;
             const r = headRadius * sizeMult;

             // 3D Sphere Gradient
             // Light source from top-left-front (implied)
             const grad = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.2, p.x, headY, r);
             grad.addColorStop(0, adjustColor(hairColor, 40)); // Highlight
             grad.addColorStop(0.5, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -40)); // Shadow

             ctx.fillStyle = grad;

             ctx.beginPath();
             ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2);
             ctx.fill();
             return;
        }

        if (style === 'curly' || style === 'short_curly') {
             // Textured Cap: Smooth gradient volume + soft "clumps" for depth
             const r = headRadius * 1.05;
             const seed = baseSeed;

             // 1. Base Volume (Darker)
             const baseGrad = ctx.createRadialGradient(p.x, headY - 3*s, r*0.5, p.x, headY, r);
             baseGrad.addColorStop(0, hairColor);
             baseGrad.addColorStop(1, adjustColor(hairColor, -30));
             ctx.fillStyle = baseGrad;

             ctx.beginPath();
             ctx.arc(p.x, headY - 2*s, r, Math.PI, 0); // Top
             ctx.lineTo(p.x + r, headY + 4*s);
             ctx.quadraticCurveTo(p.x, headY + 8*s, p.x - r, headY + 4*s);
             ctx.lineTo(p.x - r, headY - 2*s);
             ctx.fill();

             // 2. Soft Clumps (Large circles with gradients to simulate bumps)
             const clumpSize = 6*s;
             const density = 12;

             for (let i = 0; i < density; i++) {
                 const angle = seededRandom(seed + i) * Math.PI * 2;
                 const dist = seededRandom(seed + i + 100) * r * 0.8;

                 // Clump Gradient (Light to Transparent)
                 const cx = p.x + Math.cos(angle)*dist;
                 const cy = (headY - 2*s) + Math.sin(angle)*dist;

                 const clumpGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, clumpSize);
                 clumpGrad.addColorStop(0, 'rgba(255,255,255,0.1)'); // Highlight center
                 clumpGrad.addColorStop(1, 'rgba(0,0,0,0)'); // Fade out

                 ctx.fillStyle = clumpGrad;
                 ctx.beginPath();
                 ctx.arc(cx, cy, clumpSize, 0, Math.PI*2);
                 ctx.fill();
             }
             return;
        }


        if (style === 'pompadour') {
             ctx.fillStyle = createHairGradient(ctx, p.x, headY, headRadius*1.2, hairColor);
             ctx.beginPath();
             ctx.ellipse(p.x, headY - 6*s, headRadius * 1.2, headRadius * 1.4, 0, Math.PI, 0);
             ctx.lineTo(p.x + headRadius * 0.8, headY + 10*s);
             ctx.quadraticCurveTo(p.x, headY + 14*s, p.x - headRadius * 0.8, headY + 10*s);
             ctx.lineTo(p.x - headRadius * 1.2, headY - 6*s);
             ctx.fill();
        }

        // --- NEW HAIRSTYLES ---

        if (style === 'dreads_short') {
            const w = headRadius * 1.1;
            ctx.fillStyle = adjustColor(hairColor, -10);
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();
            ctx.lineCap = 'round'; ctx.strokeStyle = hairColor; ctx.lineWidth = 3 * s;
            const num = 16;
            for(let i=0; i<num; i++) {
                const angle = seededRandom(baseSeed + i) * Math.PI * 2;
                const dist = seededRandom(baseSeed + i + 100) * w * 0.8;
                const len = 6*s + seededRandom(baseSeed + i + 200) * 4*s;
                const sx = p.x + Math.cos(angle)*dist;
                const sy = (headY - 2*s) + Math.sin(angle)*dist;

                const c1 = (seededRandom(baseSeed + i + 300) - 0.5) * 5 * s;
                const c2 = (seededRandom(baseSeed + i + 400) - 0.5) * 8 * s;

                ctx.beginPath(); ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(sx + c1, sy - len*0.5, sx + c2, sy - len);
                ctx.stroke();
            }
        }
        else if (style === 'curly_high') {
             const w = headRadius * 1.1;
             const h = headRadius * 1.4;
             ctx.fillStyle = hairColor;
             // High top shape but lumpy
             drawFuzzyCircle(p.x, headY - h*0.6, w, hairColor, 40, s, true, true);
             drawFuzzyCircle(p.x, headY - h*0.3, w*0.9, hairColor, 40, s, true, true);
        }
        else if (style === 'waves') {
             const r = headRadius * 1.05;
             const grad = ctx.createRadialGradient(p.x, headY - 5*s, r*0.2, p.x, headY, r);
             grad.addColorStop(0, adjustColor(hairColor, 20)); grad.addColorStop(1, hairColor);
             ctx.fillStyle = grad;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();
             // Draw wave lines
             ctx.strokeStyle = adjustColor(hairColor, -30); ctx.lineWidth = 1*s;
             for(let i=0; i<5; i++) {
                 ctx.beginPath();
                 ctx.ellipse(p.x, headY - 2*s, r * (0.3 + i*0.15), r * (0.3 + i*0.15) * 0.6, 0, 0, Math.PI*2);
                 ctx.stroke();
             }
        }
        else if (style === 'twisted_fade') {
             const w = headRadius * 1.1;
             ctx.fillStyle = hairColor; // Fade base
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = adjustColor(hairColor, 10);
             // Twists on top
             for(let i=0; i<15; i++) {
                 const angle = (i/15)*Math.PI*2;
                 const dist = seededRandom(baseSeed + i) * w * 0.7;
                 const sx = p.x + Math.cos(angle)*dist;
                 const sy = (headY - 5*s) + Math.sin(angle)*dist * 0.7;
                 ctx.beginPath(); ctx.arc(sx, sy, 2.5*s, 0, Math.PI*2); ctx.fill();
             }
        }
        else if (style === 'bun_low' || style === 'bun_high' || style === 'top_knot' || style === 'samurai_bun' || style === 'dread_bun' || style === 'space_buns') {
            // Base
            ctx.fillStyle = hairColor;
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.05, 0, Math.PI*2); ctx.fill();
            const bunColor = adjustColor(hairColor, 10);
            ctx.fillStyle = bunColor;

            if (style === 'space_buns') {
                 ctx.beginPath(); ctx.arc(p.x - headRadius*0.8, headY - headRadius*0.8, 6*s, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(p.x + headRadius*0.8, headY - headRadius*0.8, 6*s, 0, Math.PI*2); ctx.fill();
            } else {
                let bx = p.x, by = headY - headRadius;
                let bSize = 7*s;
                if(style === 'bun_low') by = headY + 5*s;
                if(style === 'top_knot') { by = headY - headRadius * 1.2; bSize = 5*s; }
                if(style === 'samurai_bun') { by = headY - headRadius * 1.1; bSize = 6*s; ctx.fillRect(p.x-2*s, by+2*s, 4*s, 6*s); }
                if(style === 'dread_bun') { bSize = 9*s; ctx.fillStyle = adjustColor(hairColor, -10); }

                ctx.beginPath(); ctx.arc(bx, by, bSize, 0, Math.PI*2); ctx.fill();
            }
        }
        else if (style === 'ponytail_high' || style === 'ponytail_low' || style === 'pigtails') {
             ctx.fillStyle = hairColor;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.05, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = hairColor; ctx.lineWidth = 5*s; ctx.lineCap = 'round';

             if (style === 'pigtails') {
                 ctx.beginPath(); ctx.moveTo(p.x - headRadius*0.8, headY); ctx.quadraticCurveTo(p.x - headRadius*1.2, headY+5*s, p.x - headRadius*1.5, headY+15*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(p.x + headRadius*0.8, headY); ctx.quadraticCurveTo(p.x + headRadius*1.2, headY+5*s, p.x + headRadius*1.5, headY+15*s); ctx.stroke();
             } else {
                 let py = (style === 'ponytail_high') ? headY - headRadius*0.5 : headY + 5*s;
                 ctx.beginPath(); ctx.moveTo(p.x, py); ctx.quadraticCurveTo(p.x + 5*s, py+10*s, p.x, py+20*s); ctx.stroke();
             }
        }
        else if (style === 'mullet_modern' || style === 'shag') {
             // Short top, long back
             ctx.fillStyle = hairColor;
             // Top
             drawFuzzyCircle(p.x, headY - 5*s, headRadius * 1.0, hairColor, 30, s, true, true);
             // Back
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY);
             ctx.quadraticCurveTo(p.x - headRadius*1.2, headY+15*s, p.x - headRadius*0.5, headY+20*s); // Left
             ctx.lineTo(p.x + headRadius*0.5, headY+20*s);
             ctx.quadraticCurveTo(p.x + headRadius*1.2, headY+15*s, p.x + headRadius, headY); // Right
             ctx.fill();
        }
        else if (style === 'undercut' || style === 'slicked_back') {
             ctx.fillStyle = adjustColor(hairColor, -20); // Shaved sides color
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = hairColor;
             const w = headRadius * 0.9;
             ctx.beginPath();
             ctx.moveTo(p.x - w, headY - 5*s);
             ctx.quadraticCurveTo(p.x, headY - headRadius*1.4, p.x + w, headY - 5*s);
             ctx.lineTo(p.x + w*0.8, headY + 5*s); // Taper back
             ctx.quadraticCurveTo(p.x, headY + 8*s, p.x - w*0.8, headY + 5*s);
             ctx.fill();
        }
        else if (style === 'caesar' || style === 'french_crop' || style === 'buzz_cut') {
             const fade = (style === 'buzz_cut');
             const r = headRadius * 1.05;
             const grad = ctx.createRadialGradient(p.x, headY - 5*s, r*0.5, p.x, headY, r);
             grad.addColorStop(0, fade ? adjustColor(hairColor, 30) : hairColor);
             grad.addColorStop(1, fade ? adjustColor(hairColor, -10) : adjustColor(hairColor, -20));
             ctx.fillStyle = grad;
             ctx.beginPath(); ctx.arc(p.x, headY - 3*s, r, 0, Math.PI*2); ctx.fill();

             if (style === 'french_crop') {
                 // Blunt fringe logic (draw rect across forehead/top)
                 ctx.fillStyle = hairColor;
                 ctx.beginPath(); ctx.arc(p.x, headY - 5*s, r*0.9, Math.PI, 0); ctx.fill();
             }
        }
        else if (style === 'bowl_cut') {
             ctx.fillStyle = hairColor;
             const r = headRadius * 1.1;
             ctx.beginPath();
             ctx.arc(p.x, headY - 5*s, r, Math.PI, 0); // Top dome
             ctx.lineTo(p.x + r, headY + 2*s); // Side
             ctx.lineTo(p.x - r, headY + 2*s); // Straight cut across
             ctx.lineTo(p.x - r, headY - 5*s);
             ctx.fill();
        }
        else if (style === 'faux_hawk' || style === 'liberty_spikes' || style === 'spikes') {
             ctx.fillStyle = adjustColor(hairColor, -20); // Base
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = hairColor;
             const numSpikes = (style === 'liberty_spikes') ? 7 : 5;
             const h = (style === 'liberty_spikes') ? 20*s : 10*s;
             const w = (style === 'faux_hawk') ? 8*s : 4*s;

             for(let i=0; i<numSpikes; i++) {
                 const x = p.x + (i - (numSpikes-1)/2) * (headRadius*0.5);
                 const y = headY - headRadius * 0.8 - Math.abs(x - p.x)*0.2;
                 ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w, y); ctx.fill();
             }
        }
        else if (style === 'bob' || style === 'curtains') {
             ctx.fillStyle = hairColor;
             const r = headRadius * 1.15;
             ctx.beginPath();
             ctx.moveTo(p.x, headY - r); // Top center
             // Left curtain
             ctx.bezierCurveTo(p.x - r, headY - r, p.x - r*1.2, headY, p.x - r*1.1, headY + 10*s);
             ctx.lineTo(p.x - r*0.5, headY + 10*s); // End
             // Right curtain
             ctx.lineTo(p.x + r*0.5, headY + 10*s);
             ctx.lineTo(p.x + r*1.1, headY + 10*s);
             ctx.bezierCurveTo(p.x + r*1.2, headY, p.x + r, headY - r, p.x, headY - r);
             ctx.fill();
             if (style === 'curtains') {
                 // Split in middle
                 ctx.globalCompositeOperation = 'destination-out';
                 ctx.beginPath(); ctx.moveTo(p.x, headY-r); ctx.lineTo(p.x-2*s, headY); ctx.lineTo(p.x+2*s, headY); ctx.fill();
                 ctx.globalCompositeOperation = 'source-over';
             }
        }
        else if (style === 'pixie') {
             drawFuzzyCircle(p.x, headY - 3*s, headRadius * 1.05, hairColor, 30, s, true, true);
        }
        else if (style === 'beehive') {
             const h = headRadius * 2.0;
             ctx.fillStyle = createHairGradient(ctx, p.x, headY - h*0.5, headRadius*1.5, hairColor);
             ctx.beginPath();
             ctx.ellipse(p.x, headY - h*0.4, headRadius * 1.3, h * 0.6, 0, 0, Math.PI*2);
             ctx.fill();
        }
        else if (style === 'emo_fringe') {
             ctx.fillStyle = hairColor;
             const r = headRadius * 1.1;
             ctx.beginPath();
             ctx.arc(p.x, headY - 2*s, r, Math.PI, 0); // Top
             ctx.lineTo(p.x + r, headY + 8*s); // Long side
             ctx.lineTo(p.x - r * 0.5, headY + 12*s); // Sweep across
             ctx.lineTo(p.x - r, headY + 2*s); // Short side
             ctx.fill();
        }
        else if (style === 'clown') {
             ctx.fillStyle = 'red'; // Classic clown red usually, but adhere to hairColor?
             // Prompt implies hairstyle, so use hairColor
             ctx.fillStyle = hairColor;
             // Two big puffs on sides
             drawFuzzyCircle(p.x - headRadius, headY, headRadius * 0.6, hairColor, 30, s, true, true);
             drawFuzzyCircle(p.x + headRadius, headY, headRadius * 0.6, hairColor, 30, s, true, true);
             // Bald top (don't draw anything in middle)
        }
        else if (style === 'monk') {
             // Ring around head
             ctx.fillStyle = hairColor;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.1, 0, Math.PI*2); ctx.fill();
             // Bald spot
             ctx.fillStyle = skinObj.skinTone || '#dcb'; // Try to match skin
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 0.7, 0, Math.PI*2); ctx.fill();
        }
        else if (style === 'long_straight' || style === 'long_wavy') {
             ctx.fillStyle = hairColor;
             const len = 25*s;
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY - 5*s);
             ctx.quadraticCurveTo(p.x, headY - headRadius*1.5, p.x + headRadius, headY - 5*s);
             ctx.lineTo(p.x + headRadius + 2*s, headY + len);
             if (style === 'long_wavy') {
                 ctx.quadraticCurveTo(p.x + headRadius, headY + len + 5*s, p.x, headY + len);
                 ctx.quadraticCurveTo(p.x - headRadius, headY + len + 5*s, p.x - headRadius - 2*s, headY + len);
             } else {
                 ctx.lineTo(p.x - headRadius - 2*s, headY + len);
             }
             ctx.fill();
        }
        else if (style === 'comb_over') {
             // Bald base
             // Thin strands across
             ctx.strokeStyle = hairColor; ctx.lineWidth = 1*s;
             for(let i=0; i<5; i++) {
                 ctx.beginPath();
                 ctx.moveTo(p.x - headRadius, headY - 5*s + i*2*s);
                 ctx.quadraticCurveTo(p.x, headY - headRadius - 5*s, p.x + headRadius, headY - 5*s + i*4*s);
                 ctx.stroke();
             }
        }
        else if (style === 'perm' || style === 'messy_bedhead') {
             drawFuzzyCircle(p.x, headY - 4*s, headRadius * 1.2, hairColor, 50, s, true, true);
        }

    }


    function drawRealisticHuman(p, s, skinObj) {
        const isMechanical = isMechanicalSkin(skinObj.id);
        // Base Setup
        const sizeMod = {
            w: skinObj.widthScale || 0.9,
            h: skinObj.heightScale || 1.1,
            head: 0.9,
            armWidth: skinObj.armWidthScale || (skinObj.widthScale || 0.9),
            legWidth: skinObj.legWidthScale || (skinObj.widthScale || 0.9)
        };

        const skinTone = skinObj.skinTone || '#8d5524';

        // Body Dimensions
        const bodyW = 20 * s * sizeMod.w;
        const bodyH = 40 * s * sizeMod.h;
        let legLen = 30 * s * sizeMod.h;

        // Crouch compression (shorten legs visually)
        if (state === 'PRE_JUMP') {
            legLen *= 0.7;
        }

        let torsoY = p.y - legLen - bodyH;
        let neckLen = 0;
        if (skinObj.neckLength) neckLen = skinObj.neckLength * s;
        let headY = torsoY - (10 * s * sizeMod.head) - neckLen;
        const headRadius = 12 * s * sizeMod.head;

        // Super Saiyan Aura
        if (currentStreak >= 10) {
             const hue = getStreakFireHue(currentStreak);
             ctx.save();
             ctx.shadowBlur = 30 * s;
             ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
             ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 2.5, bodyH * 2.0, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 15 * s;
             ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.15)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 1.5, bodyH * 1.5, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        // 0. Calculate Arm Configuration
        const r_la = g_animState.la;
        const r_ra = g_animState.ra;
        const r_lfa = g_animState.lfa;
        const r_rfa = g_animState.rfa;
        const r_w = g_animState.w;
        const r_la_z = g_animState.la_z || 0;
        const r_ra_z = g_animState.ra_z || 0;
        const r_lfa_z = g_animState.lfa_z || 0;
        const r_rfa_z = g_animState.rfa_z || 0;

        let leftArmAngle, rightArmAngle, leftForeArmAngle, rightForeArmAngle, wristAngle;
        let leftArmZ, rightArmZ, leftForeArmZ, rightForeArmZ;

        if (playerData.isLefty) {
            leftArmAngle = Math.PI - r_ra; rightArmAngle = Math.PI - r_la;
            leftForeArmAngle = Math.PI - r_rfa; rightForeArmAngle = Math.PI - r_lfa;
            wristAngle = -r_w;
            leftArmZ = r_ra_z; rightArmZ = r_la_z;
            leftForeArmZ = r_rfa_z; rightForeArmZ = r_lfa_z;
        } else {
            leftArmAngle = r_la; rightArmAngle = r_ra;
            leftForeArmAngle = r_lfa; rightForeArmAngle = r_rfa;
            wristAngle = r_w;
            leftArmZ = r_la_z; rightArmZ = r_ra_z;
            leftForeArmZ = r_lfa_z; rightForeArmZ = r_rfa_z;
        }

        // BEARD (Drawn first so body obscures it)
        drawBeard(ctx, p, headY, headRadius, s, skinObj);
        // Draw Neck
        if (neckLen > 5*s) {
            ctx.fillStyle = skinTone;
            const neckW = 12 * s * sizeMod.w * 0.7;
            ctx.fillRect(p.x - neckW/2, torsoY + 10*s, neckW, -neckLen - 5*s);
        }
        let shoulderY = torsoY + (2*s);
        let armY = torsoY + (5*s);
        let leftShoulderX = p.x - 16*s * sizeMod.w; let rightShoulderX = p.x + 16*s * sizeMod.w;
        const upperArmLen = 20 * s * sizeMod.h * 1.05;
        const foreArmLen = 20 * s * sizeMod.h * 1.05;

        // PROCEDURAL GUIDE HAND LOGIC
        if (isTwoHandedStyle(playerData.currentStyle) && (state === 'JUMPING' || state === 'PRE_JUMP')) {
            const isRightHand = !playerData.isLefty;
            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootUZ = isRightHand ? rightArmZ : leftArmZ;
            const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;

            const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

            const elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
            const wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);
            const ballPos = calculateBallPosition(wrist.x, wrist.y, s, shootFAngle, wristAngle);

            const guideTargetX = ballPos.x + (isRightHand ? -8*s : 8*s);
            const guideTargetY = ballPos.y;
            const guideSX = isRightHand ? leftShoulderX : rightShoulderX;

            const animGuideU = (g_animState.guide_u !== undefined) ? g_animState.guide_u : -1.7;
            const animGuideUZ = (g_animState.guide_u_z !== undefined) ? g_animState.guide_u_z : 1.3;
            const finalGuideU = isRightHand ? animGuideU : (-Math.PI - animGuideU);

            const guideEffUpper = upperArmLen * Math.max(0.1, Math.cos(animGuideUZ));
            const guideElbow = getJoint(guideSX, armY, guideEffUpper, finalGuideU);

            const dx = guideTargetX - guideElbow.x;
            const dy = guideTargetY - guideElbow.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const fixedGuideFAngle = Math.atan2(dy, dx);
            const ratio = Math.min(0.99, dist / foreArmLen);
            const fixedGuideFZ = Math.acos(ratio);

            if (isRightHand) {
                leftArmAngle = finalGuideU; leftForeArmAngle = fixedGuideFAngle;
                leftArmZ = animGuideUZ; leftForeArmZ = fixedGuideFZ;
            } else {
                rightArmAngle = finalGuideU; rightForeArmAngle = fixedGuideFAngle;
                rightArmZ = animGuideUZ; rightForeArmZ = fixedGuideFZ;
            }
        }

        drawDetachedBall(p, s, torsoY, bodyH, headY);

        if (playerData.currentStyle === 'airbud' && state === 'SHOOTING') {
             const t = airbudJumpTime;
             const maxT = 30;
             if (t < maxT) {
                 const jumpHeight = 60 * s * sizeMod.h;
                 const nt = t / maxT;
                 const offset = 4 * jumpHeight * nt * (1 - nt);
                 p.y -= offset;
                 torsoY = p.y - legLen - bodyH;
                 headY = torsoY - (10 * s * sizeMod.head);
                 shoulderY = torsoY + (2*s);
                 armY = torsoY + (5*s);
                 leftShoulderX = p.x - 16*s * sizeMod.w; rightShoulderX = p.x + 16*s * sizeMod.w;
             }
        }

        const isDetachedStyle = ['airbud', 'telekinesis'].includes(playerData.currentStyle);
        if (!isDetachedStyle && state !== 'SHOOTING' && state !== 'GAMEOVER') {
            const isRightHand = !playerData.isLefty;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;

            let elbow = getJoint(shootSX, armY, upperArmLen, shootUAngle);
            let wrist = getJoint(elbow.x, elbow.y, foreArmLen, shootFAngle);

            let theta = shootFAngle + wristAngle;
            let ballX = wrist.x + Math.cos(theta) * 0 - Math.sin(theta) * 5 * s;
            let ballY = wrist.y + Math.sin(theta) * 0 + Math.cos(theta) * 5 * s;

            var phys = getTempBallPhys(ballX, ballY, p);
            drawBallSprite(ballX, ballY, s, (currentStreak >= 5), 0, phys);
        }

        // Colors
        const jerseyColor = skinObj.jerseyColor || '#FFF';
        const shortsColor = skinObj.shortsColor || '#FFF';
        const sleeveRight = skinObj.sleeveRight || skinObj.sleeveColor;
        const sleeveLeft = skinObj.sleeveLeft || skinObj.sleeveColor;
        const socksColor = skinObj.socksColor;
        const shoesColor = skinObj.shoesColor;

        // Legs
        const baseKneeY = p.y - (legLen * 0.5);
        const stanceModLegs = sizeMod.stance || 1.0;
        const hipOffset = 7 * s;
        const footOffset = 10 * s * stanceModLegs;
        const kneeOffset = (hipOffset + footOffset) / 2;

        let lKneeX = p.x - kneeOffset, lKneeY = baseKneeY;
        let rKneeX = p.x + kneeOffset, rKneeY = baseKneeY;
        let lFootX = p.x - footOffset, lFootY = p.y;
        let rFootX = p.x + footOffset, rFootY = p.y;

        if (state === 'JUMPING' && playerData.currentStyle === 'dirk') {
            const style = getCurrentStyle();
            const maxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            const lift = Math.min(1.0, Math.max(0, (maxVz - getCurrentVz()) / maxVz));
            const kickH = 20 * s * lift;
            const kickW = 15 * s * lift;
            if (playerData.isLefty) {
                 lKneeY -= kickH; lKneeX -= kickW; lFootX -= kickW; lFootY -= kickH*0.8;
            } else {
                 rKneeY -= kickH; rKneeX += kickW; rFootX += kickW; rFootY -= kickH*0.8;
            }
        }

        const drawHumanArm = (sx, sy, isRight, angle1, angle2, angle1_z, angle2_z) => {
            const isShootingSide = (playerData.isLefty && !isRight) || (!playerData.isLefty && isRight);
            let uColor = skinTone, fColor = skinTone;
            let activeSleeveColor = null;

            if (skinObj.jerseyType === 'tshirt' || skinObj.jerseyType === 'link_tunic') uColor = jerseyColor;

            if (isRight && sleeveRight) activeSleeveColor = sleeveRight;
            if (!isRight && sleeveLeft) activeSleeveColor = sleeveLeft;

            if (activeSleeveColor) {
                fColor = activeSleeveColor;
            }

            let uZ = angle1_z || 0;
            let fZ = angle2_z || 0;
            if (p.type === 'player_shadow') { uZ = 0; fZ = 0; }

            const effUpper = upperArmLen * Math.max(0.1, Math.cos(uZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(fZ));

            drawJoint(sx, sy, 4*s*sizeMod.armWidth, uColor, isMechanical);

            let elbow = getJoint(sx, sy, effUpper, angle1);
            const upperTattoos = skinObj.tattoos && !activeSleeveColor;
            drawMuscleLimb(sx, sy, elbow.x, elbow.y, 8*s*sizeMod.armWidth, uColor, 'thigh', s, upperTattoos);

            if (activeSleeveColor) {
                 const midX = (sx + elbow.x) / 2;
                 const midY = (sy + elbow.y) / 2;
                 drawMuscleLimb(midX, midY, elbow.x, elbow.y, 8.2*s*sizeMod.armWidth, activeSleeveColor, 'thigh', s, false);
            }

            let wrist = getJoint(elbow.x, elbow.y, effFore, angle2);
            const foreTattoos = skinObj.tattoos && !activeSleeveColor;
            drawMuscleLimb(elbow.x, elbow.y, wrist.x, wrist.y, 6*s*sizeMod.armWidth, fColor, 'thigh', s, foreTattoos);

            drawJoint(elbow.x, elbow.y, 3*s*sizeMod.armWidth, activeSleeveColor || uColor, isMechanical);

            ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.rotate(angle2 + (isShootingSide ? wristAngle : 0));

            ctx.fillStyle = skinTone;
            ctx.beginPath();
            ctx.moveTo(-2*s, 0); ctx.lineTo(2*s, 0); ctx.lineTo(2.5*s, 6*s); ctx.lineTo(-2.5*s, 6*s);
            ctx.fill();

            if (isShootingSide && state !== 'SHOOTING' && state !== 'GAMEOVER' && !isDetachedStyle) {
                ctx.fillStyle = skinTone;
                ctx.beginPath(); ctx.arc(-2*s, 6*s, 1.5*s, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(2*s, 6*s, 1.5*s, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        };

        drawHumanArm(leftShoulderX, armY, false, leftArmAngle, leftForeArmAngle, leftArmZ, leftForeArmZ);
        drawHumanArm(rightShoulderX, armY, true, rightArmAngle, rightForeArmAngle, rightArmZ, rightForeArmZ);

        const hipOffsetX = 7 * s * sizeMod.w;
        drawJoint(p.x - hipOffsetX, p.y - legLen, 4*s*sizeMod.legWidth, skinTone, isMechanical);
        drawJoint(p.x + hipOffsetX, p.y - legLen, 4*s*sizeMod.legWidth, skinTone, isMechanical);

        drawMuscleLimb(p.x - hipOffsetX, p.y - legLen, lKneeX, lKneeY, 8*s*sizeMod.legWidth, skinTone, 'thigh', s, skinObj.tattoos);
        drawMuscleLimb(p.x + hipOffsetX, p.y - legLen, rKneeX, rKneeY, 8*s*sizeMod.legWidth, skinTone, 'thigh', s, skinObj.tattoos);

        // HEAD BASE
        if (skinObj.headType && skinObj.headType !== 'human') {
            drawHybridHead(p, headY, headRadius, s, skinObj.headType, skinObj);
        } else {
            // Standard Human Head - Back View
            ctx.fillStyle = skinTone;
            // Ears
            ctx.beginPath(); ctx.ellipse(p.x - headRadius*0.95, headY, 3.5*s, 6*s, -0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + headRadius*0.95, headY, 3.5*s, 6*s, 0.1, 0, Math.PI*2); ctx.fill();

            if(skinObj.ears === 'elf') {
                 ctx.beginPath(); ctx.moveTo(p.x - headRadius*0.9, headY-5*s); ctx.lineTo(p.x - headRadius*1.6, headY-10*s); ctx.lineTo(p.x - headRadius*0.9, headY+2*s); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(p.x + headRadius*0.9, headY-5*s); ctx.lineTo(p.x + headRadius*1.6, headY-10*s); ctx.lineTo(p.x + headRadius*0.9, headY+2*s); ctx.fill();
            }

            // Skull
            ctx.beginPath();
            ctx.ellipse(p.x, headY - 1*s, headRadius * 0.95, headRadius * 1.05, 0, 0, Math.PI*2);

            if (playerData.graphics === 'HIGH') {
                 const r = headRadius;
                 ctx.fillStyle = skinTone;
                 ctx.fill();
                 const shade = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.1, p.x, headY, r*1.1);
                 shade.addColorStop(0, 'rgba(255,255,255,0.1)');
                 shade.addColorStop(0.5, 'rgba(0,0,0,0)');
                 shade.addColorStop(1, 'rgba(0,0,0,0.4)');
                 ctx.fillStyle = shade;
                 ctx.fill();
                 const neckShadow = ctx.createRadialGradient(p.x, headY + r*0.9, 0, p.x, headY + r*0.9, r*0.7);
                 neckShadow.addColorStop(0, 'rgba(0,0,0,0.3)');
                 neckShadow.addColorStop(1, 'rgba(0,0,0,0)');
                 ctx.fillStyle = neckShadow;
                 ctx.beginPath(); ctx.ellipse(p.x, headY + r*0.7, r*0.5, r*0.3, 0, 0, Math.PI*2); ctx.fill();
            } else {
                 ctx.fill();
                 ctx.fillStyle = 'rgba(0,0,0,0.15)';
                 ctx.beginPath(); ctx.arc(p.x, headY + headRadius*0.6, 5*s, 0, Math.PI*2); ctx.fill();
            }
        }

        // NECK
        const neckW = 10 * s * sizeMod.w;
        const neckH = 10 * s;
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        ctx.moveTo(p.x - neckW, torsoY + 8*s);
        ctx.quadraticCurveTo(p.x - neckW*0.6, torsoY - neckH*0.8, p.x - neckW*0.4, torsoY - neckH);
        ctx.lineTo(p.x + neckW*0.4, torsoY - neckH);
        ctx.quadraticCurveTo(p.x + neckW*0.6, torsoY - neckH*0.8, p.x + neckW, torsoY + 8*s);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.rect(p.x - 1*s, torsoY - neckH + 2*s, 2*s, neckH); ctx.fill();

        // Torso & Shorts
        const jerseyH = bodyH * 0.85;
        const reducedBodyW = bodyW * 0.9;
        const waistY = torsoY + bodyH * 0.85;
        let shortsLen = (0.5 * legLen) + (0.15 * bodyH) + 2*s;
        if (skinObj.shortsLength === 'short') { shortsLen = (0.25 * legLen) + (0.1 * bodyH); }

        drawShorts(p.x, waistY, reducedBodyW * 1.05, shortsLen, s, skinObj);

        const anchors = {
            shoulders: { left: {x: leftShoulderX, y: shoulderY}, right: {x: rightShoulderX, y: shoulderY} },
            hips: { left: {x: p.x - 7*s * sizeMod.w, y: p.y - legLen}, right: {x: p.x + 7*s * sizeMod.w, y: p.y - legLen} }
        };

        if (skinObj.jerseyType === 'none') {
             drawAnatomicBody(p.x, torsoY, reducedBodyW, jerseyH, s, skinTone, false, 0, { chestStripeColor: null, pattern: skinObj.pattern }, anchors);
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.beginPath(); ctx.moveTo(p.x, torsoY + 10*s); ctx.lineTo(p.x, torsoY + jerseyH*0.8); ctx.lineTo(p.x + 2*s, torsoY + jerseyH*0.8); ctx.lineTo(p.x + 2*s, torsoY + 10*s); ctx.fill();
        } else if (skinObj.jerseyType === 'link_tunic') {
             drawLinkTunic(p.x, torsoY, reducedBodyW, jerseyH, s, skinObj, anchors);
        } else {
             drawJersey(p.x, torsoY, reducedBodyW, jerseyH, s, skinObj, anchors);
        }

        if (skinObj.jerseyName) {
             const nameText = skinObj.jerseyName.toUpperCase();
             ctx.fillStyle = skinObj.numberColor || "#FFF";
             const maxW = reducedBodyW * 0.9;
             let fontSize = 7 * s;
             ctx.font = `bold ${fontSize}px Arial`;
             let textW = ctx.measureText(nameText).width;

             ctx.textAlign = "center";
             if (textW > maxW) {
                 const scaleFactor = maxW / textW;
                 ctx.save();
                 ctx.translate(p.x, torsoY + bodyH * 0.25);
                 ctx.scale(scaleFactor, 1);
                 ctx.fillText(nameText, 0, 0);
                 ctx.restore();
             } else {
                 ctx.fillText(nameText, p.x, torsoY + bodyH * 0.25);
             }
        }

        if (skinObj.number) {
            ctx.fillStyle = skinObj.numberColor || "#FFF";
            ctx.font = `bold ${12 * s}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(skinObj.number, p.x, torsoY + bodyH * 0.6);
        }

        if (skinObj.clothingDetail === 'overalls') {
             const bibColor = skinObj.shortsColor || '#000080';
             ctx.fillStyle = bibColor;
             ctx.fillRect(p.x - reducedBodyW*0.35, torsoY + 15*s, reducedBodyW*0.7, jerseyH - 15*s);
             ctx.fillRect(p.x - reducedBodyW*0.35, torsoY, 4*s, 20*s);
             ctx.fillRect(p.x + reducedBodyW*0.35 - 4*s, torsoY, 4*s, 20*s);
             ctx.fillStyle = '#FFD700';
             ctx.beginPath(); ctx.arc(p.x - reducedBodyW*0.35 + 2*s, torsoY + 18*s, 2*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x + reducedBodyW*0.35 - 2*s, torsoY + 18*s, 2*s, 0, Math.PI*2); ctx.fill();
        }

        const drawLowerLeg = (xTop, yTop, xBot, yBot, isRight) => {
             let calfCol = skinTone;
             if (skinObj.legType === 'pants') calfCol = shortsColor;
             drawMuscleLimb(xTop, yTop, xBot, yBot, 7*s*sizeMod.legWidth, calfCol, 'calf', s);
             if(socksColor) {
                 const sockH = 7 * s;
                 const sockY = yBot - 5*s - sockH;
                 const t = (sockY - yTop) / (yBot - yTop);
                 const sockTopX = xTop + (xBot - xTop) * t;
                 const ankleY = yBot - 5*s;
                 const t2 = (ankleY - yTop) / (yBot - yTop);
                 const ankleX = xTop + (xBot - xTop) * t2;
                 drawMuscleLimb(sockTopX, sockY, ankleX, ankleY, 6.5*s*sizeMod.legWidth, socksColor, 'standard', s);
                 ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
                 for(let i=0; i<3; i++) {
                     const ly = sockY + (i*2*s);
                     ctx.beginPath(); ctx.moveTo(sockTopX - 3*s, ly); ctx.lineTo(sockTopX + 3*s, ly); ctx.stroke();
                 }
             }

             // Shoes Logic
             let shoeType = 'none';
             let shoeColor = shoesColor;
             let shoeDetail = null;
             let shoeShiny = false;

             if (playerData.currentShoes && playerData.currentShoes !== 'shoe_none') {
                 const shoeObj = SHOES_DB.find(s => s.id === playerData.currentShoes);
                 if (shoeObj) {
                     shoeType = shoeObj.type;
                     shoeColor = shoeObj.color;
                     shoeDetail = shoeObj.detailColor;
                     shoeShiny = shoeObj.shiny;
                 }
             } else if (shoesColor) {
                 // Default shoes from skin
                 shoeType = 'sneakers';
                 shoeColor = shoesColor;
             }

             if(shoeType !== 'none') {
                 drawRealisticShoe(xBot, yBot, 5.5*s, 5.5*s, shoeColor, isRight, shoeType, shoeDetail, shoeShiny);
             }
        };
        drawLowerLeg(lKneeX, lKneeY, lFootX, lFootY, false);
        drawLowerLeg(rKneeX, rKneeY, rFootX, rFootY, true);

        // Tail
        if (skinObj.tailType) {
            const tx = p.x;
            const ty = waistY + 5*s;
            const tailColor = skinObj.furColor || skinTone;
            const tW = 4*s;

            if (skinObj.tailType === 'bull') {
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = tW;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 20*s, ty + 20*s); ctx.stroke();
                 drawFuzzyPath([{x: tx+20*s, y: ty+20*s}, {x: tx+28*s, y: ty+32*s}, {x: tx+12*s, y: ty+32*s}], '#3E2723', s, true, 901);
            }
            else if (skinObj.tailType === 'snake') {
                 ctx.beginPath(); ctx.strokeStyle = '#2E8B57'; ctx.lineWidth = 6*s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx - 15*s, ty + 10*s, tx - 25*s, ty + 5*s); ctx.stroke();
            }
            else if (skinObj.tailType === 'devil') {
                ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4 * s;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 25*s, ty - 20*s); ctx.stroke();
                ctx.fillStyle = '#8B0000'; ctx.beginPath();
                const ttx = tx + 25*s, tty = ty - 20*s;
                ctx.moveTo(ttx, tty); ctx.lineTo(ttx - 5*s, tty + 10*s); ctx.lineTo(ttx + 5*s, tty + 10*s); ctx.fill();
            }
        }

        // HAIR
        if (!skinObj.headType || skinObj.headType === 'human') {
            drawHairstyle(ctx, p, headY, headRadius, s, skinObj);
        }

        // Head Accessories
        let accessoryType = skinObj.headAccessory;
        let accessoryColor = skinObj.hatColor;

        if (playerData.currentHat && playerData.currentHat !== 'hat_none') {
             const hat = HATS_DB.find(h => h.id === playerData.currentHat);
             if (hat) {
                 accessoryType = hat.type;
                 if (hat.color) accessoryColor = hat.color;
             }
        }

        if (accessoryType === 'cap') {
             ctx.fillStyle = accessoryColor || '#FFF';
             // Dome
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.05, Math.PI, 0); ctx.fill();
             // Button
             ctx.fillStyle = 'rgba(0,0,0,0.2)';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, 4*s, 0, Math.PI*2); ctx.fill();
             // Snapback hole (since back view)
             ctx.fillStyle = '#333';
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, 3*s, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'party_hat') {
             ctx.fillStyle = accessoryColor || '#FF00FF';
             ctx.beginPath();
             ctx.moveTo(p.x - 8*s, headY - 8*s);
             ctx.lineTo(p.x + 8*s, headY - 8*s);
             ctx.lineTo(p.x, headY - 35*s); // Cone tip
             ctx.fill();
        }
        else if (accessoryType === 'propeller_cap') {
             ctx.fillStyle = '#FF0000';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius, Math.PI, Math.PI*1.5); ctx.lineTo(p.x, headY-5*s); ctx.fill();
             ctx.fillStyle = '#0000FF';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius, Math.PI*1.5, 0); ctx.lineTo(p.x, headY-5*s); ctx.fill();
             ctx.fillStyle = '#FFFF00';
             ctx.beginPath(); ctx.arc(p.x, headY - 17*s, 2*s, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = accessoryColor || '#FFD700';
             ctx.fillRect(p.x - 10*s, headY - 19*s, 20*s, 2*s);
             ctx.fillRect(p.x - 2*s, headY - 19*s, 4*s, 4*s);
        }
        else if (accessoryType === 'bucket_hat') {
             ctx.fillStyle = accessoryColor || '#FFFF00';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 12*s, headRadius * 0.9, 4*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillRect(p.x - headRadius * 0.9, headY - 12*s, headRadius * 1.8, 8*s);
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius * 0.9, headY - 4*s);
             ctx.lineTo(p.x + headRadius * 0.9, headY - 4*s);
             ctx.lineTo(p.x + headRadius * 1.4, headY + 2*s);
             ctx.lineTo(p.x - headRadius * 1.4, headY + 2*s);
             ctx.fill();
        }
        else if (accessoryType === 'santa_hat') {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.2, 4*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = accessoryColor || '#FF0000';
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY - 5*s);
             ctx.quadraticCurveTo(p.x, headY - 30*s, p.x + 20*s, headY - 15*s);
             ctx.lineTo(p.x + headRadius, headY - 5*s);
             ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.arc(p.x + 20*s, headY - 15*s, 4*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'viking_helmet') {
             ctx.fillStyle = accessoryColor || '#AAA';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.1, Math.PI, 0); ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 10*s); ctx.quadraticCurveTo(p.x - 20*s, headY - 20*s, p.x - 25*s, headY - 30*s); ctx.lineTo(p.x - 12*s, headY - 12*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x + 10*s, headY - 10*s); ctx.quadraticCurveTo(p.x + 20*s, headY - 20*s, p.x + 25*s, headY - 30*s); ctx.lineTo(p.x + 12*s, headY - 12*s); ctx.fill();
        }
        else if (accessoryType === 'pirate_hat') {
             ctx.fillStyle = accessoryColor || '#111';
             ctx.beginPath();
             ctx.moveTo(p.x - 20*s, headY - 5*s);
             ctx.quadraticCurveTo(p.x - 10*s, headY - 20*s, p.x, headY - 10*s);
             ctx.quadraticCurveTo(p.x + 10*s, headY - 20*s, p.x + 20*s, headY - 5*s);
             ctx.lineTo(p.x, headY - 15*s);
             ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.arc(p.x, headY - 12*s, 3*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'sombrero') {
            ctx.fillStyle = accessoryColor || '#1a1a1a';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, 30*s, 8*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 10*s, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'hat') {
             ctx.fillStyle = accessoryColor || '#5D4037';
             // Brim
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.8, 4*s, 0, 0, Math.PI*2); ctx.fill();
             // Top
             ctx.beginPath(); ctx.arc(p.x, headY - 10*s, headRadius * 0.9, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'fez') {
             ctx.fillStyle = '#8B0000';
             ctx.beginPath(); ctx.moveTo(p.x - 6*s, headY - 8*s); ctx.lineTo(p.x + 6*s, headY - 8*s); ctx.lineTo(p.x + 4*s, headY - 18*s); ctx.lineTo(p.x - 4*s, headY - 18*s); ctx.fill();
             ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1*s; ctx.beginPath(); ctx.moveTo(p.x, headY - 18*s); ctx.lineTo(p.x + 2*s, headY - 12*s); ctx.stroke();
        }
        else if (accessoryType === 'crown') {
            ctx.fillStyle = '#FFD700'; ctx.strokeStyle='#DAA520'; ctx.lineWidth=2*s;
            ctx.beginPath(); ctx.moveTo(p.x - 12*s, headY - 5*s); ctx.lineTo(p.x + 12*s, headY - 5*s); ctx.lineTo(p.x + 15*s, headY - 15*s); ctx.lineTo(p.x + 5*s, headY - 10*s); ctx.lineTo(p.x, headY - 20*s); ctx.lineTo(p.x - 5*s, headY - 10*s); ctx.lineTo(p.x - 15*s, headY - 15*s); ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
        else if (accessoryType === 'halo') {
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3*s;
            ctx.beginPath(); ctx.ellipse(p.x, headY - 25*s, 12*s, 4*s, 0, 0, Math.PI*2); ctx.stroke();
        }
        else if (accessoryType === 'horns') {
            ctx.fillStyle = '#8B0000';
            ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x - 15*s, headY - 15*s, p.x - 5*s, headY - 20*s); ctx.lineTo(p.x - 8*s, headY - 5*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x + 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x + 15*s, headY - 15*s, p.x + 5*s, headY - 20*s); ctx.lineTo(p.x + 8*s, headY - 5*s); ctx.fill();
        }
        else if (accessoryType === 'wizard_hat') {
            ctx.fillStyle = accessoryColor || '#000080';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 10*s, 20*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 10*s); ctx.lineTo(p.x + 10*s, headY - 10*s); ctx.lineTo(p.x + 5*s, headY - 25*s); ctx.lineTo(p.x - 20*s, headY - 35*s); ctx.fill(); // Crooked tip
        }
        else if (accessoryType === 'chef_hat') {
            ctx.fillStyle = '#FFF'; ctx.strokeStyle='#EEE'; ctx.lineWidth=1*s;
            ctx.fillRect(p.x-10*s, headY-15*s, 20*s, 10*s);
            ctx.beginPath(); ctx.arc(p.x, headY-20*s, 12*s, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        }
        else if (accessoryType === 'helmet') {
            const hColor = accessoryColor || '#AAA';
            ctx.fillStyle = hColor;
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(p.x - 12*s, headY, 24*s, 5*s); // Visor area
        }
        else if (accessoryType === 'top_hat') {
            ctx.fillStyle = '#111';
            ctx.fillRect(p.x - 15*s, headY - 10*s, 30*s, 4*s); // Brim
            ctx.fillRect(p.x - 10*s, headY - 25*s, 20*s, 15*s); // Cylinder
        }
        else if (accessoryType === 'flower') {
            ctx.fillStyle = '#FF69B4';
            for(let i=0; i<5; i++) {
                const angle = (i/5)*Math.PI*2;
                ctx.beginPath(); ctx.arc(p.x + Math.cos(angle)*8*s + 10*s, headY - 10*s + Math.sin(angle)*8*s, 4*s, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(p.x + 10*s, headY - 10*s, 4*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'bow') {
            ctx.fillStyle = accessoryColor || '#FF0000';
            ctx.beginPath(); ctx.moveTo(p.x, headY - 15*s); ctx.lineTo(p.x - 10*s, headY - 20*s); ctx.lineTo(p.x - 10*s, headY - 10*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x, headY - 15*s); ctx.lineTo(p.x + 10*s, headY - 20*s); ctx.lineTo(p.x + 10*s, headY - 10*s); ctx.fill();
        }
        else if (accessoryType === 'beanie') {
            ctx.fillStyle = accessoryColor || '#FF0000';
            ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.1, Math.PI, 0); ctx.lineTo(p.x + headRadius*1.1, headY); ctx.lineTo(p.x - headRadius*1.1, headY); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 3*s, 0, Math.PI*2); ctx.fill(); // Pom
        }
        else if (accessoryType === 'ear_muffs') {
            ctx.fillStyle = accessoryColor || '#FFF';
            ctx.beginPath(); ctx.arc(p.x - 12*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 12*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2*s;
            ctx.beginPath(); ctx.arc(p.x, headY - 5*s, 12*s, Math.PI, 0); ctx.stroke();
        }
        else if (accessoryType === 'headband' && skinObj.hairStyle !== 'headband') {
             // Standalone headband (e.g. Ninja)
             const bandColor = accessoryColor || '#FF0000';
             ctx.fillStyle = bandColor;
             ctx.fillRect(p.x - headRadius, headY - 8*s, headRadius * 2, 6*s);
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY - 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY - 5*s); ctx.fill();
        }
        else if (accessoryType === 'bandana_neck') {
             ctx.fillStyle = accessoryColor || '#FF0000';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY + 5*s); ctx.lineTo(p.x, headY + 15*s); ctx.lineTo(p.x + 10*s, headY + 5*s); ctx.fill();
        }
        else if (accessoryType === 'scarf') {
             ctx.fillStyle = accessoryColor || '#8B0000';
             ctx.lineWidth = 6*s; ctx.strokeStyle = accessoryColor || '#8B0000';
             ctx.beginPath(); ctx.arc(p.x, headY + 5*s, 10*s, 0, Math.PI*2); ctx.stroke();
             ctx.fillRect(p.x + 5*s, headY + 5*s, 6*s, 15*s); // Hanging part
        }
        else if (accessoryType === 'gold_bands') {
             ctx.fillStyle = '#FFD700';
             ctx.fillRect(p.x - 15*s, headY - 15*s, 30*s, 5*s);
             ctx.fillRect(p.x - 15*s, headY + 5*s, 30*s, 5*s);
        }

        if(skinObj.headDetail === 'mohawk' && skinObj.hairStyle !== 'mohawk') {
             // Animal mohawk (already handled by drawHairstyle for humans)
             ctx.fillStyle = skinObj.hairColor || '#000';
             for(let i=0; i<5; i++) {
                 ctx.beginPath(); ctx.arc(p.x, headY - 10*s - (i*4*s), (5-i)*s + 2*s, 0, Math.PI*2); ctx.fill();
             }
        }
        if(skinObj.headDetail === 'visor') {
             ctx.fillStyle = '#FF0000'; ctx.shadowBlur = 5; ctx.shadowColor = '#FF0000';
             ctx.fillRect(p.x - 8*s, headY - 5*s, 16*s, 4*s);
             ctx.shadowBlur = 0;
        }

        // Back Props
        if (skinObj.backAccessory === 'cape') {
            ctx.fillStyle = skinObj.backColor || '#000';
            ctx.fillRect(p.x - bodyW/1.5, torsoY + 5*s, bodyW*1.3, bodyH*0.8);
        }
        if (skinObj.backAccessory === 'wings') {
            ctx.fillStyle = skinObj.backColor || '#FFF';
            ctx.beginPath(); ctx.ellipse(p.x - 20*s, torsoY + 10*s, 10*s, 20*s, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + 20*s, torsoY + 10*s, 10*s, 20*s, 0.5, 0, Math.PI*2); ctx.fill();
        }
        if (skinObj.backAccessory === 'backpack') {
             ctx.fillStyle = skinObj.backColor || '#555';
             ctx.fillRect(p.x - bodyW/2, torsoY + 10*s, bodyW, bodyH*0.6);
        }
        if (skinObj.backAccessory === 'hoodie_hood') {
             ctx.fillStyle = skinObj.backColor || '#555';
             // Draw hood down shape on upper back
             ctx.beginPath();
             ctx.moveTo(p.x - bodyW*0.4, torsoY + 5*s);
             ctx.quadraticCurveTo(p.x, torsoY + 20*s, p.x + bodyW*0.4, torsoY + 5*s);
             ctx.lineTo(p.x + bodyW*0.3, torsoY - 5*s); // Tuck under head
             ctx.lineTo(p.x - bodyW*0.3, torsoY - 5*s);
             ctx.fill();
             // Hood crease/shadow
             ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.moveTo(p.x, torsoY+2*s); ctx.lineTo(p.x, torsoY+15*s); ctx.stroke();
        }
        drawMeterCommon(p, s, sizeMod);
    }


    let g_cachedSkinId = null;
    let g_cachedSkinObj = null;

    function drawMeterCommon(p, s, sizeMod) {
        if (state === 'JUMPING' || state === 'PRE_JUMP') {
            const style = getCurrentStyle();
            let baseMaxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            if (baseMaxVz <= 0.5) baseMaxVz = 9;

            const boost = 0.5 * 0.10 * 60;
            const adjustedMaxVz = baseMaxVz + boost;

            const curVz = getCurrentVz();
            const targetVz = getReleaseTargetVz(baseMaxVz);
            const dist = adjustedMaxVz - targetVz;

            let progress = 1.0 - (Math.abs(curVz - targetVz) / dist);
            progress = Math.max(0, Math.min(1, progress));

            const groundY = p.y + (player3D.z * s);
            const meterY = groundY - (130 * s * sizeMod.h);
            const cx = p.x + (60 * s); const radius = 50 * s;

            const thresh = calculateShotThreshold();
            const greenWidth = thresh / dist;

            let gStart = 1.0 - greenWidth;
            let gEnd = 1.0;
            gStart = Math.max(0, gStart);

            if (playerData.meterEnabled) {
                drawShotMeter(cx, meterY, radius * (playerData.meterScale || 1.0), s, progress, gStart, playerData.meterShape || 'arc', gEnd);
            }
        }
    }

    function drawPlayer(p) {
        if (!p) return;
        // Debug
        // if(Math.random() < 0.01) console.log("drawPlayer", p, playerData.currentSkin);

        const s = p.scale;
        const skin = playerData.currentSkin;

        let skinObj;
        if (skin === g_cachedSkinId && g_cachedSkinObj) {
            skinObj = g_cachedSkinObj;
        } else {
            skinObj = SKINS_DB.find(x => x.id === skin);
            if(!skinObj) skinObj = SKINS_DB[0];
            g_cachedSkinId = skin;
            g_cachedSkinObj = skinObj;
        }

        // Apply Custom Human Settings
        if (skin === 'human_custom') {
             // Create shallow copy
             skinObj = Object.assign({}, skinObj);

             if (!playerData.customSkinSettings) playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };
             const cs = playerData.customSkinSettings;

             // Base human is ~1.06 height (Anchor). Range 0.5 to 1.5 -> 0.53 to 1.59
             skinObj.heightScale = 1.06 * cs.height;
             skinObj.widthScale = 1.0 * cs.width;

             if (typeof SKIN_TONES !== 'undefined' && SKIN_TONES[cs.skinToneIndex]) {
                 skinObj.skinTone = SKIN_TONES[cs.skinToneIndex];
             }
        }

        // Apply Global Hair Settings (Length & Color) if set
        if (typeof playerData.customHairLength !== 'undefined' || typeof playerData.customHairColorIndex !== 'undefined') {
             if (skinObj === g_cachedSkinObj) skinObj = Object.assign({}, skinObj); // Ensure copy

             if (typeof playerData.customHairLength !== 'undefined') {
                 skinObj.hairScale = playerData.customHairLength;
             }
             if (typeof playerData.customHairColorIndex !== 'undefined' && typeof HAIR_COLORS !== 'undefined') {
                 const col = HAIR_COLORS[playerData.customHairColorIndex];
                 if(col) skinObj.hairColor = col;
             }
        }

        // Apply Variant Overrides (Style 2)
        if (playerData.skinVariants && playerData.skinVariants[skin] === 1) {
             // Create shallow copy to avoid mutating global cache
             skinObj = Object.assign({}, skinObj);
             if (skinObj.hairStyle2) skinObj.hairStyle = skinObj.hairStyle2;
             if (skinObj.hairColor2) skinObj.hairColor = skinObj.hairColor2;
             if (skinObj.afroSize2) skinObj.afroSize = skinObj.afroSize2;
             if (skinObj.beard2 !== undefined) skinObj.beard = skinObj.beard2;
             if (skinObj.headbandColor2 !== undefined) skinObj.headbandColor = skinObj.headbandColor2;
             if (skinObj.pattern2) skinObj.pattern = skinObj.pattern2;
        }

        // Apply Clothing Overrides
        if (playerData.currentClothing && playerData.currentClothing !== 'clothes_none') {
             // Ensure we are working on a copy
             if (skinObj === g_cachedSkinObj) skinObj = Object.assign({}, skinObj);

             const clothing = CLOTHING_DB.find(c => c.id === playerData.currentClothing);
             if (clothing) {
                 skinObj.clothing = clothing; // Tag for later use
                 skinObj.jerseyColor = clothing.color;

                 if (clothing.type === 'tshirt') {
                     skinObj.jerseyType = 'tshirt';
                     skinObj.sleeveColor = null;
                 } else if (clothing.sleeveColor) {
                     skinObj.sleeveColor = clothing.sleeveColor;
                 }

                 if (clothing.pattern) skinObj.pattern = clothing.pattern;
                 if (clothing.decal) skinObj.decal = clothing.decal;

                 // Override back props if hoodie
                 if (clothing.type === 'hoodie') {
                     skinObj.backAccessory = 'hoodie_hood';
                     skinObj.backColor = clothing.hoodColor || clothing.color;
                 }

                 // Remove conflicting built-in details
                 if (['track', 'hoodie', 'sweatshirt'].includes(clothing.type)) {
                     skinObj.clothingDetail = null; // Hide suspenders etc.
                     // Track suits often have stripes
                     if(clothing.stripeColor) skinObj.chestStripeColor = clothing.stripeColor;
                 }
             }
        }

        const isMechanical = isMechanicalSkin(skinObj.id);
        const currentAnimal = skinObj.animal;

        if (currentAnimal === 'human') {
            drawRealisticHuman(p, s, skinObj);
            return;
        }

        let sizeMod = { w: 1, h: 1, head: 1, stance: 1.0, limbLen: 1.0, armWidth: 1.0, legWidth: 1.0, shoulderWidth: 1.0, footScale: 1.0, neckWidth: 1.0, snoutScale: 1.0, limbTaper: 0.7 };
        switch(currentAnimal) {
            case 'rat': sizeMod = { w: 0.7, h: 0.7, head: 0.8, stance: 0.8, limbLen: 0.85, shoulderWidth: 0.6, footScale: 0.8, neckWidth: 0.8, snoutScale: 1.0, limbTaper: 0.7 }; break;
            case 'cat':
                sizeMod = { w: 0.8, h: 0.8, head: 0.9, stance: 0.9, limbLen: 0.9, shoulderWidth: 0.6, footScale: 0.9, neckWidth: 0.9, snoutScale: 0.8, limbTaper: 0.7 };
                if (skin.includes('sphinx')) { sizeMod.w = 0.7; sizeMod.h = 0.85; sizeMod.head = 0.85; } // Skinny
                if (skin.includes('persian')) { sizeMod.w = 1.0; sizeMod.h = 0.8; sizeMod.head = 1.0; } // Fluffy
                if (skin.includes('panther')) { sizeMod.w = 0.9; sizeMod.h = 0.9; sizeMod.limbLen = 1.0; } // Athletic
                if (skin.includes('garfield')) { sizeMod.w = 1.1; sizeMod.h = 0.9; sizeMod.head = 1.1; } // Fat cat
                break;
            case 'rabbit': sizeMod = { w: 0.8, h: 0.8, head: 0.9, stance: 0.9, limbLen: 0.9, shoulderWidth: 0.6, footScale: 1.2, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'dog':
                sizeMod = { w: 1.0, h: 1.0, head: 1.0, stance: 1.0, limbLen: 1.0, shoulderWidth: 0.7, footScale: 1.0, neckWidth: 1.1, snoutScale: 1.1, limbTaper: 0.7 };
                if (skin.includes('pug')) { sizeMod.w = 0.9; sizeMod.h = 0.75; sizeMod.head = 1.1; sizeMod.limbLen = 0.8; sizeMod.snoutScale = 0.5; } // Small & Flat
                if (skin.includes('husky') || skin.includes('police') || skin.includes('wolf')) { sizeMod.w = 1.05; sizeMod.h = 1.1; sizeMod.limbLen = 1.1; } // Athletic
                if (skin.includes('boxer')) { sizeMod.w = 1.1; sizeMod.h = 1.05; sizeMod.shoulderWidth = 0.9; } // Muscular
                if (skin.includes('dalmation')) { sizeMod.w = 0.95; sizeMod.h = 1.05; sizeMod.limbLen = 1.1; } // Lean
                break;
            case 'moose': sizeMod = { w: 1.2, h: 1.3, head: 1.1, stance: 1.1, limbLen: 1.1, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.4, limbTaper: 0.7 }; break;
            case 'bear': sizeMod = { w: 1.4, h: 1.3, head: 1.2, stance: 1.6, limbLen: 0.7, armWidth: 1.3, legWidth: 1.5, shoulderWidth: 0.9, footScale: 1.3, neckWidth: 1.4, snoutScale: 1.2, limbTaper: 0.85 }; break;
            case 'human': sizeMod = { w: 0.9, h: 1.1, head: 0.9, stance: 1.0, limbLen: 1.0, shoulderWidth: 1.0, footScale: 1.0, neckWidth: 1.0, limbTaper: 0.8 }; break;
            case 'fox': sizeMod = { w: 0.9, h: 0.9, head: 0.95, stance: 0.95, limbLen: 0.95, shoulderWidth: 0.6, footScale: 0.9, neckWidth: 0.9, snoutScale: 1.1, limbTaper: 0.7 }; break;
            case 'wolf': sizeMod = { w: 1.1, h: 1.1, head: 1.1, stance: 1.05, limbLen: 1.05, legWidth: 1.1, shoulderWidth: 0.7, footScale: 1.0, neckWidth: 1.1, snoutScale: 1.2, limbTaper: 0.75 }; break;
            case 'lion': sizeMod = { w: 1.3, h: 1.2, head: 1.25, stance: 1.2, limbLen: 1.05, legWidth: 1.25, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.1, limbTaper: 0.8 }; break;
            case 'tiger': sizeMod = { w: 1.3, h: 1.2, head: 1.2, stance: 1.2, limbLen: 1.05, legWidth: 1.25, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.1, limbTaper: 0.8 }; break;
            case 'pig': sizeMod = { w: 1.1, h: 0.9, head: 1.0, stance: 1.5, limbLen: 0.7, armWidth: 1.2, legWidth: 1.2, shoulderWidth: 0.6, footScale: 0.8, neckWidth: 1.2, snoutScale: 1.0, limbTaper: 0.85 }; break;
            case 'cow': sizeMod = { w: 1.3, h: 1.3, head: 1.2, stance: 1.5, limbLen: 0.9, legWidth: 1.2, shoulderWidth: 0.7, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.2, limbTaper: 0.85 }; break;
            case 'monkey': sizeMod = { w: 0.85, h: 0.9, head: 0.9, stance: 1.0, limbLen: 1.2, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'penguin': sizeMod = { w: 1.0, h: 0.8, head: 0.9, stance: 1.1, limbLen: 0.5, shoulderWidth: 0.5, footScale: 1.3, neckWidth: 1.0, limbTaper: 0.8 }; break;
            case 'chicken': sizeMod = { w: 0.7, h: 0.7, head: 0.7, stance: 0.8, limbLen: 0.7, armWidth: 0.6, legWidth: 0.6, shoulderWidth: 0.5, footScale: 0.8, neckWidth: 0.6, limbTaper: 0.6 }; break;
            case 'frog': sizeMod = { w: 0.8, h: 0.7, head: 1.0, stance: 1.4, limbLen: 1.1, armWidth: 0.8, legWidth: 0.8, shoulderWidth: 0.6, footScale: 1.4, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'turtle': sizeMod = { w: 1.1, h: 0.9, head: 0.9, stance: 1.2, limbLen: 0.6, armWidth: 1.2, legWidth: 1.2, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.2, limbTaper: 0.8 }; break;
            case 'elephant': sizeMod = { w: 1.5, h: 1.3, head: 1.4, stance: 1.3, limbLen: 0.8, armWidth: 1.5, legWidth: 1.6, shoulderWidth: 0.9, footScale: 1.5, neckWidth: 1.5, limbTaper: 0.9 }; break;
            case 'dino': sizeMod = { w: 1.3, h: 1.3, head: 1.2, stance: 1.2, limbLen: 1.1, legWidth: 1.4, shoulderWidth: 0.7, footScale: 1.3, neckWidth: 1.2, snoutScale: 1.3, limbTaper: 0.8 }; break;
            case 'zebra': sizeMod = { w: 1.2, h: 1.2, head: 1.1, stance: 1.1, limbLen: 1.1, shoulderWidth: 0.75, footScale: 1.0, neckWidth: 1.2, snoutScale: 1.2, limbTaper: 0.7 }; break;
            case 'giraffe': sizeMod = { w: 1.2, h: 1.6, head: 1.0, stance: 1.2, limbLen: 1.5, shoulderWidth: 0.7, footScale: 1.2, neckWidth: 0.7, limbTaper: 0.7 }; break;
        }

        // Apply Skin Overrides (Size & Proportions)
        if (skinObj.widthScale) sizeMod.w = skinObj.widthScale;
        if (skinObj.heightScale) sizeMod.h = skinObj.heightScale;
        if (skinObj.armWidthScale) sizeMod.armWidth = skinObj.armWidthScale;
        if (skinObj.legWidthScale) sizeMod.legWidth = skinObj.legWidthScale;

        // Fill defaults if missing
        if (!sizeMod.armWidth) sizeMod.armWidth = sizeMod.w;
        if (!sizeMod.legWidth) sizeMod.legWidth = sizeMod.w;

        // V-Taper / Hulk Body Size Adjustment
        if (currentAnimal === 'human' && skinObj.jerseyType === 'none') {
            sizeMod.w *= 1.5;
            sizeMod.h *= 1.5;
        }

        // Determine if Furry
        const NON_FURRY_ANIMALS = ['dino', 'turtle', 'penguin', 'frog', 'elephant', 'human'];
        const isNonFurrySkin = skin.includes('robot') || skin.includes('astronaut') || skin.includes('alien') || skin.includes('ninja');
        let isFurry = !NON_FURRY_ANIMALS.includes(currentAnimal) && !isNonFurrySkin;

        // 1. Setup Base Colors
        let furColor = '#555', tailColor = '#FFC0CB', torsoColor = '#555', legColor = '#555', armColor = '#555';
        let thighColor = '#555', calfColor = '#555';
        let bellyColor = null, hasSpots = false, hasBlackEars = false;

        if (skin === 'bear_panda' || skinObj.hasBlackEars) hasBlackEars = true;

        if(currentAnimal === 'rat') { furColor = '#696969'; tailColor = '#FFC0CB'; }
        else if(currentAnimal === 'cat') { furColor = '#808080'; tailColor = '#808080'; }
        else if(currentAnimal === 'dog') { furColor = '#8B4513'; tailColor = '#8B4513'; }
        else if(currentAnimal === 'bear') { furColor = '#4B3621'; tailColor = '#4B3621'; }
        else if(currentAnimal === 'rabbit') { furColor = '#fff'; tailColor = '#fff'; }
        else if(currentAnimal === 'moose') { furColor = '#5D4037'; tailColor = '#5D4037'; }
        else if(currentAnimal === 'fox') { furColor = '#D2691E'; tailColor = '#D2691E'; }
        else if(currentAnimal === 'wolf') { furColor = '#808080'; tailColor = '#808080'; }
        else if(currentAnimal === 'lion') { furColor = '#DAA520'; tailColor = '#DAA520'; }
        else if(currentAnimal === 'tiger') { furColor = '#FFA500'; tailColor = '#FFA500'; }
        else if(currentAnimal === 'pig') { furColor = '#FFC0CB'; tailColor = '#FFC0CB'; }
        else if(currentAnimal === 'cow') { furColor = '#FFF'; tailColor = '#FFF'; }
        else if(currentAnimal === 'monkey') { furColor = '#8B4513'; tailColor = '#8B4513'; }
        else if(currentAnimal === 'penguin') { furColor = '#000'; tailColor = '#000'; }
        else if(currentAnimal === 'human') {
            furColor = skinObj.skinTone || '#8d5524';
            tailColor = 'transparent';
        }

        // 2. Apply Skin Overrides (Data Driven)
        // Biological overrides first
        if (skinObj.furColor) { furColor = skinObj.furColor; tailColor = skinObj.furColor; }
        if (skinObj.hasSpots) hasSpots = true;

        if (skin.includes('alien')) { furColor = '#32CD32'; tailColor = '#32CD32'; }
        if (skin.includes('zombie')) { furColor = '#98FB98'; }
        if (skin.includes('robot')) { furColor = '#C0C0C0'; }

        // Default clothes to fur color (naked)
        torsoColor = furColor; legColor = furColor; armColor = furColor;
        thighColor = legColor; calfColor = legColor;

        // Clothing overrides
        torsoColor = skinObj.jerseyColor || furColor;
        thighColor = skinObj.shortsColor || furColor;
        calfColor = furColor; // Default exposed calf

        // Arms: Default to fur, check for sleeves
        armColor = furColor;
        if (skinObj.sleeveColor) armColor = skinObj.sleeveColor;

        // Legs: If "trousers" (long pants), calf follows thigh color
        if (skinObj.legType === 'pants') calfColor = thighColor;
        if (skinObj.legType === 'tights') calfColor = thighColor;

        // Panda Logic (Black limbs)
        if (skinObj.legType === 'panda_limbs') {
            legColor = '#000'; thighColor = '#000'; calfColor = '#000'; armColor = '#000';
        }

        // 0. Calculate Arm Config EARLY
        // Uses global smooth animation state
        const r_la = g_animState.la;
        const r_ra = g_animState.ra;
        const r_lfa = g_animState.lfa;
        const r_rfa = g_animState.rfa;
        const r_w = g_animState.w;

        // Z-Rotation (Depth)
        const r_la_z = g_animState.la_z || 0;
        const r_ra_z = g_animState.ra_z || 0;
        const r_lfa_z = g_animState.lfa_z || 0;
        const r_rfa_z = g_animState.rfa_z || 0;

        let leftArmAngle, rightArmAngle, leftForeArmAngle, rightForeArmAngle, wristAngle;
        let leftArmZ, rightArmZ, leftForeArmZ, rightForeArmZ;

        const isLefty = playerData.isLefty;
        if (isLefty) {
            leftArmAngle = Math.PI - r_ra; rightArmAngle = Math.PI - r_la;
            leftForeArmAngle = Math.PI - r_rfa; rightForeArmAngle = Math.PI - r_lfa;
            wristAngle = -r_w;
            // Swap Z for Lefty
            leftArmZ = r_ra_z; rightArmZ = r_la_z;
            leftForeArmZ = r_rfa_z; rightForeArmZ = r_lfa_z;
        } else {
            leftArmAngle = r_la; rightArmAngle = r_ra;
            leftForeArmAngle = r_lfa; rightForeArmAngle = r_rfa;
            wristAngle = r_w;
            // Standard Z
            leftArmZ = r_la_z; rightArmZ = r_ra_z;
            leftForeArmZ = r_lfa_z; rightForeArmZ = r_rfa_z;
        }

        let bodyW = 20 * s * sizeMod.w; let bodyH = 40 * s * sizeMod.h;
        if(currentAnimal === 'bear') bodyW = 30 * s * sizeMod.w;

        let legLen = 30 * s * sizeMod.h * (sizeMod.limbLen || 1.0);
        let neckLen = 0;

        // Pose Logic
        const isSitting = (state === 'GAMEOVER' && currentAnimal !== 'human');
        const isCrouching = (state === 'PRE_JUMP'); // Now applies to animals too (Gather)

        let torsoY;
        if (isSitting) {
             torsoY = p.y - bodyH * 0.85; // Low to ground
        } else if (isCrouching) {
             torsoY = p.y - legLen * 0.6 - bodyH; // Crouched
        } else {
             torsoY = p.y - legLen - bodyH;
        }
        if (skinObj.neckLength) neckLen = skinObj.neckLength * s;
        let headY = torsoY - (10 * s * sizeMod.head) - neckLen;
        let headRadius = 12 * s * sizeMod.head;

        // Super Saiyan Aura
        if (currentStreak >= 10) {
             const hue = getStreakFireHue(currentStreak);
             ctx.save();
             // Outer Glow
             ctx.shadowBlur = 30 * s;
             ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
             ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.2)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 2.5, bodyH * 2.0, 0, 0, Math.PI*2);
             ctx.fill();
             // Inner Core
             ctx.shadowBlur = 15 * s;
             ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.3)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 1.5, bodyH * 1.5, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        // Draw Neck (Universal - Connect Head to Body)
        const neckWidth = 10 * s * (sizeMod.neckWidth || (sizeMod.w || 1.0) * 0.6);
        const neckTopY = headY + headRadius * 0.5;
        const neckBottomY = torsoY + (10*s);

        // Always draw neck if gap exists or explicitly requested (Rat/Giraffe fix)
        if (neckBottomY > neckTopY || skinObj.neckLength) {
             const savedFill = ctx.fillStyle;
             ctx.fillStyle = furColor;
             // Ensure skin tone for humans
             if (currentAnimal === 'human') ctx.fillStyle = skinObj.skinTone || furColor;

             ctx.fillRect(p.x - neckWidth/2, neckTopY, neckWidth, neckBottomY - neckTopY);
             ctx.fillStyle = savedFill;
        }

        // Lift shoulders for humans to extend jersey higher (Trapezoid shape)
        let shoulderY = torsoY + (2*s);
        let armY = torsoY + (5*s); // Lower attachment
        if (currentAnimal === 'human') { shoulderY = torsoY; armY = torsoY; } // Square shoulders at top of bounding box

        // Stance modifier for shoulder width and hip width
        const stanceMod = sizeMod.stance || 1.0;

        // Dynamic Shoulder Width (Scaling with Body Width)
        const shoulderScale = (sizeMod.w || 1.0) * (sizeMod.shoulderWidth || 1.0);
        let shoulderBaseW = 12 * s * stanceMod * shoulderScale;

        // Extra Broad for Hulk/Strong types (Shirtless = Broad)
        if (skinObj.jerseyType === 'none') {
            shoulderBaseW *= 1.5;
        }

        let leftShoulderX = p.x - shoulderBaseW;
        let rightShoulderX = p.x + shoulderBaseW;

        let armLenMod = sizeMod.limbLen || 1.0;
        if (skinObj.armLen) armLenMod = skinObj.armLen;
        else if (currentAnimal === 'bear') armLenMod = 0.95; // Bears have slightly shorter arms but not too short to break shooting
        let upperArmLen = 20 * s * sizeMod.h * 1.05 * armLenMod; let foreArmLen = 20 * s * sizeMod.h * 1.05 * armLenMod;

        // --- PROCEDURAL GUIDE HAND LOGIC (ANIMALS) ---
        // Updated to handle Z-foreshortening in IK (Approximation)
        if (isTwoHandedStyle(playerData.currentStyle) && (state === 'JUMPING' || state === 'PRE_JUMP')) {
            const isRightHand = !isLefty;

            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootUZ = isRightHand ? rightArmZ : leftArmZ;
            const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;

            // Calculate effective lengths for 2D projection
            const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

            const elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
            const wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);
            const ballPos = calculateBallPosition(wrist.x, wrist.y, s, shootFAngle, wristAngle);

            // 2. Calculate Guide Arm Target
            const guideTargetX = ballPos.x + (isRightHand ? -15*s : 15*s);
            const guideTargetY = ballPos.y;

            const guideSX = isRightHand ? leftShoulderX : rightShoulderX;

            // 3. Solve IK
            const distSq = (guideTargetX - guideSX)**2 + (guideTargetY - armY)**2;
            const maxLen = upperArmLen + foreArmLen;
            const minScale = Math.min(1.0, Math.sqrt(distSq) / maxLen);
            const maxZ = Math.acos(Math.max(0, Math.min(1, minScale * 0.99)));
            const guideZ = Math.min(shootUZ, maxZ);

            const effGuideUpper = upperArmLen * Math.max(0.1, Math.cos(guideZ));
            const effGuideFore = foreArmLen * Math.max(0.1, Math.cos(guideZ));

            const ik = solveIK(guideSX, armY, guideTargetX, guideTargetY, effGuideUpper, effGuideFore, isLefty);

            // 4. Override Guide Arm Angles
            if (isRightHand) {
                leftArmAngle = ik.uAngle;
                leftForeArmAngle = ik.fAngle;
                // Sync Z
                leftArmZ = guideZ; leftForeArmZ = guideZ;
            } else {
                rightArmAngle = ik.uAngle;
                rightForeArmAngle = ik.fAngle;
                rightArmZ = guideZ; rightForeArmZ = guideZ;
            }
        }

        const isShadow = (p.type === 'player_shadow');

        const drawSegmentedArm = (sx, sy, isRight, angle1, angle2, angle1_z, angle2_z) => {
            const armFurry = isFurry && (armColor === furColor);
            const seedBase = isRight ? 10 : 20;
            const isShootingSide = (isLefty && !isRight) || (!isLefty && isRight);

            let thisUpperColor = armColor;
            let thisForeColor = armColor;
            let activeSleeveColor = null;

            // T-Shirt Logic
            if(skinObj.jerseyType === 'tshirt' || skinObj.jerseyType === 'link_tunic') {
                thisUpperColor = torsoColor;
            }

            // Sleeve Logic (Physical side based)
            if(isRight && skinObj.sleeveRight) {
                activeSleeveColor = skinObj.sleeveRight;
            }
            if(!isRight && skinObj.sleeveLeft) {
                activeSleeveColor = skinObj.sleeveLeft;
            }

            if (activeSleeveColor) {
                thisForeColor = activeSleeveColor;
            }

            // Calculate Tapered Widths
            const taper = sizeMod.limbTaper || 0.7;
            const upperStartW = 7 * s * sizeMod.armWidth;
            const upperEndW = upperStartW * taper;
            const foreStartW = upperEndW; // Seamless transition
            const foreEndW = foreStartW * taper;

            // FORESHORTENING
            let uFactor = Math.cos(angle1_z || 0);
            let fFactor = Math.cos(angle2_z || 0);

            // Shadow Logic: Show full length (projected to ground) to imply depth
            if (isShadow) {
                // If shadow, we ignore the Z-shortening because the shadow
                // of a forward-reaching arm (parallel to ground) is full length.
                // However, our Z-angle is "angle from screen plane".
                // If Z=90, arm is pointing at camera (horizontal). Shadow is full length.
                // If Z=0, arm is parallel to screen (horizontal). Shadow is full length.
                // What if arm is pointing UP? That's controlled by angle1 (X/Y).
                // If angle1 is -PI/2 (UP), and Z=0, arm is vertical. Shadow is short (blob).
                // So, we should use uFactor = 1.0 for shadow pass?
                uFactor = 1.0;
                fFactor = 1.0;
            }

            uFactor = Math.max(0.1, Math.abs(uFactor));
            fFactor = Math.max(0.1, Math.abs(fFactor));

            let elbow = getJoint(sx, sy, upperArmLen * uFactor, angle1);

            // Shoulder Joint (Radius = Half Width for seamless look)
            if(!armFurry) drawJoint(sx, sy, upperStartW * 0.5, thisUpperColor, isMechanical);
            else drawFuzzyCircle(sx, sy, upperStartW * 0.5, thisUpperColor, seedBase, s, true);

            // Upper Arm (Tapered)
            drawFuzzyLimb(sx, sy, elbow.x, elbow.y, upperStartW, thisUpperColor, s, armFurry, seedBase, upperEndW);

            // Arm Sleeve Upper Segment (Mid-Bicep to Elbow)
            if (activeSleeveColor) {
                const midX = (sx + elbow.x) / 2;
                const midY = (sy + elbow.y) / 2;
                // Interpolate width at mid point
                const midW = upperStartW + (upperEndW - upperStartW) * 0.5;
                drawFuzzyLimb(midX, midY, elbow.x, elbow.y, midW, activeSleeveColor, s, false, seedBase, upperEndW);
            }

            let wrist = getJoint(elbow.x, elbow.y, foreArmLen * fFactor, angle2);

            // Forearm (Tapered)
            drawFuzzyLimb(elbow.x, elbow.y, wrist.x, wrist.y, foreStartW, thisForeColor, s, activeSleeveColor ? false : armFurry, seedBase + 1, foreEndW);

            // Elbow Joint (Radius = Half Width)
            let elbowColor = thisUpperColor;
            if (activeSleeveColor) {
                elbowColor = activeSleeveColor;
            } else if (thisForeColor === furColor && thisUpperColor !== furColor) {
                elbowColor = thisUpperColor; // Sleeve covers elbow
            } else if (thisUpperColor === furColor) {
                elbowColor = furColor;
            }

            const elbowFurry = activeSleeveColor ? false : armFurry;
            if(!elbowFurry) drawJoint(elbow.x, elbow.y, upperEndW * 0.5, elbowColor, isMechanical);
            else drawFuzzyCircle(elbow.x, elbow.y, upperEndW * 0.5, elbowColor, seedBase+2, s, true);

            ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.rotate(angle2 + (isShootingSide ? wristAngle : 0));

            // Paw / Hand
            if (armFurry && !activeSleeveColor) {
                 // Fuzzy Paw
                 const pawColor = thisForeColor;
                 drawFuzzyCircle(0, 0, 4.5*s, pawColor, seedBase+5, s, true);
                 // Toes
                 for(let k=-1; k<=1; k++) {
                     drawFuzzyCircle(k*3*s, 5*s, 2.5*s, pawColor, seedBase+6+k, s, true);
                 }
            } else {
                 // Simple Hand
                 ctx.fillStyle = furColor; ctx.beginPath(); ctx.arc(0, 0, 5*s, 0, Math.PI*2); ctx.fill();
            }

            if (wristAngle > 0.5 && isShootingSide) {
                 if(skin.includes('hockey')) { ctx.strokeStyle='#8B4513'; ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 40*s); ctx.lineTo(10*s, 45*s); ctx.stroke(); }
            }

            // Ball removed (drawn earlier)
            ctx.restore();
        };

        if (playerData.currentStyle === 'airbud' && state === 'SHOOTING') {
             const t = airbudJumpTime;
             const maxT = 30;
             if (t < maxT) {
                 const jumpHeight = 60 * s * sizeMod.h;
                 const nt = t / maxT;
                 const offset = 4 * jumpHeight * nt * (1 - nt);
                 p.y -= offset;
                 torsoY = p.y - legLen - bodyH;
                 headY = torsoY - (10 * s * sizeMod.head);
                 shoulderY = torsoY + (2*s);
                 armY = torsoY + (5*s);
                 // Recalculate shoulders
                 leftShoulderX = p.x - 12*s; rightShoulderX = p.x + 12*s;
             }
        }

        // 0b. Detached Ball Rendering
        drawDetachedBall(p, s, torsoY, bodyH, headY);

        // 0c. HELD BALL RENDERING (Layer 0)
        const isDetachedStyle = ['airbud', 'telekinesis'].includes(playerData.currentStyle);
        if (!isDetachedStyle && state !== 'SHOOTING' && state !== 'GAMEOVER') {
             let ballX, ballY;

             if (isSitting) {
                 // Ball in Lap
                 ballX = p.x;
                 ballY = torsoY + bodyH * 0.8;
             } else {
                 const isRightHand = !isLefty;
                 const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
                 const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
                 // Use Z-factor for ball position too!
                 const shootUZ = isRightHand ? rightArmZ : leftArmZ;
                 const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;
                 const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
                 const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

                 const shootSX = isRightHand ? rightShoulderX : leftShoulderX;

                 let elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
                 let wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);

                 let theta = shootFAngle + wristAngle;
                 ballX = wrist.x + Math.cos(theta) * 0 - Math.sin(theta) * 5 * s;
                 ballY = wrist.y + Math.sin(theta) * 0 + Math.cos(theta) * 5 * s;
             }

             var phys = getTempBallPhys(ballX, ballY, p);
             drawBallSprite(ballX, ballY, s, (currentStreak >= 5), 0, phys);
        }

        // Arms First (Layer 1) - Arms behind legs
        drawSegmentedArm(leftShoulderX, armY, false, leftArmAngle, leftForeArmAngle, leftArmZ, leftForeArmZ);
        drawSegmentedArm(rightShoulderX, armY, true, rightArmAngle, rightForeArmAngle, rightArmZ, rightForeArmZ);

        // 2. Legs (Base implementation)
        let lKneeX, lKneeY, rKneeX, rKneeY, lFootX, lFootY, rFootX, rFootY;

        if (isSitting) {
             // Sitting Pose: Knees wide, Feet forward/central
             lKneeX = p.x - 20*s*stanceMod; lKneeY = p.y - 5*s;
             rKneeX = p.x + 20*s*stanceMod; rKneeY = p.y - 5*s;
             lFootX = p.x - 12*s; lFootY = p.y + 5*s;
             rFootX = p.x + 12*s; rFootY = p.y + 5*s;
        } else if (isCrouching) {
             // Crouch Pose: Knees bent outward
             lKneeX = p.x - 15*s*stanceMod; lKneeY = p.y - legLen * 0.3;
             rKneeX = p.x + 15*s*stanceMod; rKneeY = p.y - legLen * 0.3;
             lFootX = p.x - 10*s*stanceMod; lFootY = p.y;
             rFootX = p.x + 10*s*stanceMod; rFootY = p.y;
        } else {
             // Standing
             const baseKneeY = p.y - (legLen * 0.5);
             lKneeX = p.x - 9*s*stanceMod; lKneeY = baseKneeY;
             rKneeX = p.x + 9*s*stanceMod; rKneeY = baseKneeY;
             lFootX = p.x - 10*s*stanceMod; lFootY = p.y;
             rFootX = p.x + 10*s*stanceMod; rFootY = p.y;
        }

        // Dirk Kick Logic
        if (state === 'JUMPING' && playerData.currentStyle === 'dirk') {
            const style = getCurrentStyle();
            const maxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            const lift = Math.min(1.0, Math.max(0, (maxVz - getCurrentVz()) / maxVz));
            const kickH = 20 * s * lift;
            const kickW = 15 * s * lift;
            if (playerData.isLefty) {
                 lKneeY -= kickH; lKneeX -= kickW; lFootX -= kickW; lFootY -= kickH*0.8;
            } else {
                 rKneeY -= kickH; rKneeX += kickW; rFootX += kickW; rFootY -= kickH*0.8;
            }
        }


        const legFurry = isFurry && (legColor === furColor);

        // Scale Hip Width with Body/Leg Width (Fixes narrow hips on wide chars)
        const hipScale = (sizeMod.legWidth || sizeMod.w || 1.0);
        const hipX = 8 * s * stanceMod * hipScale;

        let hipY = p.y - legLen;
        if (isSitting) hipY = p.y - 10 * s;

        // Calculate Tapered Leg Widths
        const legTaper = sizeMod.limbTaper || 0.7;
        const thighStartW = 8 * s * sizeMod.legWidth;
        const thighEndW = thighStartW * legTaper;
        const calfStartW = thighEndW;
        const calfEndW = calfStartW * legTaper;

        // Hip Joints
        if(!legFurry) {
            drawJoint(p.x - hipX, hipY, thighStartW * 0.5, thighColor, isMechanical);
            drawJoint(p.x + hipX, hipY, thighStartW * 0.5, thighColor, isMechanical);
        } else {
            drawFuzzyCircle(p.x - hipX, hipY, thighStartW * 0.5, thighColor, 10, s, true);
            drawFuzzyCircle(p.x + hipX, hipY, thighStartW * 0.5, thighColor, 30, s, true);
        }

        // Tapered Thighs
        drawFuzzyLimb(p.x - hipX, hipY, lKneeX, lKneeY, thighStartW, thighColor, s, legFurry, 1, thighEndW);
        drawFuzzyLimb(p.x + hipX, hipY, rKneeX, rKneeY, thighStartW, thighColor, s, legFurry, 3, thighEndW);

        // Calves & Socks/Shoes
        const drawLowerLeg = (xTop, yTop, xBot, yBot, isRight) => {
             const calfBaseColor = calfColor;

             // Draw Base Calf
             drawFuzzyLimb(xTop, yTop, xBot, yBot, calfStartW, calfBaseColor, s, legFurry, isRight?4:2, calfEndW);

             // Paw / Foot (If no shoes)
             if (legFurry && !skinObj.shoesColor) {
                 const pawColor = calfBaseColor;
                 const footS = sizeMod.footScale || 1.0;
                 drawFuzzyCircle(xBot, yBot, 4.5*s*footS, pawColor, isRight?50:60, s, true);
                 // Toes
                 for(let k=-1; k<=1; k++) {
                     drawFuzzyCircle(xBot + k*3*s*footS, yBot + 4*s*footS, 3*s*footS, pawColor, isRight?51+k:61+k, s, true);
                 }
             }

             // Knee Joint (Radius = Half Width)
             if(!legFurry) drawJoint(xTop, yTop, thighEndW * 0.5, thighColor, isMechanical);
             else drawFuzzyCircle(xTop, yTop, thighEndW * 0.5, thighColor, isRight?40:20, s, true);

             // Socks & Shoes Overlay
             if(skinObj.socksColor || skinObj.shoesColor || (playerData.currentShoes && playerData.currentShoes !== 'shoe_none')) {
                 const shoeH = 5 * s; const sockH = 7 * s;
                 // Calculate local Y relative to the foot Y
                 const ankleY = yBot - shoeH; const sockY = ankleY - sockH;

                 // Interpolate X/Y
                 const getXAtY = (y) => {
                     const t = (y - yTop) / (yBot - yTop);
                     return xTop + (xBot - xTop) * t;
                 };

                 if(skinObj.socksColor) {
                     const sockTopX = getXAtY(sockY);
                     const ankleX = getXAtY(ankleY);
                     // Interpolate widths
                     const sockTopW = calfStartW + (calfEndW - calfStartW) * ((sockY - yTop)/(yBot - yTop));
                     const ankleW = calfStartW + (calfEndW - calfStartW) * ((ankleY - yTop)/(yBot - yTop));
                     drawFuzzyLimb(sockTopX, sockY, ankleX, ankleY, sockTopW, skinObj.socksColor, s, false, 0, ankleW);
                 }

                 // Shoes Logic
                 let shoeType = 'none';
                 let shoeColor = skinObj.shoesColor;
                 let shoeDetail = null;
                 let shoeShiny = false;

                 if (playerData.currentShoes && playerData.currentShoes !== 'shoe_none') {
                     const shoeObj = SHOES_DB.find(s => s.id === playerData.currentShoes);
                     if (shoeObj) {
                         shoeType = shoeObj.type;
                         shoeColor = shoeObj.color;
                         shoeDetail = shoeObj.detailColor;
                         shoeShiny = shoeObj.shiny;
                     }
                 } else if (skinObj.shoesColor) {
                     shoeType = 'sneakers';
                 }

                 if(shoeType !== 'none' && shoeColor) {
                     const ankleX = getXAtY(ankleY);
                     const ankleW = calfStartW + (calfEndW - calfStartW) * ((ankleY - yTop)/(yBot - yTop));

                     // Draw high top part of shoe on ankle
                     if(shoeType === 'hightop' || shoeType === 'boots' || shoeType === 'sneakers') {
                         drawFuzzyLimb(ankleX, ankleY, xBot, yBot, ankleW, shoeColor, s, false, 0, calfEndW);
                     }
                     // Draw Foot Shoe
                     drawRealisticShoe(xBot, yBot, 5.5*s, 5.5*s, shoeColor, isRight, shoeType, shoeDetail, shoeShiny);
                 }
             }
        };

        drawLowerLeg(lKneeX, lKneeY, lFootX, lFootY, false); // Left
        drawLowerLeg(rKneeX, rKneeY, rFootX, rFootY, true); // Right

        // 6. Draw Body (Layer 2)
        const bodyFurry = isFurry && (torsoColor === furColor);
        let bodyOptions = {};

        // Define Body Shapes for Animals
        if (currentAnimal === 'bear') { bodyOptions.bodyShape = 'bear_new'; }
        else if (['rat', 'cat', 'rabbit', 'fox', 'monkey'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'oval'; // Small animals
        }
        else if (['dog', 'wolf', 'lion', 'tiger'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'athletic_animal'; // Leaner, standing
        }
        else if (['pig', 'cow', 'moose'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'round'; // Chunky
            bodyOptions.waistScale = 1.1;
            bodyOptions.roundness = 0.2;
        }

        if (skin === 'bear_panda') bodyOptions.chestStripeColor = '#000';

        // Auto-detect Jersey
        if (!bodyFurry && torsoColor !== furColor && !skinObj.pattern) {
            bodyOptions.isJersey = true;
        }

        bodyOptions.pattern = skinObj.pattern; // Pass pattern to body (e.g. tattoos)
        bodyOptions.animal = currentAnimal;
        bodyOptions.skinId = skin;
        bodyOptions.hasSpots = hasSpots;
        bodyOptions.spotColor = skinObj.spotColor;
        bodyOptions.isTabby = skin.includes('tabby');

        const anchors = {
            shoulders: { left: {x: leftShoulderX, y: shoulderY}, right: {x: rightShoulderX, y: shoulderY} },
            hips: { left: {x: p.x - hipX, y: hipY}, right: {x: p.x + hipX, y: hipY} }
        };
        drawAnatomicBody(p.x, torsoY, bodyW, bodyH, s, torsoColor, bodyFurry, 40, bodyOptions, anchors);

        if(currentAnimal === 'penguin' && torsoColor === furColor) {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, torsoY + bodyH * 0.55, bodyW * 0.7, bodyH * 0.4, 0, 0, Math.PI*2); ctx.fill();
        }

        // Clothing Details (New Layer)
        if(skinObj.clothingDetail === 'suspenders') {
             ctx.fillStyle = '#1a1a1a'; // Dark suspenders
             // Left
             ctx.fillRect(p.x - bodyW/2 + 2*s, torsoY, 3*s, bodyH);
             // Right
             ctx.fillRect(p.x + bodyW/2 - 5*s, torsoY, 3*s, bodyH);
        }
        if(skinObj.clothingDetail === 'apron_ties') {
             ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2*s;
             ctx.beginPath();
             ctx.moveTo(p.x, torsoY + bodyH*0.6);
             ctx.lineTo(p.x - 10*s, torsoY + bodyH*0.6 + 5*s); // Left hanging
             ctx.moveTo(p.x, torsoY + bodyH*0.6);
             ctx.lineTo(p.x + 10*s, torsoY + bodyH*0.6 + 5*s); // Right hanging
             // Knot
             ctx.fillStyle='#FFF'; ctx.beginPath(); ctx.arc(p.x, torsoY+bodyH*0.6, 3*s, 0, Math.PI*2); ctx.fill();
             ctx.stroke();
        }
        if(skinObj.clothingDetail === 'overalls') {
             ctx.fillStyle = skinObj.shortsColor || '#000080';
             // Bib
             ctx.fillRect(p.x - bodyW*0.3, torsoY + bodyH*0.3, bodyW*0.6, bodyH*0.4);
             // Straps
             ctx.fillRect(p.x - bodyW*0.3, torsoY, bodyW*0.1, bodyH*0.3);
             ctx.fillRect(p.x + bodyW*0.2, torsoY, bodyW*0.1, bodyH*0.3);
        }
        if(skinObj.clothingDetail === 'stitches') {
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
             // Random stitches
             ctx.beginPath(); ctx.moveTo(p.x-5*s, torsoY+10*s); ctx.lineTo(p.x-5*s, torsoY+15*s); ctx.moveTo(p.x-8*s, torsoY+12*s); ctx.lineTo(p.x-2*s, torsoY+12*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x+5*s, torsoY+25*s); ctx.lineTo(p.x+5*s, torsoY+30*s); ctx.moveTo(p.x+2*s, torsoY+27*s); ctx.lineTo(p.x+8*s, torsoY+27*s); ctx.stroke();
             // Head stitch
             ctx.beginPath(); ctx.moveTo(p.x, headY-headRadius); ctx.lineTo(p.x, headY-headRadius+5*s); ctx.moveTo(p.x-3*s, headY-headRadius+2*s); ctx.lineTo(p.x+3*s, headY-headRadius+2*s); ctx.stroke();
        }

        // 7. Draw Tail (Layer 3)
        // Skip for bears, humans, robots, astronauts, frogs (unless specific tail logic exists)
        const hasTail = (!['bear', 'human', 'frog'].includes(currentAnimal) || skinObj.tailType) && !skin.includes('astronaut') && !skin.includes('robot');

        if (hasTail) {
            const tx = p.x;
            const ty = (torsoY + bodyH) - 5*s;

            if (skinObj.tailType === 'devil') {
                ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4 * s;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 25*s, ty - 20*s); ctx.stroke();
                // Triangle Tip
                ctx.fillStyle = '#8B0000'; ctx.beginPath();
                const ttx = tx + 25*s, tty = ty - 20*s;
                ctx.moveTo(ttx, tty); ctx.lineTo(ttx - 5*s, tty + 10*s); ctx.lineTo(ttx + 5*s, tty + 10*s); ctx.fill();
            }
            else if (skinObj.tailType === 'bull') {
                 // Minotaur tail
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4 * s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 25*s, ty + 5*s); ctx.stroke();
                 drawFuzzyPath([{x: tx+25*s, y: ty+5*s}, {x: tx+35*s, y: ty+8*s}, {x: tx+35*s, y: ty+2*s}], '#000', s, true, 101);
            }
            else if (currentAnimal === 'rat') {
                // Rat: Long, thin, smooth, flesh colored
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3*s;
                ctx.moveTo(tx, ty);
                // S-curve down
                ctx.bezierCurveTo(tx + 20*s, ty + 10*s, tx + 10*s, ty + 30*s, tx + 25*s, ty + 40*s);
                ctx.stroke();
            }
            else if (currentAnimal === 'monkey') {
                // Monkey: Long, curled up
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4*s;
                ctx.moveTo(tx, ty);
                ctx.bezierCurveTo(tx + 20*s, ty - 10*s, tx + 25*s, ty - 30*s, tx + 10*s, ty - 40*s);
                ctx.stroke();
            }
            else if (currentAnimal === 'dino') {
                // T-Rex: Thick, tapered
                ctx.fillStyle = tailColor;
                ctx.beginPath();
                ctx.moveTo(tx - 5*s, ty);
                ctx.lineTo(tx + 5*s, ty);
                // Curve down to a point
                ctx.quadraticCurveTo(tx + 30*s, ty + 10*s, tx + 45*s, ty + 5*s); // Tip
                ctx.quadraticCurveTo(tx + 20*s, ty + 20*s, tx - 5*s, ty + 5*s);
                ctx.fill();
            }
            else if (currentAnimal === 'turtle') {
                // Turtle: Short pointed
                ctx.fillStyle = tailColor;
                ctx.beginPath(); ctx.moveTo(tx - 3*s, ty); ctx.lineTo(tx + 3*s, ty); ctx.lineTo(tx, ty + 10*s); ctx.fill();
            }
            else if (currentAnimal === 'chicken') {
                // Chicken: Feathers
                ctx.fillStyle = tailColor;
                for(let i=-1; i<=1; i++) {
                    ctx.beginPath(); ctx.ellipse(tx + (i*5*s), ty - 5*s, 4*s, 10*s, i*0.5, 0, Math.PI*2); ctx.fill();
                }
            }
            else if (currentAnimal === 'fox' || currentAnimal === 'wolf' || skinObj.tailType === 'multi') {
                // Bushy Tail
                const tailPoints = [
                    {x: tx, y: ty},
                    {x: tx + 15*s, y: ty + 5*s},
                    {x: tx + 30*s, y: ty - 10*s}, // Tip
                    {x: tx + 15*s, y: ty - 15*s}
                ];
                let tColor = tailColor;
                if(skinObj.tailType === 'multi') { // Kitsune
                    for(let k=0; k<3; k++) {
                        const off = (k-1)*10*s;
                        drawFuzzyPath([{x:tx,y:ty},{x:tx+15*s+off,y:ty+5*s},{x:tx+30*s+off,y:ty-10*s},{x:tx+15*s+off,y:ty-15*s}], '#FFD700', s, true, 100+k);
                    }
                } else {
                    drawFuzzyPath(tailPoints, tColor, s, true, 99);
                    // White tip for classic fox
                    if(currentAnimal === 'fox' && skin === 'fox_classic') {
                        const tipPoints = [{x: tx + 20*s, y: ty - 5*s}, {x: tx + 30*s, y: ty - 10*s}, {x: tx + 20*s, y: ty - 12*s}];
                        drawFuzzyPath(tipPoints, '#FFF', s, true, 100);
                    }
                }
            }
            else if (currentAnimal === 'rabbit') {
                // Round Fluffy Tail
                drawFuzzyCircle(p.x, ty - 2*s, 6*s, tailColor, 102, s, true);
            }
            else if (currentAnimal === 'pig') {
                // Curly Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3 * s;
                ctx.moveTo(tx, ty);
                ctx.bezierCurveTo(tx + 10*s, ty - 5*s, tx + 10*s, ty + 10*s, tx + 20*s, ty);
                ctx.stroke();
            }
            else if (['lion', 'cow', 'zebra', 'giraffe'].includes(currentAnimal)) {
                // Tufted Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3 * s;
                ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 25*s, ty + 5*s); ctx.stroke();
                // Tuft
                let tuftColor = '#000';
                if (currentAnimal === 'lion') tuftColor = '#8B4513';
                if (currentAnimal === 'cow' && skinObj.furColor === '#8B0000') tuftColor = '#8B0000'; // Highland
                if (skin === 'lion_white') tuftColor = '#EEE';

                drawFuzzyPath([{x: tx+25*s, y: ty+5*s}, {x: tx+35*s, y: ty+8*s}, {x: tx+35*s, y: ty+2*s}], tuftColor, s, true, 101);
            }
            else if (currentAnimal === 'elephant') {
                 // Thin tail with small tuft
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 2*s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 5*s, ty + 15*s, tx + 8*s, ty + 25*s); ctx.stroke();
                 drawFuzzyCircle(tx + 8*s, ty + 25*s, 3*s, tailColor, 101, s, true);
            }
            else if (currentAnimal === 'penguin') {
                // Stubby Tail
                ctx.fillStyle = tailColor;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 10*s, ty + 5*s); ctx.lineTo(tx + 5*s, ty + 10*s); ctx.fill();
            }
            else if (currentAnimal === 'moose') {
                // Short Stubby Tail (Deer/Moose like)
                ctx.fillStyle = tailColor;
                ctx.beginPath();
                ctx.ellipse(tx, ty, 4*s, 6*s, 0, 0, Math.PI*2);
                ctx.fill();
            }
            else {
                // Standard Thin Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4 * s;
                ctx.lineCap = 'round'; ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 20*s, ty - 10*s); ctx.stroke();
                if(currentAnimal === 'tiger' || skinObj.pattern === 'tiger_stripes') {
                    // Stripes on tail
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2*s;
                    ctx.beginPath(); ctx.moveTo(tx+5*s, ty); ctx.lineTo(tx+5*s, ty+3*s); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx+10*s, ty); ctx.lineTo(tx+10*s, ty+3*s); ctx.stroke();
                }

            }
        }

        // 8. Draw Head & Ears (Layer 4)
        ctx.fillStyle = (hasBlackEars) ? '#000' : furColor;
        if (skinObj.earColor) ctx.fillStyle = skinObj.earColor;
        if(skin.includes('alien')) ctx.fillStyle = '#32CD32';

        const drawEarPair = (drawFunc) => {
             // Left (Base)
             ctx.save(); ctx.translate(p.x, headY); drawFunc(1); ctx.restore();
             // Right (Mirrored)
             ctx.save(); ctx.translate(p.x, headY); ctx.scale(-1, 1); drawFunc(-1); ctx.restore();
        };

        if (currentAnimal === 'lion') {
            // LION (Unchanged as requested)
            let earY = headY - 8*s; let earX = 12*s; let earR = 6*s;
            drawFuzzyCircle(p.x - earX, earY, earR, ctx.fillStyle, 55, s, isFurry, false);
            drawFuzzyCircle(p.x + earX, earY, earR, ctx.fillStyle, 56, s, isFurry, false);
        }
        else if (currentAnimal === 'rat') {
             drawEarPair(() => {
                 // Large, round, wide-set on top
                 const pts = [{x: -5*s, y: -10*s}, {x: -12*s, y: -20*s}, {x: -18*s, y: -8*s}, {x: -10*s, y: -2*s}];
                 drawFuzzyPath(pts, ctx.fillStyle, s, true, 51);
             });
        }
        else if (currentAnimal === 'cat') {
             let w = 10*s; let h = 12*s; let baseAngle = 0;
             if(skin.includes('sphinx')) { w=16*s; h=20*s; baseAngle = -0.2; }
             if(skin.includes('persian')) { w=8*s; h=7*s; }

             drawEarPair(() => {
                 ctx.save();
                 ctx.rotate(baseAngle);
                 // Triangular with distinct connection
                 ctx.beginPath();
                 ctx.moveTo(-5*s, -8*s); // Inner base
                 ctx.lineTo(-12*s, -8*s - h); // Tip
                 ctx.lineTo(-5*s - w, -4*s); // Outer base
                 ctx.quadraticCurveTo(-10*s, -6*s, -5*s, -8*s); // Curve back to skull
                 ctx.fill();
                 ctx.restore();
             });
        }
        else if (currentAnimal === 'dog') {
             let type = 'floppy';
             if(skin.includes('husky') || skin.includes('police') || skin.includes('wolf') || skin.includes('boxer')) type = 'pricked';
             if(skin.includes('pug')) type = 'button';

             drawEarPair(() => {
                 if(type === 'pricked') {
                     // High triangular (Husky/Wolf)
                     ctx.beginPath();
                     ctx.moveTo(-6*s, -10*s);
                     ctx.lineTo(-12*s, -25*s);
                     ctx.lineTo(-18*s, -8*s);
                     ctx.quadraticCurveTo(-12*s, -12*s, -6*s, -10*s);
                     ctx.fill();
                 } else if (type === 'button') {
                     // Folded forward (Pug)
                     ctx.beginPath();
                     ctx.moveTo(-6*s, -8*s);
                     ctx.quadraticCurveTo(-14*s, -12*s, -12*s, 0);
                     ctx.lineTo(-6*s, -4*s);
                     ctx.fill();
                 } else {
                     // Floppy (Golden/Dalmation) - Drooping from side
                     ctx.beginPath();
                     ctx.moveTo(-10*s, -5*s);
                     ctx.bezierCurveTo(-20*s, -5*s, -25*s, 10*s, -15*s, 20*s);
                     ctx.bezierCurveTo(-10*s, 15*s, -8*s, 5*s, -10*s, -5*s);
                     ctx.fill();
                 }
             });
        }
        else if (currentAnimal === 'bear') {
             drawEarPair(() => {
                 // Small, round, side-top
                 ctx.beginPath();
                 ctx.arc(-14*s, -10*s, 6*s, 0, Math.PI*2);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'rabbit') {
             drawEarPair(() => {
                 // Elongated, correct width-to-height
                 ctx.beginPath();
                 ctx.moveTo(-5*s, -10*s);
                 ctx.bezierCurveTo(-5*s, -50*s, -15*s, -50*s, -12*s, -10*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'fox' || currentAnimal === 'wolf') {
             drawEarPair(() => {
                 // Large Triangular
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -8*s);
                 ctx.lineTo(-15*s, -28*s);
                 ctx.lineTo(-22*s, -6*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'tiger') {
             drawEarPair(() => {
                 // Rounded - Black back with white spot
                 ctx.fillStyle = '#000';
                 ctx.beginPath();
                 ctx.arc(-12*s, -8*s, 7*s, 0, Math.PI*2);
                 ctx.fill();
                 // White Spot (Ocelli)
                 ctx.fillStyle = '#FFF';
                 ctx.beginPath(); ctx.arc(-12*s, -8*s, 2*s, 0, Math.PI*2); ctx.fill();
             });
        }
        else if (currentAnimal === 'monkey') {
             drawEarPair(() => {
                 // Side, human-like round
                 ctx.beginPath();
                 ctx.arc(-16*s, 0, 6*s, 0, Math.PI*2);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'pig') {
             drawEarPair(() => {
                 // Leaf shape, slightly flopped forward
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -8*s);
                 ctx.quadraticCurveTo(-16*s, -20*s, -14*s, -22*s); // Top corner
                 ctx.quadraticCurveTo(-18*s, -10*s, -14*s, 0); // Bottom corner
                 ctx.lineTo(-8*s, -4*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'cow') {
             drawEarPair(() => {
                 // Horizontal, slightly droopy
                 ctx.beginPath();
                 ctx.moveTo(-12*s, -4*s);
                 ctx.quadraticCurveTo(-25*s, -8*s, -28*s, 2*s);
                 ctx.quadraticCurveTo(-20*s, 5*s, -12*s, 2*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'moose') {
             drawEarPair(() => {
                 // Large Paddle-like ears
                 ctx.beginPath();
                 ctx.moveTo(-10*s, -5*s);
                 ctx.bezierCurveTo(-30*s, -15*s, -35*s, 5*s, -25*s, 10*s);
                 ctx.quadraticCurveTo(-15*s, 5*s, -10*s, 0);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'elephant') {
             drawEarPair(() => {
                 // Giant Fan Ears
                 ctx.beginPath();
                 ctx.moveTo(-12*s, -8*s);
                 ctx.bezierCurveTo(-45*s, -25*s, -55*s, 25*s, -20*s, 35*s);
                 ctx.quadraticCurveTo(-15*s, 20*s, -12*s, 10*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'giraffe') {
             drawEarPair(() => {
                 // Ossicones (Horns)
                 ctx.fillStyle = '#8B4513';
                 ctx.beginPath(); ctx.moveTo(-5*s, -15*s); ctx.lineTo(-5*s, -25*s); ctx.lineTo(-3*s, -25*s); ctx.lineTo(-3*s, -15*s); ctx.fill();
                 ctx.beginPath(); ctx.arc(-4*s, -25*s, 2*s, 0, Math.PI*2); ctx.fill();
                 // Ears
                 ctx.fillStyle = furColor;
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -10*s);
                 ctx.quadraticCurveTo(-20*s, -12*s, -22*s, -5*s);
                 ctx.quadraticCurveTo(-15*s, -2*s, -8*s, -5*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'human') {
            // Human Ears (Keep existing logic, simplified)
            ctx.fillStyle = furColor;
            if (skinObj.ears === 'elf') {
                // Pointy Elf Ears
                // Left Ear
                ctx.beginPath();
                ctx.moveTo(p.x - 10*s, headY);
                ctx.lineTo(p.x - 22*s, headY - 8*s); // Tip
                ctx.lineTo(p.x - 10*s, headY + 6*s);
                ctx.fill();
                // Right Ear
                ctx.beginPath();
                ctx.moveTo(p.x + 10*s, headY);
                ctx.lineTo(p.x + 22*s, headY - 8*s); // Tip
                ctx.lineTo(p.x + 10*s, headY + 6*s);
                ctx.fill();
            } else {
                ctx.beginPath(); ctx.ellipse(p.x - 12*s, headY, 3*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(p.x + 12*s, headY, 3*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
            }

            if(skinObj.hairStyle === 'afro') {
                 ctx.fillStyle = skinObj.hairColor || '#000';
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.5, 0, Math.PI*2); ctx.fill();
            }
        }
        if(currentAnimal === 'moose') {
            ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 4*s;
            ctx.beginPath(); ctx.moveTo(p.x-10*s, headY-10*s); ctx.lineTo(p.x-30*s, headY-25*s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x+10*s, headY-10*s); ctx.lineTo(p.x+30*s, headY-25*s); ctx.stroke();
        }
        if(currentAnimal === 'cow') {
            ctx.fillStyle = '#EEE';
            ctx.beginPath(); ctx.moveTo(p.x-5*s, headY-10*s); ctx.quadraticCurveTo(p.x-15*s, headY-20*s, p.x-12*s, headY-25*s); ctx.lineTo(p.x-8*s, headY-15*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x+5*s, headY-10*s); ctx.quadraticCurveTo(p.x+15*s, headY-20*s, p.x+12*s, headY-25*s); ctx.lineTo(p.x+8*s, headY-15*s); ctx.fill();
        }

        // Head Circle
        let headColor = furColor;
        if(skin.includes('alien')) headColor = '#32CD32';
        if(currentAnimal === 'penguin') headColor = '#000';
        if(currentAnimal === 'lion' && skin !== 'lion_scar') {
             if(skin === 'lion_white') headColor = '#EEE';
             else if(skin === 'lion_classic') headColor = '#A0522D';
             else headColor = '#8B4513';
        }

        // SNOUT POINTING UP (Back View)
        // Draw a smaller, slightly offset circle near the top of the head to represent the snout pointing towards the basket.
        // Moved BEFORE the head drawing to ensure it's "behind" (rendered first) or "on top" correctly depending on view logic.
        // Actually, for a back view, if the animal looks UP, the snout is on the far side (front face) peeking over.
        // Drawing it FIRST ensures the main head mass covers the bottom of it, making it look like it's attached to the front/top.
        if (['dog', 'wolf', 'fox', 'bear', 'pig', 'cow', 'moose', 'rat', 'lion', 'tiger'].includes(currentAnimal)) {
            // Position snout higher to "peek" over the top of the head
            const snoutScale = sizeMod.snoutScale || 1.0;
            const snoutY = headY - headRadius * 0.85;
            const snoutR = headRadius * 0.45 * snoutScale;

            // Slightly darker shade for snout to distinguish it
            let snoutColor = headColor;

            // Draw Snout (With shading enabled to match "reimplement 3d shading" request)
            drawFuzzyCircle(p.x, snoutY, snoutR, snoutColor, 65, s, isFurry, true);

            // Nose Tip (Black dot usually)
            if (currentAnimal !== 'moose') { // Moose has big nose nostrils
                const noseY = snoutY - snoutR * 0.5;
                const noseR = snoutR * 0.4;
                const noseColor = (currentAnimal === 'pig') ? '#FF69B4' : '#000'; // Pig nose pinkish? Or darker pink.

                if (isFurry) {
                    drawFuzzyCircle(p.x, noseY, noseR, noseColor, 66, s, true, true);
                } else {
                    ctx.fillStyle = noseColor;
                    // Add simple shading for smooth nose tip
                    const grad = ctx.createRadialGradient(p.x - noseR*0.3, noseY - noseR*0.3, noseR*0.1, p.x, noseY, noseR);
                    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
                    grad.addColorStop(1, noseColor);
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(p.x, noseY, noseR, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        if (currentAnimal === 'cat' || currentAnimal === 'bear' || currentAnimal === 'frog') {
             // Wide Head - Single Mass
             if (!isFurry) {
                 ctx.fillStyle = headColor;
                 ctx.beginPath(); ctx.ellipse(p.x, headY, headRadius * 1.2, headRadius * 0.9, 0, 0, Math.PI*2); ctx.fill();
             }
             // Draw Main Head
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 62, s, isFurry, true);
        }
        else if (currentAnimal === 'cow' || currentAnimal === 'moose' || currentAnimal === 'pig') {
             // Boxy Head - Single Mass
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 60, s, isFurry, true);
        }
        else if (['fox', 'wolf', 'dog'].includes(currentAnimal)) {
             // Tapered Head - Single Mass
             drawFuzzyCircle(p.x, headY, headRadius * 1.0, headColor, 60, s, isFurry, true);
        }
        else if (currentAnimal === 'penguin') {
             // Continuous
             ctx.fillStyle = headColor;
             ctx.beginPath();
             ctx.moveTo(p.x - bodyW/2, torsoY + 5*s);
             ctx.lineTo(p.x + bodyW/2, torsoY + 5*s);
             ctx.lineTo(p.x + headRadius, headY);
             ctx.lineTo(p.x - headRadius, headY);
             ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
        }
        else if (currentAnimal === 'elephant') {
             ctx.fillStyle = headColor;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius * 1.2, 0, Math.PI*2); ctx.fill();
        }
        else {
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 60, s, isFurry, true);
        }

        // MANE (Lion) - Moved to be last layer
        if(currentAnimal === 'lion' && skin !== 'lion_scar') {
             ctx.fillStyle = '#8B4513';
             if(skin === 'lion_white') ctx.fillStyle = '#EEE';
             if(skin === 'lion_classic') ctx.fillStyle = '#A0522D';
             drawFuzzyCircle(p.x, headY, headRadius * 1.6, ctx.fillStyle, 61, s, isFurry, false);
        }

        // FACE DETAILS REMOVED - Back View Only

        if(skinObj.pattern === 'tiger_stripes') {
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.moveTo(p.x, headY - 10*s); ctx.lineTo(p.x, headY - 5*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x - 5*s, headY - 8*s); ctx.lineTo(p.x - 2*s, headY - 4*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x + 5*s, headY - 8*s); ctx.lineTo(p.x + 2*s, headY - 4*s); ctx.stroke();
        }

        // Head Details
        if(skinObj.headDetail === 'antenna') {
             ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.moveTo(p.x, headY - headRadius); ctx.lineTo(p.x, headY - headRadius - 15*s); ctx.stroke();
             ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(p.x, headY - headRadius - 15*s, 3*s, 0, Math.PI*2); ctx.fill();
        }
        if(skinObj.headDetail === 'tattoo_stripe') {
             ctx.fillStyle = '#FF0000';
             // Stripe going up the back left side of the head (Kratos)
             ctx.beginPath();
             ctx.moveTo(p.x - 4*s, headY + headRadius * 0.8);
             ctx.quadraticCurveTo(p.x - 12*s, headY, p.x - 4*s, headY - headRadius * 0.9);
             ctx.lineTo(p.x - 8*s, headY - headRadius * 0.9);
             ctx.quadraticCurveTo(p.x - 16*s, headY, p.x - 8*s, headY + headRadius * 0.8);
             ctx.fill();
        }
        if(skinObj.headDetail === 'bandana_ties') {
             ctx.fillStyle = 'red';
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY);
             ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s);
             ctx.lineTo(p.x + headRadius + 12*s, headY + 15*s);
             ctx.lineTo(p.x + headRadius, headY + 5*s);
             ctx.fill();
        }

        // Hairstyle Support (Universal)
        drawHairstyle(ctx, p, headY, headRadius, s, skinObj);

        // Head Accessories
        let accessoryType = skinObj.headAccessory;
        let accessoryColor = skinObj.hatColor;

        if (playerData.currentHat && playerData.currentHat !== 'hat_none') {
             const hat = HATS_DB.find(h => h.id === playerData.currentHat);
             if (hat) {
                 accessoryType = hat.type;
                 if (hat.color) accessoryColor = hat.color;
             }
        }

        if (accessoryType === 'cap') {
             ctx.fillStyle = accessoryColor || '#FFF';
             // Dome
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.05, Math.PI, 0); ctx.fill();
             // Button
             ctx.fillStyle = 'rgba(0,0,0,0.2)';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, 4*s, 0, Math.PI*2); ctx.fill();
             // Snapback hole (since back view)
             ctx.fillStyle = '#333';
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, 3*s, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'party_hat') {
             ctx.fillStyle = accessoryColor || '#FF00FF';
             ctx.beginPath();
             ctx.moveTo(p.x - 8*s, headY - 8*s);
             ctx.lineTo(p.x + 8*s, headY - 8*s);
             ctx.lineTo(p.x, headY - 35*s); // Cone tip
             ctx.fill();
        }
        else if (accessoryType === 'propeller_cap') {
             ctx.fillStyle = '#FF0000';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius, Math.PI, Math.PI*1.5); ctx.lineTo(p.x, headY-5*s); ctx.fill();
             ctx.fillStyle = '#0000FF';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius, Math.PI*1.5, 0); ctx.lineTo(p.x, headY-5*s); ctx.fill();
             ctx.fillStyle = '#FFFF00';
             ctx.beginPath(); ctx.arc(p.x, headY - 17*s, 2*s, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = accessoryColor || '#FFD700';
             ctx.fillRect(p.x - 10*s, headY - 19*s, 20*s, 2*s);
             ctx.fillRect(p.x - 2*s, headY - 19*s, 4*s, 4*s);
        }
        else if (accessoryType === 'bucket_hat') {
             ctx.fillStyle = accessoryColor || '#FFFF00';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 12*s, headRadius * 0.9, 4*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillRect(p.x - headRadius * 0.9, headY - 12*s, headRadius * 1.8, 8*s);
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius * 0.9, headY - 4*s);
             ctx.lineTo(p.x + headRadius * 0.9, headY - 4*s);
             ctx.lineTo(p.x + headRadius * 1.4, headY + 2*s);
             ctx.lineTo(p.x - headRadius * 1.4, headY + 2*s);
             ctx.fill();
        }
        else if (accessoryType === 'santa_hat') {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.2, 4*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = accessoryColor || '#FF0000';
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY - 5*s);
             ctx.quadraticCurveTo(p.x, headY - 30*s, p.x + 20*s, headY - 15*s);
             ctx.lineTo(p.x + headRadius, headY - 5*s);
             ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.arc(p.x + 20*s, headY - 15*s, 4*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'viking_helmet') {
             ctx.fillStyle = accessoryColor || '#AAA';
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.1, Math.PI, 0); ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 10*s); ctx.quadraticCurveTo(p.x - 20*s, headY - 20*s, p.x - 25*s, headY - 30*s); ctx.lineTo(p.x - 12*s, headY - 12*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x + 10*s, headY - 10*s); ctx.quadraticCurveTo(p.x + 20*s, headY - 20*s, p.x + 25*s, headY - 30*s); ctx.lineTo(p.x + 12*s, headY - 12*s); ctx.fill();
        }
        else if (accessoryType === 'pirate_hat') {
             ctx.fillStyle = accessoryColor || '#111';
             ctx.beginPath();
             ctx.moveTo(p.x - 20*s, headY - 5*s);
             ctx.quadraticCurveTo(p.x - 10*s, headY - 20*s, p.x, headY - 10*s);
             ctx.quadraticCurveTo(p.x + 10*s, headY - 20*s, p.x + 20*s, headY - 5*s);
             ctx.lineTo(p.x, headY - 15*s);
             ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.arc(p.x, headY - 12*s, 3*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'sombrero') {
            ctx.fillStyle = accessoryColor || '#1a1a1a';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, 30*s, 8*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 10*s, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'crown') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.moveTo(p.x-8*s, headY-10*s); ctx.lineTo(p.x-4*s, headY-18*s); ctx.lineTo(p.x, headY-10*s);
            ctx.lineTo(p.x+4*s, headY-18*s); ctx.lineTo(p.x+8*s, headY-10*s); ctx.lineTo(p.x+8*s, headY-5*s); ctx.lineTo(p.x-8*s, headY-5*s); ctx.fill();
        }
        else if (accessoryType === 'wizard_hat') {
            ctx.fillStyle = accessoryColor || '#000080';
            ctx.beginPath(); ctx.moveTo(p.x-10*s, headY-5*s); ctx.lineTo(p.x+10*s, headY-5*s); ctx.lineTo(p.x, headY-30*s); ctx.fill();
        }
        else if (accessoryType === 'chef_hat') {
             ctx.fillStyle = '#FFF'; ctx.fillRect(p.x-8*s, headY-25*s, 16*s, 15*s);
        }
        else if (accessoryType === 'helmet') {
             ctx.strokeStyle = accessoryColor || '#87CEEB'; ctx.lineWidth=2*s;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius-2*s, 0, Math.PI*2); ctx.stroke();
             if(accessoryColor === '#FFF') { // Hockey mask fill
                 ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
             }
        }
        else if (accessoryType === 'horns') {
             ctx.fillStyle = 'red';
             ctx.beginPath(); ctx.moveTo(p.x-5*s, headY-10*s); ctx.lineTo(p.x-8*s, headY-18*s); ctx.lineTo(p.x-2*s, headY-10*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x+5*s, headY-10*s); ctx.lineTo(p.x+8*s, headY-18*s); ctx.lineTo(p.x+2*s, headY-10*s); ctx.fill();
        }
        else if (accessoryType === 'halo') {
             ctx.strokeStyle='#FFD700'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.ellipse(p.x, headY-15*s, 8*s, 3*s, 0, 0, Math.PI*2); ctx.stroke();
        }
        else if (accessoryType === 'beanie') {
             ctx.fillStyle = accessoryColor || '#FF0000'; ctx.fillRect(p.x-10*s, headY-12*s, 20*s, 6*s);
        }
        else if (accessoryType === 'ear_muffs') {
             const col = accessoryColor || '#FFF';
             ctx.fillStyle = col;
             ctx.beginPath(); ctx.arc(p.x - headRadius - 2*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x + headRadius + 2*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = col; ctx.lineWidth = 3*s;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius + 4*s, Math.PI, 0); ctx.stroke();
        }
        else if (accessoryType === 'collar') {
             ctx.fillStyle = accessoryColor || '#FF0000';
             ctx.fillRect(p.x - headRadius, headY + headRadius - 2*s, headRadius * 2, 4*s);
             ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(p.x, headY + headRadius, 3*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'scarf') {
             ctx.strokeStyle = accessoryColor || '#00008B'; ctx.lineWidth = 6*s;
             ctx.beginPath(); ctx.arc(p.x, headY + headRadius, 6*s, 0, Math.PI, false); ctx.stroke();
             // Dangling part
             ctx.fillStyle = accessoryColor || '#00008B';
             ctx.fillRect(p.x + 4*s, headY + headRadius, 6*s, 15*s);
        }
        else if (accessoryType === 'fez') {
             ctx.fillStyle = '#8B0000';
             ctx.beginPath(); ctx.moveTo(p.x - 6*s, headY - 8*s); ctx.lineTo(p.x + 6*s, headY - 8*s); ctx.lineTo(p.x + 4*s, headY - 18*s); ctx.lineTo(p.x - 4*s, headY - 18*s); ctx.fill();
             ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1*s; ctx.beginPath(); ctx.moveTo(p.x, headY - 18*s); ctx.lineTo(p.x + 2*s, headY - 12*s); ctx.stroke();
        }
        else if (accessoryType === 'bow') {
             ctx.fillStyle = accessoryColor || '#FFC0CB';
             ctx.beginPath();
             ctx.ellipse(p.x - 6*s, headY - 8*s, 6*s, 4*s, -0.2, 0, Math.PI*2); ctx.fill();
             ctx.beginPath();
             ctx.ellipse(p.x + 6*s, headY - 8*s, 6*s, 4*s, 0.2, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, headY - 8*s, 2*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'flower') {
             ctx.fillStyle = '#FF69B4';
             const fx = p.x + headRadius; const fy = headY - 5*s;
             for(let i=0; i<5; i++) {
                 const a = (i/5)*Math.PI*2;
                 ctx.beginPath(); ctx.arc(fx + Math.cos(a)*4*s, fy + Math.sin(a)*4*s, 3*s, 0, Math.PI*2); ctx.fill();
             }
             ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(fx, fy, 2*s, 0, Math.PI*2); ctx.fill();
        }
        else if (accessoryType === 'algae') {
             ctx.fillStyle = '#2E8B57';
             drawFuzzyPath([{x:p.x-5*s,y:headY-10*s},{x:p.x+5*s,y:headY-12*s},{x:p.x+8*s,y:headY-5*s},{x:p.x-8*s,y:headY-4*s}], '#2E8B57', s, true, 200);
        }
        else if (accessoryType === 'hat') {
             ctx.fillStyle = accessoryColor || '#5D4037';
             // Brim
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.8, 4*s, 0, 0, Math.PI*2); ctx.fill();
             // Top
             ctx.beginPath(); ctx.arc(p.x, headY - 10*s, headRadius * 0.9, Math.PI, 0); ctx.fill();
        }
        else if (accessoryType === 'floppy_cap') {
             const capColor = accessoryColor || '#00A000';
             ctx.fillStyle = capColor;
             // Base (Headband part)
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY - 2*s);
             ctx.lineTo(p.x + headRadius, headY - 2*s);
             ctx.lineTo(p.x + headRadius, headY - 8*s);
             ctx.lineTo(p.x - headRadius, headY - 8*s);
             ctx.fill();

             // Floppy Tail
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius + 2*s, headY - 8*s);
             ctx.lineTo(p.x + headRadius - 2*s, headY - 8*s);
             // Curve down and to the right/left
             ctx.quadraticCurveTo(p.x + 20*s, headY + 10*s, p.x + 15*s, headY + 25*s); // Tail tip
             ctx.quadraticCurveTo(p.x - 5*s, headY + 15*s, p.x - headRadius + 2*s, headY - 8*s);
             ctx.fill();
        }
        else if (accessoryType === 'top_hat') {
             ctx.fillStyle = accessoryColor || '#111';
             // Brim
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.5, 3*s, 0, 0, Math.PI*2); ctx.fill();
             // Cylinder
             ctx.fillRect(p.x - headRadius * 0.8, headY - 25*s, headRadius * 1.6, 20*s);
        }
        else if (accessoryType === 'headband') {
             ctx.fillStyle = accessoryColor || '#FF0000'; // Default red
             if(accessoryColor === '#FFF' && skin.includes('tiger_white')) ctx.fillStyle = '#000'; // Contrast for white tiger
             ctx.fillRect(p.x - headRadius, headY - 8*s, headRadius * 2, 6*s);
             // Knot/Tails
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY - 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY - 5*s); ctx.fill();
        }
        else if (accessoryType === 'bandana_neck') {
             ctx.fillStyle = accessoryColor || '#FF0000';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY + 5*s); ctx.lineTo(p.x, headY + 15*s); ctx.lineTo(p.x + 10*s, headY + 5*s); ctx.fill();
        }
        else if (accessoryType === 'feathers') {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 15*s, 4*s, 10*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s; ctx.stroke();
             ctx.fillStyle = '#FF0000';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 15*s, 2*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
        }

        // Head Details that act like accessories
        if(skinObj.headDetail === 'mohawk') {
             ctx.fillStyle = skinObj.hairColor || '#000';
             for(let i=0; i<5; i++) {
                 ctx.beginPath(); ctx.arc(p.x, headY - 10*s - (i*4*s), (5-i)*s + 2*s, 0, Math.PI*2); ctx.fill();
             }
        }
        if(skinObj.headDetail === 'visor') {
             ctx.fillStyle = '#FF0000'; ctx.shadowBlur = 5; ctx.shadowColor = '#FF0000';
             ctx.fillRect(p.x - 8*s, headY - 5*s, 16*s, 4*s);
             ctx.shadowBlur = 0;
        }
        if(skinObj.headDetail === 'yellow_neck') {
             ctx.fillStyle = '#FFD700';
             ctx.beginPath(); ctx.arc(p.x, headY + 5*s, 8*s, 0, Math.PI, false); ctx.fill();
        }

        // 11. Back Props (New Layer - Drawn on top of body for Back View)
        // Existing Back Accessories moved here
        if (skinObj.backAccessory === 'cape') {
            ctx.fillStyle = skinObj.backColor || '#000';
            ctx.fillRect(p.x - bodyW/1.5, torsoY + 5*s, bodyW*1.3, bodyH*0.8);
        }
        if (skinObj.backAccessory === 'wings') {
            ctx.fillStyle = skinObj.backColor || '#FFF';
            ctx.beginPath(); ctx.ellipse(p.x - 20*s, torsoY + 10*s, 10*s, 20*s, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + 20*s, torsoY + 10*s, 10*s, 20*s, 0.5, 0, Math.PI*2); ctx.fill();
        }
        if (skinObj.backAccessory === 'backpack') {
             ctx.fillStyle = skinObj.backColor || '#555';
             ctx.fillRect(p.x - bodyW/2, torsoY + 10*s, bodyW, bodyH*0.6);
        }
        if (skinObj.backAccessory === 'hoodie_hood') {
             ctx.fillStyle = skinObj.backColor || '#555';
             // Draw hood down shape on upper back
             ctx.beginPath();
             ctx.moveTo(p.x - bodyW*0.4, torsoY + 5*s);
             ctx.quadraticCurveTo(p.x, torsoY + 20*s, p.x + bodyW*0.4, torsoY + 5*s);
             ctx.lineTo(p.x + bodyW*0.3, torsoY - 5*s); // Tuck under head
             ctx.lineTo(p.x - bodyW*0.3, torsoY - 5*s);
             ctx.fill();
             // Hood crease/shadow
             ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.moveTo(p.x, torsoY+2*s); ctx.lineTo(p.x, torsoY+15*s); ctx.stroke();
        }
        if (skinObj.backAccessory === 'shell') {
             const shellW = bodyW * 1.4;
             const shellH = bodyH * 0.8;
             const sx = p.x;
             const sy = torsoY + bodyH * 0.4;
             const color = skinObj.backColor || '#006400';

             // Shell Rim (Outline)
             ctx.fillStyle = '#556B2F'; // Dark Olive Green
             ctx.beginPath();
             ctx.ellipse(sx, sy, shellW * 0.55, shellH * 0.55, 0, 0, Math.PI * 2);
             ctx.fill();

             // Shell Dome (Body)
             const grad = ctx.createRadialGradient(sx - shellW * 0.2, sy - shellH * 0.2, shellW * 0.1, sx, sy, shellW * 0.6);
             grad.addColorStop(0, '#228B22'); // Forest Green Light
             grad.addColorStop(1, color); // Base Dark Green
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.ellipse(sx, sy, shellW * 0.5, shellH * 0.5, 0, 0, Math.PI * 2);
             ctx.fill();

             // Scute Pattern (Hexagons)
             ctx.strokeStyle = 'rgba(0,0,0,0.3)';
             ctx.lineWidth = 2 * s;
             ctx.beginPath();

             // Center Scute
             const hexR = shellW * 0.15;
             for (let i = 0; i < 6; i++) {
                 const angle = (i / 6) * Math.PI * 2;
                 const hx = sx + Math.cos(angle) * hexR;
                 const hy = sy + Math.sin(angle) * hexR;
                 if (i === 0) ctx.moveTo(hx, hy);
                 else ctx.lineTo(hx, hy);
             }
             ctx.closePath();

             // Surrounding Scutes
             const outerR = shellW * 0.35;
             for(let i=0; i<6; i++) {
                 const angle = (i/6) * Math.PI * 2;
                 const hx = sx + Math.cos(angle) * hexR;
                 const hy = sy + Math.sin(angle) * hexR;
                 const ox = sx + Math.cos(angle) * outerR;
                 const oy = sy + Math.sin(angle) * outerR;
                 ctx.moveTo(hx, hy);
                 ctx.lineTo(ox, oy);
             }
             ctx.stroke();
        }

        // New Props
        if (skinObj.backProp) {
             const bp = skinObj.backProp;
             const centerX = p.x;
             const centerY = torsoY + bodyH * 0.4;

             if (bp === 'axe') {
                 // Axe handle diagonal
                 ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 // Axe head
                 ctx.fillStyle = '#AAA';
                 ctx.beginPath();
                 ctx.moveTo(centerX - 15*s, centerY - 15*s);
                 ctx.lineTo(centerX - 20*s, centerY - 20*s);
                 ctx.quadraticCurveTo(centerX - 10*s, centerY - 25*s, centerX - 5*s, centerY - 15*s);
                 ctx.fill();
             }
             if (bp === 'hero_gear') {
                 // Sword Hilt (Behind Shield)
                 ctx.fillStyle = '#800080'; // Master Sword Hilt
                 ctx.fillRect(centerX - 15*s, centerY - 30*s, 30*s, 5*s); // Crossguard
                 ctx.fillStyle = '#00008B'; // Handle
                 ctx.fillRect(centerX - 3*s, centerY - 35*s, 6*s, 15*s);

                 // Shield
                 ctx.fillStyle = '#00008B'; // Blue
                 ctx.beginPath();
                 ctx.moveTo(centerX - 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 10*s, centerY + 10*s);
                 ctx.lineTo(centerX, centerY + 20*s);
                 ctx.lineTo(centerX - 10*s, centerY + 10*s);
                 ctx.fill();

                 // Silver Trim
                 ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 2*s;
                 ctx.beginPath();
                 ctx.moveTo(centerX - 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 10*s, centerY + 10*s);
                 ctx.lineTo(centerX, centerY + 20*s);
                 ctx.lineTo(centerX - 10*s, centerY + 10*s);
                 ctx.closePath();
                 ctx.stroke();

                 // Triforce detail
                 ctx.fillStyle = '#FFD700';
                 ctx.beginPath(); ctx.moveTo(centerX, centerY - 10*s); ctx.lineTo(centerX + 4*s, centerY); ctx.lineTo(centerX - 4*s, centerY); ctx.fill();
             }
             if (bp === 'chaos_blades') {
                 // Two Crossed Blades
                 const drawBlade = (x, y, angle, flip) => {
                     ctx.save();
                     ctx.translate(x, y);
                     ctx.rotate(angle);
                     if(flip) ctx.scale(-1, 1);

                     // Blade
                     ctx.fillStyle = '#A9A9A9'; // Metal
                     ctx.beginPath();
                     ctx.moveTo(0, 0);
                     ctx.quadraticCurveTo(10*s, 10*s, 5*s, 30*s); // Outer edge
                     ctx.quadraticCurveTo(0, 20*s, -5*s, 30*s); // Inner hook?
                     ctx.lineTo(-2*s, 0);
                     ctx.fill();

                     // Glow
                     ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 1*s;
                     ctx.stroke();

                     // Handle
                     ctx.fillStyle = '#8B4513';
                     ctx.fillRect(-2*s, -10*s, 4*s, 10*s);

                     ctx.restore();
                 };

                 drawBlade(centerX - 5*s, centerY - 10*s, -0.5, false);
                 drawBlade(centerX + 5*s, centerY - 10*s, 0.5, true);

                 // Chain
                 ctx.strokeStyle = '#333'; ctx.lineWidth = 1*s;
                 ctx.beginPath();
                 ctx.moveTo(centerX - 5*s, centerY - 20*s);
                 ctx.quadraticCurveTo(centerX, centerY, centerX + 5*s, centerY - 20*s);
                 ctx.stroke();
             }
             if (bp === 'guitar') {
                 // Guitar Body
                 ctx.fillStyle = '#8B4513';
                 ctx.beginPath();
                 ctx.ellipse(centerX, centerY, 12*s, 18*s, -0.2, 0, Math.PI*2);
                 ctx.fill();
                 ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(centerX, centerY, 5*s, 0, Math.PI*2); ctx.fill();
                 // Neck
                 ctx.fillStyle = '#5D4037';
                 ctx.fillRect(centerX - 3*s, centerY - 30*s, 6*s, 20*s);
             }
             if (bp === 'oxygen_tank') {
                 ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#AAA'; ctx.lineWidth = 1*s;
                 ctx.fillRect(centerX - 12*s, centerY - 15*s, 24*s, 35*s);
                 ctx.strokeRect(centerX - 12*s, centerY - 15*s, 24*s, 35*s);
                 // Tubes
                 ctx.strokeStyle = '#CCC'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX, centerY - 15*s); ctx.quadraticCurveTo(centerX, centerY - 25*s, centerX - 10*s, centerY - 20*s); ctx.stroke();
             }
             if (bp === 'katanas') {
                 ctx.strokeStyle = '#333'; ctx.lineWidth = 3*s;
                 // X shape
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(centerX + 15*s, centerY - 15*s); ctx.lineTo(centerX - 15*s, centerY + 15*s); ctx.stroke();
                 // Hilts
                 ctx.fillStyle = '#000';
                 ctx.fillRect(centerX - 18*s, centerY - 18*s, 5*s, 5*s);
                 ctx.fillRect(centerX + 13*s, centerY - 18*s, 5*s, 5*s);
             }
             if (bp === 'sword') {
                 ctx.strokeStyle = '#555'; ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 // Hilt (Basket)
                 ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(centerX - 15*s, centerY - 15*s, 5*s, 0, Math.PI*2); ctx.fill();
             }
             if (bp === 'hockey_sticks') {
                 ctx.strokeStyle = '#D2B48C'; ctx.lineWidth = 3*s; // Wood
                 // Crossed
                 ctx.beginPath(); ctx.moveTo(centerX - 10*s, centerY - 20*s); ctx.lineTo(centerX + 10*s, centerY + 20*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(centerX + 10*s, centerY - 20*s); ctx.lineTo(centerX - 10*s, centerY + 20*s); ctx.stroke();
                 // Blades at bottom
                 ctx.fillStyle = '#000'; // Tape
                 ctx.fillRect(centerX + 8*s, centerY + 18*s, 8*s, 4*s);
                 ctx.fillRect(centerX - 16*s, centerY + 18*s, 8*s, 4*s);
             }
             if (bp === 'staff') {
                 ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX + 15*s, centerY - 30*s); ctx.lineTo(centerX - 15*s, centerY + 30*s); ctx.stroke();
                 // Orb (Optimized)
                 const orbX = centerX + 15*s;
                 const orbY = centerY - 30*s;
                 const orbR = 5*s;
                 const glowR = orbR + 15;
                 const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, glowR);
                 orbGrad.addColorStop(0, '#00FFFF');
                 orbGrad.addColorStop(orbR/glowR, '#00FFFF');
                 orbGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                 ctx.fillStyle = orbGrad;
                 ctx.beginPath(); ctx.arc(orbX, orbY, glowR, 0, Math.PI*2); ctx.fill();
             }
             if (bp === 'windup_key') {
                 ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY + 10*s); ctx.stroke();
                 // Handle
                 ctx.lineWidth = 2*s;
                 ctx.beginPath(); ctx.arc(centerX - 5*s, centerY, 5*s, 0, Math.PI*2); ctx.stroke();
                 ctx.beginPath(); ctx.arc(centerX + 5*s, centerY, 5*s, 0, Math.PI*2); ctx.stroke();
             }
        }

        // 9. Jersey Number (Layer 5)
        if(!skin.includes('alien') && !skin.includes('robot') && skinObj.number) {
            ctx.fillStyle = skinObj.numberColor || "#FFF";
            ctx.font = `bold ${12 * s}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(skinObj.number, p.x, torsoY + bodyH * 0.6);
        }

        // 10. Shot Meter (Layer 6)
        drawMeterCommon(p, s, sizeMod);
    }
    function getProjectedY(gDist, currentDist, horizonY) {
        if (gDist <= 0) { const p = project(HOOP_POS.x, HOOP_POS.y, 0); return p ? p.y : horizonY; }
        const ratio = gDist / currentDist;
        const wx = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratio; const wy = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratio;
        const p = project(wx, wy, 0); return p ? p.y : canvas.height;
    }

    function drawMountainLayer(layer, horizonY, dx, scale) {
        if (playerData.graphics === 'HIGH') {
            if (!layer.gradient) {
                const grad = ctx.createLinearGradient(0, horizonY - 150, 0, horizonY);
                grad.addColorStop(0, layer.color);
                grad.addColorStop(1, '#1a1a1a');
                layer.gradient = grad;
            }
            ctx.fillStyle = layer.gradient;
        } else {
            ctx.fillStyle = layer.color;
        }

        if (!scale) scale = 1.0;

        ctx.beginPath();
        ctx.moveTo((layer.points[0].x * scale) + dx, horizonY);
        layer.points.forEach(p => { ctx.lineTo((p.x * scale) + dx, horizonY - (p.y * scale)); });
        ctx.lineTo((layer.points[layer.points.length-1].x * scale) + dx, horizonY);
        ctx.fill();
    }

    function drawBackground(vpX, vpY, vpW, vpH) {
        if (vpW === undefined) { vpX=0; vpY=0; vpW=canvas.width; vpH=canvas.height; }
        g_viewport = { x: vpX, y: vpY, w: vpW, h: vpH };

        // Optimization: Per-frame camera calculation
        // Camera Follow Logic
        if (!window.g_camSmooth) window.g_camSmooth = { x: player3D.x, y: player3D.y };

        let targetX = player3D.x;
        let targetY = player3D.y;

        if (state === 'SHOOTING' && activeBalls.length > 0 && currentGameMode === 'CLASSIC') {
            const b = activeBalls[activeBalls.length - 1];
            if (b.active) {
                targetX = b.x;
                targetY = b.y;
            }
        }

        // Smooth Interpolation
        const lerp = 0.1;
        window.g_camSmooth.x += (targetX - window.g_camSmooth.x) * lerp;
        window.g_camSmooth.y += (targetY - window.g_camSmooth.y) * lerp;

        // Snap if close to avoid micro-jitter
        if (Math.abs(targetX - window.g_camSmooth.x) < 1) window.g_camSmooth.x = targetX;
        if (Math.abs(targetY - window.g_camSmooth.y) < 1) window.g_camSmooth.y = targetY;

        const camX = window.g_camSmooth.x;
        const camY = window.g_camSmooth.y;

        const dxToHoop = HOOP_POS.x - camX;
        const dyToHoop = HOOP_POS.y - camY;
        const angleToHoop = Math.atan2(dyToHoop, dxToHoop);
        const camRotation = -angleToHoop - Math.PI / 2;
        const camSin = Math.sin(camRotation);
        const camCos = Math.cos(camRotation);
        const camZoom = isSplitscreen ? 450 : 698;
        const camHeight = 130000 / camZoom;

        if (!g_camCache) g_camCache = {};
        g_camCache.rotation = camRotation;
        g_camCache.sinRot = camSin;
        g_camCache.cosRot = camCos;
        g_camCache.cameraZoom = camZoom;
        g_camCache.cameraHeight = camHeight;
        g_camCache.x = camX;
        g_camCache.y = camY;

        // Ensure globals are updated
        cameraZoom = camZoom;
        cameraHeight = camHeight;

        const horizonY = (vpH - 120) * 0.38;

        if (!bgCache || bgCache.distanceLevel !== distanceLevel || bgCache.mode !== currentGameMode) {
            bgCache = { distanceLevel: distanceLevel, mode: currentGameMode, pastFloors: [] };

            let court;
            if (currentGameMode === 'CONTEST') {
                court = COURT_THEMES.arena;
            } else if (currentGameMode === 'TIME_ATTACK') {
                court = COURT_THEMES.carnival;
            } else {
                const currentDist = 10 + (distanceLevel * 5);
                court = getCourtDetails(currentDist);
            }

            // Sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, vpH * 0.6);
            skyGrad.addColorStop(0, court.sky1); skyGrad.addColorStop(1, court.sky2);
            bgCache.sky = skyGrad;

            // Current Floor
            if (playerData.graphics === 'HIGH') {
                 // Bake texture for high graphics
                 const fCv = document.createElement('canvas');
                 fCv.width = vpW;
                 fCv.height = Math.ceil(vpH - horizonY);
                 const fCtx = fCv.getContext('2d');

                 // Base Gradient
                 const grad = fCtx.createLinearGradient(0, 0, 0, fCv.height);
                 grad.addColorStop(0, court.ground1); grad.addColorStop(1, court.ground2);
                 fCtx.fillStyle = grad;
                 fCtx.fillRect(0, 0, fCv.width, fCv.height);

                 // Procedural Textures based on Type
                 if (court.type === 'arena') {
                     // Wood Planks
                     fCtx.fillStyle = court.ground2;
                     const plankW = 40;
                     for(let i=0; i<fCv.width; i+=plankW) {
                         fCtx.fillRect(i, 0, 2, fCv.height);
                     }
                 }
                 else if (court.type === 'carnival') {
                     // Carnival Checkerboard
                     const size = 50;
                     fCtx.fillStyle = court.ground2;
                     for(let y=0; y<fCv.height; y+=size) {
                         for(let x=0; x<fCv.width; x+=size) {
                             if ((Math.floor(x/size) + Math.floor(y/size)) % 2 === 0) {
                                 fCtx.fillRect(x, y, size, size);
                             }
                         }
                     }
                 }
                 else if (court.type === 'grass' || court.type === 'tree') {
                     // Grass Blades removed for clean High graphics
                 }
                 else if (court.type === 'castle') {
                    // Clean asphalt
                 }
                 else if (court.type === 'mountain') {
                     // Ice / Snow Gloss
                     // Reflections (Fake)
                     const gradRef = fCtx.createLinearGradient(0, 0, fCv.width, fCv.height);
                     gradRef.addColorStop(0, 'rgba(255,255,255,0)');
                     gradRef.addColorStop(0.5, 'rgba(255,255,255,0.1)');
                     gradRef.addColorStop(1, 'rgba(255,255,255,0)');
                     fCtx.fillStyle = gradRef;
                     fCtx.fillRect(0, 0, fCv.width, fCv.height);
                 }
                 else if (court.type === 'water') {
                    // Clean water
                 }
                 else if (court.type === 'space') {
                     // Craters / Dust
                     fCtx.fillStyle = 'rgba(0,0,0,0.2)';
                     for(let i=0; i<20; i++) {
                         const r = 10 + Math.random() * 40;
                         const cx = Math.random() * fCv.width;
                         const cy = Math.random() * fCv.height;
                         fCtx.beginPath();
                         fCtx.arc(cx, cy, r, 0, Math.PI*2);
                         fCtx.fill();
                     }
                 }

                 bgCache.floorImage = fCv;
            } else {
                 const currentZoneGrad = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
                 currentZoneGrad.addColorStop(0, court.ground1); currentZoneGrad.addColorStop(1, court.ground2);
                 bgCache.currentFloor = currentZoneGrad;
            }

            // Past Floors (Only for CLASSIC)
            if (currentGameMode === 'CLASSIC') {
                const currentDist = 10 + (distanceLevel * 5);
                for (let i = 0; i < COURT_ZONES.length; i++) {
                    const z = COURT_ZONES[i];
                    let zStart = (i === 0) ? 0 : COURT_ZONES[i-1].limit;
                    let zEnd = z.limit;
                    if (zStart >= currentDist) break;
                    let drawEnd = Math.min(zEnd, currentDist);
                    const yTop = getProjectedY(zStart, currentDist, horizonY); const yBottom = getProjectedY(drawEnd, currentDist, horizonY);
                    if ((yBottom - yTop) > 0.5) {
                        const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
                        grad.addColorStop(0, z.ground1); grad.addColorStop(1, z.ground2);
                        bgCache.pastFloors.push({ y: yTop, h: (yBottom - yTop) + 2, grad: grad });
                    }
                }
            }
        }

        // DRAW FROM CACHE
        ctx.fillStyle = bgCache.sky; ctx.fillRect(0, 0, vpW, vpH);

        // SUN / MOON / STARS / MOUNTAINS (CLASSIC ONLY)
        if (currentGameMode === 'CLASSIC') {
            if (distanceLevel > 8) {
                 // Simple stars
                 ctx.fillStyle = 'rgba(255,255,255,0.8)';
                 for(let i=0; i<30; i++) {
                     let sx = (i * 137) % vpW;
                     let sy = (i * 59) % (horizonY * 0.8);
                     ctx.beginPath(); ctx.arc(sx, sy, 1 + (i%2), 0, Math.PI*2); ctx.fill();
                }
            } else {
                 // Sun
                 if (playerData.graphics === 'HIGH') {
                     const sunX = 700, sunY = 80;
                     const glow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 120);
                     glow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                     glow.addColorStop(0.4, 'rgba(255, 165, 0, 0.4)');
                     glow.addColorStop(1, 'rgba(255, 69, 0, 0)');
                     ctx.fillStyle = glow;
                     ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, Math.PI*2); ctx.fill();
                     ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI*2); ctx.fill();
                 } else {
                     ctx.fillStyle = sunGradient;
                     ctx.beginPath(); ctx.arc(700, 80, 80, 0, Math.PI*2); ctx.fill();
                 }
            }

            // BACKGROUND MOUNTAINS
            const mountainScale = 1.0 / (1.0 + (distanceLevel - 1) * 0.01);

            mountainLayers.forEach(layer => {
                 const shift = (camX + camY) * layer.speed;
                 const loopWidth = 2000 * mountainScale;
                 const offset = shift % loopWidth;
                 let startX = -offset;
                 if (startX > 0) startX -= loopWidth;

                 let currentX = startX;
                 while(currentX < vpW) {
                     drawMountainLayer(layer, horizonY, currentX, mountainScale);
                     currentX += loopWidth;
                 }
            });
        }

        // CLOUDS
        if (currentGameMode === 'CLASSIC') {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            clouds.forEach(c => {
                 // c.x updated in updateEnvironment
                 let xPos = c.x;
                 let yPos = c.y;
                 ctx.beginPath();
                 c.puffs.forEach(p => {
                     ctx.moveTo(xPos + p.dx * c.scale, yPos + p.dy * c.scale);
                     ctx.arc(xPos + p.dx * c.scale, yPos + p.dy * c.scale, p.r * c.scale, 0, Math.PI*2);
                 });
                 ctx.fill();
            });
        }

        if (bgCache.floorImage) {
             ctx.drawImage(bgCache.floorImage, 0, horizonY);
        } else {
             ctx.fillStyle = bgCache.currentFloor; ctx.fillRect(0, horizonY, vpW, vpH - horizonY);
        }

        // River Injection
        const poleProj = project(HOOP_POS.x, HOOP_POS.y, 0);
        if (poleProj) {
            const riverBottomY = poleProj.y;
            boatSystem.draw(ctx, horizonY, riverBottomY, vpW);
        }

        if (currentGameMode === 'CLASSIC') {
            const currentDist = 10 + (distanceLevel * 5);
            for (let i = 0; i < COURT_ZONES.length; i++) {
                const z = COURT_ZONES[i];
                let zStart = (i === 0) ? 0 : COURT_ZONES[i-1].limit;
                if (zStart >= currentDist) break;
                let drawEnd = Math.min(z.limit, currentDist);

                // Re-project zone boundaries based on current camera
                const ratioStart = zStart / currentDist;
                const ratioEnd = drawEnd / currentDist;

                const wxStart = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratioStart;
                const wyStart = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratioStart;
                const pStart = project(wxStart, wyStart, 0, g_camCache); // Force use of current camera cache

                const wxEnd = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratioEnd;
                const wyEnd = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratioEnd;
                const pEnd = project(wxEnd, wyEnd, 0, g_camCache);

                const yTop = pStart ? pStart.y : horizonY;
                const yBottom = pEnd ? pEnd.y : canvas.height;

                if ((yBottom - yTop) > 0.5) {
                    const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
                    grad.addColorStop(0, z.ground1); grad.addColorStop(1, z.ground2);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, yTop, vpW, yBottom - yTop);
                }
            }
        }

        ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(vpW, horizonY); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();

        // 3D OBJECTS
        g_poolIndex = 0;
        g_renderList.length = 0;

        // Use cached camera values (already calculated at top of function)

        // OPTIMIZATION: Cull objects far beyond the player
        // Player moves away from hoop. d.dist approximates distance from hoop (in pixels).
        // Objects with d.dist >> playerDistFromHoop are behind the camera.
        const playerDistFromHoop = Math.sqrt(Math.pow(player3D.x - HOOP_POS.x, 2) + Math.pow(player3D.y - HOOP_POS.y, 2));
        const cullDist = playerDistFromHoop + 3000; // Margin for scatter and frustum depth

        // OPTIMIZATION: Start iteration from visible range
        // Objects with d.dist << playerDistFromHoop are too far in the distance to be seen (sub-pixel scale).
        // We assume a max visible depth of ~15000 pixels.

        // Optimization: Inline decor processing to avoid intermediate array allocation
        const processDecor = (d) => {
            // Fast Z-Check
            const dx = d.x - camX;
            const dy = d.y - camY;
            // ry calculation: dx * sin + dy * cos
            const ry = dx * camSin + dy * camCos;
            // cameraOffset is 550 in project()
            const depth = 550 - ry;
            if (depth <= 0) return;

            // Inline projection
            const rx = dx * camCos - dy * camSin;
            const scale = camZoom / depth;
            const screenX = vpW / 2 + (rx * scale);
            const screenY = horizonY + (camHeight - 0) * scale; // z is 0

            const obj = getRenderItem();
            obj.type = 'decor';
            obj.depth = depth;
            obj.x = screenX;
            obj.y = screenY;
            obj.scale = scale;
            obj.zoneType = d.zoneType;
            obj.variant = d.variant;
            obj.seed = d.seed;
            g_renderList.push(obj);
        };

        if (currentGameMode === 'CLASSIC') {
            const startDist = Math.max(0, playerDistFromHoop - 15000);
            let startIndex = 0;
            if (startDist > 1000) {
                 startIndex = binarySearchLowerBound(decors, startDist);
            }
            for (let i = startIndex; i < decors.length; i++) {
                const d = decors[i];
                if (d.dist > cullDist) break;
                processDecor(d);
            }
        } else if (currentGameMode === 'TIME_ATTACK') {
            // Carnival: Circle of tents around hoop
            const r = 800;
            for(let i=0; i<8; i++) {
                const angle = (i/8) * Math.PI * 2;
                processDecor({
                    x: HOOP_POS.x + Math.cos(angle)*r,
                    y: HOOP_POS.y + Math.sin(angle)*r,
                    zoneType: 'carnival_tent',
                    variant: {},
                    seed: i
                });
            }
        } else if (currentGameMode === 'CONTEST') {
            // Arena: Bleachers
            const r = 900;
            for(let i=0; i<12; i++) {
                const angle = (i/12) * Math.PI * 2;
                processDecor({
                    x: HOOP_POS.x + Math.cos(angle)*r,
                    y: HOOP_POS.y + Math.sin(angle)*r,
                    zoneType: 'arena_bleachers',
                    variant: {},
                    seed: i
                });
            }
        }

        const hoopProj = project(HOOP_POS.x, HOOP_POS.y, HOOP_POS.z);
        if (hoopProj) {
            const obj = getRenderItem();
            obj.type = 'hoop';
            obj.depth = hoopProj.depth;
            obj.x = hoopProj.x; obj.y = hoopProj.y; obj.scale = hoopProj.scale;
            g_renderList.push(obj);
        }

        const playerProj = project(player3D.x, player3D.y, player3D.z);
        if (playerProj) {
            const obj = getRenderItem();
            obj.type = 'player';
            obj.depth = playerProj.depth;
            obj.x = playerProj.x; obj.y = playerProj.y; obj.scale = playerProj.scale;
            g_renderList.push(obj);
        }

        const shadowProj = project(player3D.x, player3D.y, 0);
        if (shadowProj) {
            const obj = getRenderItem();
            obj.type = 'player_shadow';
            obj.depth = shadowProj.depth + 0.1;
            obj.x = shadowProj.x; obj.y = shadowProj.y; obj.scale = shadowProj.scale;
            g_renderList.push(obj);
        }

        activeBalls.forEach(b => {
            if (b.active) {
                const ballShadowProj = project(b.x, b.y, 0);
                if (ballShadowProj) {
                    const obj = getRenderItem();
                    obj.type = 'ball_shadow';
                    obj.depth = ballShadowProj.depth + 0.1;
                    obj.x = ballShadowProj.x; obj.y = ballShadowProj.y; obj.scale = ballShadowProj.scale;
                    obj.ballRef = b;
                    g_renderList.push(obj);
                }

                const ballProj = project(b.x, b.y, b.z);
                if (ballProj) {
                    const obj = getRenderItem();
                    obj.type = 'ball';
                    obj.depth = ballProj.depth;
                    obj.x = ballProj.x; obj.y = ballProj.y; obj.scale = ballProj.scale;
                    obj.ballRef = b;
                    g_renderList.push(obj);
                }
            }
        });

        particles.forEach(p => {
             const proj = project(p.x, p.y, p.z);
             if(proj) {
                 const obj = getRenderItem();
                 obj.type = 'smoke';
                 // Force streak fire particles behind the player (depth > 550)
                 if (p.isFireParticle && p.customHue !== undefined) {
                     obj.depth = Math.max(proj.depth, 580);
                 } else {
                     obj.depth = proj.depth;
                 }
                 obj.x = proj.x; obj.y = proj.y; obj.scale = proj.scale;
                 obj.alpha = p.alpha;
                 obj.color = p.color;
                 g_renderList.push(obj);
             }
        });

        g_renderList.sort((a, b) => b.depth - a.depth);
        g_renderList.forEach(obj => {
            if (obj.type === 'decor') drawDecor(obj, obj.zoneType, obj.variant, obj.seed);
            if (obj.type === 'hoop') drawHoop(obj);
            if (obj.type === 'player_shadow') drawRealisticShadow(obj, 'player');
            if (obj.type === 'ball_shadow') drawRealisticShadow(obj, 'ball');
            if (obj.type === 'player') drawPlayer(obj);
            if (obj.type === 'ball') drawBall(obj, obj.ballRef);
            if (obj.type === 'smoke') drawSmoke(obj, obj.alpha, obj.color);
        });

        // Draw Weather overlay on top of 3D scene but behind UI
        weather.draw(project);

        if (feedbackTimer > 0) {
            ctx.save(); ctx.font = "900 60px 'Arial Black'";
            ctx.fillStyle = feedback === "MUY BIEN!" || feedback === "CHANCEUX!" || feedback === "Swish" || feedback.includes('MONEY') || feedback === "SUR LA LIGNE!" || feedback === "OUF!" || feedback.includes('SÉRIE') ? "#00FF00" : "#FF0000";
            if (feedback === "DERNIÈRE CHANCE !") ctx.fillStyle = "#FFA500";
            ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.textAlign = "center";
            ctx.fillText(feedback, vpW/2, 200); ctx.strokeText(feedback, vpW/2, 200);
            ctx.restore();
        }
    }
    // Achievement Logic Helpers
    function drawSplitscreenHUD() {
        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;

        const drawPlayerHUD = (gCtx, xCenter, label, actionBtn) => {
            ctx.textAlign = "center";

            // Label
            ctx.font = "bold 20px 'Roboto Condensed'";
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText(label, xCenter, 30);

            // Stats
            ctx.font = "900 32px 'Russo One'";
            ctx.fillStyle = "#FFD700";

            let line1 = "";
            let line2 = "";

            if (currentGameMode === 'CLASSIC') {
                const dist = 10 + (gCtx.distanceLevel * 5);
                const maxMisses = 2 + (gCtx.playerData.stats.extraLives || 0);
                line1 = `${dist} PI`;
                line2 = `MISS: ${gCtx.consecutiveMisses}/${maxMisses}`;
                // Streak?
                if (gCtx.currentStreak > 1) line2 += ` (${gCtx.currentStreak} 🔥)`;
            } else if (currentGameMode === 'CONTEST') {
                line1 = `SCORE: ${gCtx.contestData.score}`;
                line2 = `TIME: ${Math.ceil(gCtx.contestData.timer)}`;
            } else if (currentGameMode === 'TIME_ATTACK') {
                line1 = `SCORE: ${gCtx.timeAttackData.score}`;
                line2 = `TIME: ${Math.ceil(gCtx.timeAttackData.timer)}`;
            }

            ctx.fillText(line1, xCenter, 65);

            ctx.font = "bold 24px 'Roboto Condensed'";
            ctx.fillStyle = "#FFF";
            ctx.fillText(line2, xCenter, 95);

            // Game Over State
            if (gCtx.state === 'GAMEOVER') {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(xCenter - 150, h/2 - 60, 300, 120);

                ctx.font = "900 40px 'Russo One'";
                ctx.fillStyle = "#FF0000";
                ctx.fillText("TERMINÉ", xCenter, h/2 - 10);

                ctx.font = "bold 20px 'Roboto Condensed'";
                ctx.fillStyle = "#FFF";
                ctx.fillText(`PRESS ${actionBtn}`, xCenter, h/2 + 30);
                ctx.fillText("TO RESTART", xCenter, h/2 + 55);
            }
        };

        drawPlayerHUD(game1, w * 0.25, "PLAYER 1", "SPACE");
        drawPlayerHUD(game2, w * 0.75, "PLAYER 2", "ENTER");

        // Center Divider Line (Visual)
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
