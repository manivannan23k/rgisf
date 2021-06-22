const {
    fromBuffer,
    fromGeoTiffBuffer,
    fromGeoTiffFileAsync,
    fromUncompressedBuffer,
    fromFile,
    fromUrl,
    fromUUrl,
    fromUncompressedFile,
    combineBands,
    fromGeoTiffUrl,
    geoTiffBufferToRgf
} = require("./object-builders");
const RGisFile = require('./rgisf');
const {validPath, validUrl} = require('./utils')

RGisFile.fromBuffer = fromBuffer
RGisFile.fromUBuffer = fromUncompressedBuffer
RGisFile.fromFile = fromFile
RGisFile.fromUFile = fromUncompressedFile
RGisFile.fromUrl = fromUrl
RGisFile.fromUUrl = fromUUrl

RGisFile.fromGeoTiffFile = fromGeoTiffFileAsync
RGisFile.fromGeoTiffUrl = fromGeoTiffUrl
RGisFile.fromGeoTiffBuffer = fromGeoTiffBuffer

RGisFile.geoTiffBufferToRgf = geoTiffBufferToRgf
RGisFile.combine = combineBands

RGisFile.from = async (data, options = {}, isCompressed = true) => {
    if (isCompressed){
        switch (typeof data) {
            case "string":
                if (validUrl(data)) {
                    return await RGisFile.fromUrl(data, options);
                } else if (validPath(data)) {
                    return RGisFile.fromFile(data, options);
                }
                throw "Not a valid path/url";
            case "object":
                return RGisFile.fromBuffer(data, options);
        }
        throw "Not a valid data";
    }else {
        switch (typeof data) {
            case "string":
                if (validUrl(data)) {
                    return await RGisFile.fromUUrl(data, options);
                } else if (validPath(data)) {
                    return RGisFile.fromUFile(data, options);
                }
                throw "Not a valid path/url";
            case "object":
                return RGisFile.fromUBuffer(data, options);
        }
        throw "Not a valid data";
    }
}
RGisFile.fromGeoTiff = async (data, options) => {
    switch (typeof data) {
        case "string":
            if (validUrl(data)) {
                return await RGisFile.fromGeoTiffUrl(data, options);
            } else if (validPath(data)) {
                return await RGisFile.fromGeoTiffFile(data, options);
            }
            throw "Not a valid path/url";
        case "object":
            return await RGisFile.fromGeoTiffBuffer(data, options);
    }
    throw "Not a valid data";
}

module.exports=RGisFile