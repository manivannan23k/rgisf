const {PixelType, RendererType, AttributeType} = require('./constants')
const fs = require('fs');
const bufferToArrayBuffer = (buf) => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
const getPixelTypeFromObj = (obj) => {
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
            return PixelType.FLOAT32;
        case Float64Array:
            return PixelType.FLOAT64;
    }
}
const writeBandValueToBuffer = (vt, value, buffer, offset) => {
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
const getTypeObjFromType = (type) => {
    switch (type.type) {
        case PixelType.INT8.type:
            return PixelType.INT8;
        case PixelType.INT16.type:
            return PixelType.INT16;
        case PixelType.INT32.type:
            return PixelType.INT32;
        case PixelType.UINT8.type:
            return PixelType.UINT8;
        case PixelType.UINT16.type:
            return PixelType.UINT16;
        case PixelType.UINT32.type:
            return PixelType.UINT32;
        case PixelType.FLOAT32.type:
            return PixelType.FLOAT32;
        case PixelType.FLOAT64.type:
            return PixelType.FLOAT64;
    }
    return PixelType.FLOAT32;
}
const getTypeObjFromGdalType = (type) => {
    switch (type) {
        case "Int16":
            return PixelType.INT16;
        case "Int32":
            return PixelType.INT32;
        case "UInt16":
            return PixelType.UINT16;
        case "UInt32":
            return PixelType.UINT32;
        case "Float32":
            return PixelType.FLOAT32;
        case "Float64":
            return PixelType.FLOAT64;
    }
    throw "Pixel data type is not supported";
}
const getRasterInitBuffer = ({vt, nb, crs, x1, y1, x2, y2, xRes, yRes, nx, ny, factor}) => {
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
    buffer.writeFloatBE(factor, 36);
    return buffer
}
const writeColorRampToBuffer = (buffer, colorRamp, startsAt) => {
    for (let i = 0; i < colorRamp.length; i++) {
        const color = colorRamp[i];
        for (let j = 0; j < color.length; j++) {
            const colorComp = color[j];
            buffer.writeUInt8(colorComp, startsAt + (i*4) + j);
        }
    }
    return buffer;
}
const writeClassesToBuffer = (buffer, classes, startsAt, bytePerPixel) => {
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
const getRendererBuffer = (renderer, bytePerPixel) => {
    let rb = null;
    let rendererSize = 0;
    switch (renderer.type) {
        case RendererType.STRETCHED:
            rendererSize = 2 + 4*renderer.definition.colorRamp.length;
            rb = Buffer.alloc(rendererSize);
            rb.writeUInt8(renderer.type, 0);
            rb.writeUInt8(renderer.definition.colorRamp.length, 1);
            rb = writeColorRampToBuffer(rb, renderer.definition.colorRamp, 2);
            break;
        case RendererType.CLASSIFIED:
            rendererSize = 2 + (4 * 2 + 4) * renderer.definition.classes.length;
            rb = Buffer.alloc(rendererSize);
            rb.writeUInt8(2, 0);
            rb.writeUInt8(renderer.definition.classes.length, 1);
            rb = writeClassesToBuffer(rb, renderer.definition.classes, 2, bytePerPixel);
            break;
    }
    return rb;
}

const getAttrBuffer = (attr) => {
    let buffer = Buffer.alloc(2);
    const fields = Object.keys(attr);
    const fieldSize = fields.length;
    buffer.writeInt16BE(fieldSize);
    for (const field of fields) {
        const fieldData = field;//str
        const fieldSize = field.length;//int16be
        const valueData = attr[field];//
        const valueType = getAttrType(valueData);//int16be
        const valueSize = getAttrValueSize(valueData);//int16be
        let tempBuf = Buffer.alloc(fieldSize+valueSize+2+2+2);
        tempBuf.writeInt16BE(fieldSize, 0);
        tempBuf.write(fieldData, 2);
        tempBuf.writeInt16BE(valueType, 2 + fieldSize);
        tempBuf.writeInt16BE(valueSize, 2 + 2 + fieldSize);
        switch (valueType) {
            case AttributeType.VARCHAR.type:
                tempBuf.write(valueData, 2 + 2 + 2 + fieldSize);
                break;
            case AttributeType.BOOL.type:
                tempBuf.writeUInt8(valueData?1:0, 2 + 2 + 2 + fieldSize);
                break;
            case AttributeType.FLOAT32.type:
                tempBuf.writeFloatBE(valueData, 2 + 2 + 2 + fieldSize);
                break;
        }
        buffer = Buffer.concat([buffer, tempBuf]);
    }
    return buffer;
}

const getAttrValueSize = (value) => {
    switch (typeof value) {
        case "string":
            return value.length;
        case "number":
            return 4;
        case "boolean":
            return 1;
        default:
            return value.length;
    }
}

const getAttrType = (value) => {
    switch (typeof value) {
        case "string":
            return AttributeType.VARCHAR.type;
        case "number":
            return AttributeType.FLOAT32.type;
        case "boolean":
            return AttributeType.BOOL.type;
        default:
            return AttributeType.VARCHAR.type;
    }
}


const getPixelType  = (v) => {
    return Object.keys(PixelType).map(key=>{
        const t = PixelType[key];
        if (t['type']===v){
            return t;
        }else{
            return null;
        }
    }).filter(e=>e!==null)[0]||null;
}


const bufferToCanvas = (imgBuf, nx, ny) => {
    const canvas = require('./create-canvas')(nx, ny)
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(nx, ny);
    imageData.data.set(imgBuf);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

const mergeBandImgBuffers = (bufLength, arr) => {
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

const readFile = (path) => {
    return fs.readFileSync(path)
}

const validUrl = (str) => {
    const pattern = new RegExp("^((https|http|ftp|rtsp|mms)?://)"
        + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp
        + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-z_!~*'()-]+\.)*" // www.
        + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\."
        + "[a-z]{2,6})" // first level domain- .com
        + "(:[0-9]{1,4})?" //:80
        + "((/?)|" // a slash isn't required if there is no file name
        + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$");
    return !!pattern.test(str);
}

const validPath = (string) => {
    return fs.existsSync(string);
}

module.exports = {
    getRasterInitBuffer,
    getRendererBuffer,
    bufferToArrayBuffer,
    getPixelTypeFromObj,
    writeBandValueToBuffer,
    writeClassesToBuffer,
    writeColorRampToBuffer,
    getTypeObjFromType,
    getAttrBuffer,
    getPixelType,
    bufferToCanvas,
    mergeBandImgBuffers,
    readFile,
    validUrl,
    validPath,
    getTypeObjFromGdalType
}