// AudioWorklet polyfill
// Jari Kleimola 2017 (jari@webaudiomodules.org)
//
// based on https://github.com/GoogleChromeLabs/houdini-samples/blob/master/animation-worklet/anim-worklet.js
// feature detection borrowed from Google's AudioWorklet demo page
//
var AWGS = { processors:[] }

// --------------------------------------------------------------------------
//
//
AWGS.AudioWorkletGlobalScope = function () {
  var ctors = {}; // node name to processor definition map

  function registerOnWorker(name, ctor) {
    if (!ctors[name]) { // register only once (?)
      var descriptor = eval(ctor.name).parameterDescriptors
      ctors[name] = ctor;
      postMessage({ type:"register", name:name, descriptor:descriptor });
    }
  };

  function constructOnWorker (name, port, options) {
    if (ctors[name]) {
      options = options || {}
      options._port = port;
      var processor = new ctors[name](options);
      if (!(processor instanceof AudioWorkletProcessor)) {
        postMessage({ type:"state", node:nodeID, state:"error" });
        throw new Error("InvalidStateError");
      }
      return processor;
    }
    else {
      postMessage({ type:"state", node:nodeID, state:"error" });
      throw new Error("NotSupportedException");       
    }
  }

  class AudioWorkletProcessorPolyfill {
    constructor (options) { this.port = options._port; }
    process (inputs, outputs, params) {}
  }
  
  return {
    'AudioWorkletProcessor': AudioWorkletProcessorPolyfill,
    'registerProcessor': registerOnWorker,
    '_createProcessor':  constructOnWorker
  }
}


AudioWorkletGlobalScope = AWGS.AudioWorkletGlobalScope();
AudioWorkletProcessor   = AudioWorkletGlobalScope.AudioWorkletProcessor;
registerProcessor = AudioWorkletGlobalScope.registerProcessor;

onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {

    case "import":
      importScripts(msg.url);
      postMessage({ type:"load", url:msg.url });
      break;
      
    case "createProcessor":
      // -- if required, slice io for double buffering
      var a = msg.args;
      var pingpong = [];
      var buflen = a.options.samplesPerBuffer;
      for (var i=0; i<a.bus.bufferCount; i++) {
        var sliceStart = i * buflen;
        var sliceEnd   = sliceStart + buflen;
        
        // -- create io buses
        function createBus (buffers) {
          var ports = [];
          for (var iport=0; iport<buffers.length; iport++) {          
            var port = [];
            for (var channel=0; channel<buffers[iport].length; channel++) {
              var buf = new Float32Array(buffers[iport][channel]);
              port.push(buf.subarray(sliceStart, sliceEnd));
            }
            ports.push(port);
          }
          return ports;
        }
        var inbus  = createBus(a.bus.input);
        var outbus = createBus(a.bus.output);
        
        pingpong.push({ inbus:inbus, outbus:outbus });
      }

      // -- create processor
      AudioWorkletGlobalScope.sampleRate = a.sampleRate;
      var processor = AudioWorkletGlobalScope._createProcessor(a.name, e.ports[0], a.options);
      processor.node = a.node;
      processor.id = AWGS.processors.length;
      AWGS.processors.push({ awp:processor, slices:pingpong });
      postMessage({ type:"state", node:a.node, processor:processor.id, state:"running" });
      break;
      
    case "process":
      var processor = AWGS.processors[msg.processor];
      if (processor) {
        var slice = processor.slices[msg.index];
        processor.awp.process(slice.inbus, slice.outbus);
      }
      break;
  }
}
