
import FileSaver from 'file-saver';
import './tracking-min';
import './face-min';

!function() {

  const DPR = window.devicePixelRatio;
  const MAX_COUNT = 10;
  const faces = ['user', 'environment'];

  const img = new Image();
  const overlay = document.getElementById('myOverlay');
  const overlayCtx = overlay.getContext('2d');
  const picture = document.createElement('canvas');
  const pictureCtx = picture.getContext('2d');
  const video = document.getElementById('myVideo');
  const btnPlay = document.getElementById('btn-play');
  const btnStop = document.getElementById('btn-stop');
  const btnCamera = document.getElementById('btn-camera');
  const btnSave = document.getElementById('btn-save');
  const tracker = new tracking.ObjectTracker(['face']);

  let contentWidth = window.innerWidth;
  let contentHeight = window.innerHeight;
  let track;
  let trackers;
  let memTrackers = [];
  let savedTrackers = [];
  let untrackCount = 0;
  let currentFace = faces[0];
  let cameras = [];

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
    overlay.setAttribute('width', contentWidth * DPR);
    overlay.setAttribute('height', contentHeight * DPR);
    overlayCtx.strokeStyle = '#0F0';
    overlayCtx.lineWidth = 1;
    picture.setAttribute('width', contentWidth * DPR);
    picture.setAttribute('height', contentHeight * DPR);
    pictureCtx.strokeStyle = '#0F0';
    pictureCtx.lineWidth = 1;
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
      cameras = devices.filter(device => device.kind === 'videoinput');
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
  });

  btnSave.addEventListener('click', e => {
    savedTrackers = memTrackers.slice();
    if (savedTrackers.length === 0) {
      console.warn('No trackers');
      return;
    }
    pictureCtx.clearRect(0, 0, contentWidth * DPR, contentHeight * DPR);
    pictureCtx.drawImage(video, 0, 0, contentWidth * DPR, contentHeight * DPR);
    drawMask(pictureCtx, savedTrackers);
    picture.toBlob(blob => {
      FileSaver.saveAs(blob, 'laughingman.png');
    });
  });

  function drawMask(ctx, trackers) {
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
      // overlayCtx.beginPath();
      // ctx.strokeRect(rect.x * DPR, rect.y * DPR, rect.width * DPR, rect.height * DPR);
      ctx.drawImage(img, rect.x * DPR, rect.y * DPR, width * DPR, height * DPR);
    });
  }

  tracker.on('track', e => {
    trackers = e.data;
    overlayCtx.clearRect(0, 0, contentWidth * DPR, contentHeight * DPR);

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
      drawMask(overlayCtx, trackers);
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
