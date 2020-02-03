// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : Jan 2020
// *********************************************************************************************************************

// Fractal Types
const MANDELBROT = "mandel"
const JULIA      = "julia"

// Default pixels per unit (controls zoom level)
const DEFAULT_PPU = 200

// Default origin in the coordinate space of the Mandelbrot set
const DEFAULT_MANDEL_ORIGIN = [-0.5, 0.0]

// Default number of iterations for teh escape time algorithm
const DEFAULT_MAX_ITERS = 1000

// Bail out if the iterated value exceeds this threshold
const BAILOUT = 4.0

// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export {
  MANDELBROT
, JULIA
, BAILOUT
, DEFAULT_PPU
, DEFAULT_MANDEL_ORIGIN
, DEFAULT_MAX_ITERS
}