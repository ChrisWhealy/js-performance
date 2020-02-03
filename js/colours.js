// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : June 2013
// Updated : Jan 2020
//
// Build the colour maps for each colour scheme - one entry per iteration value
//
// Each entry in a colour map is an array of 4 numbers whose values are always in the order [Red, Green, Blue, Alpha]
// *********************************************************************************************************************

import { $id } from "./utilities.js"

// *********************************************************************************************************************
// PRIVATE API
// *********************************************************************************************************************

const R2G_MAX = 0.13
const G2B_MAX = 0.42
const B2R_MAX = 0.77
const R2B_MIN = 0.26
const G2R_MIN = 0.58

// *********************************************************************************************************************
// Generate a pixel for the monochrome colour scheme
// The colours for this scheme are evenly distributed between zero and maxIter
// *********************************************************************************************************************
const monochrome =
  (_idx, logScale, _band3) =>
    (val => [val, val, val])
    (parseInt(255*logScale))

// *********************************************************************************************************************
// Generate a pixel for the fire colour scheme
// The colours for this scheme are evenly distributed between zero and maxIter
// *********************************************************************************************************************
const fire =
  (_idx, _logScale, band3) =>
    [ (band3<1) ? parseInt(255*band3) : 255                       // Red
    , (band3<1) ? 0 : (band3<2) ? parseInt(255*(band3-1)) : 255   // Green
    , (band3<2) ? 0 : parseInt(255*(band3-2))                     // Blue
    ]

// *********************************************************************************************************************
// Generate a pixel for the webSafeCycle colour scheme
// The web safe values simply cycle around the 252 standard colours
// *********************************************************************************************************************
const webSafeCycle =
  (idx, _logScale, _band3) =>
    [ Math.floor((idx % 252) / 42) * 0x33    // Red
    , Math.floor((idx % 42) / 6)   * 0x33    // Green
    ,            (idx % 6)         * 0x33    // Blue
    ]

// *********************************************************************************************************************
// Generate a pixel for the rainbow colour scheme
// The rainbow scheme evenly spreads the ROYGBIV colours from zero to maxIter
// *********************************************************************************************************************
const rainbow =
  (_idx, logScale, _band3) =>
    [ rainbow_red(logScale)
    , rainbow_green(logScale)
    , rainbow_blue(logScale)
    ]

const rainbow_red =
  scaleVal =>
    scaleVal < R2G_MAX || scaleVal > B2R_MAX
    ? 255
    : scaleVal >= R2G_MAX && scaleVal <= R2B_MIN
      ? Math.floor(255 * (scaleVal - R2G_MAX) / (R2B_MIN - R2G_MAX))
      : scaleVal >= G2R_MIN && scaleVal <= B2R_MAX
        ? Math.floor(255 * (scaleVal - G2R_MIN) / (B2R_MAX - G2R_MIN))
        : 0

const rainbow_green =
  scaleVal =>
    scaleVal > R2G_MAX && scaleVal < G2B_MAX
    ? 255
    : scaleVal <= R2G_MAX
      ? Math.floor(255 * scaleVal / R2G_MAX)
      : scaleVal >= G2B_MAX && scaleVal <= G2R_MIN
        ? Math.floor(255 * (scaleVal - G2B_MAX) / (G2R_MIN - G2B_MAX))
        : 0

const rainbow_blue =
  scaleVal =>
    scaleVal > G2B_MAX && scaleVal < B2R_MAX
    ? 255
    : scaleVal >= R2B_MIN && scaleVal <= G2B_MAX
      ? Math.floor(255 * (scaleVal - R2B_MIN) / (G2B_MAX - R2B_MIN))
      : scaleVal >= B2R_MAX
        ? Math.floor(255 * (scaleVal - B2R_MAX) / (1 - B2R_MAX))
        : 0


// *********************************************************************************************************************
// Colour Scheme ids
// 0 = Grey scale
// 1 = Red -> Yellow -> White (a.k.a. 'Fire')
// 2 = Websafe colour cycle
// 3 = Kinda like a rainbow (Red -> Orange -> Yellow -> Green -> Blue -> Magenta -> Red)

// The functions in this array generate the appropriate colours according to the colourScheme index
const colourMapFns = [monochrome, fire, webSafeCycle, rainbow]

// *********************************************************************************************************************
// PUBLIC API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Rebuild the colour map arrays if the value of window.maxIters changes
// *********************************************************************************************************************
const rebuildColourMaps =
  () => 
    (newIters => {
      if (newIters != window.maxIters) {
        window.colourMaps = buildColourMaps(newIters)
        window.maxIters   = newIters
      }
    })
    (parseInt($id('maxIters').value))

// *********************************************************************************************************************
// Build colour map arrays based on the current value of window.maxIters
// *********************************************************************************************************************
const buildColourMaps =
  iterLimit => {
    let logScale = 0.0
    let band3    = 0.0
    
    // Reset all colour map arrays
    let colourMaps = new Array()

    colourMaps[0] = []
    colourMaps[1] = []
    colourMaps[2] = []
    colourMaps[3] = []

    // Arbitrarily set the maxIter colour to black
    colourMaps[0][iterLimit] = [0x0,0x0,0x0]
    colourMaps[1][iterLimit] = [0x0,0x0,0x0]
    colourMaps[2][iterLimit] = [0x0,0x0,0x0]
    colourMaps[3][iterLimit] = [0x0,0x0,0x0]

    // Since its a very bad idea to attempt to calculate the value of log(0), generate the first pixel colour for each
    // colour map outside the following for loop
    colourMaps[0][0] = colourMapFns[0](0, logScale, band3)
    colourMaps[1][0] = colourMapFns[1](0, logScale, band3)
    colourMaps[2][0] = colourMapFns[2](0, logScale, band3)
    colourMaps[3][0] = colourMapFns[3](0, logScale, band3)

    let logMaxIter = Math.log(iterLimit - 1.0)

    for (var i=1; i<iterLimit; i++) {
      logScale = Math.log(i) / logMaxIter
      band3    = logScale * 3

      colourMaps[0][i] = colourMapFns[0](i, logScale, band3)  // Monochrome
      colourMaps[1][i] = colourMapFns[1](i, logScale, band3)  // Fire
      colourMaps[2][i] = colourMapFns[2](i, logScale, band3)  // Websafe Colour Cycle
      colourMaps[3][i] = colourMapFns[3](i, logScale, band3)  // Rainbow
    }

    return colourMaps
  }


// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export {
  buildColourMaps   as default
, rebuildColourMaps
}