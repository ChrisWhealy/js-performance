// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : June 2013
// Updated : Jan 2020
//
// Calculate a fractal image.  Currently, only the Mandelbrot Set and the Julia Set have been implemented
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
, pixelXToCoordX
, pixelYToCoordY
, updateJuliaCoordTxt
} from "./utilities.js"

import {
  draw_julia
, draw_mandel
} from '../pkg/fractal_explorer.js'

// *********************************************************************************************************************
// PRIVATE API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Time how long it takes to plot a new fractal image
// *********************************************************************************************************************
const fractalPlot =
  (fType, argList) =>
    (calcUsing =>
      $id(`${fType}${calcUsing}Runtime`).innerHTML = `${timer(fractalCalc, [fType, calcUsing].concat(argList || []))}`
    )
    (getRadio('calcUsing'))

// *********************************************************************************************************************
// Calculate a new fractal image
// *********************************************************************************************************************
const fractalCalc =
  (fType, calcUsing, mandelXArg, mandelYArg) => {
    let cvs = $id(`${fType}Image`)

    // Calculate half the width and height given the current number of pixels per unit
    let halfWidthUnits  = cvs.width  / 2 / window[`${fType}PixelsPerUnit`]
    let halfHeightUnits = cvs.height / 2 / window[`${fType}PixelsPerUnit`]
    
    // Fractal image parameters
    let imgSpace = {}

    // Get selected colour map
    imgSpace.colourMap = window.colourMaps[parseInt(getRadio('colourScheme'))]

    // Mouse pointer location in Mandelbrot Set if calculating a Julia Set
    imgSpace.mandelX = mandelXArg || 0.0
    imgSpace.mandelY = mandelYArg || 0.0

    // Allow for future inclusion of other fractal types 
    switch (fType) {
      case C.MANDELBROT:
        imgSpace.xMin = window.mandelOrigin[0] - halfWidthUnits 
        imgSpace.xMax = window.mandelOrigin[0] + halfWidthUnits 
        imgSpace.yMin = window.mandelOrigin[1] - halfHeightUnits
        imgSpace.yMax = window.mandelOrigin[1] + halfHeightUnits
        break

      case C.JULIA:
        imgSpace.xMin = -halfWidthUnits
        imgSpace.xMax = +halfWidthUnits
        imgSpace.yMin = -halfHeightUnits
        imgSpace.yMax = +halfHeightUnits
        break
      
      default :
    }

    // Calculate the required fractal based on either JS or WASM
    calcUsing === "WASM" ? fractalCalcWASM(fType, cvs, imgSpace) : fractalCalcJS(fType, cvs, imgSpace)
  }

// *********************************************************************************************************************
// Calculate the selected fractal image
// *********************************************************************************************************************
const fractalCalcWASM =
  (fType, cvs, imgSpace) => {
    switch(fType) {
      case C.MANDELBROT:
        draw_mandel(
          cvs.getContext('2d'), cvs.width, cvs.height
        , imgSpace.xMax, imgSpace.xMin, imgSpace.yMax, imgSpace.yMin
        , window.maxIters, imgSpace.colourMap, window.isLittleEndian
        )
        break
      
      case C.JULIA:
        draw_julia(
          cvs.getContext('2d'), cvs.width, cvs.height
        , imgSpace.xMax, imgSpace.xMin, imgSpace.yMax, imgSpace.yMin
        , imgSpace.mandelX, imgSpace.mandelY
        , window.maxIters, imgSpace.colourMap, window.isLittleEndian
        )
        break
      
      default:
    }
  }

// *********************************************************************************************************************
// Calculate the selected fractal image using JavaScript
// *********************************************************************************************************************
const fractalCalcJS = 
  (fType, cvs, imgSpace) => {
    let ctx = cvs.getContext('2d')
    let img = ctx.createImageData(cvs.width, cvs.height) 

    // ArrayBuffer holds the [r,g,b,a] pixel data for the canvas.  Write to the ArrayBuffer using the 32-bit overlay,
    // read from it using the 8-bit overlay
    let buf   = new ArrayBuffer(img.data.length)
    let buf8  = new Uint8ClampedArray(buf)
    let buf32 = new Uint32Array(buf)

    // Prepare pixel to coordinate translation functions
    let xCoordFn = pixelXToCoordX(imgSpace, cvs.width)
    let yCoordFn = pixelYToCoordY(imgSpace, cvs.height)

    for (let iy = 0; iy < cvs.height; ++iy) {
      for (let ix = 0; ix < cvs.width; ++ix) {
        // Fetch the RGBA colour array of the current pixel from the selected colour map using the appropriate iteration
        // function
        let thisColour = imgSpace.colourMap[
          fType === C.MANDELBROT
          ? mandelIter(xCoordFn(ix), yCoordFn(iy))
          : escapeTimeMJ(imgSpace.mandelX, imgSpace.mandelY, xCoordFn(ix), yCoordFn(iy))
        ]

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
// *********************************************************************************************************************
const mandelIter = (x_val, y_val) => mandelEarlyBailout(x_val, y_val) ? window.maxIters : escapeTimeMJ(x_val, y_val)

// *********************************************************************************************************************
// Calculate whether the current point lies within the Mandelbrot Set's main cardioid or the period-2 bulb
// If it does, then we can bail out early
// *********************************************************************************************************************
const isInMainCardioid   = (x, y) => (temp => temp * (temp + x - 0.25) <= (y * y) / 4.0)(sumOfSquares(x - 0.25, y))
const isInPeriod2Bulb    = (x, y) => sumOfSquares(x + 1.0, y) <= 0.0625
const mandelEarlyBailout = (x, y) => isInMainCardioid(x, y) || isInPeriod2Bulb(x, y)

// *********************************************************************************************************************
// Common escape time algorithm for calculating both the Mandelbrot and Julia Sets
// *********************************************************************************************************************
const escapeTimeMJ =
  (mandelX, mandelY, xArg, yArg) => {
    let x         = xArg || 0
    let y         = yArg || 0
    let new_x     = 0
    let new_y     = 0
    let iterCount = 0

    // Count the number of iterations needed before the value at the current location either escapes to infinity or hits
    // the iteration limit
    while ((sumOfSquares(x, y) <= C.BAILOUT) && iterCount < window.maxIters) {
      new_x = mandelX + diffOfSquares(x, y)
      new_y = mandelY + (2 * x * y)
      x     = new_x
      y     = new_y
      iterCount++
    }
      
    return iterCount
  }

// *********************************************************************************************************************
// PUBLIC API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Calculate a new Mandelbrot set image
// *********************************************************************************************************************
const mandelPlot = () => fractalPlot(C.MANDELBROT)

// *********************************************************************************************************************
// Plot Julia set for current mouse pointer position in the Mandelbrot set
// *********************************************************************************************************************
const juliaPlot =
  evt =>
    (mp2c => {
      updateJuliaCoordTxt(mp2c.x_coord, mp2c.y_coord)
      fractalPlot(C.JULIA, [mp2c.x_coord, mp2c.y_coord])
    })
    (mousePosToCoords(evt))

// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export {
  mandelPlot
, juliaPlot
}