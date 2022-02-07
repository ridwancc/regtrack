/**
 * Represents a single point
 */
 export class Point {
    constructor (x, y) {
      this.x = x ? x : 0
      this.y = y ? y : 0
    }
}

/**
 * Text coordinates
 */
class TextCoord {
  constructor (u, v) {
    this.u = u ? u : 0
    this.v = v ? v : 0
  }
}

/**
 * A geometric triangle
 */
class Triangle {
  constructor (p0, topLeft, topRight, t0, t1, t2) {
    this.p0 = p0
    this.topLeft = topLeft
    this.topRight = topRight

    this.t0 = t0
    this.t1 = t1
    this.t2 = t2
  }
}

/**
 * Renders a triangle on the canvas
 * @param context
 * @param image
 * @param tri - the triangle
 * @param wireframe - should it use a wireframe
 */
const render = (context, image, tri, wireframe) => {

  if (wireframe) {
    context.strokeStyle = 'green'
    context.beginPath()
    context.moveTo(tri.p0.x, tri.p0.y)
    context.lineTo(tri.topLeft.x, tri.topLeft.y)
    context.lineTo(tri.topRight.x, tri.topRight.y)
    context.lineTo(tri.p0.x, tri.p0.y)
    context.stroke()
    context.closePath()
  }

  if (image) {
    drawTriangle(context, image,
      tri.p0.x, tri.p0.y,
      tri.topLeft.x, tri.topLeft.y,
      tri.topRight.x, tri.topRight.y,
      tri.t0.u, tri.t0.v,
      tri.t1.u, tri.t1.v,
      tri.t2.u, tri.t2.v)
  }
}

/**
 * Draws the stretched image based on the triangle geometry.
 * @param context
 * @param image
 * @param triangles
 * @param wireframe - should it use a wireframe
 */
export const drawStretched = (context, image, triangles, wireframe) => {
    triangles.forEach(triangle => render(context, image, triangle, wireframe))
}

/**
 * Calculates the triangles that meet the co-ordinates.
 * @param image
 * @param topLeft
 * @param topRight
 * @param bottomRight
 * @param bottomLeft
 * @returns triangles
 */
export const calculateGeometry = function (image, topLeft, topRight, bottomRight, bottomLeft) {
  // Define triangles
  const triangles = []

  // generate subdivision
  var subs = 9 // vertical subdivisions
  var divs = 9 // horizontal subdivisions

  var dx1 = bottomLeft.x - topLeft.x
  var dy1 = bottomLeft.y - topLeft.y
  var dx2 = bottomRight.x - topRight.x
  var dy2 = bottomRight.y - topRight.y

  var imgW = image.naturalWidth
  var imgH = image.naturalHeight

  for (var sub = 0; sub < subs; ++sub) {
    var curRow = sub / subs
    var nextRow = (sub + 1) / subs

    var curRowX1 = topLeft.x + dx1 * curRow
    var curRowY1 = topLeft.y + dy1 * curRow

    var curRowX2 = topRight.x + dx2 * curRow
    var curRowY2 = topRight.y + dy2 * curRow

    var nextRowX1 = topLeft.x + dx1 * nextRow
    var nextRowY1 = topLeft.y + dy1 * nextRow

    var nextRowX2 = topRight.x + dx2 * nextRow
    var nextRowY2 = topRight.y + dy2 * nextRow

    for (var div = 0; div < divs; ++div) {
      var curCol = div / divs
      var nextCol = (div + 1) / divs

      var dCurX = curRowX2 - curRowX1
      var dCurY = curRowY2 - curRowY1
      var dNextX = nextRowX2 - nextRowX1
      var dNextY = nextRowY2 - nextRowY1

      var topLeftx = curRowX1 + dCurX * curCol
      var topLefty = curRowY1 + dCurY * curCol

      var topRightx = curRowX1 + (curRowX2 - curRowX1) * nextCol
      var topRighty = curRowY1 + (curRowY2 - curRowY1) * nextCol

      var bottomRightx = nextRowX1 + dNextX * nextCol
      var bottomRighty = nextRowY1 + dNextY * nextCol

      var bottomLeftx = nextRowX1 + dNextX * curCol
      var bottomLefty = nextRowY1 + dNextY * curCol

      var u1 = curCol * imgW
      var u2 = nextCol * imgW
      var v1 = curRow * imgH
      var v2 = nextRow * imgH

      var triangle1 = new Triangle(
        new Point(topLeftx - 1, topLefty),
        new Point(bottomRightx + 2, bottomRighty + 1),
        new Point(bottomLeftx - 1, bottomLefty + 1),
        new TextCoord(u1, v1),
        new TextCoord(u2, v2),
        new TextCoord(u1, v2)
      )

      var triangle2 = new Triangle(
        new Point(topLeftx - 2, topLefty),
        new Point(topRightx + 1, topRighty),
        new Point(bottomRightx + 1, bottomRighty + 1),
        new TextCoord(u1, v1),
        new TextCoord(u2, v1),
        new TextCoord(u2, v2)
      )

      triangles.push(triangle1)
      triangles.push(triangle2)
    }
  }
  return triangles
}

// from http://tulrich.com/geekstuff/canvas_3d/jsgl.js
var drawTriangle = function (ctx, im, x0, y0, x1, y1, x2, y2, sx0, sy0, sx1, sy1, sx2, sy2) {
  ctx.save()

  // Clip the output to the on-screen triangle boundaries.
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.closePath()
  // ctx.stroke();//xxxxxxx for wireframe
  ctx.clip()

  var denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0
  if (denom == 0) {
    return
  }
  var m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom
  var m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom
  var m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom
  var m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom
  var dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom
  var dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom

  ctx.transform(m11, m12, m21, m22, dx, dy)
  ctx.drawImage(im, 0, 0)
  ctx.restore()
}