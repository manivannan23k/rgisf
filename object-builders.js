const {
    getRasterInitBuffer,
    getRendererBuffer,
    bufferToArrayBuffer,
    getPixelTypeFromObj,
    writeBandValueToBuffer,
    getTypeObjFromType,
    getAttrBuffer,
    readFile
} = require('./utils');
const Rgf = require('./rgisf');
const GeoTIFF = require('geotiff');
const fetch = require('node-fetch');
const {defaultRenderer, defaultCrs} = require('./constants');

const fromBuffer = (buffer, options) => {
    return new Rgf(buffer, options);
}

const fromUncompressedBuffer = (buffer, options) => {
    const rgf = new Rgf(null, options);
    rgf.setUncompressedData(buffer);
    return rgf;
}

const fromGeoTiffFileAsync = async (path, options) => {
    const data = readFile(path);
    return await geoTiffBufferToRgf(data, options);
}

const fromGeoTiffBuffer = async (buffer, options) => {
    return await geoTiffBufferToRgf(buffer, options);
}

const combineBands = (rgfFiles, options) => {
    const rgf = new Rgf(null, options);
    rgf.options = {
        ...rgfFiles[0].options,
        ...options
    }
    rgf.rasterMeta = rgfFiles[0].getMetaData();
    rgf.rasterMeta['nb'] = 0;
    rgf.bands = [];
    for (const rgfFile of rgfFiles) {
        const bands = rgfFile.getBands();
        for (const band of bands) {
            rgf.bands.push(band);
            rgf.rasterMeta['nb']++;
        }
    }
    return rgf;
}

const fromGeoTiffUrl = async (url, options) => {
    const response = await fetch(url);
    const buffer = await response.buffer();
    return await geoTiffBufferToRgf(buffer, options);
}

const fromFile = (url, options) => {
    const data = readFile(url);
    return new Rgf(data, options);
}

const fromUncompressedFile = (url, options) => {
    const data = readFile(url);
    return Rgf.fromUBuffer(data, options);
}

const fromUrl = async (url, options) => {
    const response = await fetch(url);
    const data = await response.buffer();
    return new Rgf(data, options);
}

const fromUUrl = async (url, options) => {
    const response = await fetch(url);
    const data = await response.buffer();
    return Rgf.fromUBuffer(data, options);
}

const geoTiffBufferToRgf = async (data, options) => {
    const rgf = new Rgf(null);
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
        vt: vt.type, nb, crs: defaultCrs, x1, y1, x2, y2, xRes, yRes, nx, ny, factor: factor
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

module.exports = {
    fromBuffer,
    fromUncompressedBuffer,
    fromGeoTiffFileAsync,
    fromGeoTiffBuffer,
    combineBands,
    fromGeoTiffUrl,
    fromFile,
    fromUncompressedFile,
    fromUrl,
    geoTiffBufferToRgf,
    fromUUrl
}