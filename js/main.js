// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : Dec 2019
// Updated : Jan 2020
//
// Compare the performance of Web Assembly and JavaScript by calculating the Mandelbrot Set and the corresponding Julia
// Sets.  The algorithms used by JavaScript and Web Assembly (Rust) are identical
// *********************************************************************************************************************

import * as C from "./constants.js"

import {
  $id
, zoomIn
, zoomOut
, resetUI
, handleKeyCode
, mouseAxisToCoordAxis
} from "./utilities.js"

import {
  juliaPlot
, mandelPlot
} from "./fractal.js"

import buildColourMaps
, { rebuildColourMaps } from "./colours.js"

// *********************************************************************************************************************
// PUBLIC API
// *********************************************************************************************************************
const startJS =
  () => {
    let mCanvas = $id('mandelImage')

    // Define starting zoom level
    window.mandelPixelsPerUnit = C.DEFAULT_PPU
    window.juliaPixelsPerUnit  = C.DEFAULT_PPU
    
    // Define Mandelbrot Set origin
    window.mandelOrigin = []
    window.mandelOrigin[0] = C.DEFAULT_MANDEL_ORIGIN[0]
    window.mandelOrigin[1] = C.DEFAULT_MANDEL_ORIGIN[1]

    // Build functions that translate the mouse (X,Y) position over the Mandelbrot set to (X,Y) coordinates
    window.mandelXToCoordXFn = mouseAxisToCoordAxis(mCanvas.width,  C.DEFAULT_PPU, C.DEFAULT_MANDEL_ORIGIN[0])
    window.mandelYToCoordYFn = mouseAxisToCoordAxis(mCanvas.height, C.DEFAULT_PPU, C.DEFAULT_MANDEL_ORIGIN[1])

    // Build initial colour maps based on default calculation depth
    window.maxIters   = parseInt($id('maxIters').value)
    window.colourMaps = buildColourMaps(window.maxIters)

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Event listeners
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    document.addEventListener('keydown', handleKeyCode, false)
    
    // Add event listeners to Mandelbrot Set canvas
    mCanvas.addEventListener('click',       zoomIn,     false)
    mCanvas.addEventListener('contextmenu', zoomOut,    false)
    mCanvas.addEventListener('mousemove',   juliaPlot,  false)

    // Event listeners to redraw the Mandelbrot set if any of the UI values change
    $id('resetUIButton').onclick  = resetUI
    $id('calcUsingJS').onchange   = mandelPlot
    $id('calcUsingWASM').onchange = mandelPlot
    $id('colourScheme0').onchange = mandelPlot
    $id('colourScheme1').onchange = mandelPlot
    $id('colourScheme2').onchange = mandelPlot
    $id('colourScheme3').onchange = mandelPlot

    $id('maxIters').onchange =
      () => {
        rebuildColourMaps()
        mandelPlot()
      }

    // Plot the initial Mandelbrot Set image
    mandelPlot()
  }

// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export default startJS
