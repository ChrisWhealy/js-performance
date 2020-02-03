// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : June 2013
// Updated : Dec 2019
//
// Calculate a fractal image.  Currently, only the Mandelbrot Set and the Julia Set have been implemented
//
// *********************************************************************************************************************

import * as C from "./constants.js"
import setRGB from "./endian.js"

import {
  $id
, getRadio
, mousePosToCoords
, sumOfSquares
, diffOfSquares
, timer
} from "./utilities.js"

import {
  draw_julia
, draw_mandel
} from '../pkg/fractal_explorer.js'



// *********************************************************************************************************************
// *********************************************************************************************************************
//
//                                                 P R I V A T E   A P I
//
// *********************************************************************************************************************
// *********************************************************************************************************************



// *********************************************************************************************************************
// Plot a new fractal image
// *********************************************************************************************************************
const fractalPlot =
  (fType, argList) =>
    (calcUsing =>
      $id(`${fType}${calcUsing}Runtime`).innerHTML = `${timer(fractalCalc, [fType, calcUsing].concat(argList))}`
    )
    (getRadio('calcUsing'))

// *********************************************************************************************************************
// Calculate a new fractal image
// *********************************************************************************************************************
const fractalCalc =
  (fType, calcUsing, mandelXCoord, mandelYCoord) => {
    let cvs = $id(`${fType}Image`)

    // Calculate half the width and height given the current number of pixels per unit
    let halfWidthUnits  = cvs.width  / 2 / window[`${fType}PixelsPerUnit`]
    let halfHeightUnits = cvs.height / 2 / window[`${fType}PixelsPerUnit`]
    
    // Fractal image parameters
    let imageSpace = {}

    imageSpace.mandelXCoord = mandelXCoord || 0.0
    imageSpace.mandelYCoord = mandelYCoord || 0.0

    // Allow for future inclusion of other fractal types 
    switch (fType) {
      case C.MANDELBROT:
        imageSpace.xMin = window.mandelOrigin[0] - halfWidthUnits 
        imageSpace.xMax = window.mandelOrigin[0] + halfWidthUnits 
        imageSpace.yMin = window.mandelOrigin[1] - halfHeightUnits
        imageSpace.yMax = window.mandelOrigin[1] + halfHeightUnits

        // Calculate the required fractal based on either JS or WASM
        calcUsing === "WASM" ? mandelCalcWASM(cvs, imageSpace)
                             : mandelCalcJS(cvs, imageSpace)
        break

      case C.JULIA:
        imageSpace.xMin = halfWidthUnits * -1
        imageSpace.xMax = halfWidthUnits
        imageSpace.yMin = halfHeightUnits * -1
        imageSpace.yMax = halfHeightUnits

        // Calculate the required fractal based on either JS or WASM
        calcUsing === "WASM" ? juliaCalcWASM(cvs, imageSpace)
                             : juliaCalcJS(cvs, imageSpace)

        break
      
      default :
    }
  }

// *********************************************************************************************************************
// Calculate the Mandelbrot Set using Web Assembly
// *********************************************************************************************************************
const mandelCalcWASM =
  (cvs, imageSpace) => {
    let colourScheme  = parseInt(getRadio('colourScheme'))
    let thisColourMap = window.colourMaps[colourScheme]

    draw_mandel(
      cvs.getContext('2d')
    , cvs.width, cvs.height
    , imageSpace.xMax, imageSpace.xMin
    , imageSpace.yMax, imageSpace.yMin
    , window.maxIters, thisColourMap
    , window.isLittleEndian
    )
  }

// *********************************************************************************************************************
// Calculate the Mandelbrot Set using JavaScript
// *********************************************************************************************************************
const mandelCalcJS = 
  (cvs, imageSpace) => {
    let ctx = cvs.getContext('2d')
    let img = ctx.createImageData(cvs.width, cvs.height) 

    let thisColourMap = window.colourMaps[parseInt(getRadio('colourScheme'))]

    // Use an ArrayBuffer to hold the [r,g,b,a] pixel data for the canvas
    // Use an 8 bit overlay for reading ArrayBuffer pixel data
    // Use a 32 bit overlay for writing ArrayBuffer pixel data
    let buf   = new ArrayBuffer(img.data.length)
    let buf8  = new Uint8ClampedArray(buf)
    let buf32 = new Uint32Array(buf)
    
    for (let iy = 0; iy < cvs.height; ++iy) {
      for (let ix = 0; ix < cvs.width; ++ix) {
        // Translate (x,y) pixel value of the canvas to the (x,y) coordinate space of Mandelbrot Set
        let x_val = imageSpace.xMin + (imageSpace.xMax - imageSpace.xMin) * ix / (cvs.width-1)
        let y_val = imageSpace.yMin + (imageSpace.yMax - imageSpace.yMin) * iy / (cvs.height-1)

        // Fetch the RGB colour array of the current pixel from the selected colour map
        let thisColour = thisColourMap[mandelIter(x_val, y_val)]

        // Write the current pixel to the ArrayBuffer via the 32 bit overlay
        buf32[iy * cvs.width + ix] = setRGB(thisColour[0], thisColour[1], thisColour[2])
      }
    }

    // Update the canvas with the new image
    img.data.set(buf8)
    ctx.putImageData(img, 0, 0)
  }

// *********************************************************************************************************************
// Return the iteration value of a particular pixel in the Mandelbrot set
// This calculation has been optimized to bail out early if the current point is located within the main cardioid or the
// period-2 bulb
// *********************************************************************************************************************
const mandelIter =
  (x_val, y_val) =>
    ((iters, temp) =>
      // Does the current x_val lie within either the main cardioid?
      (temp * (temp + x_val - 0.25) <= (y_val * y_val) / 4.0) ||
      // Or the period 2 bulb?
      (sumOfSquares(x_val + 1, y_val) < 0.0625)
      // Yup, so bail out early
      ? window.maxIters
      // Nope, so count the number of iterations before either the current pixel escapes to infinity or hits the maximum
      // iteration limit
      : ((x_sqr, y_sqr, x, y) => {
          while (iters < window.maxIters && (x_sqr + y_sqr <= C.BAILOUT)) {
            y = 2*x*y + y_val
            x = x_sqr - y_sqr + x_val
            x_sqr = x*x
            y_sqr = y*y
            iters++
          }

          return iters
        })
        (0, 0, 0, 0)
    )
    // First arg  = Iteration counter
    // Second arg = Intermediate value for calculating early bailout
    (0, sumOfSquares(x_val - 0.25, y_val))

// *********************************************************************************************************************
// Calculate a Julia set using WASM
// *********************************************************************************************************************
const juliaCalcWASM =
  (cvs, juliaSpace) => {
    let colourScheme  = parseInt(getRadio('colourScheme'))
    let thisColourMap = window.colourMaps[colourScheme]

    draw_julia(
      cvs.getContext('2d')
    , cvs.width, cvs.height
    , juliaSpace.xMax, juliaSpace.xMin
    , juliaSpace.yMax, juliaSpace.yMin
    , juliaSpace.mandelXCoord, juliaSpace.mandelYCoord
    , window.maxIters, thisColourMap
    , window.isLittleEndian
    )
  }


// *********************************************************************************************************************
// Calculate a Julia set using JavaScript
// *********************************************************************************************************************
const juliaCalcJS =
  (cvs, juliaSpace) => {
    let ctx = cvs.getContext('2d')
    let img = ctx.createImageData(cvs.width, cvs.height)

    let thisColourMap = window.colourMaps[parseInt(getRadio('colourScheme'))]
    
    // Use an ArrayBuffer to hold the [r,g,b,a] pixel data for the canvas
    // Use an 8 bit overlay for reading ArrayBuffer pixel data
    // Use a 32 bit overlay for writing ArrayBuffer pixel data
    let buf   = new ArrayBuffer(img.data.length)
    let buf8  = new Uint8ClampedArray(buf)
    let buf32 = new Uint32Array(buf)
    
    for (let iy = 0; iy < cvs.height; ++iy) {
      // This is really weird...
      // The following two functions only need to be created once per Julia Set; however, if the two declarations below
      // are moved outside the scope of this for loop, then the performance takes a significant nose-dive
      let juliaXStepFn = makeJuliaXStepFn(juliaSpace.mandelXCoord)
      let juliaYStepFn = makeJuliaYStepFn(juliaSpace.mandelYCoord)

      for (let ix = 0; ix < cvs.width; ++ix) {
        // Translate (x,y) pixel value of the canvas to the (x,y) coordinate space of Julia set currently being plotted
        let x_coord = juliaSpace.xMin + (juliaSpace.xMax - juliaSpace.xMin) * ix / (cvs.width - 1)
        let y_coord = juliaSpace.yMin + (juliaSpace.yMax - juliaSpace.yMin) * iy / (cvs.height - 1)

        // Fetch the RGB colour array of the current pixel from the selected colour map
        let thisColourMapIdx = thisColourMap[juliaIter(x_coord, y_coord, juliaXStepFn, juliaYStepFn)]

        // Write the current pixel to the ArrayBuffer via the 32 bit overlay
        buf32[iy * cvs.width + ix] = setRGB(thisColourMapIdx[0], thisColourMapIdx[1], thisColourMapIdx[2])
      }
    }

    img.data.set(buf8)
    ctx.putImageData(img, 0, 0)
  }

// *********************************************************************************************************************
// Return the iteration value of a particular pixel in the Julia set
// *********************************************************************************************************************
const makeJuliaXStepFn = mandelXCoord => (x, y) => mandelXCoord + diffOfSquares(x, y)
const makeJuliaYStepFn = mandelYCoord => (x, y) => mandelYCoord + (2 * x * y)

const juliaIter =
  (x_coord, y_coord, juliaXStepFn, juliaYStepFn) => {
    let iterCount = 0
    let new_x     = 0
    let new_y     = 0

    // Determine if the value at the current location escapes to infinity or not.
    while ((sumOfSquares(new_x, new_y) <= C.BAILOUT) && iterCount < window.maxIters) {
      new_x = juliaXStepFn(x_coord, y_coord)
      new_y = juliaYStepFn(x_coord, y_coord)
      x_coord = new_x
      y_coord = new_y
      iterCount++
    }
      
    return iterCount
  }

// *********************************************************************************************************************
// *********************************************************************************************************************
//
//                                                  P U B L I C    A P I
//
// *********************************************************************************************************************
// *********************************************************************************************************************


// *********************************************************************************************************************
// Calculate a new Mandelbrot set image
// *********************************************************************************************************************
const mandelPlot = () => fractalPlot(C.MANDELBROT, [])

// *********************************************************************************************************************
// Plot Julia set for current mouse pointer position in the Mandelbrot set
// *********************************************************************************************************************
const juliaPlot =
  evt =>
    (p2c => {
      // Update text for Julia Set coordinates
      $id('mouseX').innerHTML = p2c.x_coord
      $id('mouseY').innerHTML = p2c.y_coord;  // <-- One of the few places a semicolon is actually needed!

      fractalPlot(C.JULIA, [p2c.x_coord, p2c.y_coord])
    })
    (mousePosToCoords(evt))


// *********************************************************************************************************************
export {
  mandelPlot
, juliaPlot
}