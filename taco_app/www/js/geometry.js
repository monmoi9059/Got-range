    var Geometry = {
        basketball: [],
        soccer: [],
        seam: [],
        dimples: [],
        beach: [],
        watermelon: [],
        sphere: { vertices: [], faces: [] },

        init: function() {
            // Sphere (Subdivided Octahedron)
            var v = [
                {x:0, y:1, z:0}, {x:0, y:-1, z:0},
                {x:1, y:0, z:0}, {x:-1, y:0, z:0},
                {x:0, y:0, z:1}, {x:0, y:0, z:-1}
            ];
            var f = [
                [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
                [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
            ];
            var subdiv = 2;
            for(var s=0; s<subdiv; s++) {
                var newF = [];
                var midCache = {};
                var getMid = function(i1, i2) {
                    var key = i1 < i2 ? i1 + "_" + i2 : i2 + "_" + i1;
                    if(midCache[key]) return midCache[key];
                    var p1 = v[i1], p2 = v[i2];
                    var mx = (p1.x + p2.x)/2, my = (p1.y + p2.y)/2, mz = (p1.z + p2.z)/2;
                    var len = Math.sqrt(mx*mx + my*my + mz*mz);
                    var idx = v.length;
                    v.push({x:mx/len, y:my/len, z:mz/len});
                    midCache[key] = idx;
                    return idx;
                };
                for(var i=0; i<f.length; i++) {
                    var tri = f[i];
                    var a = getMid(tri[0], tri[1]);
                    var b = getMid(tri[1], tri[2]);
                    var c = getMid(tri[2], tri[0]);
                    newF.push([tri[0], a, c]);
                    newF.push([tri[1], b, a]);
                    newF.push([tri[2], c, b]);
                    newF.push([a, b, c]);
                }
                f = newF;
            }
            this.sphere.vertices = v;
            this.sphere.faces = f;

            // Basketball (3 Rings - Orthogonal)
            var res = 32;
            // Ring 1 (XY)
            for(var i=0; i<=res; i++) { var a=(i/res)*Math.PI*2; this.basketball.push({x:Math.cos(a), y:Math.sin(a), z:0}); }
            // Ring 2 (YZ)
            for(var i=0; i<=res; i++) { var a=(i/res)*Math.PI*2; this.basketball.push({x:0, y:Math.cos(a), z:Math.sin(a)}); }
            // Ring 3 (XZ)
            for(var i=0; i<=res; i++) { var a=(i/res)*Math.PI*2; this.basketball.push({x:Math.cos(a), y:0, z:Math.sin(a)}); }

            // Soccer (Pentagons)
            var t = (1.0 + Math.sqrt(5.0)) / 2.0;
            var icosa = [
                [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
                [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
                [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
            ];

            var self = this;
            icosa.forEach(function(center) {
                var len = Math.sqrt(center[0]*center[0] + center[1]*center[1] + center[2]*center[2]);
                var cx = center[0]/len; var cy = center[1]/len; var cz = center[2]/len;

                var up = [0, 1, 0];
                if (Math.abs(cy) > 0.9) up = [1, 0, 0];

                var tx = up[1]*cz - up[2]*cy;
                var ty = up[2]*cx - up[0]*cz;
                var tz = up[0]*cy - up[1]*cx;
                var tLen = Math.sqrt(tx*tx + ty*ty + tz*tz);

                var ux = tx/tLen; var uy = ty/tLen; var uz = tz/tLen;
                var vx = cy*uz - cz*uy;
                var vy = cz*ux - cx*uz;
                var vz = cx*uy - cy*ux;

                var pentagon = [];
                var radius = 0.25;

                for(var i=0; i<5; i++) {
                    var angle = (i/5) * Math.PI * 2;
                    var px = ux * Math.cos(angle) * radius + vx * Math.sin(angle) * radius;
                    var py = uy * Math.cos(angle) * radius + vy * Math.sin(angle) * radius;
                    var pz = uz * Math.cos(angle) * radius + vz * Math.sin(angle) * radius;

                    var fx = cx + px; var fy = cy + py; var fz = cz + pz;
                    var fl = Math.sqrt(fx*fx + fy*fy + fz*fz);
                    pentagon.push({x:fx/fl, y:fy/fl, z:fz/fl});
                }
                self.soccer.push(pentagon);
            });

            // Seam (Baseball/Tennis)
            for(var i=0; i<=100; i++) {
                var t = (i/100)*Math.PI*2;
                var r0 = 0.4;
                var x = Math.sin(t) - r0 * Math.sin(3*t);
                var y = Math.cos(t) + r0 * Math.cos(3*t);
                var z = 1.4 * Math.cos(2*t);
                var len = Math.sqrt(x*x + y*y + z*z);
                this.seam.push({x:x/len, y:y/len, z:z/len});
            }

            // Dimples (Golf)
            var numDimples = 200;
            var phi = Math.PI * (3. - Math.sqrt(5.));
            for (var i=0; i<numDimples; i++) {
                var y = 1 - (i / (numDimples - 1)) * 2;
                var radius = Math.sqrt(1 - y * y);
                var theta = phi * i;
                var x = Math.cos(theta) * radius;
                var z = Math.sin(theta) * radius;
                this.dimples.push({x:x, y:y, z:z});
            }

            // Beach Ball
            for(var s=0; s<6; s++) {
                var angle = (s/6)*Math.PI*2;
                var line = [];
                for(var i=0; i<=20; i++) {
                    var lat = -Math.PI/2 + (i/20)*Math.PI;
                    var x = Math.cos(lat) * Math.cos(angle);
                    var y = Math.sin(lat);
                    var z = Math.cos(lat) * Math.sin(angle);
                    line.push({x:x, y:y, z:z});
                }
                this.beach.push(line);
            }

            // Watermelon
             for(var s=0; s<8; s++) {
                var angle = (s/8)*Math.PI*2;
                var line = [];
                for(var i=0; i<=20; i++) {
                    var lat = -Math.PI/2 + (i/20)*Math.PI;
                    var wobble = Math.sin(i * 1.5) * 0.1;
                    var localAngle = angle + wobble;
                    var x = Math.cos(lat) * Math.cos(localAngle);
                    var y = Math.sin(lat);
                    var z = Math.cos(lat) * Math.sin(localAngle);
                    line.push({x:x, y:y, z:z});
                }
                this.watermelon.push(line);
            }
        }
    };
    Geometry.init();
