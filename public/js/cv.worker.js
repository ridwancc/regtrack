/**
 * Gets the plate rect from a detections vector
 * @param {RectVector} detected 
 * @param {int} imageScale 
 * @returns {Rect} rect
 */
const getPlateRect = (detected) => {
  let rect;
  if (detected.size() > 0) {
    rect = new cv.Rect(
      detected.get(0).x,
      detected.get(0).y,
      detected.get(0).width,
      detected.get(0).height
    )
    return rect;
  }
  return null;
}

/**
 * Detects the shape of a contour
 * @param {MatVector} contour 
 * @returns {string} shape
 */
const detectShape = (contour) => {
  let shape = 'unidentified'
  let temp = new cv.Mat();
  cv.approxPolyDP(contour, temp, .04 * cv.arcLength(contour, true), true);
  let n = temp.total();
  if (4 == n) {
    let rect = cv.boundingRect(temp);
    let r = rect.width / rect.height;
    shape = r >= .95 && r <= 1.05 ? 'SQUARE' : 'RECTANGLE'
  }
  temp.delete();
  return shape;
}

let prev;

/**
 * Main function for detecting a plate and sending it back to the main thread
 * @param {*} data  {msg,payload}
 */
const detectPlate = ({ msg, payload }) => {
  const startTime = performance.now()
  const { imageData, vrn } = payload

  // create matrice from the image data
  const src = cv.matFromImageData(imageData)

  if (!prev) {
    // haarcascade classifier
    const detections = new cv.RectVector();
    classifier.detectMultiScale(src, detections, 1.5, 3)

    // get the plate rect
    const rect = getPlateRect(detections)

    // if we dont have a number plate then return null back to the main thread
    if (rect == null) return postMessage({ msg, payload: null })

    // copy the region on a new matrice
    let plate = new cv.Mat.zeros(src.size(), src.type());
    src.roi(rect).copyTo(plate.roi(rect))

    const canny = new cv.Mat()
    cv.cvtColor(plate, canny, cv.COLOR_RGBA2GRAY)
    cv.Canny(plate, canny, 0, 255, 3, false)

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(canny, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    let shapes = [];
    for (let i = 0; i < contours.size(); i++) {
      const shape = detectShape(contours.get(i))
      if (shape === 'RECTANGLE') {
        const area = cv.contourArea(contours.get(i))
        const rectArea = rect.width * rect.height
        if (area > 0.1 * rectArea && area < 0.9 * rectArea) {
          const rect = cv.minAreaRect(contours.get(i))
          shapes.push({
            index: i,
            rect
          })
        }
      }
    }

    plate = new cv.Mat.zeros(src.size(), src.type())
    shapes.forEach(shape => {
      const { rect, index } = shape
      // draw rectangle
      const hull = new cv.Mat();
      const approx = new cv.MatVector();
      cv.convexHull(contours.get(index), hull, false, true);
      approx.push_back(hull);
      cv.drawContours(plate, approx, 0, [255, 255, 255, 255], cv.FILLED);
      hull.delete();
      approx.delete();
    })

    let plateGrey = new cv.Mat()
    cv.cvtColor(plate, plateGrey, cv.COLOR_RGBA2GRAY)
    let p0 = new cv.Mat()
    let none = new cv.Mat()

    cv.goodFeaturesToTrack(plateGrey, p0, 4, 0.01, 10, none, 3, false, 0.04)

    // draw the features
    let mask = new cv.Mat.zeros(src.size(), src.type())
    let points = []
    for (let i = 0; i < p0.rows; i++) {
      const x = p0.data32F[i * 2]
      const y = p0.data32F[i * 2 + 1]
      points.push({ x, y })
      cv.circle(mask, new cv.Point(x, y), 3, [255, 255, 255, 255], -1, cv.LINE_AA, 0)
    }

    // store the frame and features for tracking in the next frame
    if (p0.rows > 3) {
      prev = {
        src: src.clone(),
        p0: p0.clone()
      }
    }

    postMessage({ msg, payload: { imageData: imageDataFromMat(mask) } });

    src.delete()
    plate.delete()
    detections.delete()
    canny.delete()
    contours.delete()
    hierarchy.delete()
    plateGrey.delete()
    p0.delete()
    none.delete()
    mask.delete()

  } else {
    // we have a previous frame so we can track the features

    // current frame
    let frameGrey = new cv.Mat()
    cv.cvtColor(src, frameGrey, cv.COLOR_RGBA2GRAY)
    let p1 = new cv.Mat();
    let st = new cv.Mat();
    let err = new cv.Mat();

    // previous frame
    let prevGrey = new cv.Mat()
    cv.cvtColor(prev.src, prevGrey, cv.COLOR_RGBA2GRAY)

    let mask = new cv.Mat.zeros(src.size(), src.type())

    // Lukas Kanade parameters
    let winSize = new cv.Size(15, 15);
    let maxLevel = 2;
    let criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 0.03);

    try {
      // Calculate optical flow
      cv.calcOpticalFlowPyrLK(prevGrey, frameGrey, prev.p0, p1, st, err, winSize, maxLevel, criteria, 1);
    } catch (err) {
      console.log(err);
    }

    // select good points
    let goodNew = [];
    for (let i = 0; i < st.rows; i++) {
      if (st.data[i] === 1) {
        goodNew.push(new cv.Point(p1.data32F[i * 2], p1.data32F[i * 2 + 1]));
      }
    }

    // sort the points in clockwise 
    goodNew.sort((a, b) => a.y - b.y);
    const cy = (goodNew[0].y + goodNew[goodNew.length - 1].y) / 2;
    goodNew.sort((a, b) => b.x - a.x);
    const cx = (goodNew[0].x + goodNew[goodNew.length - 1].x) / 2;
    const center = { x: cx, y: cy };

    let startAng;
    goodNew.forEach(point => {
      let ang = Math.atan2(point.y - center.y, point.x - center.x);
      if (!startAng) { startAng = ang }
      else {
        if (ang < startAng) {  // ensure that all points are clockwise of the start point
          ang += Math.PI * 2;
        }
      }
      point.angle = ang; // add the angle to the point
    });
    goodNew.sort((a, b) => a.angle - b.angle);

    // get the average distance from the center of the points
    const pointDist = [];
    goodNew.forEach(point => {
      const dist = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));
      pointDist.push(dist);
    });
    const avgDist = pointDist.reduce((a, b) => a + b, 0) / pointDist.length;

    // if a point is outside the average distance then remove it from the goodNew list
    goodNew.forEach((point, i) => {
      const distance = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));
      if (distance > avgDist * 1.05) {
        goodNew.splice(i, 1);
        i--;
      }
    });

    if (goodNew.length > 3) {
      goodNew.forEach((point, i) => {
        const nextPoint = goodNew[i + 1];
        cv.circle(mask, point, 2, [0, 255, 0, 255], -1, cv.LINE_AA, 0);
        if (nextPoint) {
          cv.line(mask, point, nextPoint, [0, 255, 0, 255], 2, cv.LINE_AA, 0);
        } else {
          cv.line(mask, point, goodNew[0], [0, 255, 0, 255], 2, cv.FILLED, 0);
        }
      });
    }


    // cv.add(src, mask, src);

    // now update the previous frame and previous points
    frameGrey.copyTo(prevGrey);
    prev.p0.delete(); prev.p0 = null;
    prev.p0 = new cv.Mat.zeros(goodNew.length, 1, cv.CV_32FC2);
    for (let i = 0; i < goodNew.length; i++) {
      prev.p0.data32F[i * 2] = goodNew[i].x;
      prev.p0.data32F[i * 2 + 1] = goodNew[i].y;
    }

    prev.src.delete(); prev.src = null;
    prev.src = src.clone();

    // delete prev if points are lost
    if (prev.p0.rows < 4) {
      prev.src.delete();
      prev.p0.delete();
      prev = null;
      postMessage({ msg, payload: null });
    }

    postMessage({ msg, payload: { imageData: imageDataFromMat(mask) } });

    // delete the matrices
    src.delete();
    frameGrey.delete()
    prevGrey.delete()
    p1.delete()
    st.delete()
    err.delete()
    mask.delete()
  }

  console.log(`detectPlate took ${performance.now() - startTime}ms`)
}

const createFileFromUrl = (path, url, callback) => {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function (ev) {
    if (request.readyState === 4) {
      if (request.status === 200) {
        let data = new Uint8Array(request.response);
        cv.FS_createDataFile('/', path, data, true, false, false);
        callback();
      } else {
        console.error('Failed to load ' + url + ' status: ' + request.status);
      }
    }
  };
  request.send();
};

let classifier;
const loadClassifier = () => {
  let plateCascadeFile = '/haarcascade_number_plate.xml';
  createFileFromUrl(plateCascadeFile, plateCascadeFile, () => {
    classifier = new cv.CascadeClassifier();
    classifier.load(plateCascadeFile);
    postMessage('cascade loaded');
  });
}

/**
 *  Here we will check from time to time if we can access the OpenCV
 *  functions. We will return in a callback if it's been resolved
 *  well (true) or if there has been a timeout (false).
 */

const waitForOpenCV = (callbackFn, waitTimeMs = 30000, stepTimeMs = 100) => {
  if (cv.Mat) callbackFn(true)

  let timeSpentMs = 0
  let interval = setInterval(() => {
    let limitReached = timeSpentMs > waitTimeMs
    if (cv.Mat || limitReached) {
      clearInterval(interval)
      return callbackFn(!limitReached)
    } else {
      timeSpentMs += stepTimeMs
    }
  }, stepTimeMs)
}

/**
 * This function converts again from cv.Mat to ImageData
 */
const imageDataFromMat = (mat) => {
  // converts the mat type to cv.CV_8U
  let img = new cv.Mat()
  let depth = mat.type() % 8
  let scale = depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0
  let shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0
  mat.convertTo(img, cv.CV_8U, scale, shift)

  // converts the img type to cv.CV_8UC4
  switch (img.type()) {
    case cv.CV_8UC1:
      cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA)
      break
    case cv.CV_8UC3:
      cv.cvtColor(img, img, cv.COLOR_RGB2RGBA)
      break
    case cv.CV_8UC4:
      break
    default:
      throw new Error(
        'Bad number of channels (Source image must have 1, 3 or 4 channels)'
      )
  }
  let clampedArray = new ImageData(
    new Uint8ClampedArray(img.data),
    img.cols,
    img.rows
  )
  img.delete()
  return clampedArray
}

/**
 * This exists to capture all the events that are thrown out of the worker
 * into the worker. Without this, there would be no communication possible
 * with the project.
 */
onmessage = (e) => {
  switch (e.data.msg) {
    case 'load': {
      // Import Webassembly script
      self.importScripts('./opencv.js')
      // self.importScripts('./opencv.js')
      waitForOpenCV(function (success) {
        if (success) postMessage({ msg: e.data.msg })
        else throw new Error('Error on loading OpenCV')
      })
      break
    }
    case 'detectPlate':
      return detectPlate(e.data)
    case 'loadClassifier':
      return loadClassifier()
    default:
      break
  }
}