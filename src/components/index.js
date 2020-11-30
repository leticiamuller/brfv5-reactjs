import { setupExample } from './brfv5-browser/js/examples/setup__example.js'
import { trackCamera, trackImage } from './brfv5-browser/js/examples/setup__example.js'

import { drawCircles } from './brfv5-browser/js/utils/utils__canvas.js'
import { drawFaceDetectionResults } from './brfv5-browser/js/utils/utils__draw_tracking_results.js'
import { detectBlink } from './brfv5-browser/js/utils/utils__blink_detection.js'

import { brfv5 } from './brfv5-browser/js/brfv5/brfv5__init.js'
import { colorPrimary, colorSecondary } from './brfv5-browser/js/utils/utils__colors.js'

let _leftEyeBlinked         = false;
let _rightEyeBlinked        = false;

let _leftEyeTimeOut         = -1;
let _rightEyeTimeOut        = -1;

const _leftEyeLidDistances  = [];
const _rightEyeLidDistances = [];

export const configureExample = (brfv5Config) => {

  // No special configuration necessary, defaults are fine.
}

export const handleTrackingResults = (brfv5Manager, brfv5Config, canvas) => {

  const ctx   = canvas.getContext('2d')
  const faces = brfv5Manager.getFaces()

  let doDrawFaceDetection = false

  for(let i = 0; i < faces.length; i++) {

    const face = faces[i];

    if(face.state === brfv5.BRFv5State.FACE_TRACKING) {

      drawCircles(ctx, face.landmarks, colorPrimary, 2.0);

      // Select the eye landmarks, then detect blinks for left and right individually:

      const lm                = face.landmarks;
      const leftEyeLandmarks  = [lm[36], lm[39], lm[37], lm[38], lm[41], lm[40]];
      const rightEyeLandmarks = [lm[45], lm[42], lm[44], lm[43], lm[46], lm[47]];

      detectBlinkLeft( leftEyeLandmarks,  _leftEyeLidDistances,  ctx);
      detectBlinkRight(rightEyeLandmarks, _rightEyeLidDistances, ctx);

      // White for blink, blue for no blink:

      drawCircles(ctx, leftEyeLandmarks,
        _leftEyeBlinked ? colorSecondary : colorPrimary, 3.0);
      drawCircles(ctx, rightEyeLandmarks,
        _rightEyeBlinked ? colorSecondary : colorPrimary, 3.0);

    } else {

      _leftEyeLidDistances.length  = 0;
      _rightEyeLidDistances.length = 0;

      doDrawFaceDetection = true;
    }
  }

  if(doDrawFaceDetection) {

    drawFaceDetectionResults(brfv5Manager, brfv5Config, canvas)
  }

  return false
}

const detectBlinkLeft = (lm, distances) => {

  const blinked = detectBlink(lm[0], lm[1], lm[2], lm[3], lm[4], lm[5], distances);

  // Keep a blink status for 0.150 seconds, then reset:

  if(blinked) {

    // Set blinked! Reset after 150ms.

    _leftEyeBlinked = true;

    if(_leftEyeTimeOut > -1) { clearTimeout(_leftEyeTimeOut); }

    _leftEyeTimeOut = setTimeout(() => { _leftEyeBlinked = false; }, 150);
  }
}

const detectBlinkRight = (lm, distances) => {

  const blinked = detectBlink(lm[0], lm[1], lm[2], lm[3], lm[4], lm[5], distances);

  if(blinked) {

    // Set blinked! Reset after 150ms.

    _rightEyeBlinked = true;

    if(_rightEyeTimeOut > -1) { clearTimeout(_rightEyeTimeOut); }

    _rightEyeTimeOut = setTimeout(() => { _rightEyeBlinked = false; }, 150);
  }
}

const exampleConfig = {

  onConfigure:              configureExample,
  onTracking:               handleTrackingResults
}

// run() will be called automatically after 1 second, if run isn't called immediately after the script was loaded.
// Exporting it allows re-running the configuration from within other scripts.

let timeoutId = -1

export const run = () => {

  clearTimeout(timeoutId)
  setupExample(exampleConfig)

  if(window.selectedSetup === 'image') {

    trackImage('./assets/tracking/' + window.selectedImage)

  } else {

    trackCamera()
  }
}

timeoutId = setTimeout(() => { run() }, 1000)

export default { run }