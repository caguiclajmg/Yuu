/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const gui = require('gui');
const gifFrames = require('gif-frames');
const promisepipe = require('promisepipe');
const memoryStreams = require('memory-streams');
const jimp = require('jimp');

async function processFrame(frame, options) {
    options = options || {};

    const stream = frame.getImage();
    const ws = new memoryStreams.WritableStream();
    await promisepipe(stream, ws);

    const image = await jimp.read(ws.toBuffer());

    if(options.chromaKey) {
        const key = options.chromaKey.colorKey;
        const tolerance = options.chromaKey.tolerance;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const pixel = {
                r: image.bitmap.data[idx + 0],
                g: image.bitmap.data[idx + 1],
                b: image.bitmap.data[idx + 2],
                a: image.bitmap.data[idx + 3],
            };
            const distance = Math.sqrt(Math.pow(pixel.r - key.r, 2) + Math.pow(pixel.g - key.g, 2) + Math.pow(pixel.b - key.b, 2)) / Math.sqrt(Math.pow(255, 2) * 3);

            if(distance <= tolerance) image.setPixelColor(jimp.rgbaToInt(pixel.r, pixel.g, pixel.b, 0), x, y);
        });
    }

    return gui.Image.createFromBuffer(await image.getBufferAsync(jimp.MIME_PNG), 1);
}

async function loadImage(path, options) {
    options = options || {};

    const frameData = await gifFrames({
        url: path,
        frames: (options.start && options.end) ?  `${options.start}-${options.end}` : 'all',
        outputType: 'png',
        cumulative: options.cumulative,
    });

    const frames = new Array(frameData.length);

    const promises = Promise.all(frameData.map(async (frame, index) => {
        frames[index] = await processFrame(frame, options);
    }));

    if(!options.asyncLoad) await promises;

    return frames;
}

async function main() {
    const imagePath = process.argv[2];
    if(!imagePath) process.exit(0);

    const window = gui.Window.create({
        frame: false,
        transparent: true,
    });
    window.onClose = () => gui.MessageLoop.quit();

    const frames = await loadImage(imagePath, {
        cumulative: false,
        asyncLoad: true,
    });

    let frame = 0;

    const tmiFrame = gui.MenuItem.create({
        type: 'checkbox',
        checked: false,
        label: 'Frame'
    });
    tmiFrame.onClick = (self) => {
    };
    const tmiExit = gui.MenuItem.create({
        type: 'label',
        label: 'Exit',
    });
    tmiExit.onClick = (self) => {
        process.exit(0);
    };
    const menu = gui.Menu.create([tmiFrame, tmiExit]);

    let velocity = {
        x: 16 + Math.floor(Math.random() * 16) * (Math.random() <= 0.5 ? 1 : -1),
        y: 8 + Math.floor(Math.random() * 32) * (Math.random() <= 0.5 ? 1 : -1),
    };
    let held = false;

    const container = gui.Container.create();
    container.setMouseDownCanMoveWindow(true);
    container.onDraw = (self, painter) => {
        if(++frame >= frames.length) frame = 0;
        if(frames[frame]) painter.drawImage(frames[frame], window.getContentSize());

        if(!held) {
            const bounds = window.getBounds();

            if(bounds.x <= -bounds.width) {
                bounds.x = 1440;
                velocity.x = 16 + Math.floor(Math.random() * 16) * (Math.random() <= 0.5 ? 1 : -1);
            } else {
                bounds.x += velocity.x;
            }
            if(bounds.x >= 1400) {
                bounds.x = -bounds.width;
                velocity.x = 16 + Math.floor(Math.random() * 16) * (Math.random() <= 0.5 ? 1 : -1);
            } else {
                bounds.x += velocity.x;
            }
            /*if(bounds.y <= -bounds.height) {
                bounds.y = 900;
                velocity.y = 8 + Math.floor(Math.random() * 32) * (Math.random() <= 0.5 ? 1 : -1);
            }
            if(bounds.y >= 900) {
                bounds.y = -bounds.height;
                velocity.y = 8 + Math.floor(Math.random() * 32) * (Math.random() <= 0.5 ? 1 : -1);
            }*/

            //bounds.y += velocity.y;

            window.setBounds(bounds);
        }
    };
    container.onMouseDown = (self, e) => {
        if(e.button === 1) held = true;

        if(e.button === 2) {
            menu.popup();
        }
    };
    container.onMouseUp = (self, e) => {
        if(e.button === 1) held = false;
    };

    window.setAlwaysOnTop(true);
    window.setContentSize({
        width: frames[0].getSize().width / 2,
        height: frames[0].getSize().height / 2,
    });
    window.setContentView(container);
    window.center();
    window.activate();

    setInterval(() => {
        container.schedulePaint();
    }, 100);

    if(!process.versions.yode) {
        gui.MessageLoop.run();
        process.exit(0);
    }
}

main().catch((e) => {
    console.log(e);
    process.exit(0);
});
