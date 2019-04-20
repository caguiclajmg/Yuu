const Yue = require('gui');

function inputSlider(prompt, title, min, max, step, value, callback) {
    const window = Yue.Window.create({});
    window.setTitle(title);

    const container = Yue.Container.create();

    const label = Yue.Label.create(prompt);
    container.addChildView(label);

    const slider = Yue.Slider.create();
    slider.setRange(min, max);
    slider.setValue(value);
    slider.setStep(step);
    container.addChildView(slider);

    const ok = Yue.Button.create('OK');
    ok.onClick = () => {
        if(callback) callback(slider.getValue());
        window.close();
    };
    container.addChildView(ok);

    const cancel = Yue.Button.create('Cancel');
    cancel.onClick = () => window.close();
    container.addChildView(cancel);

    window.setContentView(container);

    const size = container.getPreferredSize();
    window.setContentSize({
        width: Math.max(size.width, 320),
        height: size.height
    });
    window.center();
    window.activate();
}

module.exports = exports = inputSlider;
