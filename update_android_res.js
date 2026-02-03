const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'taco_app/assets/icon_source.png');
const androidRes = path.join(__dirname, 'taco_app/android/app/src/main/res');

const mipmaps = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 }
];

async function run() {
    try {
        console.log(`Reading source from ${inputPath}`);
        const image = await Jimp.read(inputPath);

        // Update Mipmaps
        for (const mip of mipmaps) {
            const dir = path.join(androidRes, mip.name);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created ${dir}`);
            }

            const icon = image.clone().resize({ w: mip.size, h: mip.size });
            await icon.write(path.join(dir, 'ic_launcher.png'));
            await icon.write(path.join(dir, 'ic_launcher_round.png')); // Using same image for round
            console.log(`Updated ${mip.name} (size ${mip.size})`);
        }

        // Update Adaptive Foreground
        const drawableDir = path.join(androidRes, 'drawable-xxxhdpi');
        if (!fs.existsSync(drawableDir)) {
            fs.mkdirSync(drawableDir, { recursive: true });
             console.log(`Created ${drawableDir}`);
        }

        const foregroundSize = 432;
        const foreground = image.clone().resize({ w: foregroundSize, h: foregroundSize });
        await foreground.write(path.join(drawableDir, 'ic_launcher_foreground.png'));
        console.log(`Updated drawable-xxxhdpi/ic_launcher_foreground.png (size ${foregroundSize})`);

        // Clean up conflicting XML
        const conflictXml = path.join(androidRes, 'drawable/ic_launcher_foreground.xml');
        if (fs.existsSync(conflictXml)) {
            fs.unlinkSync(conflictXml);
            console.log(`Deleted conflicting ${conflictXml}`);
        } else {
            console.log(`No conflicting ${conflictXml} found.`);
        }

    } catch (err) {
        console.error('Error updating android resources:', err);
        process.exit(1);
    }
}

run();
