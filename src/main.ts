import './style.css'
import jsQR from 'jsqr'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="scanner-container">
      <video id="video" playsinline autoplay></video>
      <canvas id="canvas" style="display: none;"></canvas>
    </div>
  </div>
`

// QR Scanner functionality
class QRScanner {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private canvasContext: CanvasRenderingContext2D
  private stream: MediaStream | null = null
  private scanning = false

  constructor() {
    this.video = document.getElementById('video') as HTMLVideoElement
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.canvasContext = this.canvas.getContext('2d')!

    // Start scanning immediately
    this.startScanning()
  }

  private async startScanning() {
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Use back camera on mobile devices
        }
      })

      this.video.srcObject = this.stream
      this.video.play()

      this.scanning = true

      // Start scanning loop
      this.scanLoop()

    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  private scanLoop() {
    if (!this.scanning) return

    // Check if video is ready
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match video
      this.canvas.width = this.video.videoWidth
      this.canvas.height = this.video.videoHeight

      // Draw video frame to canvas
      this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

      // Get image data from canvas
      const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height)

      // Try to decode QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      })

      if (code) {
        console.log('Found QR code:', code)
        // Dispatch custom event with QR code data
        window.dispatchEvent(new CustomEvent('qr-detected', {
          detail: { data: code.data, version: code.version }
        }))
      }
    }

    // Continue scanning
    requestAnimationFrame(() => this.scanLoop())
  }
}

// Initialize QR scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QRScanner()
})
