//
//
// const getTypeObjFromGdalType = (type) => {
//     switch (type) {
//         case "Int16":
//             return PixelType.INT16;
//         case "Int32":
//             return PixelType.INT32;
//         case "UInt16":
//             return PixelType.UINT16;
//         case "UInt32":
//             return PixelType.UINT32;
//         case "Float32":
//             return PixelType.FLOAT32;
//         case "Float64":
//             return PixelType.FLOAT64;
//     }
//     throw "Pixel data type is not supported";
// }
//
// var gdal = require("gdal");
// const {PixelType} = require("./constants");
// var dataset = gdal.open('D:\\GIS_APP_DATA\\data.tif');
//
// // console.log("number of bands: " + dataset.bands.count());
// // console.log("width: " + dataset.rasterSize.x);
// // console.log("height: " + dataset.rasterSize.y);
// const geoTransform = dataset['geoTransform'];
// const x1 = geoTransform[0],
//     y1= geoTransform[3],
//     x2 = geoTransform[0] + (dataset['rasterSize'].x * geoTransform[1]),
//     y2 = geoTransform[3] + (dataset['rasterSize'].y*geoTransform[5]),
//     xRes = geoTransform[1],
//     yRes = geoTransform[5],
//     width = dataset['rasterSize'].x,
//     height = dataset['rasterSize'].y,
//     nb = dataset['bands'].count()
// ;
// dataset.bands.forEach(b=>console.log(getTypeObjFromGdalType(b['dataType'])));
// // dataset.bands.forEach(b=>console.log(b.pixels.read(0, 0, width, height)));