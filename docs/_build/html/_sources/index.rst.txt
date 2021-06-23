############################
RGisF version: 1.0.23-alpha
############################

    RGisF is a collection of helper methods to work with raster data mainly in web applications. It stores the raster data in a customized format ``.rgisf`` (compressed: default) or ``.urgisf`` (uncompressed) data and can be read using any of the rgisf client libraries. It includes utility methods for reading, filtering & rendering raster data with custom renderers(classes, color ramp).

    |br| **Note:** Currently, it is only available in NodeJs and only supports coordinate system EPSG 4326. Support to more frameworks and coordinates system will be added soon.
    |br| **Next release:** Independent browser support + EPSG 3857

.. toctree::
   :maxdepth: 5


**************************
1. Docs (NodeJs)
**************************

* `1.1. Class RGisFile`_
    * `Static methods`_
        * `static RGisFile.from(data, [options], [isCompressed=true])`_
        * `static RGisFile.fromGeoTiff(data, [options])`_
        * `static RGisFile.fromBuffer(buffer, [options])`_
        * `static RGisFile.fromUBuffer(buffer, [options])`_
        * `static RGisFile.fromFile(path, [options])`_
        * `static RGisFile.fromUFile(path, [options])`_
        * `static RGisFile.fromUrl(url, [options])`_
        * `static RGisFile.fromUUrl(url, [options])`_
        * `static RGisFile.fromGeoTiffUrl(url, [options])`_
        * `static RGisFile.fromGeoTiffFile(path, [options])`_
        * `static RGisFile.combine(rgFiles, [options])`_
    * `Methods`_
        * `RGisFile.saveToFile(filePath)`_
        * `RGisFile.saveToUFile(filePath)`_
        * `RGisFile.saveAsPng(filePath)`_
        * `RGisFile.toBuffer()`_
        * `RGisFile.toCompressedBuffer()`_
        * `RGisFile.toDataUrl()`_
        * `RGisFile.getMetaData()`_
        * `RGisFile.getBbox()`_
        * `RGisFile.getNoOfBands()`_
        * `RGisFile.getCoordinateSystem()`_
        * `RGisFile.getXResolution()`_
        * `RGisFile.getYResolution()`_
        * `RGisFile.getWidth()`_
        * `RGisFile.getHeight()`_
        * `RGisFile.getBands()`_
        * `RGisFile.getTileImage(x, y, z)`_
        * `RGisFile.generateTiles(z1, z2, dirPath)`_
* `1.2. Class Band`_
    * `Methods`_
        * `Band.getValueAt(x, y)`_
        * `Band.toDataUrl()`_
        * `Band.saveAsPng(filePath)`_
        * `Band.saveTileAsPng(x, y, z, filePath)`_
        * `Band.getTileImage(x, y, z)`_
        * `Band.generateTiles(z1, z2, dirPath)`_
* `1.3. Renderers`_
    * `Class StretchedRenderer`_
    * `Class ClassifiedRenderer`_
* `1.4. Misc`_
    * `RasterOptions`_


.. _1.1. Class RGisFile:

======================
1.1. Class: RGisFile
======================

.. _static methods:

static methods
******************************************************************

.. _static RGisFile.from(data, [options], [isCompressed=true]):

1.1.1. static RGisFile.from(data, [options], [isCompressed=true])
=========================================================================
* ``data`` - Buffer, path or url
* ``options`` - Options
* ``isCompressed`` - boolean; default: true

Creates an instance of the class RGisFile from the rgisf data(buffer, path or url).

.. code-block:: js

    const RGisFile = require('rgisf');
    const fs = require('fs');

    //from data buffer
    const buffer = fs.readFileSync('data.rgisf');
    const rgf1 = RGisFile.from(buffer);

    //from file path
    const rgf2 = RGisFile.from('/some/path/to/data.rgisf');

    //from Url
    const rgf3 = RGisFile.from('https://some.domain.name/data.rgisf');


.. _static RGisFile.fromGeoTiff(data, [options]):

1.1.2. static RGisFile.fromGeoTiff(data, [options], [isCompressed=true])
==================================================================================
* ``data`` - Buffer, path or url
* ``options`` - Options

Creates an instance of the class RGisFile from the GeoTiff data(buffer, path or url).

.. code-block:: js

    const RGisFile = require('rgisf');
    const fs = require('fs');

    //from data buffer
    const buffer = fs.readFileSync('data.tif');
    const rgf1 = RGisFile.fromGeoTiff(buffer);

    //from file path
    const rgf2 = RGisFile.fromGeoTiff('/some/path/to/data.tif');

    //from Url
    const rgf3 = RGisFile.fromGeoTiff('https://some.domain.name/data.tif');

.. _static RGisFile.fromBuffer(buffer, [options]):

1.1.3. static RGisFile.fromBuffer(buffer, [options])
==================================================================
* ``buffer`` - RGisFile buffer
* ``options`` - Options

Creates an instance of the class RGisFile from the RGisFile buffer.

.. code-block:: js

    const RGisFile = require('rgisf');
    const fs = require('fs');
    const buffer = fs.readFileSync('data.rgisf');
    const object = RGisFile.fromBuffer(buffer);

.. _static RGisFile.fromUBuffer(buffer, [options]):

1.1.4. static RGisFile.fromUBuffer(buffer, [options])
==================================================================
* ``buffer`` - Uncompressed RGisFile buffer
* ``options`` - Options

Creates an instance of the class RGisFile from the RGisFile data buffer(uncompressed data file).

.. code-block:: js

    const RGisFile = require('rgisf');
    const fs = require('fs');
    const buffer = fs.readFileSync('data.rgisf');
    const object = RGisFile.fromUBuffer(buffer);

.. _static RGisFile.fromFile(path, [options]):

1.1.5. static RGisFile.fromFile(path, [options])
==================================================================
* ``path`` - RGisFile path
* ``options`` - Options

Creates an instance of the class RGisFile from the RGisFile file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromFile('data.rgisf');

.. _static RGisFile.fromUFile(path, [options]):

1.1.6. static RGisFile.fromUFile(path, [options])
==================================================================
* ``path`` - Uncompressed RGisFile path
* ``options`` - Options

Creates an instance of the class RGisFile from the uncompressed RGisFile file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromFile('data.rgisf');

.. _static RGisFile.fromUrl(url, [options]):

1.1.7. static RGisFile.fromUrl(url, [options])
==================================================================
* ``url`` - RGisFile url
* ``options`` - Options

Creates an instance of the class RGisFile from RGisFile url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromUrl(url);

.. _static RGisFile.fromUUrl(url, [options]):

1.1.8. static RGisFile.fromUUrl(url, [options])
==================================================================
* ``url`` - Uncompressed RGisFile url
* ``options`` - Options

Creates an instance of the class RGisFile from uncompressed RGisFile url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromUUrl(url);

.. _static RGisFile.fromGeoTiffUrl(url, [options]):

1.1.9. static RGisFile.fromGeoTiffUrl(url, [options])
==================================================================
* ``url`` - Buffer
* ``options`` - Options

Creates an instance of the class RGisFile from GeoTiff url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromGeoTiffUrl(url);

.. _static RGisFile.fromGeoTiffFile(path, [options]):

1.1.10. static RGisFile.fromGeoTiffFile(path, [options])
==================================================================
* ``path`` - GeoTiff path
* ``options`` - Options

Creates an instance of the class RGisFile from GeoTiff file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromGeoTiffFile('data.tif');

.. _static RGisFile.combine(rgFiles, [options]):

1.1.11. static RGisFile.combine(rgFiles, [options])
==================================================================
* ``rgFiles`` - Array of RGisFile objects
* ``options`` - Options

Combines bands in multiple RGisFile and returns a single file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object1 = RGisFile.fromGeoTiff('data.tif');
    const object2 = RGisFile.from('data.rgisf');
    const combinedRgf = RGisFile.combine([object1, object2]);



.. _Methods:

Methods
******************************************************************

.. _RGisFile.saveToFile(filePath):

1.1.12. RGisFile.saveToFile(filePath)
==================================================================
* ``filePath`` - File location to store the data

Stores the object in the specified location. By default, the data is compressed while it is stored.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveToFile('data.rgisf');

.. _RGisFile.saveToUFile(filePath):

1.1.13. RGisFile.saveToUFile(filePath)
==================================================================
* ``filePath`` - File location to store the data

Stores the object in the specified location in uncompressed state.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveToUFile('data.urgisf');

.. _RGisFile.saveAsPng(filePath):

1.1.14. RGisFile.saveAsPng(filePath)
==================================================================
* ``filePath`` - File location to store the rendered png image

Stores the rendered png image in the specified location. The image is rendered based on the passed renderer specified or default renderer will be used.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveAsPng('data.png');

.. _RGisFile.toBuffer():

1.1.15. RGisFile.toBuffer()
==================================================================

Returns the data in uncompressed buffer format.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const buffer = rgf.toBuffer();

.. _RGisFile.toCompressedBuffer():

1.1.16. RGisFile.toCompressedBuffer()
==================================================================

Returns the data in compressed buffer format.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const buffer = rgf.toCompressedBuffer();

.. _RGisFile.toDataUrl():

1.1.17. RGisFile.toDataUrl()
==================================================================

Returns the data as a rendered png data url (using the specified renderer. If not specified, default renderer will be used).

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const dataUrl = rgf.toDataUrl();

.. _RGisFile.getMetaData():

1.1.18. RGisFile.getMetaData()
==================================================================

Returns RasterMetadata object for the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const metaData = rgf.getMetaData();
    /*
    * returns RasterMetadata {
    *   pixelType, noOfBands, coordinateSystem
    *   x1, y1, x2, y2,
    *   xResolution, yResolution,
    *   width, height
    * }
    */

.. _RGisFile.getBbox():

1.1.19. RGisFile.getBbox()
==================================================================

Returns bbox array ``[x1, y1, x2, y2]`` for the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const bbox = rgf.getBounds();
    /*
    * returns ``[x1, y1, x2, y2]``
    */

.. _RGisFile.getNoOfBands():

1.1.20. RGisFile.getNoOfBands()
==================================================================

Returns the number of bands ``integer`` in the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const noOfBands = rgf.getNoOfBands();

.. _RGisFile.getCoordinateSystem():

1.1.21. RGisFile.getCoordinateSystem()
==================================================================

Returns coordinates system ``integer`` used in the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const crs = rgf.getCoordinateSystem(); //Eg: 4326

.. _RGisFile.getXResolution():

1.1.22. RGisFile.getXResolution()
==================================================================

Returns x resolution ``float`` of the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const xRes = rgf.getXResolution(); //Eg: 0.0025

.. _RGisFile.getYResolution():

1.1.23. RGisFile.getYResolution()
==================================================================

Returns y resolution ``float`` of the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const yRes = rgf.getYResolution(); //Eg: 0.0025

.. _RGisFile.getWidth():

1.1.24. RGisFile.getWidth()
==================================================================

Returns width (no of pixels in x-direction) ``integer`` in the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const width = rgf.getWidth(); //Eg: 542

.. _RGisFile.getHeight():

1.1.25. RGisFile.getHeight()
==================================================================

Returns height (no of pixels in y-direction) ``integer`` in the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const height = rgf.getHeight(); //Eg: 845

.. _RGisFile.getBands():

1.1.26. RGisFile.getBands()
==================================================================

Returns Bands ``array of Band`` in the RGisFile.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');

    const bands = rgf.getBands();



.. _RGisFile.getTileImage(x, y, z):

1.1.12. RGisFile.getTileImage(x, y, z)
==================================================================
* ``x`` - tile coordinate x
* ``y`` - tile coordinate y
* ``z`` - tile coordinate z (Zoom level)

Returns a canvas object with rendered data of the RGisFile. It uses whichever renderer is passed while creating the object or uses the existing one/default renderer.

.. code-block:: js

    const RGisFile = require('rgisf');
    const StretchedRenderer = require('rgisf/stretched-renderer')

    const colorRamp = [[255, 255, 0, 150], [255, 0, 255, 150]];
    const renderer = new StretchedRenderer(colorRamp);
    const rgf = RGisFile.from('data.rgisf', {renderer: renderer});

    const canvas = rgf.getTileImage(23, 14, 5);
    const pngImageDataUrl = canvas.toDataURL();

.. _RGisFile.generateTiles(z1, z2, dirPath):

1.1.12. RGisFile.generateTiles(z1, z2, dirPath)
==================================================================
* ``z1`` - start zoom level
* ``z2`` - end zoom level
* ``dirPath`` - directory where the generated tiles to be stored

Generates and stores tile images for the specified zoom levels for the RGisFile. It uses whichever renderer is passed while creating the object or uses the existing one/default renderer.

.. code-block:: js

    const RGisFile = require('rgisf');
    const StretchedRenderer = require('rgisf/stretched-renderer')

    const colorRamp = [[255, 255, 0, 150], [255, 0, 255, 150]];
    const renderer = new StretchedRenderer(colorRamp);
    const rgf = RGisFile.from('data.rgisf', {renderer: renderer});

    try{
        await rgf.generateTiles(5, 10, './tiles/');
        console.log("Tiles are generated");
    }catch(e){
        console.log("Failed to generate tiles");
    }



.. _1.2. Class Band:

==========================
1.2. Class Band
==========================

.. _Band accessors:

Band accessors
******************************************************************

.. _Band.getValueAt(x, y):

1.4.1. Band.getValueAt(x, y)
=========================================================================
* ``x`` - x coordinate of the pixel
* ``y`` - x coordinate of the pixel

Returns the pixel value at the specified geometric coordinates.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');
    const band = rgf.bands[0];
    const pixelValue = band.getValueAt(0, 51);
    console.log(`Value at ${x}, ${y} is ${pixelValue}`);

.. _Band.toDataUrl():

1.4.2. Band.toDataUrl(x, y)
=========================================================================

Returns rendered data as a png data url using the specified renderer.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');
    const band = rgf.bands[0];
    const dataUrl = band.toDataUrl();

.. _Band.getTileImage(x, y, z):

1.4.3. Band.getTileImage(x, y, z)
=========================================================================
* ``x`` - tile coordinate x
* ``y`` - tile coordinate y
* ``z`` - tile coordinate z (Zoom level)

Returns a canvas object with rendered data of the band. It uses whichever renderer is passed while creating the object or uses the existing one/default renderer.


.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.from('data.rgisf');
    const band = rgf.bands[0];
    const canvas = band.getTileImage(23, 14, 5);

.. _Band.generateTiles(z1, z2, dirPath):

1.4.4. Band.generateTiles(z1, z2, dirPath)
=========================================================================

* ``z1`` - start zoom level
* ``z2`` - end zoom level
* ``dirPath`` - directory where the generated tiles to be stored

Generates and stores tile images for the specified zoom levels for the band. It uses whichever renderer is passed while creating the object or uses the existing one/default renderer.

.. code-block:: js

    const RGisFile = require('rgisf');
    const StretchedRenderer = require('rgisf/stretched-renderer')

    const colorRamp = [[255, 255, 0, 150], [255, 0, 255, 150]];
    const renderer = new StretchedRenderer(colorRamp);
    const rgf = RGisFile.from('data.rgisf', {renderer: renderer});
    const band = rgf.bands[0];

    try{
        await band.generateTiles(5, 10, './tiles/');
        console.log("Tiles are generated");
    }catch(e){
        console.log("Failed to generate tiles");
    }


.. _Band.saveAsPng(filePath):

1.4.5. Band.saveAsPng(filePath)
=========================================================================

* ``filePath`` - File location to store the rendered png image

Stores the rendered png image for the band in the specified location. The image is rendered based on the passed renderer specified or default renderer will be used.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const band = rgf.bands[0];
    await band.saveAsPng('data.png');


.. _Band.saveTileAsPng(x, y, z, filePath):

1.4.6. Band.saveTileAsPng(x, y, z, filePath)
==================================================================

* ``x`` - tile coordinate x
* ``y`` - tile coordinate y
* ``z`` - tile coordinate z (Zoom level)
* ``filePath`` - File location to store the rendered png tile image

Generates and saves a particular tile in the specified location.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const band = rgf.bands[0];
    await band.saveTileAsPng(23, 14, 5, 'data.png');


.. _1.3. Renderers:

==========================
1.3. Renderers
==========================

.. _Class StretchedRenderer:

1.3.1. Class StretchedRenderer([colorRamp])
***********************************************

* ``colorRamp [optional]`` - 2D array of integers which represents rgba color values.


.. code-block:: js

    const StretchedRenderer = require('rgisf/stretched-renderer')

    const colorRamp = [[255, 255, 0, 150], [255, 0, 255, 150]];
    const renderer = new StretchedRenderer(colorRamp);

.. _Class ClassifiedRenderer:

1.3.2. Class ClassifiedRenderer([classes])
***********************************************

* ``classes`` - an array of objects each of which has the minimum and the maximum value for the specified rgba color value(class).


.. code-block:: js

    const ClassifiedRenderer = require('rgisf/classified-renderer')

    const classes = [{ min:1, max: 5, color: [255,255,255,100]}, { min:5, max: 10, color: [255,0,0,100]}];
    const renderer = new ClassifiedRenderer(classes);


.. _1.4. Misc:

==========================
1.4. Misc
==========================


.. _RasterOptions:

1.4.1 RasterOptions
***********************************************


RasterOptions is optionally passed as an argument while creating instance of the RGisFile.

.. list-table::
   :widths: 25 25 50
   :header-rows: 1

   * - parameter
     - type
     - description
   * - ``bbox [optional]``
     - ``array``
     - Bounding box of the region that is to be filtered |br| from the original data. |br| |br| Eg: ``[x1, y1, x2, y2]``
   * - ``attrs [optional]``
     - ``array``
     - array of json objects. The number of elements in the array |br| should be equal to the number of bands. |br| |br| Eg: ``[{name: "Band 1"}, {name: "Band 2"}] //(2 bands)``
   * - ``renderer [optional]``
     - any type of Renderer (``StretchedRenderer | ClassifiedRenderer``)
     - An instance of renderer class is passed to override default |br| or existing renderer in the data
   * - ``readAs [optional]``
     - ``object``
     - This option can be used when the desired output data type is |br| different than the source datatype. Applying factor, it can |br| effectively store float data as integer(small size) with the |br| cost losing the precision. |br| |br| Eg: ``{type: PixelType.FLOAT32, factor: 1}``


.. code-block:: js

    const RGisFile = require('rgisf');
    const StretchedRenderer = require('rgisf/stretched-renderer');
    const {PixelType} = require('rgisf/constants');
    const fs = require('fs');
    const buffer = fs.readFileSync('data.rgisf');

    const options = {
        bbox: [0, 51, 20, 26],
        attrs: [{name: "Band 1"}],
        renderer: new StretchedRenderer(),
        readAs: {type: PixelType.INT16, factor: 100}, // multiplies original data by factor of 100 and converts it to 16-integer.
    };
    const rgf = RGisFile.from(buffer, options);



.. _PixelType:

1.4.2 PixelType
***********************************************

The following are the currently supported PixelTypes in RGisFile. These pre-defined types are defined in the ``'rgisf/constants'`` module. These types are to be used for specifying the data type to read if the source data is different. Check the ``readAs`` attribute of ``RasterOptions``.

.. list-table::
   :widths: 25 25 25
   :header-rows: 1

   * - name
     - type
     - size (bytes)
   * - ``INT8``
     - ``8-bit integer``
     - 1
   * - ``INT16``
     - ``16-bit integer``
     - 2
   * - ``INT32``
     - ``32-bit integer``
     - 4
   * - ``UINT8``
     - ``8-bit unsigned integer``
     - 1
   * - ``UINT16``
     - ``16-bit unsigned integer``
     - 2
   * - ``UINT32``
     - ``32-bit unsigned integer``
     - 4
   * - ``FLOAT32``
     - ``float``
     - 4
   * - ``FLOAT64``
     - ``double``
     - 8

.. code-block:: js

    const {PixelType} = require('rgisf/constants');
    console.log(PixelType.INT8);
    //prints "{type:3, size:1}"





*************
2. Tutorials
*************

    Will be added shortly












.. |br| raw:: html

     <br>