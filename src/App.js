/* global $, JitsiMeetJS */
import React, { useEffect, useState } from 'react'

const DOMAIN = 'beta.meet.jit.si'
const options = {
  hosts: {
    domain: DOMAIN,
    muc: `conference.${DOMAIN}`
  },
  bosh: `https://${DOMAIN}/http-bind`,
  clientNode: 'http://jitsi.org/jitsimeet'
};

const confOptions = {
    openBridgeChannel: true
};

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
  disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

let localTracks = []
let isJoined = false
let room = null

const connection = new JitsiMeetJS.JitsiConnection(null, null, options)
const { CONNECTION_ESTABLISHED, CONNECTION_FAILED, CONNECTION_DISCONNECTED } = JitsiMeetJS.events.connection
const {
  TRACK_AUDIO_LEVEL_CHANGED,
  TRACK_MUTE_CHANGED,
  LOCAL_TRACK_STOPPED,
  TRACK_AUDIO_OUTPUT_CHANGED
} = JitsiMeetJS.events.track

function onConnectionEstablished () {
  console.log('connection established')
}

function onConnectionFailed () {
  console.log('connection failed')
}

function onConnectionDisconnected () {
  console.log('connection disconected')
}

function onLocalTracks (tracks) {
  localTracks = tracks
  tracks.forEach((track, i) => {
    track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, audioLevel => {
      console.log(`Audio level local: ${audioLevel}`)
    })

    track.addEventListener(TRACK_MUTE_CHANGED, (x) => {
      console.log('local track muted', x)
    })

    track.addEventListener(LOCAL_TRACK_STOPPED, () => {
      console.log('local track stopped')
    })

    track.addEventListener(TRACK_AUDIO_OUTPUT_CHANGED, deviceId => {
      console.log(`track audio output device was changed to ${deviceId}`)
    })

    if (track.getType() === 'video') {
      $('.app__main').append(`<video autoplay='1' id='localVideo${i}' width='800' height='600' controls>`)
      track.attach($(`#localVideo${i}`)[0])
    }

    if (track.getType() === 'audio') {
      $('.app__main').append(`<audio autoplay='1' muted='true' id='localAudio${i}'>`)
      track.attach($(`#localAudio${i}`)[0])
    }

    if (isJoined) {
      room.addTrack(track)
    }
  })
}

connection.addEventListener(CONNECTION_ESTABLISHED, onConnectionEstablished)
connection.addEventListener(CONNECTION_FAILED, onConnectionFailed)
connection.addEventListener(CONNECTION_DISCONNECTED, onConnectionDisconnected)


connection.connect()

JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
  .then(onLocalTracks)
  .catch(error => {
    throw error
  })

export default function App () {
  useEffect(() => {
  }, [])
  return (
    <div className="app">
      <div className="app__main">
      </div>
      <div className="app__controls">
        <button className="btn" type="button">Модератор</button>
        <button className="btn" type="button">Слушатель</button>
      </div>
    </div>
  )
}
