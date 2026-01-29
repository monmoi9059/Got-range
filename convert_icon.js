const { Jimp } = require('jimp');
const path = require('path');

const inputFile = path.join(__dirname, 'taco_app/assets/icon_source.png');
const outputFile = path.join(__dirname, 'taco_app/res/icon.png');

Jimp.read(inputFile)
  .then(image => {
    return image
      .resize({ w: 1024, h: 1024 }) // Updated syntax for resize if needed, checking docs via error if this fails. Old was resize(w, h).
      .write(outputFile); // write might return promise or not in new version?
  })
  .then(() => {
    console.log('Icon converted successfully to', outputFile);
  })
  .catch(err => {
    console.error('Error converting icon:', err);
    process.exit(1);
  });
