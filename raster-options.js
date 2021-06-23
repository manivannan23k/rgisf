const {defaultRenderer} = require('./constants')

class RasterOptions {
    constructor() {
        this.bbox = null;
        this.attrs = [];
        this.renderer = defaultRenderer;
    }
}

module.exports = RasterOptions;