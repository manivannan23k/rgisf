# Rgisf
## Custom GIS raster format and utilities for WebGIS

Rgisf is a npm package for loading and rendering GIS raster data.
 
## Features

- Adding custom renderers for a raster image/its bands
- Render and save raster images
- Generate a specific tile with the renderer
- Generate and cache tiles at various zoom levels

## Installation

You can install rgisf using npm:

```sh
npm install rgisf
```

## Usage
Import the package:
```sh
    const Rgf = require('rgisf');
```
### Loading data
 - #### From rgisf file
a) Buffer:
```sh
    const rgf = new Rgf(buffer);
```
b) From file:
```
    const rgf = await Rgf.fromFile(path);
```
c) From url:
```
    const rgf = await Rgf.fromUrl(url);
```

 - #### From geotiff file
Note: Currently, geotiff npm package is being used for loading and parsing geotiff data.
a) From file:
```
    const rgf = await Rgf.fromGeoTiffFile(path);
```
b) From url:
```
    const rgf = await Rgf.fromGeoTiffUrl(url);
```

### Updating renderer
  - #### Setting renderer
  ```
  const renderer = {
      type: 1, //Renderer.STRETCHED
      definition: {
          colorRamp: [[0, 0, 0, 255], [255, 255, 255, 255]]
      }
  }
  rgf.setRenderer(renderer)
  ```
 Currently, it supports two types of renderers: 1) Stretched 2) Classified
 - #### Stretched renderer
 Eg:

        
            {
                type: 1, //Renderer.STRETCHED
                definition: {
                    colorRamp: [
                        [0, 0, 0, 255],//[r,g,b,a]
                        [255, 255, 255, 255]
                    ]
                }
            }
       
You can add more colors to the color ramp array. It will be split at equal interval and applied across on the raster file.

 - #### Classified renderer
 Eg:

        
            {
                type: 2, //Renderer.CLASSIFIED
                definition: {
                    classes: [
                        {
                            min: 0,
                            max: 50,
                            color: [255, 16, 100, 255]
                        },
                        {
                            min: 50,
                            max: 75,
                            color: [255, 16, 16, 255]
                        },
                        {
                            min: 75,
                            max: 80,
                            color: [163, 19, 75, 255]
                        }
                    ]
                }
            }
       
Here, you can specify the color for the class and the range of value(min & max). Unspecified values(within any ranges) will be transparent.

### Rendering
All the rendering related outputs will have the applied renderer.
 To get rendered datauri,
 ```
 const img = rgf.toDataUrl()
```
 To save it as a PNG,
 ```
 await rgf.saveAsPng(path)
```
To get specfic tile for the given x, y, z
```
const canvas = await rgf.getTileImage();
const dataUrl = canvas.toDataURL();
```
To save a specific tile as PNG,
```
await rgf.saveTileAsPng(path);
```

To generate and save tiles for specified zoom levels,
```
const z1 = 5;
const z2 = 12;
await rgf.generateTiles(z1, z2, tileCacheDir);
```





















