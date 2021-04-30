importScripts("emu.js", "message.js");

let api;
let ready = false;
let keys = new Uint8Array(8);

keys.fill(0);

// Right now we are making 2 copies of ImageData and Float32Array each frame, once to copy it locally
// in the worker thread, and another time to copy it into the parent thread. This is obviously stupid
// TODO: make only one copy of each buffer per frame
function Frame() {
	api.SetKeys(keys);
	api.EmulateFrame();
	
	let pixelPtr = api.GetFrameBuffer();
	let pixelView = new Uint8ClampedArray(Module.HEAPU8.buffer, pixelPtr, 240 * 256 * 4);
	let pixelData = new ImageData(pixelView, 256, 240);
	postMessage({type: MESSAGE_TYPE.SEND_PIXELS, pixels: pixelData});

	let numSamples = api.FlushAudioSamples();
	let audioBufPtr = api.GetAudioBuffer();
	if (numSamples !== 0) {
		let sampleView = new Float32Array(Module.HEAPF32.buffer, audioBufPtr, numSamples); // view of wasm memory
		postMessage({ type: MESSAGE_TYPE.SEND_AUDIO, audio: new Float32Array(sampleView) }); // we pass a copy of the view
	}
}

onmessage = (e) => {
	if (ready) {
		switch (e.data.type) {
		case MESSAGE_TYPE.KEY_UP:
			keys[e.data.key] = 0;
			break;
		case MESSAGE_TYPE.KEY_DOWN:
			keys[e.data.key] = 1;
			break;
		case MESSAGE_TYPE.LOAD_ROM:
			api.LoadRom(e.data.rom);
			break;
		}
	}
};

Module.onRuntimeInitialized = async _ => {
	api = Object.freeze({
		LoadRom: Module.cwrap('LoadRom', null, ['string']),
		EmulateFrame: Module.cwrap('EmulateFrame', null),
		GetFrameBuffer: Module.cwrap('GetFrameBuffer', 'number'),
		SetKeys: Module.cwrap('SetKeys', null, ['array']),
		GetAudioBuffer: Module.cwrap('GetAudioBuffer', 'number'),
		FlushAudioSamples: Module.cwrap('FlushAudioSamples', 'number'),
	});
	api.LoadRom("package/blockoban.nes");
	console.log("loaded emu");

	ready = true;

	setInterval(Frame, 16);
};
