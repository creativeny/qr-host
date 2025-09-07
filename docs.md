Usage

jsQR exports a method that takes in 3 arguments representing the image data you wish to decode. Additionally can take an options object to further configure scanning behavior.

const code = jsQR(imageData, width, height, options?);

if (code) {
  console.log("Found QR code", code);
}


Arguments

imageData - An Uint8ClampedArray of RGBA pixel values in the form [r0, g0, b0, a0, r1, g1, b1, a1, ...]. As such the length of this array should be 4 * width * height. This data is in the same form as the ImageData interface, and it's also commonly returned by node modules for reading images.
width - The width of the image you wish to decode.
height - The height of the image you wish to decode.
options (optional) - Additional options.
inversionAttempts - (attemptBoth (default), dontInvert, onlyInvert, or invertFirst) - Should jsQR attempt to invert the image to find QR codes with white modules on black backgrounds instead of the black modules on white background. This option defaults to attemptBoth for backwards compatibility but causes a ~50% performance hit, and will probably be default to dontInvert in future versions.
Return value
If a QR is able to be decoded the library will return an object with the following keys.

binaryData - Uint8ClampedArray - The raw bytes of the QR code.
data - The string version of the QR code data.
chunks - The QR chunks.
version - The QR version.
location - An object with keys describing key points of the QR code. Each key is a point of the form {x: number, y: number}. Has points for the following locations.
Corners - topRightCorner/topLeftCorner/bottomRightCorner/bottomLeftCorner;
Finder patterns - topRightFinderPattern/topLeftFinderPattern/bottomLeftFinderPattern
May also have a point for the bottomRightAlignmentPattern assuming one exists and can be located.