const Band = require('./band');
const fs = require('fs');
const zlib = require('zlib');
const GeoTIFF = require('geotiff');
const PixelType = require('./types')
const Renderer = require('./renderer')
const { createCanvas } = require('canvas')

class RGisFile{
    _buffer = Buffer.from(new ArrayBuffer(0))
    rasterMeta = {};
    bands = [];
    _offset = 0;
    options = {
        renderer: null
    }

    constructor(data){
        if (data){
            this._buffer = zlib.unzipSync(data);
            this.readRasterMeta();
        }
    }

    saveToFile = async (path) => {
        const buf = zlib.deflateSync(this._buffer);
        await fs.writeFileSync(path, buf)
    }

    saveAsPng = async (path) => {
        const arr = [];
        let bufLength = 0;
        for (let i = 0; i < this.bands.length; i++) {
            const bandData = this.bands[i].toUint8ClampedArray();
            bufLength = bandData.length;
            arr.push(bandData);
        }
        const imgBuf = new Uint8ClampedArray(bufLength);
        for (let i = 0; i < bufLength; i++) {
            let t = 0;
            for (let j = 0; j < arr.length; j++) {
                t += arr[j][i];
            }
            imgBuf[i] = t/arr.length;
        }
        const d = this.bufferToCanvasDataUrl(imgBuf);
        let base64Data = d.replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    bufferToCanvasDataUrl = (imgBuf) => {
        const canvas = createCanvas(this.rasterMeta['nx'], this.rasterMeta['ny'])
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(this.rasterMeta['nx'], this.rasterMeta['ny']);
        imageData.data.set(imgBuf);
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    setRenderer = (renderer) => {
        this.bands.forEach(band=>band.renderer=renderer);
    }

    /***
     * Read init data
     */
    static fromUncompressedBuffer = (data) => {
        const rgf = new RGisFile(null)
        rgf._buffer = data
        rgf.readRasterMeta();
        return rgf;
    }
    static fromGeoTiff = async (url, options) => {
        let renderer = options.renderer || this.defaultRenderer;

        if (typeof url !== 'string'){
            return;
        }
        const data = this.readFile(url);
        const tiff = await GeoTIFF.fromArrayBuffer(this.bufferToArrayBuffer(data));
        const image = await tiff.getImage();
        let bands = await image.readRasters();

        const nb = bands.length;

        if (nb===0){
            return
        }
        const bbox = image.getBoundingBox(), bytesPerPixel = bands[0].BYTES_PER_ELEMENT;
        const vt = this.getPixelTypeFromObj(bands[0]),
            x1 = bbox[0],
            y1 = bbox[3],
            x2 = bbox[2],
            y2 = bbox[1],
            xRes = image.getResolution()[0],
            yRes = image.getResolution()[1],
            nx = image.getWidth(),
            ny = image.getHeight();

        let buffer = this.getRasterInitBuffer({
            vt: vt.type, nb, crs: 4326, x1, y1, x2, y2, xRes, yRes, nx, ny
        })

        for (let bandNo = 0; bandNo < bands.length; bandNo++) {
            const band = bands[bandNo];

            let min = null, max = null;

            const imgBuffer = Buffer.alloc(nx*ny*vt.size);
            for (let y = 0; y < ny; y++) {
                for (let x = 0; x < nx; x++) {
                    const v = band[(y*bands.width)+x];
                    if (min===null || min > v)
                        min = v;
                    if (max===null || max < v)
                        max = v;
                    this.writeBandValueToBuffer(vt.type, v, imgBuffer, ((y*bands.width)+x) * bytesPerPixel);
                }
            }

            let bandMetaBuffer = Buffer.alloc(256);
            this.writeBandValueToBuffer(vt.type, min, bandMetaBuffer, 0);
            this.writeBandValueToBuffer(vt.type, max, bandMetaBuffer, vt.size);
            buffer = Buffer.concat([buffer, bandMetaBuffer]);
            buffer = Buffer.concat([buffer, this.getRendererBuffer(renderer, bytesPerPixel)]);
            buffer = Buffer.concat([buffer, imgBuffer]);
        }
        /**
         *
         */
        // const buf = zlib.deflateSync(buffer);
        return RGisFile.fromUncompressedBuffer(buffer);
    }
    static fromFile = async (url) => {
        const data = this.readFile(url);
        return new RGisFile(data);
    }
    static readFile = (path) => {
        return fs.readFileSync(path)
    }
    static bufferToArrayBuffer(buf) {
        const ab = new ArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }
    static getPixelTypeFromObj = (obj) => {
        switch (obj.constructor) {
            case Uint8Array:
                return PixelType.UINT8;
            case Uint16Array:
                return PixelType.UINT16;
            case Uint32Array:
                return PixelType.UINT32;
            case Int8Array:
                return PixelType.INT8;
            case Int16Array:
                return PixelType.INT16;
            case Int32Array:
                return PixelType.INT32;
            case Float32Array:
                return PixelType.FLOAT64.type;
            case Float64Array:
                return PixelType.FLOAT64.type;
        }
    }
    static writeBandValueToBuffer = (vt, value, buffer, offset) => {
        switch (vt) {
            case PixelType.INT8.type:
                buffer.writeInt8(value, offset);
                break;
            case PixelType.INT16.type:
                buffer.writeInt16BE(value, offset);
                break;
            case PixelType.INT32.type:
                buffer.writeInt32BE(value, offset);
                break;
            case PixelType.UINT8.type:
                buffer.writeUInt8(value, offset);
                break;
            case PixelType.UINT16.type:
                buffer.writeUInt16BE(value, offset);
                break;
            case PixelType.UINT32.type:
                buffer.writeUInt32BE(value, offset);
                break;
            case PixelType.FLOAT32.type:
                buffer.writeFloatBE(value, offset);
                break;
            case PixelType.FLOAT64.type:
                buffer.writeDoubleBE(value, offset);
                break;
        }
        return buffer;
    }
    static getRasterInitBuffer = ({vt, nb, crs, x1, y1, x2, y2, xRes, yRes, nx, ny}) => {
        let buffer = Buffer.alloc(256);
        buffer.writeUInt8(vt, 0);
        buffer.writeUInt8(nb, 1);
        buffer.writeUInt16BE(crs, 2);
        buffer.writeFloatBE(x1, 4);
        buffer.writeFloatBE(y1, 8);
        buffer.writeFloatBE(x2, 12);
        buffer.writeFloatBE(y2, 16);
        buffer.writeFloatBE(xRes, 20);
        buffer.writeFloatBE(yRes, 24);
        buffer.writeFloatBE(nx, 28);
        buffer.writeFloatBE(ny, 32);
        return buffer
    }
    static writeColorRampToBuffer = (buffer, colorRamp, startsAt) => {
        for (let i = 0; i < colorRamp.length; i++) {
            const color = colorRamp[i];
            for (let j = 0; j < color.length; j++) {
                const colorComp = color[j];
                buffer.writeUInt8(colorComp, startsAt + (i*4) + j);
            }
        }
        return buffer;
    }
    static writeClassesToBuffer = (buffer, classes, startsAt, bytePerPixel) => {
        for (let i = 0; i < classes.length; i++) {
            const colorClass = classes[i];
            buffer.writeFloatBE(colorClass.min, startsAt+(i*12))
            buffer.writeFloatBE(colorClass.max, startsAt+(i*12) + bytePerPixel)
            buffer.writeUInt8(colorClass.color[0], startsAt+(i*12) + (2*bytePerPixel));
            buffer.writeUInt8(colorClass.color[1], startsAt+(i*12) + (2*bytePerPixel)+1);
            buffer.writeUInt8(colorClass.color[2], startsAt+(i*12) + (2*bytePerPixel)+2);
            buffer.writeUInt8(colorClass.color[3], startsAt+(i*12) + (2*bytePerPixel)+3);
        }
        return buffer;
    }
    static getRendererBuffer = (renderer, bytePerPixel) => {
        let rb = null;
        let rendererSize = 0;
        switch (renderer.type) {
            case Renderer.STRETCHED:
                rendererSize = 2 + 4*renderer.definition.colorRamp.length;
                rb = Buffer.alloc(rendererSize);
                rb.writeUInt8(renderer.type, 0);
                rb.writeUInt8(renderer.definition.colorRamp.length, 1);
                rb = this.writeColorRampToBuffer(rb, renderer.definition.colorRamp, 2);
                break;
            case Renderer.CLASSIFIED:
                rendererSize = 2 + (4 * 2 + 4) * renderer.definition.classes.length;
                rb = Buffer.alloc(rendererSize);
                rb.writeUInt8(2, 0);
                rb.writeUInt8(renderer.definition.classes.length, 1);
                rb = this.writeClassesToBuffer(rb, renderer.definition.classes, 2, bytePerPixel);
                break;
        }
        return rb;
    }
    static defaultRenderer = {
        type: Renderer.STRETCHED,
        definition: {
            colorRamp: [
                [0, 0, 0, 255],
                [255, 255, 255, 255]
            ]
        }
    }

    /***
     * Core functions
     */

    readRasterMeta = () => {
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
        this._offset = 256;
    }

    readBand = () => {
        for (let i = 0; i < this.rasterMeta['nb']; i++) {
            let band = new Band(this._buffer, this._offset, this.rasterMeta);
            this.bands.push(band);
            this._offset = band.offset;
        }
    }


    /****
     * Accessors
     */

    getPixelType = (v) => {
        return Object.keys(PixelType).map(key=>{
            const t = PixelType[key];
            if (t['type']===v){
                return t;
            }else{
                return null;
            }
        }).filter(e=>e!==null)[0]||null;
    }

    getBounds = () => {
        return [this.rasterMeta['x1'], this.rasterMeta['y1'], this.rasterMeta['x2'], this.rasterMeta['y2']];
    }

    getNoOfBands = () => {
        return this.rasterMeta['nb'];
    }

    getValueType = () => {
        return this.rasterMeta['vt']
    }

    getCoordinateSystem = () => {
        return this.rasterMeta['crs'];
    }

    getXResolution = () => {
        return this.rasterMeta['xres'];
    }

    getYResolution = () => {
        return this.rasterMeta['yres'];
    }

    getWidth = () => {
        return this.rasterMeta['nx'];
    }

    getHeight = () => {
        return this.rasterMeta['ny'];
    }

    getBands = () => {
        return this.bands
    }

}

module.exports=RGisFile