# audioworklet-polyfill
Strictly unofficial polyfill for Web Audio API AudioWorklet. The processor runs in a Web Worker, which is connected via SharedArrayBuffer to a main thread ScriptProcessorNode.

## demos
[OBXD](https://webaudiomodules.org/demos/wasm/obxd.html) and
[DEXED](https://webaudiomodules.org/demos/wasm/dexed.html) synths

Tested in stable Chrome 64, Firefox 57 and Safari 11. Edge test is still pending.

More info at [webaudiomodules.org](http://www.webaudiomodules.org/blog/audioworklet_polyfill/)

## usage
```
<script src="audioworklet.js"></script>
<!-- audioworker.js should also reside at root -->

// --- before creating the AudioWorkletNode
var context;
if (AWPF.isAudioWorkletPolyfilled) {
  context = AWPF.context;
else context = new AudioContext();
```
then pass `context` as an argument to your AudioWorkletNode

## description
**audioworklet.js** polyfills AudioWorkletNode and creates a web worker. Worker is initialized with **audioworker.js** script, which in turn polyfills AudioWorkletGlobalScope and AudioWorkletProcessor. audioWorklet.addModule() is thereby routed to web worker's importScript(), and raw audio processing takes place off main thread. Processed audio is put into a SharedArrayBuffer, which is accessed in main thread ScriptProcessorNode (SPN) onaudioprocess() for audio output.

## caveats
Due to SPN restrictions the number of input and output ports is limited to 1, and the minimum buffer length is 256. I've also cut corners here and there, so the polyfill does not accurately follow the spec in all details. Please raise an issue if you find an offending conflict.
