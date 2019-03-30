/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const gui = require('gui');
const img = require('./image');

async function main() {
    const imagePath = process.argv[2];
    if(!imagePath) process.exit(0);

    const window = gui.Window.create({
        frame: false,
        transparent: true,
    });
    window.onClose = () => gui.MessageLoop.quit();

    const image = await img.loadImage(imagePath, {
        cumulative: false,
        asyncLoad: true,
        progressHandler: (status) => console.log(`${status.current}/${status.count}`),
        chromaKey: {
            key: {r: 0, g: 255, b: 0},
            tolerance: 0.30,
        },
    });
    const frames = image.frames;

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
    const tmiScaleHalf = gui.MenuItem.create({
        type: 'radio',
        label: '0.5x',
    });
    tmiScaleHalf.onClick = (self) => {
        window.setContentSize({
            width: image.size.width / 2,
            height: image.size.height / 2,
        });
    };
    const tmiScale1 = gui.MenuItem.create({
        type: 'radio',
        label: '1x',
        checked: true,
    });
    tmiScale1.onClick = (self) => {
        window.setContentSize({
            width: image.size.width,
            height: image.size.height,
        });
    };
    const tmiScale2 = gui.MenuItem.create({
        type: 'radio',
        label: '2x',
    });
    tmiScale2.onClick = (self) => {
        window.setContentSize({
            width: image.size.width * 2,
            height: image.size.height * 2,
        });
    };
    const menu = gui.Menu.create([tmiScaleHalf, tmiScale1, tmiScale2, tmiFrame, tmiExit]);

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
        width: image.size.width,
        height: image.size.height,
    });
    window.setContentView(container);
    window.center();
    window.activate();

    setInterval(() => {
        container.schedulePaint();
    }, 50);

    console.log('window is created!');

    if(!process.versions.yode) {
        gui.MessageLoop.run();
        process.exit(0);
    }
}

main().catch((e) => {
    console.log(e);
    process.exit(0);
});
