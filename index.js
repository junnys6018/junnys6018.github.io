let voxel;
let voxelContext = {
    handle: null,
    map: null,
    loadMap: function (map) {
        if (this.handle) {
            voxel.destroyContext(this.handle);
        }
        this.map = map;
        this.handle = voxel.createContext(map.colorMap, map.depthMap, map.background);
    },
    animate: function (width, height, timestamp) {
        return this.map.animate(this.handle, width, height, timestamp);
    }
};

let domLoaded = false;

const maps = Object.freeze({
    aztec: {
        colorMap: 'maps/Aztec-Color.png',
        depthMap: 'maps/Aztec-Depth.png',
        background: 0xFFE09090,
        startPoint: [700, 170],
        animate: function (handle, width, height, timestamp) {
            const START_PHI = 3.14159265359;
            return voxel.render(handle, width, height, timestamp / 20000 + START_PHI, ...this.startPoint, 0.4, 50);
        }
    },
    canyon: {
        colorMap: 'maps/Canyon-Color.png',
        depthMap: 'maps/Canyon-Depth.png',
        background: 0xFFE09090,
        startPoint: [300, 300],
        animate: function (handle, width, height, timestamp) {
            return voxel.render(handle, width, height, 0, this.startPoint[0] + timestamp / 10, this.startPoint[1], 0.6, 110);
        }
    },
    plains: {
        colorMap: 'maps/Plains-Color.png',
        depthMap: 'maps/Plains-Depth.png',
        background: 0xFFE09090,
        startPoint: [0, 500],
        animate: function (handle, width, height, timestamp) {
            return voxel.render(handle, width, height, 0, this.startPoint[0] + timestamp / 10, this.startPoint[1], 0.6, 110);
        }
    },
    tundra: {
        colorMap: 'maps/Tundra-Color.png',
        depthMap: 'maps/Tundra-Depth.png',
        background: 0xFFE09090,
        startPoint: [550, 500],
        animate: function (handle, width, height, timestamp) {
            const RADIUS = 600;
            const PI_OVER_2 = 1.57079632679;
            const t = timestamp / 8000;
            const xpos = RADIUS * Math.cos(t);
            const ypos = RADIUS * Math.sin(t);
            const phi = t + PI_OVER_2
            return voxel.render(handle, width, height, phi, xpos, ypos, 0.6, 110);
        }
    },
});

let update;
function RAFCallback(timestamp) {
    requestAnimationFrame(RAFCallback);
    const canvasElement = document.getElementById('voxel-canvas');
    const canvasContext = canvasElement.getContext('2d');

    const width = canvasElement.width;
    const height = canvasElement.height;

    const t0 = performance.now();
    const image = voxelContext.animate(width, height, timestamp);
    const t1 = performance.now();

    if (!update || timestamp > update) {
        document.getElementById('fps').innerText = (t1 - t0).toFixed(2);
        update = timestamp + 1000;
    }

    const imageView = new Uint8ClampedArray(Module.HEAPU8.buffer, image, width * height * 4);
    const imageData = new ImageData(imageView, width, height);

    canvasContext.putImageData(imageData, 0, 0);
}

Module.onRuntimeInitialized = async _ => {
    voxel = Object.freeze({
        // voxel_space_context *createContext(const char *color_map, const char *depth_map, uint32_t background)
        createContext: Module.cwrap('create_voxel_space_context', 'number', ['string', 'string', 'number']),

        // void destroyContext(voxel_space_context *ctx)
        destroyContext: Module.cwrap('destroy_voxel_space_context', null, ['number']),

        // uint32_t *render(voxel_space_context *ctx, int w, int h, float phi, float xpos, float ypos, float pitch, int camera_height)
        render: Module.cwrap('render_voxel_space', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
    });
    console.log('loaded voxel space');

    voxelContext.loadMap(maps.aztec);

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