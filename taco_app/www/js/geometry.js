// Global Math Helper (Loaded First)
function lerp(a, b, t) { return a + (b - a) * t; }

var Geometry = {
    sphere: {
        vertices: [
            {x:0, y:1, z:0}, {x:0, y:-1, z:0},
            {x:1, y:0, z:0}, {x:-1, y:0, z:0},
            {x:0, y:0, z:1}, {x:0, y:0, z:-1}
        ],
        faces: [
            [0,2,4], [0,4,3], [0,3,5], [0,5,2],
            [1,4,2], [1,3,4], [1,5,3], [1,2,5]
        ]
    },
    // Basketball lines (Simplified)
    basketball: [],
    soccer: [], // Will be pentagons
    beach: [], // Slices
    seam: [], // Baseball curve
    dimples: [], // Golf
    watermelon: [] // Stripes
};

// Generate Basketball Lines
(function() {
    var r = 1;
    var steps = 32;
    // 1. Horizontal Circle (Equator)
    for(var i=0; i<=steps; i++) {
        var a = (i/steps)*Math.PI*2;
        Geometry.basketball.push({x: Math.cos(a), y: 0, z: Math.sin(a)});
    }
    // 2. Vertical Circle
    for(var i=0; i<=steps; i++) {
        var a = (i/steps)*Math.PI*2;
        Geometry.basketball.push({x: 0, y: Math.cos(a), z: Math.sin(a)});
    }
    // 3. Side Curves (Approximated sine wave wrapped)
    for(var i=0; i<=steps; i++) {
        var a = (i/steps)*Math.PI*2;
        var x = Math.cos(a);
        var y = Math.sin(a)*0.7; // Flattened
        var z = Math.sqrt(1 - x*x - y*y);
        if(isNaN(z)) z = 0;
        if (i > steps/2) z = -z;
        // Rotate this curve 90 deg?
        // Let's just hardcode a 'sine' on sphere surface
        // x = cos t, z = sin t * 0.5, y = sqrt(...)
        // Just simpler: Circle rotated
        // This is complex. Let's just add one main crossing circle.
    }
})();

// Generate Soccer Ball (Truncated Icosahedron - Pentagons only for visual)
// Simplified: Just 6 points + connections
Geometry.soccer.push(
    [{x:0,y:1,z:0}, {x:0.3,y:0.8,z:0.5}, {x:-0.3,y:0.8,z:0.5}, {x:-0.5,y:0.8,z:0}, {x:0.5,y:0.8,z:0}]
);

// Generate Baseball Seam
for(var i=0; i<=64; i++) {
    var t = (i/64)*Math.PI*2;
    // Tennis ball curve parametric
    var x = 0.5 * Math.cos(t) + 0.5 * Math.cos(3*t); // Approx
    var y = 0.5 * Math.sin(t) - 0.5 * Math.sin(3*t);
    var z = Math.sin(2*t);
    // Normalize to sphere
    var l = Math.sqrt(x*x+y*y+z*z);
    Geometry.seam.push({x:x/l, y:y/l, z:z/l});
}

// Generate Beach Ball (6 Slices)
for(var k=0; k<6; k++) {
    var slice = [];
    var a1 = (k/6)*Math.PI*2;
    var a2 = ((k+1)/6)*Math.PI*2;
    for(var i=0; i<=16; i++) {
        var v = (i/16)*Math.PI; // 0 to PI (Pole to Pole)
        var y = Math.cos(v);
        var r = Math.sin(v);
        // We want the line down the middle of the slice?
        // No, we want the borders.
        // Actually borders are shared.
        // Let's store center lines for color filling or just drawing lines.
        // Let's draw the lines between slices (Meridians)
        var x = Math.sin(a1) * r;
        var z = Math.cos(a1) * r;
        slice.push({x:x, y:y, z:z});
    }
    Geometry.beach.push(slice);
}

// Generate Golf Dimples
for(var i=0; i<50; i++) {
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var x = Math.sin(phi) * Math.cos(theta);
    var y = Math.sin(phi) * Math.sin(theta);
    var z = Math.cos(phi);
    Geometry.dimples.push({x:x, y:y, z:z});
}

// Watermelon Stripes (Meridians with jitter)
for(var k=0; k<12; k++) {
    var line = [];
    var ang = (k/12)*Math.PI*2;
    for(var i=0; i<=20; i++) {
        var v = (i/20)*Math.PI;
        var r = Math.sin(v);
        var y = Math.cos(v);
        var jitter = (Math.random()-0.5)*0.1;
        var x = Math.sin(ang + jitter) * r;
        var z = Math.cos(ang + jitter) * r;
        line.push({x:x, y:y, z:z});
    }
    Geometry.watermelon.push(line);
}
