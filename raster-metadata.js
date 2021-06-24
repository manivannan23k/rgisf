class RasterMetadata {
    constructor(obj) {
        this.vt = null;
        this.nb = null;
        this.crs = null;
        this.x1 = null;
        this.y1 = null;
        this.x2 = null;
        this.y2 = null;
        this.xres = null;
        this.yres = null;
        this.nx = null;
        this.ny = null;
        this.factor = null;
        if(obj){
            this.vt = obj.vt;
            this.nb = obj.nb;
            this.crs = obj.crs;
            this.x1 = obj.x1;
            this.y1 = obj.y1;
            this.x2 = obj.x2;
            this.y2 = obj.y2;
            this.xres = obj.xres;
            this.yres = obj.yres;
            this.nx = obj.nx;
            this.ny = obj.ny;
            this.factor = obj.factor;
        }
    }

}

module.exports = RasterMetadata;