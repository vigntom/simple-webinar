/* global $, JitsiMeetJS */
import React, { useEffect, useState } from 'react'

const DOMAIN = 'beta.meet.jit.si'
// const DOMAIN = 'meet.educate.market'
const options = {
  hosts: {
    domain: DOMAIN,
    muc: `conference.${DOMAIN}`
  },
  bosh: `https://${DOMAIN}/http-bind`,
  clientNode: 'http://jitsi.org/jitsimeet'
};

const confOptions = {
  openBridgeChannel: 'websocket'
};

const initOptions = {
  disableAudioLevels: false
};

const CONFERENCE = 'abc123is48282aabd2223'
let localTracks = []
let isJoined = false
let room = null
let connection = null
const remoteTracks = {}

function onConnectionEstablished () {
  console.log('connection established')

  const {
    TRACK_ADDED,
    TRACK_REMOVED,
    CONFERENCE_JOINED,
    USER_JOINED,
    USER_LEFT,
    DISPLAY_NAME_CHANGED,
    PHONE_NUMBER_CHANGED,
    TRACK_MUTE_CHANGED,
    TRACK_AUDIO_LEVEL_CHANGED,
  } = JitsiMeetJS.events.conference

  room = connection.initJitsiConference(CONFERENCE, confOptions)
  room.on(TRACK_ADDED, onRemoteTrackAdded)
  room.on(TRACK_REMOVED, onRemoteTrackRemoved)
  room.on(CONFERENCE_JOINED, onConferenceJoined)
  room.on(USER_JOINED, onUserJoined)
  room.on(TRACK_MUTE_CHANGED, onTrackMuteChanged)
  room.on(DISPLAY_NAME_CHANGED, onDisplayNameChanged)
  room.on(TRACK_AUDIO_LEVEL_CHANGED, onTrackAudioLevelChanged)
  room.on(PHONE_NUMBER_CHANGED, onPhoneNumberChanged)

  JitsiMeetJS.createLocalTracks({
    devices: ['audio', 'video'],
    resolution: 720,
    constraints: {
      video: {
        height: {
          ideal: 720,
          max: 720,
          min: 180
        },
        width: {
          ideal: 1280,
          max: 1280,
          min: 320
        }
      }
    }
  }).then(onLocalTracks)
    .catch(error => {
      throw error
    })

  room.join()
}

function onRemoteTrackAdded (track) {
  console.log('remote track added', track.getType(), track.isLocal())
  const {
    TRACK_AUDIO_LEVEL_CHANGED,
    TRACK_MUTE_CHANGED,
    LOCAL_TRACK_STOPPED,
    TRACK_AUDIO_OUTPUT_CHANGED
  } = JitsiMeetJS.events.track

  if (track.isLocal()) return
  console.log('remote track not local')

  const participant = track.getParticipantId()

  if (!remoteTracks[participant]) {
    remoteTracks[participant] = []
  }

  const idx = remoteTracks[participant].push(track)

  // track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, audioLevel => {
  //   console.log(`Audio level remote: ${audioLevel}`)
  // })

  track.addEventListener(TRACK_MUTE_CHANGED, (state) => {
    console.log('remote track mute changed: ', state)
  })

  track.addEventListener(LOCAL_TRACK_STOPPED, () => {
    console.log('Remote track stopped')
  })

//   track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, diveiceID => {
//     console.log(`track audio output device was changed to ${diveiceID}`)
//   })

  const id = participant + track.getType() + idx

  console.log('append remote track: ', track.getType())

  if (track.getType() === 'video') {
    $('#video-root').append(`<video autoplay='false' id='${participant}video${idx}' width='400' height='300' controls>`)
  } else {
    console.log('append remote audio')
    $('#video-root').append(`<audio autoplay='false' id='${participant}audio${idx}'>`)
  }

  track.attach($(`#${id}`)[0])
}


function onRemoteTrackRemoved () {
}

function onConferenceJoined () {
  console.log('conference joined')
  isJoined = true

  localTracks.forEach(track => {
    room.addTrack(track)
  })
}

function onUserJoined (id) {
  console.log(`user join: ${id}`)
  remoteTracks[id] = []
}

function onTrackMuteChanged () {
}

function onDisplayNameChanged () {
}

function onTrackAudioLevelChanged () {
}

function onPhoneNumberChanged () {
}

function onConnectionFailed () {
  console.log('connection failed')
}

function onConnectionDisconnected () {
  console.log('connection disconected')
}

function onLocalTracks (tracks) {
  localTracks = tracks

  const {
    TRACK_AUDIO_LEVEL_CHANGED,
    TRACK_MUTE_CHANGED,
    LOCAL_TRACK_STOPPED,
    TRACK_AUDIO_OUTPUT_CHANGED
  } = JitsiMeetJS.events.track

  tracks.forEach((track, i) => {
    track.mute()

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
      console.log('local video append')
      $('#video-root').append(`<video autoplay='false' id='localVideo${i}' width='400' height='300' controls>`)
      track.attach($(`#localVideo${i}`)[0])
    }

    if (track.getType() === 'audio') {
      console.log('local video append')
      $('#video-root').append(`<audio autoplay='autoplay' muted='true' id='localAudio${i}'>`)
      track.attach($(`#localAudio${i}`)[0])
    }

    if (isJoined) {
      room.addTrack(track)
    }
  })
}


$(document).ready(() => {
  createConnection()
})

function createConnection () {
  console.log('create connection')
  const { CONNECTION_ESTABLISHED, CONNECTION_FAILED, CONNECTION_DISCONNECTED } = JitsiMeetJS.events.connection

  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
  JitsiMeetJS.init();

  connection = new JitsiMeetJS.JitsiConnection(null, null, options)

  connection.addEventListener(CONNECTION_ESTABLISHED, onConnectionEstablished)
  connection.addEventListener(CONNECTION_FAILED, onConnectionFailed)
  connection.addEventListener(CONNECTION_DISCONNECTED, onConnectionDisconnected)

  connection.connect()
}

export default function App () {
  useEffect(() => {
    // window.addEventListener('load', createConnection)

    // return function cleanup () {
    //   window.removeEventListener('load', createConnection)
    // }
  }, [])

  function setModeratorMode () {
    console.log('moderator')
    localTracks.forEach(track => {
      track.unmute()
    })
  }

  function setUserMode () {
    console.log('user')
    localTracks.forEach(track => {
      track.mute()
    })
  }

  return (
    <div className="app">
      <div className="app__controls">
        <button className="btn" type="button" onClick={setModeratorMode}>Модератор</button>
        <button className="btn" type="button" onClick={setUserMode}>Слушатель</button>
      </div>
    </div>
  )
}
