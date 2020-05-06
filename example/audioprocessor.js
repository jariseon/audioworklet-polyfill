class Processor extends AudioWorkletProcessor {
    constructor(options) {
	super(options);
        this.port.onmessage = (e) => {
            if(e.data === "stop") {
                this.resume = false;
            }
        }
	this.ticks = 0;
	this.resume = true;
    }

    process(inputs, outputs, parameters) {
        const inputArr = inputs[0];
        const inputChannel1 = inputArr[0];
        const channels = outputs[0];
        const outputChannel1 = channels[0];
        const outputChannel2 = channels[1];
	
	// Send a message after every 1000 ticks
	this.ticks += 1;
	if(this.ticks === 1000) {
	    this.port.postMessage("audioprocessor is alive."); 
	    this.ticks = 0;
	}

	outputChannel1.set(inputChannel1, 0);
	outputChannel2.set(inputChannel1, 0);
	if(!this.resume) {
	    this.port.postMessage("Bye Bye! from audioprocessor.");
	}
	
        return this.resume;
    }
}

registerProcessor('audioprocessor', Processor);
