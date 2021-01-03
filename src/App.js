/* global $, JitsiMeetJS */
import React, { useEffect, useState } from 'react'

const CONFERENCE = 'abc123is48282aabd222311aabb'
const DOMAIN = 'beta.meet.jit.si'
// const DOMAIN = 'meet.educate.market'
const VDOMAIN = 'beta.meet.jit.si'
// const VDOMAIN = 'meet.jitsi'
const options = {
  hosts: {
    domain: VDOMAIN,
    // muc: `muc.${VDOMAIN}`
    muc: `conference.${VDOMAIN}`
  },
  bosh: `https://${DOMAIN}/http-bind?room=${CONFERENCE}`,
  clientNode: 'http://jitsi.org/jitsimeet'
}

const confOptions = {
  openBridgeChannel: 'websocket'
}

const constraints = {
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
      },
      aspectRatio: 1.7777778
    }
  }
}

const initOptions = {
  disableAudioLevels: false
}

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
    TRACK_AUDIO_LEVEL_CHANGED
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

  room.addCommandListener('testCmd', onTestCmd)

  JitsiMeetJS.createLocalTracks({
    devices: ['audio', 'video'],
    ...constraints
  }).then(onLocalTracks)
    .catch(error => {
      throw error
    })

  room.join()
}

function onTestCmd (...args) {
  console.log('received command: testCmd', ...args)
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

  const participant = track.getParticipantId()

  if (!remoteTracks[participant]) {
    remoteTracks[participant] = []
  }

  track.addEventListener(TRACK_MUTE_CHANGED, (state) => {
    console.log('remote track mute changed: ', state)
  })

  track.addEventListener(LOCAL_TRACK_STOPPED, () => {
    console.log('Remote track stopped')
  })

  const id = participant + track.getType()

  console.log('append remote track: ', track.getType())

  if (track.getType() === 'video') {
    $('#video-root').append(`<video autoplay='false' id='${participant}video' width='400' height='300' controls>`)
  } else {
    console.log('append remote audio')
    $('#video-root').append(`<audio autoplay='false' id='${participant}audio'>`)
  }

  track.attach($(`#${id}`)[0])
}

function onRemoteTrackRemoved (track) {
  console.log('remote track removed: ', track)

  const participant = track.getParticipantId()

  if (!remoteTracks[participant]) return

  const id = participant + track.getType()
  const element = $(`#${id}`)[0]
  console.log('removed element: ', element, `#${id}`)

  if (!element) return

  track.detach(element)
  element.remove()

  const idx = remoteTracks[participant].indexOf(track)
  console.log('track idx: ', idx, participant, track.getType())

  if (idx === -1) return
  remoteTracks[participant].splice(idx, 1)
}

function onConferenceJoined () {
  console.log('conference joined')
  isJoined = true

  // localTracks.forEach(track => {
  //   room.addTrack(track)
  // })
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
  const { CONNECTION_ESTABLISHED, CONNECTION_FAILED, CONNECTION_DISCONNECTED } = JitsiMeetJS.events.connection

  console.log('connection disconected')
  connection.removeEventListener(CONNECTION_ESTABLISHED, onConnectionEstablished)
  connection.removeEventListener(CONNECTION_FAILED, onConnectionFailed)
  connection.removeEventListener(CONNECTION_DISCONNECTED, onConnectionDisconnected)
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
    // track.mute()

    track.addEventListener(TRACK_AUDIO_LEVEL_CHANGED, audioLevel => {
      // console.log(`Audio level local: ${audioLevel}`)
    })

    track.addEventListener(TRACK_MUTE_CHANGED, (x) => {
      // console.log('local track muted', x)
    })

    track.addEventListener(LOCAL_TRACK_STOPPED, () => {
      // console.log('local track stopped')
    })

    track.addEventListener(TRACK_AUDIO_OUTPUT_CHANGED, deviceId => {
      // console.log(`track audio output device was changed to ${deviceId}`)
    })
  })
}

function createVideoElements (tracks) {
  tracks.forEach(track => {
    const id = track.getDeviceId()
    if (track.getType() === 'video') {
      console.log('local video append')

      $('#video-root').append(`<video autoplay='false' id='localVideo${id}' width='400' height='300' controls>`)
      track.attach($(`#localVideo${id}`)[0])
    }

    if (track.getType() === 'audio') {
      console.log('local audio append')

      $('#video-root').append(`<audio autoplay='autoplay' muted='true' id='localAudio${id}'>`)
      track.attach($(`#localAudio${id}`)[0])
    }

    console.log('isJoined: ', isJoined)

    if (isJoined) {
      room.addTrack(track)
    }
  })
}

function destroyTrack (track) {
  const type = track.getType()
  const id = track.getDeviceId()
  const elementId = type === 'video' ? `#localVideo${id}` : `#localAudio${id}`
  const element = $(elementId)[0]

  return Promise.resolve()
    .then(() => {
      if (!element) return

      return track.detach(element)
    }).then(() => {
      return room.removeTrack(track)
    }).then(() => {
      return track.dispose()
    }).catch(error => {
      console.log(error)
    })
}

function destroyVideoElements (tracks) {
  tracks.forEach(track => {
    const id = track.getDeviceId()
    if (track.getType() === 'video') {
      console.log('local video remove')

      const videoElement = $(`#localVideo${id}`)[0]

      if (!videoElement) return

      track.detach(videoElement)
      videoElement.remove()
    }

    if (track.getType() === 'audio') {
      console.log('local audio remove')

      const audioElement = $(`#localAudio${id}`)[0]

      if (!audioElement) return

      track.detach(audioElement)
      audioElement.remove()
    }

    room.removeTrack(track)
  })
}

function createConnection () {
  console.log('create connection')
  const { CONNECTION_ESTABLISHED, CONNECTION_FAILED, CONNECTION_DISCONNECTED } = JitsiMeetJS.events.connection

  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)
  JitsiMeetJS.init()

  connection = new JitsiMeetJS.JitsiConnection(null, null, options)

  connection.addEventListener(CONNECTION_ESTABLISHED, onConnectionEstablished)
  connection.addEventListener(CONNECTION_FAILED, onConnectionFailed)
  connection.addEventListener(CONNECTION_DISCONNECTED, onConnectionDisconnected)

  connection.connect()
}

function destroyConnection () {
  console.log('destroy connection')
  connection.disconnect()
}

function getMediaDevices () {
  return new Promise((resolve, reject) => {
    const isDeviceListAvailable = JitsiMeetJS.mediaDevices.isDeviceListAvailable()

    if (!isDeviceListAvailable) reject(new Error('Device list is not available!'))

    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
      const result = devices.reduce((result, current) => {
        const { deviceId, label, kind } = current
        console.log('=> current device: ', current)
        if (!result[kind]) {
          result[kind] = []
        }

        result[kind].push({ deviceId, label })
        return result
      }, {})

      resolve(result)
    })
  })
}

function getVideoTracks (room) {
  const tracks = room.getLocalTracks()
  console.log('tracks: ', tracks)
  return tracks.filter(x => x.getType() === 'video')
}

function getAudioTracks (room) {
  const tracks = room.getLocalTracks()
  return tracks.filter(x => x.getType() === 'audio')
}

function getActiveDevice (kind) {
  if (kind === 'videoinput') {
    const track = getVideoTracks(room)[0]
    return track?.getDeviceId()
  }

  if (kind === 'audioinput') {
    const track = getAudioTracks(room)[0]
    return track?.getDeviceId()
  }

  if (kind === 'audiooutput') {
    return JitsiMeetJS.mediaDevices.getAudioOutputDevice()
  }
}

function DeviceList ({ isTracksReady }) {
  const [devices, setDevices] = useState(null)

  useEffect(() => {
    if (!isTracksReady) return

    getMediaDevices()
      .then(deviceList => {
        setDevices(deviceList)
      })
  }, [isTracksReady])

  if (!devices) return null
  if (!isTracksReady) return null

  function handleOnChange (e) {
    const { value } = e.currentTarget
    const kind = e.currentTarget.dataset.type

    const tracks = room.getLocalTracks()
    const current = tracks.find(x => {
      const type = x.getType()
      if (kind === 'videoinput') return type === 'video'
      if (kind === 'audioinput') return type === 'audio'
      return false
    })

    if (!current) return
    const type = current.getType()

    return destroyTrack(current)
      .then(() => {
        return JitsiMeetJS.createLocalTracks({
          devices: [type],
          ...constraints
        }).then(tracks => {
          console.log('=> tracks created: ', tracks)
          return createVideoElements(tracks)
        })
      })
  }

  return (
    <div className='device-list'>
      {
        Object.keys(devices).map(kind => {
          const activeDeviceId = getActiveDevice(kind)
          console.log('=> active device: ', activeDeviceId)

          return (
            <div key={kind}>
              <label>
                <h3>{kind}</h3>
                <select onChange={handleOnChange} data-type={kind} value={activeDeviceId}>
                  {
                    devices[kind].map(({ deviceId, label }) => {
                      return (
                        <option key={deviceId} value={deviceId}>
                          {label}
                        </option>
                      )
                    })
                  }
                </select>
              </label>
            </div>
          )
        })
      }
    </div>
  )
}

export default function App () {
  const [isTracksReady, setIsTracksReady] = useState(false)
  useEffect(() => {
    createConnection()

    return function cleanup () {
      destroyConnection()
    }
  }, [])

  function setModeratorMode () {
    console.log('moderator')
    // localTracks.forEach(track => {
    //   track.unmute()
    // })
    createVideoElements(localTracks)
    setIsTracksReady(true)
  }

  function setUserMode () {
    console.log('user')
    // localTracks.forEach(track => {
    //   track.mute()
    // })
    destroyVideoElements(localTracks)
  }

  function onTestCmd () {
    room.sendCommandOnce('testCmd', { value: true })
  }

  return (
    <div className='app'>
      <div className='app__controls'>
        <button className='btn' type='button' onClick={setModeratorMode}>Докладчик</button>
        <button className='btn' type='button' onClick={setUserMode}>Слушатель</button>
        <button className='btn' type='button' onClick={onTestCmd}>TestCmd</button>
        <DeviceList isTracksReady={isTracksReady} />
      </div>
    </div>
  )
}
