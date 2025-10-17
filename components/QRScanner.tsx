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
        
        // 既存のHTML要素をクリア
        const element = document.getElementById(qrCodeRegionId)
        if (element) {
          element.innerHTML = ''
        }
        
        // 既存のスキャナーを停止
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

    // 少し遅延させて初期化
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
      <div className="text-center mb-4">
        <p className="text-lg text-gray-600 font-medium">学生証のQRコードをスキャン</p>
        <p className="text-sm text-gray-500 mt-1">カメラにQRコードを向けてください</p>
        <button
          onClick={toggleCamera}
          className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-md"
          disabled={!isScanning}
        >
          {facingMode === "environment" ? "📱 インカメラに切替" : "📷 背面カメラに切替"}
        </button>
      </div>
      <div id="qr-reader" className="rounded-lg shadow-lg overflow-hidden mx-auto" style={{ maxWidth: '100%', minHeight: '250px' }}></div>
      {error && (
        <div className="mt-4 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg" role="alert">
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2 text-red-600">
              カメラへのアクセスを許可してページを更新してください
            </p>
          </div>
        </div>
      )}
      <style jsx global>{`
        #qr-reader {
          border: 3px solid #3b82f6;
          border-radius: 0.75rem;
          background: #f8fafc;
        }
        #qr-reader video {
          border-radius: 0.5rem;
          display: block;
          width: 100% !important;
          height: auto !important;
          max-height: 400px;
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
          background: rgba(59, 130, 246, 0.1);
          border-radius: 0.5rem;
          margin-top: 8px;
        }
        
        /* iPad横向き最適化 */
        @media (min-width: 1024px) {
          #qr-reader {
            max-width: 500px;
            margin: 0 auto;
          }
          #qr-reader video {
            max-height: 350px;
          }
        }
        
        /* タブレット縦向き */
        @media (min-width: 768px) and (max-width: 1023px) {
          #qr-reader video {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}

export default QRScanner

