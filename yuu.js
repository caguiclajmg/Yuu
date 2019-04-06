/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const gui = require('gui');
const img = require('./image');
const Window = require('./window');

async function main() {
    const imagePath = process.argv[2];
    if(!imagePath) process.exit(0);

    const window = new Window();
    window.show();

    const gif = await img.loadImage(imagePath, {
        cumulative: true,
        asyncLoad: true,
        progressHandler: (status) => console.log(`${status.current}/${status.count}`),
    });
    window.setImage(gif);
    window.setSize(gif.size);

    if(!process.versions.yode) {
        gui.MessageLoop.run();
        process.exit(0);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(-1);
});
