const Band = require('./band');
const RasterMetadata = require('./raster-metadata');
const RasterOptions = require('./raster-options');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {defaultRenderer, defaultCrs} = require('./constants')

const {
    getRasterInitBuffer,
    bufferToCanvas,
    getPixelType,
    mergeBandImgBuffers
} = require('./utils')

class RGisFile{

    constructor(data, options){
        this._buffer = Buffer.from(new ArrayBuffer(0))
        this.rasterMeta = new RasterMetadata();
        this.bands = [];
        this.offset = 0;
        this.factor = null;
        this.options = new RasterOptions();

        if(options){
            this.options.renderer = options.renderer || defaultRenderer;
            this.options.bbox = options.bbox;
            this.factor = options.factor;
            this.options.attrs = options.attrs || [];
        }
        if (data){
            this.#init(zlib.unzipSync(data));
        }
    }

    #init(buffer){
        this._buffer = buffer;
        this.#readRasterMeta();
        this.#readBand();
        delete this._buffer;
    }



    /***
     * Core functions
     */

    #readRasterMeta() {
        this.rasterMeta['vt'] = getPixelType(this._buffer.readInt8(0));
        this.rasterMeta['nb'] = this._buffer.readInt8(1);
        this.rasterMeta['crs'] = this._buffer.readInt16BE(2);
        this.rasterMeta['x1'] = this._buffer.readFloatBE(4);
        this.rasterMeta['y1'] = this._buffer.readFloatBE(8);
        this.rasterMeta['x2'] = this._buffer.readFloatBE(12);
        this.rasterMeta['y2'] = this._buffer.readFloatBE(16);
        this.rasterMeta['xres'] = this._buffer.readFloatBE(20);
        this.rasterMeta['yres'] = this._buffer.readFloatBE(24);
        this.rasterMeta['nx'] = this._buffer.readFloatBE(28);
        this.rasterMeta['ny'] = this._buffer.readFloatBE(32);
        this.rasterMeta['factor'] = this._buffer.readFloatBE(36);
        if (this.options.bbox){
            this.rasterMeta = this.#getBboxMeta(
                this.options.bbox[0],
                this.options.bbox[1],
                this.options.bbox[2],
                this.options.bbox[3]
            )
        }
        this.rasterMeta['factor'] = this._buffer.readFloatBE(36);
        if (this.factor){
            this.rasterMeta['factor'] = this.factor
        }
        this.offset = 256;
    }

    #readBand() {
        const tempOffset = this.offset;
        this.bands = [];
        for (let i = 0; i < this.rasterMeta['nb']; i++) {
            let attr = {};
            if (this.options.attrs.length>i)
                attr = this.options.attrs[i];
            let band = new Band(this._buffer, this.offset, this.rasterMeta, this.regionFilter, this.options.renderer, attr);
            this.bands.push(band);
            this.offset = band.offset;
        }
        this.offset = tempOffset;
    }

    /***
     * Store data
     */

    async saveToFile(path){
        const buf = this.toCompressedBuffer();
        await fs.writeFileSync(path, buf)
    }

    //noinspection JSUnusedGlobalSymbols
    async saveToUFile(path){
        const buf = this.toBuffer();
        await fs.writeFileSync(path, buf)
    }

    //noinspection JSUnusedGlobalSymbols
    async saveAsPng(path){
        const d = this.toDataUrl();
        let base64Data = d.replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }


    /***
     * Accessors
     */

    toBuffer(){
        let buffer = getRasterInitBuffer({
            vt: this.rasterMeta['vt'].type,
            nb: this.rasterMeta['nb'],
            crs: this.rasterMeta['crs'],
            x1: this.rasterMeta['x1'],
            y1: this.rasterMeta['y1'],
            x2: this.rasterMeta['x2'],
            y2: this.rasterMeta['y2'],
            xRes: this.rasterMeta['xres'],
            yRes: this.rasterMeta['yres'],
            nx: this.rasterMeta['nx'],
            ny: this.rasterMeta['ny'],
            factor: this.rasterMeta['factor']
        });
        for (let i = 0; i < this.bands.length; i++) {
            buffer = Buffer.concat([buffer, this.bands[i].toBuffer()]);
        }
        return buffer;
    }

    toDataUrl(){
        const arr = [];
        let bufLength = 0;
        for (let i = 0; i < this.bands.length; i++) {
            const bandData = this.bands[i].toUint8ClampedArray();
            bufLength = bandData.length;
            arr.push(bandData);
        }
        const imgBuf = mergeBandImgBuffers(bufLength, arr);
        return bufferToCanvas(imgBuf, this.rasterMeta['nx'], this.rasterMeta['ny']).toDataURL();
    }

    toCompressedBuffer(){
        return zlib.deflateSync(this.toBuffer());
    }

    getTileImage(x, y, z){
        const arr = [];
        let bufLength = 0;
        for (let i = 0; i < this.bands.length; i++) {
            const tileCanvas = this.bands[i].getTileImage(x, y, z);
            const bandData = tileCanvas.getContext("2d").getImageData(0, 0, 256, 256);
            bufLength = bandData.length;
            arr.push(bandData);
        }
        const imgBuf = mergeBandImgBuffers(bufLength, arr);
        const canvas = require('./create-canvas')(256, 256)
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imgBuf, 0, 0);
        return canvas;
    }

    //noinspection JSUnusedGlobalSymbols
    async generateTiles(z1, z2, dirPath){
        const latLngToTile = (lng, lat, zoom) => {
            let x = (Math.floor((lng+180)/360*Math.pow(2,zoom)));
            let y = (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
            return {x,y}
        }
        const x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'],
            x2 = this.rasterMeta['x2'],
            y2 = this.rasterMeta['y2'];
        for (let i = z1; i <= z2; i++) {
            const z = i;
            const {x:tileX1, y:tileY1} = latLngToTile(x1, y1, z);
            const {x:tileX2, y:tileY2} = latLngToTile(x2, y2, z);
            for (let tileX = tileX1; tileX <= tileX2; tileX++) {
                for (let tileY = tileY1; tileY <= tileY2; tileY++) {
                    console.log("Generating tile: ", z, tileX, tileY);
                    const imgName = `${tileY}.png`;
                    const imageDirPath = path.join(dirPath, `/${z}/${tileX}/`)
                    if (!fs.existsSync(imageDirPath)){
                        fs.mkdirSync(imageDirPath, { recursive: true });
                    }
                    await this.#saveTileAsPng(tileX, tileY, z, path.join(imageDirPath, imgName));
                }
            }
        }
    }

    getMetaData(){
        return this.rasterMeta;
    }

    //noinspection JSUnusedGlobalSymbols
    getRegion(fx1, fy1, fx2, fy2){
        const nb = this.bands.length;
        const xRes = this.rasterMeta['xres'],
            yRes = this.rasterMeta['yres'],
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'];
        const dataXIndex1 = Math.floor((fx1-x1)/xRes);
        const dataYIndex1 = Math.floor((fy1-y1)/yRes);
        const dataXIndex2 = Math.floor((fx2-x1)/xRes);
        const dataYIndex2 = Math.floor((fy2-y1)/yRes);

        const fvt = this.rasterMeta['vt'],
            fxRes = this.rasterMeta['xres'],
            fyRes = this.rasterMeta['yres'],
            fnx = Math.abs(dataXIndex1-dataXIndex2),
            fny = Math.abs(dataYIndex1-dataYIndex2);

        let buffer = getRasterInitBuffer({
            vt: fvt.type, nb, crs: defaultCrs, x1: fx1, y1: fy1, x2: fx2, y2: fy2, xRes: fxRes, yRes: fyRes, nx: fnx, ny: fny, factor: this.rasterMeta['factor']
        });

        for (let bandNo = 0; bandNo < this.bands.length; bandNo++) {
            const band = this.bands[bandNo];
            const bandBuffer = band.getRegion(fx1, fy1, fx2, fy2)
            buffer = Buffer.concat([buffer, bandBuffer]);
        }
        return RGisFile.fromUBuffer(buffer);
    }

    //noinspection JSUnusedGlobalSymbols
    getBounds  ()  {
        return [this.rasterMeta['x1'], this.rasterMeta['y1'], this.rasterMeta['x2'], this.rasterMeta['y2']];
    }

    //noinspection JSUnusedGlobalSymbols
    getNoOfBands  ()  {
        return this.rasterMeta['nb'];
    }

    //noinspection JSUnusedGlobalSymbols
    getValueType  ()  {
        return this.rasterMeta['vt']
    }

    //noinspection JSUnusedGlobalSymbols
    getCoordinateSystem  ()  {
        return this.rasterMeta['crs'];
    }

    //noinspection JSUnusedGlobalSymbols
    getXResolution  ()  {
        return this.rasterMeta['xres'];
    }

    //noinspection JSUnusedGlobalSymbols
    getYResolution  ()  {
        return this.rasterMeta['yres'];
    }

    //noinspection JSUnusedGlobalSymbols
    getWidth  ()  {
        return this.rasterMeta['nx'];
    }

    //noinspection JSUnusedGlobalSymbols
    getHeight  ()  {
        return this.rasterMeta['ny'];
    }

    //noinspection JSUnusedGlobalSymbols
    getBands ()  {
        return this.bands
    }

    //noinspection JSUnusedGlobalSymbols
    getBbox () {
        const
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'],
            x2 = this.rasterMeta['x2'],
            y2 = this.rasterMeta['y2'];
        return [x1, y1, x2, y2];
    }

    /***
     * Setters
     */

    setUncompressedData(data){
        this.#init(data);
    }

    //noinspection JSUnusedGlobalSymbols
    setRenderer(renderer){
        this.bands.forEach(band=>band.renderer=renderer);
    }


    /***
     * Private helpers
     */

    async #saveTileAsPng (x, y, z, path){
        const canvas = this.getTileImage(x, y, z);
        const dataUrl = canvas.toDataURL();
        let base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    #getBboxMeta  (fx1, fy1, fx2, fy2)  {
        const nb = this.rasterMeta['nb'];
        const xRes = this.rasterMeta['xres'],
            yRes = this.rasterMeta['yres'],
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'];
        const dataXIndex1 = Math.floor((fx1-x1)/Math.abs(xRes));
        const dataYIndex1 = Math.floor((y1-fy1)/Math.abs(yRes));
        const dataXIndex2 = Math.floor((fx2-x1)/Math.abs(xRes));
        const dataYIndex2 = Math.floor((y1-fy2)/Math.abs(yRes));

        const fvt = this.rasterMeta['vt'],
            fxRes = this.rasterMeta['xres'],
            fyRes = this.rasterMeta['yres'],
            fnx = Math.abs(dataXIndex1-dataXIndex2),
            fny = Math.abs(dataYIndex1-dataYIndex2);

        this.regionFilter = {
            bbox: [dataXIndex1, dataYIndex1, dataXIndex2, dataYIndex2],
            nx: this.rasterMeta['nx'],
            ny: this.rasterMeta['ny'],
        };
        return new RasterMetadata(
            {
                vt: fvt,
                nb,
                crs: defaultCrs,
                x1: fx1,
                y1: fy1,
                x2: fx2,
                y2: fy2,
                xRes: fxRes,
                yRes: fyRes,
                nx: fnx,
                ny: fny
            }
        );
    }


}

module.exports=RGisFile