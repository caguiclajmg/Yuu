const Yue = require('gui');

class Window {
    constructor(options) {
        options = options || {};

        this._draw = this._draw.bind(this);

        this.frame = 0;
        this.image = null;

        this.window = Yue.Window.create({
            frame: false,
            transparent: true,
        });

        this.setSize({width: 100, height: 100});

        this.container = Yue.Container.create();

        this.scaleMenuQuarter = Yue.MenuItem.create({
            type: 'radio',
            label: '0.25x',
        });
        this.scaleMenuQuarter.onClick = () => this.window.setContentSize({width: this.size.width * 0.25, height: this.size.height * 0.25});

        this.scaleMenuHalf = Yue.MenuItem.create({
            type: 'radio',
            label: '0.5x',
        });
        this.scaleMenuHalf.onClick = () => this.window.setContentSize({width: this.size.width * 0.5, height: this.size.height * 0.5});

        this.scaleMenuNormal = Yue.MenuItem.create({
            type: 'radio',
            label: '1x',
            checked: true,
        });
        this.scaleMenuNormal.onClick = () => this.window.setContentSize(this.size);

        this.scaleMenuDouble = Yue.MenuItem.create({
            type: 'radio',
            label: '2x',
        });
        this.scaleMenuDouble.onClick = () => this.window.setContentSize({width: this.size.width * 2, height: this.size.height * 2});

        this.scaleMenu = Yue.Menu.create([
            this.scaleMenuQuarter,
            this.scaleMenuHalf,
            this.scaleMenuNormal,
            this.scaleMenuDouble,
        ]);

        this.scale = Yue.MenuItem.create({
            type: 'submenu',
            label: 'Scale',
            submenu: this.scaleMenu,
        });

        this.exit = Yue.MenuItem.create({
            type: 'label',
            label: 'Exit',
        });
        this.exit.onClick = () => this.close();

        this.contextMenu = Yue.Menu.create([this.scale, this.exit]);

        this.container.onMouseDown = (self, event) => {
            if(event.button === 2) this.contextMenu.popup();
        };
        this.container.onDraw = this._draw;

        this.window.setContentView(this.container);
        this.window.onClose = () => this._unload();
        this.window.center();

        setInterval(() => {
            this.container.schedulePaint();
        }, 33);
    }

    show() {
        this.window.activate();
    }

    close() {
        this._unload();
    }

    setImage(image) {
        this.image = image;
    }

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
