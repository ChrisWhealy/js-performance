// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : June 2013
// Updated : Jan 2020
//
// Various utility functions
// *********************************************************************************************************************

import * as C         from "./constants.js"
import { mandelPlot } from "./fractal.js"

// *********************************************************************************************************************
// PUBLIC API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Fetch DOM elements by id, class name or name
// Functions with "$" in the name cannot be defined using the fat arrow syntax
// *********************************************************************************************************************
function           $id(elId) { return document.getElementById(elId) }
function      $names(elName) { return document.getElementsByName(elName) }
function $classes(className) { return document.getElementsByClassName(className) }

// *********************************************************************************************************************
// Get radio button value
// *********************************************************************************************************************
const getRadio =
  elId =>
    (nodeList => {
      for (let idx=0; idx < nodeList.length; idx++ ) {
        if (nodeList[idx].checked) {
          return nodeList[idx].value
        }
      }

      return console.log(`Huh, that's not right: all the buttons in radio button group ${elId} are switched off`)
    })
    ($names(elId))

// *********************************************************************************************************************
// Translate the mouse pointer (X,Y) canvas location to the (X,Y) coordinate space of the Mandelbrot set
// *********************************************************************************************************************
const mousePosToCoords =
evt =>
(mousePos =>
  ({
    x_pos   : evt.pageX
    , y_pos   : evt.pageY
    , x_pxl   : mousePos.x
    , y_pxl   : mousePos.y
    , x_coord :  window.mandelXToCoordXFn(mousePos.x)
    , y_coord : -window.mandelYToCoordYFn(mousePos.y) // Flip sign because positive Y direction on a canvas is down!
  }))
  (mousePositionOnCanvas(evt))
  
// *********************************************************************************************************************
// Partial function that, given fixed values for the current canvas dimension, zoom level (ppu) and origin, translates a
// one-based canvas pixel location to a coordinate on either the X or Y axis
// *********************************************************************************************************************
const mouseAxisToCoordAxis = (cnvsDim, ppu, origin) => mousePos => origin + ((mousePos - (cnvsDim / 2)) / ppu)

// *********************************************************************************************************************
// Get the mouse position on the canvas as an (X,Y) pixel location
// *********************************************************************************************************************
const mousePositionOnCanvas =
  e =>
    isNaN(e.offsetX)
    ? mousePositionViaElementHierarchy(e)
    : (el =>
        ({ "x" : offsetToPos(e.offsetX, el.width,  el.offsetWidth)
         , "y" : offsetToPos(e.offsetY, el.height, el.offsetHeight)
        })
      )
      (e.target)

const offsetToPos = (offset, dim, offsetDim) => offset * (dim / offsetDim || 1)

// *********************************************************************************************************************
// Alternative version of the above function in case the offsetX property does not exist in the event object
// *********************************************************************************************************************
const mousePositionViaElementHierarchy =
  e =>
    ((x, y, el) => {
      do {
        x  -= el.offsetLeft
        y  -= el.offsetTop
        el  = el.offsetParent
      }
      // Stop when we reach the top of the DOM hierarchy
      while (el)

      return {
        "x" : x * (el.width  / el.offsetWidth  || 1)
      , "y" : y * (el.height / el.offsetHeight || 1)
      }
    })
    (e.pageX, e.pageY, e.target)

// *********************************************************************************************************************
// Translate canvas pixel locations to image coordinates
// One must be subtracted from the dimension (either width or height) because the supplied pixel location is a
// zero-based index, not one-based pixel position
// *********************************************************************************************************************
const pixelToCoord   = (min, max, dim)    => pixelLoc => min + (max - min) * pixelLoc / (dim - 1)
const pixelXToCoordX = (imgSpace, width)  => pixelToCoord(imgSpace.xMin, imgSpace.xMax, width)
const pixelYToCoordY = (imgSpace, height) => pixelToCoord(imgSpace.yMin, imgSpace.yMax, height)

// *********************************************************************************************************************
// Reset the UI back to its starting point
// *********************************************************************************************************************
const resetUI =
  () => {
    let cnvs = $id('mandelImage')

    // Reset Mandelbrot Set origin
    window.mandelOrigin[0] = C.DEFAULT_MANDEL_ORIGIN[0]
    window.mandelOrigin[1] = C.DEFAULT_MANDEL_ORIGIN[1]
    
    // Reset zoom level
    window.mandelPixelsPerUnit = C.DEFAULT_PPU
    window.juliaPixelsPerUnit  = C.DEFAULT_PPU
    
    // Reset functions that translate the mouse (X,Y) position over the Mandelbrot set to (X,Y) coordinates
    window.mandelXToCoordXFn = mouseAxisToCoordAxis(cnvs.width,  C.DEFAULT_PPU, C.DEFAULT_MANDEL_ORIGIN[0])
    window.mandelYToCoordYFn = mouseAxisToCoordAxis(cnvs.height, C.DEFAULT_PPU, C.DEFAULT_MANDEL_ORIGIN[1])
    
    // Reset radio buttons and maximum iteration depth
    $id('calcUsingWASM').checked = true
    $id('colourScheme1').checked = true

    $id('maxIters').value = C.DEFAULT_MAX_ITERS
    
    // Redraw the Mandelbrot Set
    mandelPlot()
  }

// *********************************************************************************************************************
// Zoom in to the Mandelbrot set
// *********************************************************************************************************************
const zoomIn =
  evt => {
    let p2c  = mousePosToCoords(evt)
    let cnvs = $id('mandelImage')

    // The mouse pointer location becomes the new image origin.  The sign of the Y coordinate must be flipped
    window.mandelOrigin[0] = p2c.x_coord
    window.mandelOrigin[1] = p2c.y_coord * -1
    
    // Zoom in by a factor of 2
    window.mandelPixelsPerUnit *= 2
    
    // Rebuild functions that translate the mouse (X,Y) position over the Mandelbrot set to (X,Y) coordinates
    window.mandelXToCoordXFn = mouseAxisToCoordAxis(cnvs.width,  window.mandelPixelsPerUnit, window.mandelOrigin[0])
    window.mandelYToCoordYFn = mouseAxisToCoordAxis(cnvs.height, window.mandelPixelsPerUnit, window.mandelOrigin[1])

    mandelPlot()
  }

// *********************************************************************************************************************
// Zoom out of the Mandelbrot set
// *********************************************************************************************************************
const zoomOut =
  () => {
    let cnvs = $id('mandelImage')

    // Zoom out by a factor of 2 unless that would zoom us out too far, in which case, go back to starting zoom level
    if (window.mandelPixelsPerUnit / 2 < C.DEFAULT_PPU) {
      window.mandelPixelsPerUnit = C.DEFAULT_PPU
      window.mandelOrigin[0] = C.DEFAULT_MANDEL_ORIGIN[0]
      window.mandelOrigin[1] = C.DEFAULT_MANDEL_ORIGIN[1]
    }
    else {
      window.mandelPixelsPerUnit /= 2
    }

    // Rebuild functions that translate the mouse (X,Y) position over the Mandelbrot set to (X,Y) coordinates
    window.mandelXToCoordXFn = mouseAxisToCoordAxis(cnvs.width,  window.mandelPixelsPerUnit, window.mandelOrigin[0])
    window.mandelYToCoordYFn = mouseAxisToCoordAxis(cnvs.height, window.mandelPixelsPerUnit, window.mandelOrigin[1])
    
    mandelPlot()
  }

// *********************************************************************************************************************
// Wrapper function to record the execution time of some function
// *********************************************************************************************************************
const timer =
  (fn, argList) => {
    let start_time = new Date()
    fn.apply(null, argList || [])
    return new Date() - start_time
  }

// *********************************************************************************************************************
// Handle keyboard commands to switch colour scheme or calculation mode
// *********************************************************************************************************************
const handleKeyCode =
  evt => {
    switch (evt.keyCode) {
      // Change colour scheme
      case 70 : $id('colourScheme1').checked = true;  break   // 'f' pressed - Change to "Fire" colour scheme
      case 71 : $id('colourScheme0').checked = true;  break   // 'g' pressed - Change to "Grey scale" colour scheme
      case 82 : $id('colourScheme3').checked = true;  break   // 'r' pressed - Change to "Rainbow" colour scheme
      case 83 : $id('colourScheme2').checked = true;  break   // 's' pressed - Change to "Web safe" colour scheme

      // Change calculation type
      case 74 : $id('calcUsingJS').checked   = true;  break   // 'j' pressed - Calculate using JavaScript
      case 87 : $id('calcUsingWASM').checked = true;  break   // 'w' pressed - Calculate using WASM
      default :
    }

    mandelPlot()
  }

const sumOfSquares  = (val1, val2) => (val1 * val1) + (val2 * val2)
const diffOfSquares = (val1, val2) => (val1 * val1) - (val2 * val2)

// *********************************************************************************************************************
// Update text for Julia Set coordinates
// *********************************************************************************************************************
const updateJuliaCoordTxt =
  (xTxt, yTxt) => {
    $id('mouseX').innerHTML = xTxt
    $id('mouseY').innerHTML = yTxt
  }

// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export {
  $id
, $classes
, $names
, mousePosToCoords
, getRadio
, resetUI
, sumOfSquares
, diffOfSquares
, handleKeyCode
, timer
, zoomIn
, zoomOut
, pixelXToCoordX
, pixelYToCoordY
, mouseAxisToCoordAxis
, updateJuliaCoordTxt
}
