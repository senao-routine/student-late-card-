import type React from "react"
import { Button } from "@/components/ui/button"
import PrintView from "./PrintView"

interface PreviewModalProps {
  studentId: string | null
  studentInfo: { class: string; name: string } | null
  dateTime: string
  contact: string
  reason: string
  otherReason: string
  onClose: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  studentId,
  studentInfo,
  dateTime,
  contact,
  reason,
  otherReason,
  onClose,
}) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print-modal">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg print-hide">
          <h2 className="text-2xl md:text-3xl font-bold">印刷プレビュー</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mx-auto print-area" style={{ maxWidth: "21cm", minHeight: "29.7cm" }}>
            <PrintView
              studentId={studentId}
              studentInfo={studentInfo}
              dateTime={dateTime}
              contact={contact}
              reason={reason}
              otherReason={otherReason}
            />
          </div>
        </div>

        {/* フッター（ボタンエリア） */}
        <div className="border-t bg-gray-50 p-6 print-hide">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="h-14 text-lg font-semibold px-8 border-2 hover:bg-gray-100"
            >
              キャンセル
            </Button>
            <Button
              onClick={handlePrint}
              className="h-14 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold px-8 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              🖨️ 印刷実行
            </Button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            印刷実行をクリックするとブラウザの印刷ダイアログが開きます
          </p>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal

