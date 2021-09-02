let voxel;
let voxelContext;
let domLoaded = false;

const maps = Object.freeze({
    aztec: {
        colorMap: 'maps/Aztec-Color.png',
        depthMap: 'maps/Aztec-Depth.png',
        background: 0xFFE09090,
        startPoint: [512, 512],
    },
    canyon: {
        colorMap: 'maps/Canyon-Color.png',
        depthMap: 'maps/Canyon-Depth.png',
        background: 0xFFE09090,
        startPoint: [300, 300],
    },
    plains: {
        colorMap: 'maps/Plains-Color.png',
        depthMap: 'maps/Plains-Depth.png',
        background: 0xFFE09090,
        startPoint: [512, 512],
    },
    tundra: {
        colorMap: 'maps/Tundra-Color.png',
        depthMap: 'maps/Tundra-Depth.png',
        background: 0xFFE09090,
        startPoint: [512, 512],
    },
});

function RAFCallback(timestamp) {
    requestAnimationFrame(RAFCallback);
    const canvasElement = document.getElementById('voxel-canvas');
    const canvasContext = canvasElement.getContext('2d');

    const width = canvasElement.width;
    const height = canvasElement.height;

    const image = voxel.render(voxelContext, width, height, timestamp / 20000);

    const imageView = new Uint8ClampedArray(Module.HEAPU8.buffer, image, width * height * 4);
    const imageData = new ImageData(imageView, width, height);

    canvasContext.putImageData(imageData, 0, 0);
}

Module.onRuntimeInitialized = async _ => {
    voxel = Object.freeze({
        createContext: Module.cwrap('create_voxel_space_context', 'number', ['string', 'string', 'number', 'number', 'number']),
        destroyContext: Module.cwrap('destroy_voxel_space_context', null, ['number']),
        render: Module.cwrap('render_voxel_space', 'number', ['number', 'number', 'number', 'number']),
    });
    console.log('loaded voxel space');

    const map = maps.plains;
    voxelContext = voxel.createContext(map.colorMap, map.depthMap, map.startPoint[0], map.startPoint[1], map.background);

    if (domLoaded)
        requestAnimationFrame(RAFCallback);
};

window.addEventListener('load', _ => {
    domLoaded = true;
    if (voxel) {
        requestAnimationFrame(RAFCallback);
    }
});

function setCanvasSize() {
    const canvasElement = document.getElementById('voxel-canvas');

    const aspect = canvasElement.clientHeight / canvasElement.clientWidth;
    canvasElement.width = canvasElement.clientWidth < 700 ? canvasElement.clientWidth : 700;
    canvasElement.height = canvasElement.width * aspect;
}

window.addEventListener('resize', setCanvasSize);
window.addEventListener('load', setCanvasSize);