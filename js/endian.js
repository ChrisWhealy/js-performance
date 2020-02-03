// *********************************************************************************************************************
// Author  : Chris Whealy
// Date    : Oct 2012
// Updated : Jan 2019
//
// Exposes a single function called setRGB that returns the supplied RGB triple in the correct byte order based on the
// endianness of the current processor.  The returned RGB triple includes an Alpha value hard-coded to 0xFF
// *********************************************************************************************************************

// *********************************************************************************************************************
// PRIVATE API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Take three 8-bit unsigned integers, each representing an RGB triple, and return them as a single 32-bit unsigned
// integer according to the processor's endianness.  The alpha value is always hardcoded to 0xFF
// *********************************************************************************************************************
const littleEndianByteOrderFn = (r,g,b) => (0xff << 24) | (b << 16) | (g <<  8) | r
const    bigEndianByteOrderFn = (r,g,b) => (   r << 24) | (g << 16) | (b <<  8) | 0xff

// *********************************************************************************************************************
// PUBLIC API
// *********************************************************************************************************************

// *********************************************************************************************************************
// Define how RGB pixels should be represented by testing whether this processor is big- or little-endian
// *********************************************************************************************************************
const setRGB =
  (testBuff => {
    // Overtop of the 4-byte ArrayBuffer, lay two other data structures:
    let buff32 = new Uint32Array(testBuff)
    let buff8 = new Uint8ClampedArray(testBuff)

    // Write the unsigned integer 0A0B0C0D to the array buffer via the 32 bit mask
    buff32[0] = 0x0a0b0c0d

    // If the byte order has been reversed, then this is a little-endian processor
    let isLittleEndian = buff8[0] === 0x0d && buff8[1] === 0x0c && buff8[2] === 0x0b && buff8[3] === 0x0a

    window.isLittleEndian = isLittleEndian
    console.log(`Processor is ${isLittleEndian ? 'little' : 'big'}-endian`)

    return isLittleEndian ? littleEndianByteOrderFn : bigEndianByteOrderFn
  })
  // Start with a 4-byte ArrayBuffer
  (new ArrayBuffer(4))

// *********************************************************************************************************************
// EXPORTS
// *********************************************************************************************************************
export default setRGB

