
//radix 2 FFT
function FFT(data){
    const N = data.length
    const amplitudes = []
    const phases = []
    const pCords = []
    for(var k  = 0; k < N/2; k++){
        const E = {re: 0,im: 0}
        const O = {re: 0,im: 0}
        for(var n = 0; n < N/2; n++){
            const arg = (-2 * Math.PI * k * n) / (N / 2)
            E.re += data[2*n] * Math.cos(arg)
            E.im += data[2*n] * Math.sin(arg)
            O.re += data[2*n + 1] * Math.cos(arg)
            O.im += data[2*n + 1] * Math.sin(arg)
        }
        const arg = (-2 * Math.PI * k) / N
        var re = E.re + (O.re * Math.cos(arg) - O.im * Math.sin(arg))
        var im = E.im + (O.im * Math.cos(arg) + O.re * Math.sin(arg))
        amplitudes.push(Math.sqrt(re * re + im * im))
        phases.push(Math.atan2(im, re))
        pCords.push({re: re / N , im: im / N})
    }
    return {
        amplitudes: amplitudes,
        phases: phases,
        pCords: pCords
    }
}

function IFFT(data){
    const N = data.length
    const values = new Array(N).fill(0)
    for(var n = 0; n < N / 2; n++){
        const Even = {re: 0, im: 0}
        const Odd = {re: 0, im: 0}
        const Rest = {
            re: Math.cos((2 * Math.PI * n) / N),
            im: Math.sin((2 * Math.PI * n) / N)
        }
        for(var k = 0; k < N / 2; k++){
            const argument = (2 * Math.PI * n * k) / (N / 2)
            Even.re += (data[2 * k].re * Math.cos(argument)) - (data[2 * k].im * Math.sin(argument))
            Odd.re += (data[2 * k + 1].re * Math.cos(argument)) - (data[2 * k + 1].im * Math.sin(argument))
            Odd.im += (data[2 * k + 1].im * Math.cos(argument)) + (data[2 * k + 1].re * Math.sin(argument))
        }
        var real1 = Even.re + (Odd.re * Math.cos((2 * Math.PI * n) / N) - Odd.im * Math.sin((2 * Math.PI * n) / N))
        var real2 = Even.re - (Odd.re * Math.cos((2 * Math.PI * n) / N) - Odd.im * Math.sin((2 * Math.PI * n) / N))
        values[n] = real1 / N
        values[n + (N/2)] = real2 / N
    }
    return values
}

