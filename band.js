const fs = require('fs');
const path = require('path')
const { createCanvas } = require('canvas')
const PixelType = require('./types')
const Renderer = require('./renderer')
const {
    getRasterInitBuffer,
    getRendererBuffer,
    bufferToArrayBuffer,
    getPixelTypeFromObj,
    writeBandValueToBuffer,
    writeClassesToBuffer,
    writeColorRampToBuffer
} = require('./utils')

class Band{

    constructor(buffer, offset, rasterMeta, regionFilter){

        this.offset = 0
        this.dataOffset = 0
        this.buffer = Buffer.from(new ArrayBuffer(0))
        this.rasterMeta = null
        this.canvas = createCanvas(1, 1)
        this.regionFilter = null
        this.data = []


        this.offset = offset;
        this.buffer = buffer;
        this.regionFilter = regionFilter;
        this.rasterMeta = rasterMeta;
        this.readBandMetaData();
        this.readBandRenderer();
        this.readBandData();
        delete this.buffer;
    }

    readBandMetaData ()  {
        const typ = this.rasterMeta['vt'];
        this.metaData = {min: this.readValueOfType(typ.type, this.offset).value, max: this.readValueOfType(typ.type, this.offset+typ.size).value};
        this.offset += 256;
    }

    readBandRenderer  ()  {
        let offset = this.offset;
        const type = this.buffer.readInt8(offset);
        let renderer = null;
        offset += 1;
        switch(type){
            case Renderer.STRETCHED:
                let colorRampSize = this.buffer.readInt8(offset);
                const colorRamp = [];
                offset += 1;
                for (let i = 0; i < colorRampSize; i++) {
                    colorRamp.push([this.buffer.readUInt8(offset),this.buffer.readUInt8(offset+1),this.buffer.readUInt8(offset+2),this.buffer.readUInt8(offset+3)]);
                    offset += 4;
                }
                renderer = {
                    type: type,
                    definition: {
                        colorRamp: colorRamp
                    }
                }
                break;
            case Renderer.CLASSIFIED:
                let classSize = this.buffer.readInt8(offset);
                const classes = [];
                let t = null;
                offset += 1;
                for (let i = 0; i < classSize; i++) {
                    t = this.readValueOfType(this.rasterMeta['vt'].type, offset);
                    const min = t.value;
                    offset = t.offset;
                    t = this.readValueOfType(this.rasterMeta['vt'].type, offset);
                    const max = t.value;
                    offset = t.offset;
                    classes.push({
                        min, max,
                        color: [this.buffer.readUInt8(offset),this.buffer.readUInt8(offset+1),this.buffer.readUInt8(offset+2),this.buffer.readUInt8(offset+3)]
                    });
                    offset += 4;
                }
                renderer = {
                    type: type,
                    definition: {
                        classes: classes
                    }
                }
                break;
        }
        this.offset = offset;
        this.renderer = renderer;
        this.dataOffset = this.offset
    }

    readBandData  ()  {
        const typ = this.rasterMeta['vt'].type;
        const size = this.rasterMeta['vt'].size;
        // console.log(this.offset, size, this.buffer.readFloatBE(this.offset+(4*4500)))
        if (!this.regionFilter){
            for (let y = 0; y < this.rasterMeta['ny']; y++) {
                this.data[y] = [];
                for (let x = 0; x < this.rasterMeta['nx']; x++) {
                    const _ = this.readValueOfType(typ, this.offset);
                    this.offset = _.offset;
                    this.data[y][x] = _.value
                }
            }
        }else {
            const x1 = this.rasterMeta['x1'],
                y1 = this.rasterMeta['y1'];
            const [dataXIndex1, dataYIndex1, dataXIndex2, dataYIndex2] = this.regionFilter.bbox;
            const nx = this.regionFilter.nx;
            const fnx = Math.abs(dataXIndex1-dataXIndex2),
                fny = Math.abs(dataYIndex1-dataYIndex2);

            let min = null, max = null;
            for (let y = dataYIndex1; y < dataYIndex2; y++) {
                this.data[(y-dataYIndex1)] = [];
                for (let x = dataXIndex1; x < dataXIndex2; x++) {

                    const offset = this.offset + (size * ((y)*nx + (x)));
                    const _ = this.readValueOfType(typ, offset);
                    this.data[(y-dataYIndex1)][(x-dataXIndex1)] = _.value
                    if (min===null || min > _.value)
                        min = _.value;
                    if (max===null || max < _.value)
                        max = _.value;
                }
            }

            this.metaData = {min: min, max: max};
        }
    }

    readValueOfType  (typ, offset)  {
        let value;
        switch(typ){
            case PixelType.FLOAT32.type:
                value = this.buffer.readFloatBE(offset);
                offset += PixelType.FLOAT32.size;
                break;
            case PixelType.FLOAT64.type:
                value = this.buffer.readDoubleBE(offset);
                offset += PixelType.FLOAT64.size;
                break;
            case PixelType.INT8.type:
                value = this.buffer.readInt8(offset);
                offset += PixelType.INT8.size;
                break;
            case PixelType.INT16.type:
                value = this.buffer.readInt16BE(offset);
                offset += PixelType.INT16.size;
                break;
            case PixelType.INT32.type:
                value = this.buffer.readInt32BE(offset);
                offset += PixelType.INT32.size;
                break;
            case PixelType.UINT8.type:
                value = this.buffer.readUInt8(offset);
                offset += PixelType.UINT8.size;
                break;
            case PixelType.UINT16.type:
                value = this.buffer.readUInt16BE(offset);
                offset += PixelType.UINT16.size;
                break;
            case PixelType.UINT32.type:
                value = this.buffer.readInt32BE(offset);
                offset += PixelType.UINT32.size;
                break;
        }
        return {value, offset}
    }

    toUint8ClampedArray  ()  {
        const imgBuf = new Uint8ClampedArray(this.rasterMeta['nx'] * this.rasterMeta['ny'] * 4);
        for (let y = 0; y < this.rasterMeta['ny']; y++) {
            const row = this.data[y];
            for (let x = 0; x < this.rasterMeta['nx']; x++) {
                const rgbaVal = this.getRgbaForValue(row[x])
                const imgBufPos = (y * this.rasterMeta['nx'] + x) * 4;
                this.setImgBufPixel(imgBuf, rgbaVal, imgBufPos)
            }
        }
        return imgBuf
    }

    toDataUrl  () {
        const imgBuf = this.toUint8ClampedArray()
        return this.bufferToCanvasDataUrl(imgBuf);
    }

    getRatioColor  (startColor, endColor, ratio)  {
        const w = ratio * 2 - 1;
        const w1 = (w + 1) / 2;
        const w2 = 1 - w1;
        return [Math.round(startColor[0] * w1 + endColor[0] * w2),
            Math.round(startColor[1] * w1 + endColor[1] * w2),
            Math.round(startColor[2] * w1 + endColor[2] * w2),
            Math.round((startColor[3] * w1 + endColor[3] * w2))/255];
    }

    setImgBufPixel  (imgBuf, rgbaVal, imgBufPos)  {
        imgBuf[imgBufPos] = rgbaVal[0];
        imgBuf[imgBufPos+1] = rgbaVal[1];
        imgBuf[imgBufPos+2] = rgbaVal[2];
        imgBuf[imgBufPos+3] = Math.floor(rgbaVal[3]*255);
    }

    bufferToCanvasDataUrl  (imgBuf)  {
        this.canvas = createCanvas(this.rasterMeta['nx'], this.rasterMeta['ny'])
        const ctx = this.canvas.getContext('2d');
        const imageData = ctx.createImageData(this.rasterMeta['nx'], this.rasterMeta['ny']);
        imageData.data.set(imgBuf);
        ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL();
    }

    save  (path)  {
        this.toDataUrl()
        fs.writeFileSync(path, this.canvas.toBuffer('image/png'))
    }

    getTileImage  (x, y, z)  {
        const tileToLatLngBbox = (x, y, z) => {
            const lng1 = (x/Math.pow(2,z)*360-180);
            const lng2 = ((x+1)/Math.pow(2,z)*360-180);
            const n1 = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
            const n2 = Math.PI - 2 * Math.PI * (y+1) / Math.pow(2, z);
            const lat1 = (180/Math.PI*Math.atan(0.5*(Math.exp(n1)-Math.exp(-n1))));
            const lat2 = (180/Math.PI*Math.atan(0.5*(Math.exp(n2)-Math.exp(-n2))));
            return {lng1, lng2, lat1, lat2}
        }

        const isPtWithInBbox = (bbox, pt) => {
            return pt[0] >= bbox[0] && pt[0] <= bbox[2] && pt[1] <= bbox[1] && pt[1] >= bbox[3];

        }

        const xRes = this.rasterMeta['xres'],
            yRes = this.rasterMeta['yres'],
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'],
            x2 = this.rasterMeta['x2'],
            y2 = this.rasterMeta['y2'],
            width = this.rasterMeta['nx'],
            height = this.rasterMeta['ny'];

        const canvas = createCanvas(256, 256);
        const ctx = canvas.getContext('2d');

        const tileBbox = tileToLatLngBbox(x, y, z);
        const tileLatWidth = Math.abs(tileBbox.lat1-tileBbox.lat2)
        const tileLatHeight = Math.abs(tileBbox.lng1-tileBbox.lng2)
        for (let yTiltIndex = 0; yTiltIndex < 256; yTiltIndex++) {
            for (let xTileIndex = 0; xTileIndex < 256; xTileIndex++) {
                const lat = tileBbox.lat1 - (tileLatHeight/256*yTiltIndex);
                const lng = tileBbox.lng1 + (tileLatWidth/256*xTileIndex);
                // console.log([x1, y1, x2, y2], [lng, lat]);
                if(!isPtWithInBbox([x1, y1, x2, y2], [lng, lat])){
                    continue
                }
                // console.log([x1, y1, x2, y2], [lng, lat]);
                const dataXIndex = Math.floor((lng-x1)/xRes);
                const dataYIndex = Math.floor((lat-y1)/yRes);
                let value = this.data[dataYIndex][dataXIndex];
                const rgbaVal = this.getRgbaForValue(value);
                ctx.fillStyle = "rgba("+rgbaVal[0]+","+rgbaVal[1]+","+rgbaVal[2]+","+rgbaVal[3]+")";
                ctx.fillRect( xTileIndex, yTiltIndex, 1, 1 );
            }
        }
        return canvas;
    }

    async saveTileAsPng  (x, y, z, path)  {
        const canvas = this.getTileImage(x, y, z);
        let base64Data = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    async generateTiles  (z1, z2, dirPath)  {
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

    getRgbaForValue (value)  {
        let rgbaVal = [0,0,0,0];
        switch (this.renderer.type) {
            case 1:
                const colorRampSize = this.renderer.definition.colorRamp.length;
                const rampRatio = (1/(colorRampSize-1));
                const overAllRatio = (value - this.metaData.min)/(this.metaData.max-this.metaData.min);
                const index = Math.floor(overAllRatio/rampRatio);
                const startColor = this.renderer.definition.colorRamp[index];
                const endColor = (index+1)>=this.renderer.definition.colorRamp.length?this.renderer.definition.colorRamp[index]:this.renderer.definition.colorRamp[index+1];
                const localRatio = (overAllRatio-(rampRatio*index));
                rgbaVal = this.getRatioColor(startColor, endColor, localRatio);
                break;
            case 2:
                for (let ci = 0; ci < this.renderer.definition.classes.length; ci++) {
                    const colorClass = this.renderer.definition.classes[ci];
                    if(value>=colorClass.min && value<colorClass.max){
                        rgbaVal = colorClass.color;
                        break;
                    }
                }
                break;
            default:
                break;
        }
        return rgbaVal;
    }

    async saveAsDataUrl (path)  {
        await fs.writeFileSync(path, this.toDataUrl());
    }

    async saveAsPng  (path)  {
        let base64Data = this.toDataUrl().replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    toBuffer ()  {
        let buffer = Buffer.from('');
        let min = null, max = null, nx = this.rasterMeta['nx'], ny = this.rasterMeta['ny'], vt = this.rasterMeta['vt'];
        const imgBuffer = Buffer.alloc(nx * ny * vt.size);
        for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {
                const v = this.data[y][x];
                if (min===null || min > v)
                    min = v;
                if (max===null || max < v)
                    max = v;
                writeBandValueToBuffer(vt.type, v, imgBuffer, ((y*nx)+x) * vt.size);
            }
        }
        let bandMetaBuffer = Buffer.alloc(256);
        writeBandValueToBuffer(vt.type, min, bandMetaBuffer, 0);
        writeBandValueToBuffer(vt.type, max, bandMetaBuffer, vt.size);
        buffer = Buffer.concat([buffer, bandMetaBuffer]);
        buffer = Buffer.concat([buffer, getRendererBuffer(this.renderer, vt.size)]);
        buffer = Buffer.concat([buffer, imgBuffer]);
        return buffer;
    }


    getRegion  (fx1, fy1, fx2, fy2)  {
        const xRes = this.rasterMeta['xres'],
            yRes = this.rasterMeta['yres'],
            x1 = this.rasterMeta['x1'],
            y1 = this.rasterMeta['y1'],
            x2 = this.rasterMeta['x2'],
            y2 = this.rasterMeta['y2'];
        const dataXIndex1 = Math.floor((fx1-x1)/xRes);
        const dataYIndex1 = Math.floor((fy1-y1)/yRes);
        const dataXIndex2 = Math.floor((fx2-x1)/xRes);
        const dataYIndex2 = Math.floor((fy2-y1)/yRes);
        const fvt = this.rasterMeta['vt'],
            fnx = Math.abs(dataXIndex1-dataXIndex2),
            fny = Math.abs(dataYIndex1-dataYIndex2);

        let buffer = Buffer.from('');
        let min = null, max = null;
        const imgBuffer = Buffer.alloc(fnx*fny*fvt.size);
        for (let y = dataYIndex1; y < dataYIndex2; y++) {
            for (let x = dataXIndex1; x < dataXIndex2; x++) {
                const v = this.data[y][x];
                if (min===null || min > v)
                    min = v;
                if (max===null || max < v)
                    max = v;
                writeBandValueToBuffer(fvt.type, v, imgBuffer, (((y-dataYIndex1)*fnx)+(x-dataXIndex1)) * fvt.size);
            }
        }
        let bandMetaBuffer = Buffer.alloc(256);
        writeBandValueToBuffer(fvt.type, min, bandMetaBuffer, 0);
        writeBandValueToBuffer(fvt.type, max, bandMetaBuffer, fvt.size);
        buffer = Buffer.concat([buffer, bandMetaBuffer]);
        buffer = Buffer.concat([buffer, getRendererBuffer(this.renderer, fvt.size)]);
        buffer = Buffer.concat([buffer, imgBuffer]);
        return buffer;
    }

}

module.exports = Band