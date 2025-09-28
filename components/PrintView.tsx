import type React from "react"

interface PrintViewProps {
  studentId: string | null
  studentInfo: { class: string; name: string } | null
  dateTime: string
  contact: string
  reason: string
  otherReason: string
  teacher: string
  notes: string
}

const PrintView: React.FC<PrintViewProps> = ({ studentId, studentInfo, dateTime, contact, reason, otherReason, teacher, notes }) => {
  const displayNotes = notes?.trim() ? notes : "-"
  const displayTeacher = teacher?.trim() ? teacher : "未選択"

  return (
    <div className="px-12 py-10 max-w-[19cm] mx-auto print-card">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-wide">生徒遅刻カード</h1>
        <p className="text-sm text-gray-500 mt-2">（このカードを担当教員に提出してください）</p>
        <div className="mt-3 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"></div>
      </header>
      
      <section className="space-y-6 text-lg">
        <div className="grid grid-cols-[160px_auto] gap-y-4">
          <span className="font-semibold text-gray-700">学籍番号</span>
          <span className="font-semibold text-gray-900">{studentId || "-"}</span>

          <span className="font-semibold text-gray-700">クラス</span>
          <span className="font-semibold text-gray-900">{studentInfo?.class || "-"}</span>

          <span className="font-semibold text-gray-700">氏名</span>
          <span className="font-semibold text-gray-900">{studentInfo?.name || "-"}</span>

          <span className="font-semibold text-gray-700">日時</span>
          <span className="font-semibold text-gray-900">{dateTime}</span>

          <span className="font-semibold text-gray-700">連絡状況</span>
          <span className="font-semibold text-gray-900">{contact}</span>

          <span className="font-semibold text-gray-700">遅刻理由</span>
          <span className="font-semibold text-gray-900">
            {reason === "その他" ? otherReason || "-" : reason || "-"}
          </span>

          <span className="font-semibold text-gray-700">備考</span>
          <span className="font-semibold text-gray-900">{displayNotes}</span>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-700">担当教員</h2>
        <div className="mt-3 h-24 border border-gray-400 rounded-lg flex items-center justify-center bg-gray-50">
          <span className="text-2xl font-bold text-gray-800">{displayTeacher}</span>
        </div>
      </section>

      <footer className="mt-6 text-sm text-gray-400 text-right">
        発行日時: {dateTime}
      </footer>
    </div>
  )
}

export default PrintView

