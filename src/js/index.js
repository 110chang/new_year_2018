
import './tracking-min';
import './face-min';

window.URL = window.URL || window.webkitURL;

!function() {

  const DPR = window.devicePixelRatio;

  const img = new Image();
  const canvas = document.getElementById('myOverlay');
  const ctx = canvas.getContext('2d');
  const video = document.getElementById('myVideo');
  const play = document.getElementById('btn-play');
  const stop = document.getElementById('btn-stop');
  const tracker = new tracking.ObjectTracker(['face']);

  let contentWidth = window.innerWidth;
  let contentHeight = window.innerHeight;
  let track;

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

    ctx.clearRect(0, 0, contentWidth * DPR, contentHeight * DPR);

    if (e.data.length === 0) {
      // No objects were detected in this frame.
    } else {
      console.log('detected', ctx.canvas.clientWidth, ctx.canvas.clientHeight);
      e.data.forEach(rect => {
        let width, height;
        console.log(rect);
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
    }
  });

  initialize();


  tracking.track('#myVideo', tracker);

}();
