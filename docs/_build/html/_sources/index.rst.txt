######################
rgisf's documentation!
######################

.. toctree::
   :maxdepth: 2
   :caption: Contents:


********
Api Docs
********

* `Class RGisFile`_
    * `Instance builders`_
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
    * `Saving data`_
        * `RGisFile.saveToFile(filePath)`_
        * `RGisFile.saveToUFile(filePath)`_
        * `RGisFile.saveAsPng(filePath)`_


.. _Class RGisFile:

===============
Class: RGisFile
===============

.. _Instance builders:

Instance builders
******************************************************************

.. _static RGisFile.from(data, [options], [isCompressed=true]):

static RGisFile.from(data, [options], [isCompressed=true])
==================================================================
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

static RGisFile.fromGeoTiff(data, [options], [isCompressed=true])
==================================================================
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

static RGisFile.fromBuffer(buffer, [options])
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

static RGisFile.fromUBuffer(buffer, [options])
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

static RGisFile.fromFile(path, [options])
==================================================================
* ``path`` - RGisFile path
* ``options`` - Options

Creates an instance of the class RGisFile from the RGisFile file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromFile('data.rgisf');

.. _static RGisFile.fromUFile(path, [options]):

static RGisFile.fromUFile(path, [options])
==================================================================
* ``path`` - Uncompressed RGisFile path
* ``options`` - Options

Creates an instance of the class RGisFile from the uncompressed RGisFile file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromFile('data.rgisf');

.. _static RGisFile.fromUrl(url, [options]):

static RGisFile.fromUrl(url, [options])
==================================================================
* ``url`` - RGisFile url
* ``options`` - Options

Creates an instance of the class RGisFile from RGisFile url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromUrl(url);

.. _static RGisFile.fromUUrl(url, [options]):

static RGisFile.fromUUrl(url, [options])
==================================================================
* ``url`` - Uncompressed RGisFile url
* ``options`` - Options

Creates an instance of the class RGisFile from uncompressed RGisFile url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromUUrl(url);

.. _static RGisFile.fromGeoTiffUrl(url, [options]):

static RGisFile.fromGeoTiffUrl(url, [options])
==================================================================
* ``url`` - Buffer
* ``options`` - Options

Creates an instance of the class RGisFile from GeoTiff url.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromGeoTiffUrl(url);

.. _static RGisFile.fromGeoTiffFile(path, [options]):

static RGisFile.fromGeoTiffFile(path, [options])
==================================================================
* ``path`` - GeoTiff path
* ``options`` - Options

Creates an instance of the class RGisFile from GeoTiff file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object = RGisFile.fromGeoTiffFile('data.tif');

.. _static RGisFile.combine(rgFiles, [options]):

static RGisFile.combine(rgFiles, [options])
==================================================================
* ``rgFiles`` - Array of RGisFile objects
* ``options`` - Options

Combines bands in multiple RGisFile and returns a single file.

.. code-block:: js

    const RGisFile = require('rgisf');
    const object1 = RGisFile.fromGeoTiff('data.tif');
    const object2 = RGisFile.from('data.rgisf');
    const combinedRgf = RGisFile.combine([object1, object2]);



.. _Saving data:

Saving data
******************************************************************

.. _RGisFile.saveToFile(filePath):

RGisFile.saveToFile(filePath)
==================================================================
* ``filePath`` - File location to store the data

Stores the object in the specified location. By default, the data is compressed while it is stored.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveToFile('data.rgisf');

.. _RGisFile.saveToUFile(filePath):

RGisFile.saveToUFile(filePath)
==================================================================
* ``filePath`` - File location to store the data

Stores the object in the specified location in uncompressed state.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveToUFile('data.urgisf');

.. _RGisFile.saveAsPng(filePath):

RGisFile.saveAsPng(filePath)
==================================================================
* ``filePath`` - File location to store the rendered png image

Stores the rendered png image in the specified location. The image is rendered based on the passed renderer specified or default renderer will be used.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    rgf.saveAsPng('data.png');


.. _Accessors:

Accessors
******************************************************************

.. _RGisFile.toBuffer():

RGisFile.toBuffer()
==================================================================

Returns the data in uncompressed buffer format.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const buffer = rgf.toBuffer();

.. _RGisFile.toCompressedBuffer():

RGisFile.toCompressedBuffer()
==================================================================

Returns the data in compressed buffer format.

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const buffer = rgf.toCompressedBuffer();

.. _RGisFile.toDataUrl():

RGisFile.toDataUrl()
==================================================================

Returns the data as a rendered png data url (using the specified renderer. If not specified, default renderer will be used).

.. code-block:: js

    const RGisFile = require('rgisf');
    const rgf = RGisFile.fromGeoTiff('data.tif');
    const dataUrl = rgf.toDataUrl();