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

const CONFERENCE = 'abc123is48282'
let localTracks = []
let isJoined = false
let room = null
const remoteTracks = {}

const connection = new JitsiMeetJS.JitsiConnection(null, null, options)
const { CONNECTION_ESTABLISHED, CONNECTION_FAILED, CONNECTION_DISCONNECTED } = JitsiMeetJS.events.connection
const {
  TRACK_AUDIO_LEVEL_CHANGED,
  TRACK_MUTE_CHANGED,
  LOCAL_TRACK_STOPPED,
  TRACK_AUDIO_OUTPUT_CHANGED
} = JitsiMeetJS.events.track
const {
  TRACK_ADDED,
  TRACK_REMOVED,
  CONFERENCE_JOINED,
  USER_JOINED,
  USER_LEFT,
  DISPLAY_NAME_CHANGED,
  PHONE_NUMBER_CHANGED
} = JitsiMeetJS.events.conference

function onConnectionEstablished () {
  console.log('connection established')
  room = connection.initJitsiConference(CONFERENCE, confOptions)
  room.on(TRACK_ADDED, onRemoteTrackAdded)
  room.on(TRACK_REMOVED, onRemoteTrackRemoved)
  room.on(CONFERENCE_JOINED, onConferenceJoined)
  room.on(TRACK_MUTE_CHANGED, onTrackMuteChanged)
  room.on(DISPLAY_NAME_CHANGED, onDisplayNameChanged)
  room.on(TRACK_AUDIO_LEVEL_CHANGED, onTrackAudioLevelChanged)
  room.on(PHONE_NUMBER_CHANGED, onPhoneNumberChanged)
}

function onRemoteTrackAdded (track) {
  if (track.isLocal()) return

  const participant = track.getParticipantId()

  if (!remoteTracks[participant]) {
    remoteTracks[participant] = []
  }

  const idx = remoteTracks[participant].push(track)

  track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, audioLevel => {
    console.log(`Audio level remote: ${audioLevel}`)
  })

  track.addEventListener(TRACK_MUTE_CHANGED, (state) => {
    console.log('remote track mute changed: ', state)
  })

  track.addEventListener(LOCAL_TRACK_STOPPED, () => {
    console.log('Remote track stopped')
  })

  track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, diveiceID => {
    console.log(`track audio output device was changed to ${diveiceID}`)
  })

  const id = participant + track.getType() + idx

  if (track.getType() === 'video') {
    $('.app__main').append(
      `<video autoplay='1' id'${participant}video${idx} />`
    )
  } else {
    $('.app__main').append(
      `<audio autoplay='1' id=${participant}audio${idx} />`
    )
  }

  track.attach($(`#${id}`)[0])
}


function onRemoteTrackRemoved () {
}

function onConferenceJoined () {
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
  const [isModerator, setIsModerator] = useState(false)

  function setModeratorMode () {
    console.log('moderator')
    setIsModerator(true)
  }

  function setUserMode () {
    console.log('user')
    setIsModerator(false)
  }

  return (
    <div className="app">
      <div className="app__main">
      </div>
      <div className="app__controls">
        <button className="btn" type="button" onClick={setModeratorMode}>Модератор</button>
        <button className="btn" type="button" onClick={setUserMode}>Слушатель</button>
      </div>
    </div>
  )
}
