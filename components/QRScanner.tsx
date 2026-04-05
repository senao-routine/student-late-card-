"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerProps {
  onScan: (result: string) => void
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  useEffect(() => {
    const qrCodeRegionId = "qr-reader"
    let isMounted = true

    const startScanner = async () => {
      try {
        if (!isMounted) return

        const element = document.getElementById(qrCodeRegionId)
        if (element) {
          element.innerHTML = ''
        }

        if (scannerRef.current) {
          try {
            await scannerRef.current.stop()
            await scannerRef.current.clear()
          } catch (e) {
            // 停止エラーは無視
          }
        }

        if (!isMounted) return

        scannerRef.current = new Html5Qrcode(qrCodeRegionId)

        await scannerRef.current.start(
          { facingMode: facingMode },
          {
            fps: 10,
            qrbox: 250
          },
          (decodedText) => {
            console.log("QR Code detected:", decodedText)
            onScan(decodedText)
          },
          (errorMessage) => {
            // エラーは無視
          }
        )
        if (isMounted) {
          setIsScanning(true)
        }
      } catch (err: any) {
        console.error("Scanner error:", err)
        if (isMounted) {
          setError("カメラの起動に失敗しました: " + err.message)
        }
      }
    }

    const timer = setTimeout(startScanner, 100)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          return scannerRef.current?.clear()
        }).catch((err) => console.error("Stop error:", err))
      }
    }
  }, [facingMode, onScan])

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "environment" ? "user" : "environment"))
  }

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <button
          onClick={toggleCamera}
          className="px-5 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-semibold rounded-full transition-all active:scale-95 elevation-1 uppercase tracking-wider"
          disabled={!isScanning}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {facingMode === "environment" ? "インカメラに切替" : "背面カメラに切替"}
          </span>
        </button>
      </div>
      <div id="qr-reader" className="rounded-2xl overflow-hidden mx-auto" style={{ maxWidth: '100%', minHeight: '200px' }}></div>
      {error && (
        <div className="mt-3 text-center">
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-3 rounded-xl elevation-1" role="alert">
            <p className="font-semibold text-sm">エラーが発生しました</p>
            <p className="text-xs mt-1">{error}</p>
            <p className="text-xs mt-1.5 text-red-500">
              カメラへのアクセスを許可してページを更新してください
            </p>
          </div>
        </div>
      )}
      <style jsx global>{`
        #qr-reader {
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-radius: 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
          box-shadow:
            0 4px 14px rgba(99, 102, 241, 0.1),
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
        }
        #qr-reader video {
          border-radius: 0.75rem;
          display: block;
          width: 100% !important;
          height: auto !important;
          max-height: 350px;
          object-fit: cover;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__dashboard_section_csr {
          display: none !important;
        }
        #qr-reader__scan_region {
          border: none !important;
        }
        #qr-reader__cam_qr_result {
          padding: 8px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 0.75rem;
          margin-top: 8px;
        }

        /* iPad横向き最適化 */
        @media (min-width: 1024px) {
          #qr-reader {
            max-width: 450px;
            margin: 0 auto;
          }
          #qr-reader video {
            max-height: 300px;
          }
        }

        /* タブレット縦向き */
        @media (min-width: 768px) and (max-width: 1023px) {
          #qr-reader video {
            max-height: 280px;
          }
        }
      `}</style>
    </div>
  )
}

export default QRScanner
