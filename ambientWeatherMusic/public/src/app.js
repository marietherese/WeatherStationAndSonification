'use strict'

let tempText = document.querySelector('#temperature')
let humText = document.querySelector('#humidity')
let airPressureText = document.querySelector('#air-pressure')
let lumiText = document.querySelector('#luminosity')

const Tone = require('tone')

let socket = require('socket.io-client')('http://localhost:3000')

let temperature = 0
let humidity = 0
let pressure = 0
let lux = 0

let noteIndex
let noteTempIndex

let numberOfWaveformStaples = 64

let waveDiv = document.querySelector('#wave-form')
for (let i = 0; i < numberOfWaveformStaples; i++) {
    let div = document.createElement('div')
    div.setAttribute('class', 'wave')
    waveDiv.appendChild(div)
}

let staples = document.querySelectorAll('.wave')

socket.on('event', (weatherData) => {
    checkWeatherData(weatherData)
    renderWeatherData()
    updateMusicalValues()
})

let checkWeatherData = (weatherData) => {
    if (weatherData.temperature){
        temperature = weatherData.temperature.toFixed(1)
    }
    if (weatherData.humidity){
        humidity = weatherData.humidity.toFixed(1)
    }
    if (weatherData.pressure) {
        pressure = weatherData.pressure.toFixed(1)
    }
    if (weatherData.luminosity.lux) {
        lux = weatherData.luminosity.lux.toFixed(1)
    }
}

let renderWeatherData = () => {
    if(temperature){
        tempText.innerHTML = `${temperature} °C |`
    }
    if(humidity){
        humText.innerHTML = `${humidity} % |`
    }
    if (pressure) {
        airPressureText.innerHTML = `${pressure} hPa |`
    }
    if (lux) {
        lumiText.innerHTML = `${lux} lux`
    }   
}

let notes = ['C#1', 'D#1', 'F#1', 'G#1', 'Bb1', 'C#2', 'D#2', 'F#2', 'G#2', 'Bb2', 'C#3', 'D#3', 'F#3', 'G#3', 'Bb3', 'C#4', 'D#4', 'F#4', 'G#4', 'Bb4','C#5', 'D#5', 'F#5', 'G#5', 'Bb5', 'C#6', 'D#6', 'F#6', 'G#6', 'Bb6']
let Analyser = require('tone').Analyser
let analyser = new Analyser('waveform', numberOfWaveformStaples)

let Freeverb = require('tone').Freeverb
let brightnessReverb = new Freeverb(0.9).toMaster()
let humidityReverb = new Freeverb().toMaster()

let PingPongDelay = require('tone').PingPongDelay
let pingPong = new PingPongDelay(0.25, 0.8)

let eq = new Tone.EQ3()


let updateMusicalValues = () => {
    if (lux) {
        let normalizedLux = lux / 40000
        noteIndex = Math.floor(normalizedLux * notes.length)
    }
    if (pressure) {
        let normalisedPressureInversed = 1 - pressure / 1100
        let pressureValue = normalisedPressureInversed * 15
        eq.low.value = pressureValue
    }

    if (humidity) {
        let normalizedHumidity = humidity / 100
        humidityReverb.roomSize.value = normalizedHumidity
    }

    if (temperature) {
    let normalizedTemp = (temperature + 60) / 120
    noteTempIndex = Math.ceil(normalizedTemp * notes.length)
    }
}

let luxSynth1 = new Tone.MonoSynth({
    type: 'square',
    envelope: {
        'attack': 0.1,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let luxSynth2 = new Tone.MonoSynth({
    type: 'sawtooth',
    envelope: {
        'attack': 0.2,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let luxSynth3 = new Tone.MonoSynth({
    type: 'sine',
    envelope: {
        'attack': 0.2,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let noiseSynth = new Tone.NoiseSynth({
    type: 'brown',
    envelope : {
        'attack' : 3,
        'decay' : 5,
        'sustain': 0.5
        } 
})

let tempSynth = new Tone.MonoSynth()

new Tone.LFO({
    'frequency': 1,
    'min': -10,
    'max': 10
}).fan(luxSynth1.detune).start()

new Tone.LFO({
    'frequency': 3,
    'min': -30,
    'max': 30
}).fan(luxSynth2.detune).start()

new Tone.LFO({
    'frequency': 0.1,
    'min': -10,
    'max': 10
}).fan(luxSynth3.detune).start()

new Tone.LFO({
    'frequency': 0.1,
    'min': -3,
    'max': 3
}).fan(noiseSynth.volume).start()

luxSynth1.chain(brightnessReverb, analyser)
luxSynth2.chain(brightnessReverb, analyser)
luxSynth3.chain(brightnessReverb, analyser)
noiseSynth.chain(eq, humidityReverb, analyser)
tempSynth.chain(pingPong, humidityReverb, analyser)


Tone.Transport.scheduleRepeat((time) => {
    let note1 = notes[noteIndex]
    let note2 = notes[noteIndex] + 8
    let note3 = notes[noteIndex] + 12
    let maxRange = noteIndex.length -12
    if (noteIndex > maxRange) {
        note2 = notes[noteIndex] 
        note3 = notes[noteIndex] 
    }

    luxSynth1.triggerAttackRelease(note1, 5, time)
    luxSynth2.triggerAttackRelease(note2, 5, time)
    luxSynth2.triggerAttackRelease(note3, 5, time)
    noiseSynth.triggerAttackRelease(5)
    tempSynth.triggerAttackRelease(notes[noteTempIndex], '8n', time)
}, 2)

Tone.Transport.scheduleRepeat((time) => {
    Tone.Draw.schedule(() => {
        let values = analyser.getValue()
        if (values) {
            values.forEach((element, index) => {
                let height = 200 - (element * 10)
                staples[index].setAttribute('style', `height:${height}px`)
            })
        }
        
    }, time)
}, 0.1)

Tone.Transport.start()
Tone.Transport.bpm.value = 60
Tone.Master.volume.value = -40


