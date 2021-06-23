class StretchedRenderer{
    constructor(colorRamp) {
        this.type = 1;
        this.definition = {
            colorRamp: colorRamp || [
                [0, 0, 0, 255],
                [255, 255, 255, 255]
            ]
        }
    }
}
module.exports = StretchedRenderer;