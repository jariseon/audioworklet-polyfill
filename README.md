# audioworklet-polyfill
Strictly unofficial polyfill for Web Audio API AudioWorklet. The processor runs in a Web Worker, which is connected via SharedArrayBuffer to a main thread ScriptProcessorNode.

_edit:_ SharedArrayBuffers (SABs) are currently disabled in Firefox and Safari due to security concerns. As a workaround, the polyfill falls back to transferable ArrayBuffers that are bounced back and forth between main thread and web worker. This requires double buffering, which increases latency. The polyfill still works reasonably well even with this, in all tested user agents. SABs will be re-enabled when available.

## demos
[https://webaudiomodules.org/wamsynths](https://webaudiomodules.org/wamsynths)

Tested in stable Firefox 75.0 and Safari 12.1.2.

More info at [webaudiomodules.org](http://www.webaudiomodules.org/blog/audioworklet_polyfill/)

## usage
```html
<script src="audioworklet.js"></script>
<script>
// audioworker.js should also reside at root
const context = new AudioContext();

// -- buflenSPN defines ScriptProcessorNode buffer length in samples
// -- default is 512. use larger values if there are audible glitches
AWPF.polyfill(context, { buflenSPN:512 }).then(() => {
  let script = document.createElement("script");
  script.src = "my-worklet.js";
  script.onload = () => {
    // that's it, then just proceed 'normally'
    // const awn = new MyAudioWorkletNode(context);
    // ...
  }
  document.head.appendChild(script);    
});
</script>
```

`AWPF.polyfill()` resolves immediately if polyfill is not required. note that polyfilled AudioWorklet inputs (if any) need to be connected as in `sourceNode.connect(awn.input)`.

## description
**audioworklet.js** polyfills AudioWorkletNode and creates a web worker. Worker is initialized with **audioworker.js** script, which in turn polyfills AudioWorkletGlobalScope and AudioWorkletProcessor. audioWorklet.addModule() is thereby routed to web worker's importScript(), and raw audio processing takes place off main thread. Processed audio is put into a SAB (or transferable ArrayBuffer when SAB is unavailable), which is accessed in main thread ScriptProcessorNode (SPN) onaudioprocess() for audio output.

## caveats
Due to SPN restrictions the number of input and output ports is limited to 1, and the minimum buffer length is 256. I've also cut corners here and there, so the polyfill does not accurately follow the spec in all details. Please raise an issue if you find an offending conflict.

AudioParams are still unsupported.

## similar libraries
[@developit](https://github.com/developit) has implemented [a similar polyfill](https://github.com/GoogleChromeLabs/audioworklet-polyfill) that uses an isolated main thread scope for audio processing.
