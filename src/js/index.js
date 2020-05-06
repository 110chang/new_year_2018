
import FileSaver from 'file-saver';
import '../../node_modules/tracking/build/tracking-min';
import '../../node_modules/tracking/build/data/face-min';

!function() {

  const DPR = window.devicePixelRatio;
  const MAX_COUNT = 10;
  const faces = ['user', 'environment'];
  const masks = [{ src: '../img/inu.png', pad: 0.15 }];

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
  let currentMask = masks[0];
  let cameras = [];

  function initialize() {
    img.src = currentMask.src;
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
    picture.setAttribute('width', contentWidth * DPR);
    picture.setAttribute('height', contentHeight * DPR);
  }

  function handleVideoMetadataLoaded(e) {
    // console.log(e);
    setContentDimension(e.srcElement || e.target);
    initializeCanvas();
  }

  function initializeCamera() {
    console.log('init cam');
    navigator.mediaDevices.enumerateDevices().then(devices => {
      // console.log(devices);
      cameras = devices.filter(device => device.kind === 'videoinput');
      console.log(cameras);
      updateInterface();
    });

    const constraints = {
      video: { facingMode: currentFace },
      audio: false
    };

    const handleStream = stream => { // success
      video.srcObject = stream;
      track = stream.getTracks()[0];
      updateInterface();
    };

    const handleError = error => { // error
      console.error('mediaDevice.getUserMedia() error:', error);
      return;
    };//a

    try {
      navigator.mediaDevices.getUserMedia(constraints).then(handleStream).catch(handleError);
    } catch(e) {
      navigator.webkitGetUserMedia(constraints, handleStream, handleError);
    }
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
      console.warn('No tracking result');
      return;
    }
    pictureCtx.clearRect(0, 0, contentWidth * DPR, contentHeight * DPR);
    pictureCtx.drawImage(video, 0, 0, contentWidth * DPR, contentHeight * DPR);
    drawMask(pictureCtx, savedTrackers);
    picture.toBlob(blob => {
      FileSaver.saveAs(blob, 'inu.png');
    });
  });

  function drawMask(ctx, trackers) {
    trackers.forEach(rect => {
      let x, y, w, h, width, height;
      // console.log(rect);
      if (rect.width > rect.height) {
        width = rect.width;
        height = rect.width * img.height / img.width;
      } else {
        width = rect.height * img.width / img.height;
        height = rect.height;
      }
      w = width * DPR * (1 + 2 * currentMask.pad);
      h = height * DPR * (1 + 2 * currentMask.pad);
      x = rect.x * DPR - width * DPR * currentMask.pad;
      y = rect.y * DPR - height * DPR * currentMask.pad;
      // overlayCtx.beginPath();
      // draw original rect
      // ctx.strokeStyle = '#F00';
      // ctx.lineWidth = 1;
      // ctx.strokeRect(rect.x * DPR, rect.y * DPR, width * DPR, height * DPR);
      // draw modified rect
      // ctx.strokeStyle = '#0F0';
      // ctx.strokeRect(x, y, w, h);
      ctx.drawImage(img, x, y, w, h);
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
