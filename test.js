const {PixelType} = require('./constants')
const Rgf = require('./index');

const TIFF_URL = "http://localhost/data.tif";
const TIFF_PATH = "D:\\GIS_APP_DATA\\data.tif";
const FILE_URL = "http://localhost/data.rgisf";
const FILE_PATH = "D:\\GIS_APP_DATA\\data.rgisf";

const init = async () => {
    // const rgfGTUrl = await Rgf.fromGeoTiff(TIFF_URL, {
    //     readAs: {type: PixelType.INT16, factor: 1},
    //     attrs: [{timestamp: new Date().getTime(), name: "GeoTiff from Url"}]
    // });
    // const rgfGTPath = await Rgf.fromGeoTiff(TIFF_PATH, {
    //     readAs: {type: PixelType.INT16, factor: 1}
    // });
    // const rgfGTCombined = Rgf.combine([rgfGTUrl, rgfGTPath]);
    // await rgfGTCombined.saveToFile(FILE_PATH);
    //
    // const rgfPath = await Rgf.from(FILE_PATH, {
    //     attrs: [{name: "Band 1"}, {name: "Band 2"}]
    // }, true);
    const rgfUrl = await Rgf.from(FILE_URL, {
        attrs: [{name: "Band 1 from Url"}, {name: "Band 2 from Url"}]
    }, true);
    // const rgfCombined = Rgf.combine([rgfPath, rgfUrl, rgfGTUrl]);
    // rgfCombined.bands.forEach(band=>{
    //     console.log(band.attr);
    // });
}
init();