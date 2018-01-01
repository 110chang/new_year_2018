
import './tracking-min';
import './face-min';

!function() {

  const DPR = window.devicePixelRatio;

  const img = new Image();
  const canvas = document.getElementById('myOverlay');
  const ctx = canvas.getContext('2d');
  const video = document.getElementById('myVideo');
  const play = document.getElementById('btn-play');
  const stop = document.getElementById('btn-stop');
  const tracker = new tracking.ObjectTracker(['face']);
  const MAX_COUNT = 10;

  let contentWidth = window.innerWidth;
  let contentHeight = window.innerHeight;
  let track;
  let memTrackers = [];
  let untrackCount = 0;

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
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log(cameras);
    });

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    }).then(stream => { // success
      video.srcObject = stream;
      track = stream.getTracks()[0];
    }).catch(error => { // error
      console.error('mediaDevice.getUserMedia() error:', error);
      return;
    });
  }

  play.addEventListener('click', e => {
    console.log('play');
    initializeCamera();
  });

  stop.addEventListener('click', e => {
    console.log('stop');
    track.stop();
  });

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

  initialize();

  tracking.track('#myVideo', tracker);

}();
