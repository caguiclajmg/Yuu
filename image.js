/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const gui = require('gui');
const gifFrames = require('gif-frames');
const jimp = require('jimp');

function rgbToYCbCr(r, g, b) {
    return {
        y: 16 + ((65.738 / 256) * r) + ((129.057 / 256) * g) + ((25.064 / 256) * b),
        cb: 128 - ((37.945 / 256) * r) - ((74.494 / 256) * g) + ((112.439 / 256) * b),
        cr: 128 + ((112.439 / 256) * r) - ((94.154 / 256) * g) - ((18.285 / 256) * b),
    };
}

async function processImage(stream, options) {
    options = options || {};

    let image = await jimp.read(stream);

    if (options.size) {
        if (!options.size.width && !options.size.height) throw new Error('Image width and height cannot be both blank');
        image.resize(options.size.width || jimp.AUTO, options.size.height || jimp.AUTO);
    }

    if (options.chromaKey) {
        const key = options.chromaKey.key;
        const tolerance = options.chromaKey.tolerance;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const pixel = {
                r: image.bitmap.data[idx + 0],
                g: image.bitmap.data[idx + 1],
                b: image.bitmap.data[idx + 2],
                a: image.bitmap.data[idx + 3],
            };
            const distance = (Math.abs(pixel.r - key.r) + Math.abs(pixel.g - key.g) + Math.abs(pixel.b - key.b)) / (255 * 3);

            if (distance <= tolerance) image.bitmap.data[idx + 3] = 0;
        });
    }

    return await image.getBufferAsync(jimp.MIME_PNG);
}

async function loadGIF(path, options) {
    options = options || {};

    const frameData = await gifFrames({
        url: path,
        frames: (options.start && options.end) ? `${options.start}-${options.end}` : 'all',
        outputType: 'png',
        cumulative: options.cumulative,
    });

    let progress = 0;

    const frames = new Array(frameData.length);
    const promises = Promise.all(frameData.map(async (frame, index) => {
        frames[index] = gui.Image.createFromBuffer(await processImage(frame.getImage(), options), 1);

        progress++;

        if (options.progressHandler) options.progressHandler({
            current: progress,
            count: frames.length,
        });
    }));

    if (!options.asyncLoad) await promises;

    return {
        size: {
            // TODO: Find a better place to get the image dimensions
            width: frameData[0].frameInfo.width,
            height: frameData[0].frameInfo.height,
        },
        frames: frames,
    };
}

async function loadImage(path, options) {
    return await loadGIF(path, options);
}

module.exports = exports = {
    loadImage
}
