import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'

const MAX_FILE_SIZE = 15 * 1024 * 1024

function imageQuality(canvas) {
  const sample = document.createElement('canvas')
  sample.width = 160
  sample.height = 120
  const context = sample.getContext('2d', { willReadFrequently: true })
  context.drawImage(canvas, 0, 0, sample.width, sample.height)
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data
  const gray = new Float32Array(sample.width * sample.height)
  let brightness = 0
  for (let pixel = 0, index = 0; pixel < pixels.length; pixel += 4, index += 1) {
    gray[index] = pixels[pixel] * 0.299 + pixels[pixel + 1] * 0.587 + pixels[pixel + 2] * 0.114
    brightness += gray[index]
  }
  brightness /= gray.length
  let laplacianMean = 0
  let squaredLaplacian = 0
  for (let y = 1; y < sample.height - 1; y += 1) {
    for (let x = 1; x < sample.width - 1; x += 1) {
      const index = y * sample.width + x
      const value = gray[index - sample.width] + gray[index - 1] - 4 * gray[index] + gray[index + 1] + gray[index + sample.width]
      laplacianMean += value
      squaredLaplacian += value * value
    }
  }
  const count = (sample.width - 2) * (sample.height - 2)
  const mean = laplacianMean / count
  const blurVariance = squaredLaplacian / count - mean * mean
  const issues = []
  if (brightness < 45) issues.push('Image is too dark; add more light.')
  if (brightness > 220) issues.push('Image is overexposed; reduce direct light.')
  if (blurVariance < 18) issues.push('Image appears blurred; hold the camera steady and refocus.')
  return { brightness: Math.round(brightness), blurVariance: Math.round(blurVariance), issues }
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')
  const [quality, setQuality] = useState(null)
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream])

  async function openCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is unavailable. Use a secure HTTPS connection or select a document file.')
      return
    }
    try {
      stream?.getTracks().forEach((track) => track.stop())
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      setStream(nextStream)
      setFile(null)
      setQuality(null)
    } catch (cameraError) {
      setError(cameraError.name === 'NotAllowedError' ? 'Allow camera access in your browser settings, or choose a file instead.' : 'Could not open the camera. Check that no other app is using it.')
    }
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setError('The camera is not ready yet.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const result = imageQuality(canvas)
    setQuality(result)
    if (result.issues.length) {
      setError(result.issues.join(' '))
      return
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) {
      setError('Could not capture this image. Please try again.')
      return
    }
    setFile(new File([blob], `land-document-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
    setError('')
  }

  function selectFile(event) {
    const chosen = event.target.files?.[0] || null
    setError('')
    setQuality(null)
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
    if (chosen && chosen.size > MAX_FILE_SIZE) {
      setError('Documents must be 15 MB or smaller.')
      event.target.value = ''
      setFile(null)
      return
    }
    setFile(chosen)
  }

  async function submit(event) {
    event.preventDefault()
    if (!file || uploading) return
    setError('')
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const response = await api.post('/documents/upload', form)
      navigate(`/documents/${response.data.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return <Layout title="Upload a land document">
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="panel">
        <div className="panel-heading"><div><h3>Document upload</h3><p>PDF, JPG, or PNG · maximum 15 MB</p></div></div>
        <form onSubmit={submit} className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openCamera} className="secondary-button">Open camera</button>
            {stream && <button type="button" onClick={capturePhoto} className="primary-button">Capture document photo</button>}
          </div>
          {stream && <video ref={videoRef} autoPlay playsInline muted className="max-h-[420px] w-full rounded-lg bg-black object-contain" aria-label="Live document camera preview" />}
          <label className="field-label">Choose a document file<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={selectFile} className="field-input file:mr-3 file:border-0 file:bg-[#e6f5f3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0a5960]" /></label>
          {file && <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 break-all text-sm font-semibold text-[#183755]">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            {file.type.startsWith('image/') && previewUrl && <img src={previewUrl} alt="Selected land document preview" className="max-h-[400px] w-full rounded-lg object-contain" />}
            {file.type === 'application/pdf' && <p className="text-xs text-slate-500">PDF selected. The original will be stored and processed securely.</p>}
          </div>}
          {quality && <p className="text-xs text-slate-500">Camera image checks · brightness {quality.brightness}/255 · focus score {quality.blurVariance}</p>}
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}<p className="mt-1 text-xs">If the upload completed but OCR failed, check your <Link to="/records" className="font-semibold underline">upload history</Link>.</p></div>}
          <button type="submit" disabled={!file || uploading} className="primary-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60">{uploading ? 'Uploading and extracting...' : 'Upload and extract fields'}</button>
        </form>
      </section>
      <section className="panel bg-[#0b3457] text-white">
        <div className="eyebrow light">Document workflow</div><h2 className="mt-3 text-xl font-bold">Extraction is not official verification.</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">Text extraction and the readiness score are preliminary. Official land-record services are not connected, so each document remains in the officer review queue; no ownership claim is auto-approved.</p>
        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-white/80">
          <li>Check your captured page for blur and lighting before upload.</li>
          <li>Review each extracted field against the original image or PDF.</li>
          <li>Use the citizen Copilot for general land-record process guidance.</li>
        </ul>
      </section>
    </div>
  </Layout>
}
