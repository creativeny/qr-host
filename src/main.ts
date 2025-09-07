import './style.css'
import jsQR from 'jsqr'

// Extend window interface for TypeScript
declare global {
  interface Window {
    scannedQRData: string | null
  }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="scanner-container">
      <video id="video" playsinline autoplay></video>
      <canvas id="canvas" style="display: none;"></canvas>
      <div id="qr-overlay" class="qr-overlay"></div>
      <div class="corner-top-left"></div>
      <div class="corner-top-right"></div>
      <div class="corner-bottom-left"></div>
      <div class="corner-bottom-right"></div>
    </div>
  </div>
`

// QR Scanner functionality
class QRScanner {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private canvasContext: CanvasRenderingContext2D
  private overlay: HTMLElement
  private scannerContainer: HTMLElement
  private stream: MediaStream | null = null
  private scanning = false
  private lastQrData: string = ''
  private overlayTimeout: number | null = null
  private qrDetectedTimeout: number | null = null

  constructor() {
    this.video = document.getElementById('video') as HTMLVideoElement
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.canvasContext = this.canvas.getContext('2d')!
    this.overlay = document.getElementById('qr-overlay') as HTMLElement
    this.scannerContainer = document.querySelector('.scanner-container') as HTMLElement

    // Initialize window property
    window.scannedQRData = null
    console.log('🔄 Window.scannedQRData initialized to null')

    // Start scanning immediately
    this.startScanning()
  }

  private async startScanning() {
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile devices
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      this.video.srcObject = this.stream
      this.video.play()

      this.scanning = true

      // Start scanning loop
      this.scanLoop()

    } catch (error) {
      console.error('❌ Error accessing camera:', error)
      this.overlay.textContent = 'Camera access denied'
      this.overlay.classList.add('visible', 'error')
    }
  }

  private scanLoop() {
    if (!this.scanning) return

    // Check if video is ready
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match our fixed scanner size (320x320)
      const canvasWidth = 320
      const canvasHeight = 320
      this.canvas.width = canvasWidth
      this.canvas.height = canvasHeight

      // Draw video frame to canvas, scaling to fit our scanner size
      this.canvasContext.drawImage(this.video, 0, 0, canvasWidth, canvasHeight)

      // Get image data from canvas
      const imageData = this.canvasContext.getImageData(0, 0, canvasWidth, canvasHeight)

      // Verify we have valid image data
      if (imageData.data.length === canvasWidth * canvasHeight * 4) {
        try {
          // Try to decode QR code
          const code = jsQR(imageData.data, canvasWidth, canvasHeight, {
            inversionAttempts: 'attemptBoth'
          })

        if (code) {
          // Update on every successful detection for more frequent updates
          this.lastQrData = code.data
          this.displayQrData(code.data)
          this.showQrDetectedState()

            // Push to window object on every detection (more frequent updates)
            window.scannedQRData = code.data
            console.log('📤 Data sent to window.scannedQRData:', {
              data: code.data,
              timestamp: new Date().toISOString(),
              length: code.data.length
            })

          // Dispatch custom event with QR code data
          window.dispatchEvent(new CustomEvent('qr-detected', {
            detail: { data: code.data, version: code.version, location: code.location }
          }))
        } else {
          // Clear QR detected state if no QR is found
          this.clearQrDetectedState()

          // Clear window property if no QR is detected
          if (this.lastQrData) {
            window.scannedQRData = null
            console.log('🗑️ Window.scannedQRData cleared (no QR detected)', {
              timestamp: new Date().toISOString(),
              previousData: this.lastQrData
            })
          }

          // Clear overlay if no QR code is detected for a while
          if (this.lastQrData && !this.overlayTimeout) {
            this.overlayTimeout = window.setTimeout(() => {
              this.clearOverlay()
            }, 2000) // Clear after 2 seconds of no detection
          }
        }
        } catch (error) {
          console.error('❌ Error during QR decoding:', error)
        }
      } else {
        console.warn('Invalid image data length:', imageData.data.length, 'expected:', canvasWidth * canvasHeight * 4)
      }
    }

    // Continue scanning
    requestAnimationFrame(() => this.scanLoop())
  }

  private displayQrData(data: string) {
    // Clear any existing timeout
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout)
      this.overlayTimeout = null
    }

    // Truncate data to 25 characters and add ellipsis if needed
    const truncatedData = data.length > 25 ? data.substring(0, 25) + '...' : data

    // Display the QR data (update on every detection)
    this.overlay.textContent = truncatedData
    this.overlay.classList.remove('error')
    this.overlay.classList.add('visible')

    // Auto-hide after 5 seconds if no new QR code is detected
    this.overlayTimeout = window.setTimeout(() => {
      this.clearOverlay()
    }, 5000)
  }

  private showQrDetectedState() {
    // Clear any existing timeout
    if (this.qrDetectedTimeout) {
      clearTimeout(this.qrDetectedTimeout)
    }

    // Reset and add QR detected class for fresh animation on every detection
    this.scannerContainer.classList.remove('qr-detected')
    // Force reflow to restart animation
    void this.scannerContainer.offsetWidth
    this.scannerContainer.classList.add('qr-detected')

    // Remove the class after 2 seconds
    this.qrDetectedTimeout = window.setTimeout(() => {
      this.scannerContainer.classList.remove('qr-detected')
    }, 2000) // Keep green for 2 seconds
  }

  private clearQrDetectedState() {
    // Clear any existing timeout
    if (this.qrDetectedTimeout) {
      clearTimeout(this.qrDetectedTimeout)
      this.qrDetectedTimeout = null
    }

    // Remove QR detected class
    this.scannerContainer.classList.remove('qr-detected')
  }

  private clearOverlay() {
    this.overlay.textContent = ''
    this.overlay.classList.remove('visible', 'error')
    this.lastQrData = ''
    this.overlayTimeout = null
  }
}

// Initialize QR scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QRScanner()
})
