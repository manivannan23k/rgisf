const fs = require('fs');
const { createCanvas } = require('canvas')
const PixelType = require('./types')
const Renderer = require('./renderer')

class Band{
    offset = 0
    dataOffset = 0
    buffer = Buffer.from(new ArrayBuffer(0))
    rasterMeta = null
    canvas = createCanvas(1, 1)

    constructor(buffer, offset, rasterMeta){
        this.offset = offset;
        this.buffer = buffer;
        this.rasterMeta = rasterMeta;
        this.readBandMetaData();
        this.readBandRenderer();
        this.readBandData();
    }

    readBandMetaData = () => {
        const typ = this.rasterMeta['vt'];
        this.metaData = {min: this.readValueOfType(typ.type, this.offset).value, max: this.readValueOfType(typ.type, this.offset+typ.size).value};
        this.offset += 256;
    }

    readBandRenderer = () => {
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

    readBandData = () => {
        this.data = [];
        const typ = this.rasterMeta['vt'].type;
        for (let y = 0; y < this.rasterMeta['ny']; y++) {
            this.data[y] = [];
            for (let x = 0; x < this.rasterMeta['nx']; x++) {
                const _ = this.readValueOfType(typ, this.offset);
                this.offset = _.offset;
                this.data[y][x] = _.value
            }
        }
    }

    readValueOfType = (typ, offset) => {
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

    toUint8ClampedArray = () => {
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

    toDataUrl = () => {
        const imgBuf = this.toUint8ClampedArray()
        return this.bufferToCanvasDataUrl(imgBuf);
    }

    getRatioColor = (startColor, endColor, ratio) => {
        const w = ratio * 2 - 1;
        const w1 = (w + 1) / 2;
        const w2 = 1 - w1;
        return [Math.round(startColor[0] * w1 + endColor[0] * w2),
            Math.round(startColor[1] * w1 + endColor[1] * w2),
            Math.round(startColor[2] * w1 + endColor[2] * w2),
            Math.round((startColor[3] * w1 + endColor[3] * w2))/255];
    }

    setImgBufPixel = (imgBuf, rgbaVal, imgBufPos) => {
        imgBuf[imgBufPos] = rgbaVal[0];
        imgBuf[imgBufPos+1] = rgbaVal[1];
        imgBuf[imgBufPos+2] = rgbaVal[2];
        imgBuf[imgBufPos+3] = rgbaVal[3];
    }
    bufferToCanvasDataUrl = (imgBuf) => {
        this.canvas = createCanvas(this.rasterMeta['nx'], this.rasterMeta['ny'])
        const ctx = this.canvas.getContext('2d');
        const imageData = ctx.createImageData(this.rasterMeta['nx'], this.rasterMeta['ny']);
        imageData.data.set(imgBuf);
        ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL();
    }

    save = (path) => {
        this.toDataUrl()
        fs.writeFileSync(path, this.canvas.toBuffer('image/png'))
    }

    getTileImage = async (x, y, z) => {
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
            width = this.rasterMeta['nx'],
            height = this.rasterMeta['ny'];
        const x2 = this.rasterMeta['x2'], y2 = this.rasterMeta['y2'];
        // console.log(y2)

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

    saveTileAsPng = async (x, y, z, path) => {
        const canvas = await this.getTileImage(x, y, z);
        let base64Data = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

    getRgbaForValue = (value) => {
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

    saveAsDataUrl = async (path) => {
        await fs.writeFileSync(path, this.toDataUrl());
    }

    saveAsPng = async (path) => {
        let base64Data = this.toDataUrl().replace(/^data:image\/png;base64,/, "");
        await fs.writeFileSync(path, base64Data, {encoding: 'base64'});
    }

}

module.exports = Band