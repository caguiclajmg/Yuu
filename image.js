/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const gui = require('gui');
const gifFrames = require('gif-frames');
const promisepipe = require('promisepipe');
const memoryStreams = require('memory-streams');
const jimp = require('jimp');

async function processImage(frame, options) {
    options = options || {};

    const stream = frame.getImage();
    const ws = new memoryStreams.WritableStream();
    await promisepipe(stream, ws);

    let image = await jimp.read(ws.toBuffer());

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
            const distance = Math.sqrt(Math.pow(pixel.r - key.r, 2) + Math.pow(pixel.g - key.g, 2) + Math.pow(pixel.b - key.b, 2)) / Math.sqrt(Math.pow(255, 2) * 3);

            if (distance <= tolerance) image.setPixelColor(jimp.rgbaToInt(pixel.r, pixel.g, pixel.b, 0), x, y);
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
        frames[index] = gui.Image.createFromBuffer(await processImage(frame, options), 1);

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
