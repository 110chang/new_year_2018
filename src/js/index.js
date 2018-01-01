
import './tracking-min';
import './face-min';

!function() {

  const DPR = window.devicePixelRatio;
  const MAX_COUNT = 10;
  const faces = ['user', 'environment'];

  const img = new Image();
  const canvas = document.getElementById('myOverlay');
  const ctx = canvas.getContext('2d');
  const video = document.getElementById('myVideo');
  const btnPlay = document.getElementById('btn-play');
  const btnStop = document.getElementById('btn-stop');
  const btnCamera = document.getElementById('btn-camera');
  const tracker = new tracking.ObjectTracker(['face']);

  let contentWidth = window.innerWidth;
  let contentHeight = window.innerHeight;
  let track;
  let memTrackers = [];
  let untrackCount = 0;
  let currentFace = faces[0];
  let cameras = []

  function initialize() {
    img.src = '../img/Laughing_man.png';
    img.onload = handleImageLoaded;
    video.onloadedmetadata = handleVideoMetadataLoaded;
  }

  function handleImageLoaded(e) {
    initializeCamera();
  }

  function setContentDimension(video) {
    contentWidth = video.offsetWidth;
    contentHeight = video.offsetHeight;
  }

  function initializeCanvas() {
    canvas.setAttribute('width', contentWidth * DPR);
    canvas.setAttribute('height', contentHeight * DPR);
    ctx.strokeStyle = '#0F0';
    ctx.lineWidth = 1;
  }

  function handleVideoMetadataLoaded(e) {
    console.log(e.srcElement);
    setContentDimension(e.srcElement);
    initializeCanvas();
  }

  function initializeCamera() {
    console.log('init cam');
    navigator.mediaDevices.enumerateDevices().then(devices => {
      console.log(devices);
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log(cameras);
      updateInterface();
    });

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFace },
      audio: false
    }).then(stream => { // success
      video.srcObject = stream;
      track = stream.getTracks()[0];
      updateInterface();
    }).catch(error => { // error
      console.error('mediaDevice.getUserMedia() error:', error);
      return;
    });
  }

  function updateInterface() {
    if (track == null) {
      btnPlay.style = 'display: inline-block';
      btnStop.style = 'display: none';
    } else {
      btnPlay.style = 'display: none';
      btnStop.style = 'display: inline-block';
    }
    if (cameras.length > 1) {
      btnCamera.style = 'display: inline-block';
    } else {
      btnCamera.style = 'display: none';
    }
  }

  btnPlay.addEventListener('click', e => {
    console.log('play');
    initializeCamera();
  });

  btnStop.addEventListener('click', e => {
    console.log('stop');
    track.stop();
    track = null;
    updateInterface();
  });

  btnCamera.addEventListener('click', e => {
    if (currentFace === faces[0]) {
      currentFace = faces[1];
    } else {
      currentFace = faces[0];
    }
    track.stop();
    initializeCamera();
  })

  tracker.on('track', e => {

    let trackers = e.data;

    ctx.clearRect(0, 0, contentWidth * DPR, contentHeight * DPR);

    if (e.data == null || e.data.length === 0) {
      // No objects were detected in this frame.
      // console.log('untrack', untrackCount);
      if (untrackCount > MAX_COUNT) {
        trackers = [];
        memTrackers = [];
        untrackCount = 0;
      } else {
        trackers = memTrackers;
        untrackCount++;
      }
    }
    if (trackers.length > 0) {
      // console.log('detected', ctx.canvas.clientWidth, ctx.canvas.clientHeight);
      trackers.forEach(rect => {
        let width, height;
        // console.log(rect);
        if (rect.width > rect.height) {
          width = rect.width;
          height = rect.width * img.height / img.width;
        } else {
          width = rect.height * img.width / img.height;
          height = rect.height;
        }
        ctx.beginPath();
        // ctx.strokeRect(rect.x * DPR, rect.y * DPR, rect.width * DPR, rect.height * DPR);
        ctx.drawImage(img, rect.x * DPR, rect.y * DPR, width * DPR, height * DPR);
      });
      memTrackers = trackers;
    }
  });

  window.onorientationchange = e => {
    initialize();
    initializeCamera();
  }

  initialize();
  updateInterface();

  tracking.track('#myVideo', tracker);

}();
