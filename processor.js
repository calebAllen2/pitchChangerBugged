window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

const recordBtn = document.getElementById('recordBtn')
const processBtn = document.getElementById('processBtn')
const pitchChangeConstant = document.getElementById('pitchChangeConstant')

const signalArray = []

recordBtn.addEventListener('click', () => {
    navigator.getUserMedia({ audio: true }, onStream, onError)
})

processBtn.addEventListener('click', () => {
    pitchShift = pitchChangeConstant.value
    pitchChange(pitchShift)
})

function onStream(stream){
    var audioCtx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: sampleRate,
    });
    var inputNode = audioCtx.createMediaStreamSource(stream)
    var tunerNode = audioCtx.realTimeAudioEdit()
    var outputNode = audioCtx.destination

    inputNode.connect(tunerNode)
    tunerNode.connect(outputNode)

    setTimeout(function(){
        audioCtx.close()
    }, recordDuration)
};

function onError(){console.log("error")};

AudioContext.prototype.realTimeAudioEdit = function () {
    function edit(input, output) {
        for (var i = 0; i < output.length; i++){
            output[i] = input[i];
            signalArray.push(output[i])
        }
        return output;
    }

    var tuner = this.createScriptProcessor(bufferSize, 1, 1);
    tuner.onaudioprocess = function (e) {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        output = edit(input, output);
    };
    return tuner;
};

function drawVisualizer(output, canvasNum){
    var canvas;
    if(canvasNum == 0){
        canvas = document.getElementById("canvas")
    }else if(canvasNum == 1){
        canvas = document.getElementById("canvas1")
    }
    else if(canvasNum == 2){
        canvas = document.getElementById("canvas2")
    }
    const ctx = canvas.getContext('2d')
    const barSpaceConstant = 2000 / 40000
    var barSpaceing = 0
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(var i = 0; i < output.length; i++){
        barSpaceing += barSpaceConstant 
        ctx.beginPath()
        ctx.fillRect(barSpaceing, 75, barSpaceConstant, -output[i] * 10)
        ctx.fillStyle = "FFFF00"
        ctx.fill();
        ctx.closePath()
    }

}