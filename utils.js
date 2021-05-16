
const PixelType = require('./types')
const Renderer = require('./renderer')
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
            return PixelType.FLOAT64.type;
        case Float64Array:
            return PixelType.FLOAT64.type;
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
const getRasterInitBuffer = ({vt, nb, crs, x1, y1, x2, y2, xRes, yRes, nx, ny}) => {
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
        case Renderer.STRETCHED:
            rendererSize = 2 + 4*renderer.definition.colorRamp.length;
            rb = Buffer.alloc(rendererSize);
            rb.writeUInt8(renderer.type, 0);
            rb.writeUInt8(renderer.definition.colorRamp.length, 1);
            rb = writeColorRampToBuffer(rb, renderer.definition.colorRamp, 2);
            break;
        case Renderer.CLASSIFIED:
            rendererSize = 2 + (4 * 2 + 4) * renderer.definition.classes.length;
            rb = Buffer.alloc(rendererSize);
            rb.writeUInt8(2, 0);
            rb.writeUInt8(renderer.definition.classes.length, 1);
            rb = writeClassesToBuffer(rb, renderer.definition.classes, 2, bytePerPixel);
            break;
    }
    return rb;
}

module.exports = {
    getRasterInitBuffer,
    getRendererBuffer,
    bufferToArrayBuffer,
    getPixelTypeFromObj,
    writeBandValueToBuffer,
    writeClassesToBuffer,
    writeColorRampToBuffer
}