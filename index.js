const Band = require('./band');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const fetch = require('node-fetch');
const GeoTIFF = require('geotiff');
const PixelType = require('./types')
const Renderer = require('./renderer')

const {
    getRasterInitBuffer,
    getRendererBuffer,
    bufferToArrayBuffer,
    getPixelTypeFromObj,
    writeBandValueToBuffer,
    writeClassesToBuffer,
    writeColorRampToBuffer,
    getTypeObjFromType,
    getAttrBuffer
} = require('./utils')

const defaultRenderer = {
    type: Renderer.STRETCHED,
    definition: {
        colorRamp: [
            [0, 0, 0, 255],
            [255, 255, 255, 255]
        ]
    }
};
const readFile = (path) => {
    return fs.readFileSync(path)
}
class RGisFile{

    constructor(data, options){
        this._buffer = Buffer.from(new ArrayBuffer(0))
        this.rasterMeta = {};
        this.bands = [];
        this._offset = 0;
        this.factor = null;
        this.options = {
            renderer: defaultRenderer,
            bbox: null,
            attrs: []
        }

        if(options){
            this.options.renderer = options.renderer || defaultRenderer;
            this.options.bbox = options.bbox;
            this.factor = options.factor;
            this.options.attrs = options.attrs || [];
        }
        if (data){
            this.init(zlib.unzipSync(data));
        }
    }

    init(buffer){
        this._buffer = buffer;
        this.readRasterMeta();
        this.readBand();
        delete this._buffer;
    }

    async saveToFile(path){
        const buf = this.toCompressedBuffer();
        await fs.writeFileSync(path, buf)
    }

    async saveToFileUnCompressed(path){
        const buf = this.toBuffer();
        await fs.writeFileSync(path, buf)
    }

    async saveAsPng(path){
        const d = this.toDataUrl();
        let base64Data = d.replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    bufferToCanvas(imgBuf){

        const canvas = require('./create-canvas')(this.rasterMeta['nx'], this.rasterMeta['ny'])
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(this.rasterMeta['nx'], this.rasterMeta['ny']);
        imageData.data.set(imgBuf);
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    bufferToCanvasDataUrl(imgBuf){
        const canvas = this.bufferToCanvas(imgBuf);
        return canvas.toDataURL();
    }

    setRenderer(renderer){
        this.bands.forEach(band=>band.renderer=renderer);
    }

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

    setUncompressedData(data){
        this.init(data);
    }

    toDataUrl(){
        const arr = [];
        let bufLength = 0;
        for (let i = 0; i < this.bands.length; i++) {
            const bandData = this.bands[i].toUint8ClampedArray();
            bufLength = bandData.length;
            arr.push(bandData);
        }
        const imgBuf = this.mergeBandImgBuffers(bufLength, arr);
        return this.bufferToCanvasDataUrl(imgBuf);
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
        const imgBuf = this.mergeBandImgBuffers(bufLength, arr);
        const canvas = require('./create-canvas')(256, 256)
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imgBuf, 0, 0);
        return canvas;
    }

    async saveTileAsPng (x, y, z, path){
        const canvas = this.getTileImage(x, y, z);
        const dataUrl = canvas.toDataURL();
        let base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

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
                    await this.saveTileAsPng(tileX, tileY, z, path.join(imageDirPath, imgName));
                }
            }
        }
    }

    mergeBandImgBuffers(bufLength, arr){
        const imgBuf = new Uint8ClampedArray(bufLength);
        for (let i = 0; i < bufLength; i++) {
            let t = 0;
            for (let j = 0; j < arr.length; j++) {
                t += arr[j][i];
            }
            imgBuf[i] = t/arr.length;
        }
        return arr[0]
    }

    toCompressedBuffer(){
        return zlib.deflateSync(this.toBuffer());
    }

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
            vt: fvt.type, nb, crs: 4326, x1: fx1, y1: fy1, x2: fx2, y2: fy2, xRes: fxRes, yRes: fyRes, nx: fnx, ny: fny, factor: this.rasterMeta['factor']
        });

        for (let bandNo = 0; bandNo < this.bands.length; bandNo++) {
            const band = this.bands[bandNo];
            const bandBuffer = band.getRegion(fx1, fy1, fx2, fy2)
            buffer = Buffer.concat([buffer, bandBuffer]);
        }
        return RGisFile.fromUncompressedBuffer(buffer);
    }



    /***
     * Read init data
     */

    static fromUncompressedBuffer(buffer, options){
        const rgf = new RGisFile(null, options);
        rgf.setUncompressedData(buffer);
        return rgf;
    }
    static async  fromGeoTiffFileasync (path, options){
        const data = readFile(path);
        return await this.geoTiffBufferToRgf(data, options);
    }

    static async fromGeoTiffBuffer(buffer, options){
        return await this.geoTiffBufferToRgf(buffer, options);
    }

    static async fromGeoTiffUrl(url, options){
        const response = await fetch(url);
        const buffer = await response.buffer();
        return await this.geoTiffBufferToRgf(buffer, options);
    }

    static async fromFile(url, options) {
        const data = readFile(url);
        return new RGisFile(data, options);
    }

    static fromUncompressedFile(url, options) {
        const data = readFile(url);
        return RGisFile.fromUncompressedBuffer(data, options);
    }

    static async fromUrl(url) {
        const response = await fetch(url);
        const data = await response.buffer();
        return new RGisFile(data);
    }

    static async geoTiffBufferToRgf (data, options) {
        const rgf = new RGisFile(null);
        let filterBox = null;
        let attrs = [];
        if(options){
            rgf.options.renderer = options.renderer || defaultRenderer;
            rgf.options.readAs = options.readAs;
            filterBox = options.bbox;
            attrs = options.attrs || attrs;
        }
        const tiff = await GeoTIFF.fromArrayBuffer(bufferToArrayBuffer(data));
        const image = await tiff.getImage();
        const rasterOptions = {};
        const bbox = image.getBoundingBox();
        const x1 = bbox[0],
            y1 = bbox[3],
            x2 = bbox[2],
            y2 = bbox[1],
            xRes = image.getResolution()[0],
            yRes = image.getResolution()[1],
            nx = image.getWidth(),
            ny = image.getHeight();
        if (filterBox){
            rasterOptions['window'] = [
                Math.round((filterBox[0]-x1)/xRes),
                Math.round((filterBox[1]-y1)/yRes),
                Math.round((filterBox[2]-x1)/xRes),
                Math.round((filterBox[3]-y1)/yRes),
            ];
        }

        let bands = await image.readRasters(rasterOptions);

        const nb = bands.length;

        if (nb===0){
            return
        }
        let bytesPerPixel = bands[0].BYTES_PER_ELEMENT;
        let vt = getPixelTypeFromObj(bands[0]);
        let factor = 1;
        if (rgf.options.readAs){
            vt = getTypeObjFromType(rgf.options.readAs.type);
            bytesPerPixel = vt.size;
            factor = rgf.options.readAs.factor
        }

        let buffer = getRasterInitBuffer({
            vt: vt.type, nb, crs: 4326, x1, y1, x2, y2, xRes, yRes, nx, ny, factor: factor
        })

        for (let bandNo = 0; bandNo < bands.length; bandNo++) {
            let attr = {};
            if (attrs.length>bandNo)
                attr = attrs[bandNo];
            const band = bands[bandNo];

            let min = null, max = null;

            const imgBuffer = Buffer.alloc(nx*ny*vt.size);
            for (let y = 0; y < ny; y++) {
                for (let x = 0; x < nx; x++) {
                    const v = band[(y*bands.width)+x] * factor;
                    if (min===null || min > v)
                        min = v;
                    if (max===null || max < v)
                        max = v;
                    writeBandValueToBuffer(vt.type, v, imgBuffer, ((y*bands.width)+x) * bytesPerPixel);
                }
            }

            let bandMetaBuffer = Buffer.alloc(256);
            writeBandValueToBuffer(vt.type, min, bandMetaBuffer, 0);
            writeBandValueToBuffer(vt.type, max, bandMetaBuffer, vt.size);
            buffer = Buffer.concat([buffer, bandMetaBuffer]);
            buffer = Buffer.concat([buffer, getAttrBuffer(attr)]);
            buffer = Buffer.concat([buffer, getRendererBuffer(rgf.options.renderer, bytesPerPixel)]);
            buffer = Buffer.concat([buffer, imgBuffer]);
        }
        rgf.setUncompressedData(buffer);
        return rgf;
    }

    /***
     * Core functions
     */

    readRasterMeta() {
        this.rasterMeta['vt'] = this.getPixelType(this._buffer.readInt8(0));
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
            this.rasterMeta = this.getBboxMeta(
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
        this._offset = 256;
    }

    readBand() {
        const tempOffset = this._offset;
        this.bands = [];
        for (let i = 0; i < this.rasterMeta['nb']; i++) {
            let attr = {};
            if (this.options.attrs.length>i)
                attr = this.options.attrs[i];
            let band = new Band(this._buffer, this._offset, this.rasterMeta, this.regionFilter, this.options.renderer, attr);
            this.bands.push(band);
            this._offset = band.offset;
        }
        this._offset = tempOffset;
    }


    /****
     * Accessors
     */

    getPixelType (v)  {
        return Object.keys(PixelType).map(key=>{
            const t = PixelType[key];
            if (t['type']===v){
                return t;
            }else{
                return null;
            }
        }).filter(e=>e!==null)[0]||null;
    }

    getBounds  ()  {
        return [this.rasterMeta['x1'], this.rasterMeta['y1'], this.rasterMeta['x2'], this.rasterMeta['y2']];
    }

    getNoOfBands  ()  {
        return this.rasterMeta['nb'];
    }

    getValueType  ()  {
        return this.rasterMeta['vt']
    }

    getCoordinateSystem  ()  {
        return this.rasterMeta['crs'];
    }

    getXResolution  ()  {
        return this.rasterMeta['xres'];
    }

    getYResolution  ()  {
        return this.rasterMeta['yres'];
    }

    getWidth  ()  {
        return this.rasterMeta['nx'];
    }

    getHeight  ()  {
        return this.rasterMeta['ny'];
    }

    getBands ()  {
        return this.bands
    }

    getBboxMeta  (fx1, fy1, fx2, fy2)  {
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
        // this.dataBbox = [dataXIndex1, dataYIndex1, dataXIndex2, dataYIndex2];

        // console.log(x1, y1, fx1, fy1, fx2, fy2);
        // console.log(this.dataBbox)
        return {
            vt: fvt,
            nb,
            crs: 4326,
            x1: fx1,
            y1: fy1,
            x2: fx2,
            y2: fy2,
            xRes: fxRes,
            yRes: fyRes,
            nx: fnx,
            ny: fny
        };
    }
    getBbox () {
        const
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'],
            x2 = this.rasterMeta['x2'],
            y2 = this.rasterMeta['y2'];
        return [x1, y1, x2, y2];
    }


}

module.exports=RGisFile