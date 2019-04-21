const Yue = require('gui');

const promptSlider = require('./prompt_slider.js');

class Window {
    constructor(options) {
        options = options || {};

        this.setPaintInterval = this.setPaintInterval.bind(this);
        this._draw = this._draw.bind(this);

        this.frame = 0;
        this.image = null;

        this.window = Yue.Window.create({
            frame: false,
            transparent: true,
        });

        this.container = Yue.Container.create();

        this.scale = Yue.MenuItem.create({
            type: 'label',
            label: 'Scale',
        });
        this.scale.onClick = () => promptSlider('Scale:', 'Yuu', 0.1, 4, 0.1, 1, (scale) => this.setScale(scale));

        this.interval = Yue.MenuItem.create({
            type: 'label',
            label: 'Speed'
        });
        this.interval.onClick = () => promptSlider('Interval:', 'Yuu', 1, 500, 1, this.interval, (interval) => this.setPaintInterval(interval));

        this.exit = Yue.MenuItem.create({
            type: 'label',
            label: 'Exit',
        });
        this.exit.onClick = () => this.close();

        this.contextMenu = Yue.Menu.create([this.scale, this.interval, this.exit]);

        this.container.onMouseDown = (self, event) => {
            if(event.button === 2) this.contextMenu.popup();
        };
        this.container.onDraw = this._draw;

        this.setSize({width: 1, height: 1});

        this.window.setContentView(this.container);
        this.window.onClose = () => this._unload();
        this.window.center();

        this.setPaintInterval(33);
    }

    setPaintInterval(interval) {
        if(this.timer) clearInterval(this.timer);
        this.interval = interval;
        this.timer = setInterval(() => {
            this.container.schedulePaint();
        }, this.interval);
    }

    show() {
        this.window.activate();
    }

    close() {
        this._unload();
    }

    setImage(image) {
        this.image = image;
        this.imageSize = this.image.size;
        this.setSize(this.imageSize);
    }

    setScale(scale) {
        this.setSize({
            width: this.imageSize.width * scale,
            height: this.imageSize.height * scale
        });
    }

    getSize() { return this.size; }

    setSize(size) {
        if(!size) return;

        this.size = size;
        this.window.setContentSize(this.size);
    }

    _draw(self, painter) {
        if(this.image) {
            if(++this.frame >= this.image.frames.length) this.frame = 0;
            if(this.image.frames[this.frame]) painter.drawImage(this.image.frames[this.frame], this.window.getContentSize());
        }
    }

    _unload() {
        Yue.MessageLoop.quit();
        process.exit(0);
    }
}

module.exports = exports = Window;
