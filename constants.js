
const AttributeType = {
    FLOAT32: {
        type: 1
    },
    INT32: {
        type: 2
    },
    VARCHAR: {
        type: 3
    },
    BOOL: {
        type: 4
    },
}

const PixelType = {
    FLOAT32: {
        type: 7,
        size: 4
    },
    FLOAT64: {
        type: 6,
        size: 8
    },
    INT32: {
        type: 5,
        size: 4
    },
    INT16: {
        type: 4,
        size: 2
    },
    INT8: {
        type: 3,
        size: 1
    },
    UINT32: {
        type: 2,
        size: 4
    },
    UINT16: {
        type: 1,
        size: 2
    },
    UINT8: {
        type: 0,
        size: 1
    }
}

const RendererType = {
    STRETCHED: 1,
    CLASSIFIED: 2
}

const defaultRenderer = {
    type: RendererType.STRETCHED,
    definition: {
        colorRamp: [
            [0, 0, 0, 255],
            [255, 255, 255, 255]
        ]
    }
};

const defaultCrs = 4326;

module.exports = {
    AttributeType,
    PixelType,
    RendererType,
    defaultRenderer,
    defaultCrs
}