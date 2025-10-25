import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"

export default function DemoPage() {
  const videoSrc = '/demo.mp4'

  return (
    <>
      <div className="leading-normal tracking-normal min-h-screen font-sans">
        <Header />
    
        <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Demo</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <video
            src={videoSrc}
            controls
            autoPlay
            muted
            playsInline
            className="w-full rounded"
          >
            Your browser does not support the video tag. You can
            <a href={videoSrc} className="text-blue-600 underline ml-1">download the demo</a> instead.
          </video>
        </div>
      </div>
    </main>

        <Footer />
      </div>
    </>
  )
}
