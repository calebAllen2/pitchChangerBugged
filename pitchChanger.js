
//play around with these values (although this config works best)
const bufferSize = 2048
const sampleRate = 22050
const recordDuration = 1000
const fftSize = 512
const windowOverlap = 2

//values used in the pitch change
const fftSize2 = fftSize / 2
const lastPhase = new Array(fftSize2 + 1).fill(0);
const stepSize = fftSize / windowOverlap
const expct = 2 * Math.PI * stepSize / fftSize
const freqPerBin = sampleRate / fftSize
const dt = (fftSize / 2) * (1 / sampleRate)

function pitchChange(pitchShift){
    const windows = doWindowing()
    const phaseSums = Array(fftSize2).fill(0)
    const rebuiltSignal = new Array(signalArray.length).fill(0)
    const fftArr = []

    //compute ffts first
    for(var i = 0; i < windows.length; i++){
        fftArr.push(FFT(windows[i]))
    }

    //main loop
    for(var i = 0; i < windows.length - 1; i++){

        const analysis = {
            freqs: new Array(fftSize2).fill(0),
            amps: new Array(fftSize2).fill(0)
        }
        const synthesis = {
            freqs: new Array(fftSize2).fill(0),
            amps: new Array(fftSize2).fill(0)
        }
        const modified = new Array(fftSize).fill({re: 0, im: 0})
        var fft = fftArr[i]
        var nextfft = fftArr[i + 1]
        //analysis: use phase to find actual frequency
        //method derived from https://sethares.engr.wisc.edu/vocoders/Transforms.pdf pages 13-16 
        for(var k = 0; k < fftSize2; k++){
            const binFreq = k * freqPerBin
            const phase1 = fft.phases[k]
            const phase2 = nextfft.phases[k]
            const possibleFreqs = []
            var item = 0
            var n = 1
            while(item < binFreq){

                item = ((phase2 - phase1) + (2 * Math.PI * n)) / (2 * Math.PI * dt)
                possibleFreqs.push(item)
                n++
            }
            if(possibleFreqs.length > 1){
                possibleFreqs.splice(0, possibleFreqs.length - 2)
                analysis.freqs[k] = getClosest(possibleFreqs[0], binFreq, possibleFreqs[1])
            }else{
                analysis.freqs[k] = binFreq
            }
            analysis.amps[k] = fft.amplitudes[k]
        }

        //change frequency
        for(k = 0; k < fftSize2 - 1; k++) { 
            const index = Math.round(k * pitchShift);
            if (index < fftSize2) { 
                synthesis.amps[index] += analysis.amps[k] * 2; 
                synthesis.freqs[index] = analysis.freqs[k] * pitchShift; 
            } 
        }

        //synthesis: create vectors from modified frequency values
        //this is a part where I think I could have an error because I adpoted this 
        //method of synthesis from http://blogs.zynaptiq.com/bernsee/pitch-shifting-using-the-ft/
        //(if you click on the link and click the view source code, you'll see this method).
        //however he had a slightly different analysis method.
        for(var k = 0; k < fftSize2; k++){
            var val = synthesis.freqs[k];
            val -= k * freqPerBin;
            val /= freqPerBin
            val = 2 * Math.PI * val / windowOverlap
            val += k * expct
            phaseSums[k] += val;
            modified[k] = {
                re: synthesis.amps[k] * Math.cos(phaseSums[k]),
                im: synthesis.amps[k] * Math.sin(phaseSums[k])
            }
        }
        
        //do ifft
        const ifft = IFFT(modified)

        //push ifft to rebuilt signal..
        //here is where I think another problem could be. As of now, I have commented out the rewindowing. 
        //For some reason, when I window the signal for a second time, it just makes the buzzing worse.
        for(var k = 0; k < fftSize; k++){
            //const window = 0.5 * ( 1 - Math.cos( 2 * Math.PI * k / fftSize ))
            rebuiltSignal[(i * stepSize) + k] += ifft[k] // * window
        }
    }

    //playback original signal
    playback(rebuiltSignal)
}

//concludes finding the actual frequency by finding which "true" frequency is closest to the bin frequency.
//read more about this at https://sethares.engr.wisc.edu/vocoders/Transforms.pdf pages 14 and 15 
function getClosest(freq1, binFreq, freq2){
    var difference1 = Math.abs(freq1 - binFreq)
    var difference2 = freq2 - binFreq
    if(difference1 > difference2){
        return freq2
    }else if(difference1 < difference2){
        return freq1
    }else{
        return binFreq
    }
}


//this is probably where the error is, but I've played around with it so much and Ive had zero luck :/
function doWindowing(){
    const windows = []
    var startPos = 0
    for(var i = 0; i < signalArray.length / fftSize * windowOverlap - 1; i++){
        const window = []
        for(var k = 0; k < fftSize; k++){
            const signal =  0.5 * ( 1 - Math.cos( 2 * Math.PI * k / fftSize ))
            window.push(signalArray[startPos + k] * signal)
        }  
        windows.push(window)
        startPos += fftSize / windowOverlap 
    }
    return windows
}

function playback(data){
    var float = Float32Array.from(data)
    const audioCtx = new AudioContext()
    const audioBuf = audioCtx.createBuffer(1, float.buffer.byteLength, sampleRate)
    var nowBuffering = audioBuf.getChannelData(0)
    for(var i = 0; i < audioBuf.length; i++){
        nowBuffering[i] = float[i]
    }
    const playback = audioCtx.createBufferSource();
    playback.buffer = audioBuf;
    playback.connect(audioCtx.destination);
    playback.start();
}
