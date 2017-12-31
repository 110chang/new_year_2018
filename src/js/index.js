
import './tracking-min';
import './face-min';

window.URL = window.URL || window.webkitURL;

!function() {

  const DPR = window.devicePixelRatio;

  let contentWidth = window.innerWidth;
  let contentHeight = window.innerHeight;

  let img = new Image();
  img.src = '../img/Laughing_man.png';

  let imgWidth, imgHeight;

  img.onload = () => {
    imgWidth = img.width * DPR;
    imgHeight = img.height * DPR;
  };

  const canvas = document.getElementById('myOverlay');
  const ctx = canvas.getContext('2d');

  const video = document.getElementById('myVideo');
  video.onloadedmetadata = e => {
    // Do something with the video here.
    console.log(e.srcElement.offsetHeight);
    contentWidth = e.srcElement.offsetWidth;
    contentHeight = e.srcElement.offsetHeight;
    canvas.setAttribute('width', contentWidth * DPR);
    canvas.setAttribute('height', contentHeight * DPR);
    ctx.strokeStyle = '#0F0';
    ctx.lineWidth = 1;
  };
  let track;

  const playCamera = () => {
    console.log('play cam');
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
  playCamera();


  const play = document.getElementById('btn-play');
  play.addEventListener('click', e => {
    console.log('play');
    playCamera();
  });

  const stop = document.getElementById('btn-stop');
  stop.addEventListener('click', e => {
    console.log('stop');
    track.stop();
  });

  const objects = new tracking.ObjectTracker(['face']);

  objects.on('track', e => {

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
          height = rect.width * imgHeight / imgWidth;
        } else {
          width = rect.height * imgWidth / imgHeight;
          height = rect.height;
        }
        ctx.beginPath();
        ctx.strokeRect(rect.x * DPR, rect.y * DPR, rect.width * DPR, rect.height * DPR);
        // ctx.drawImage(img, rect.x * 1, rect.y * 1, width * 1, height * 1);
      });
    }
  });

  tracking.track('#myVideo', objects);

}();
