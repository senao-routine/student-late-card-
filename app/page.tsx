"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const QRScanner = dynamic(() => import("../components/QRScanner"), { ssr: false })

const FALLBACK_TEACHERS = ["山本先生", "佐藤先生", "鈴木先生", "高橋先生"]

type StudentData = { grade: string; classNum: string; number: string; name: string }

/* アイソメトリック装飾（背景に浮かぶ幾何学オブジェクト） */
function IsometricDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      <svg className="absolute -top-2 -left-6 w-28 h-28 opacity-10 float-slow" viewBox="0 0 100 100">
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="white"/>
        <polygon points="50,10 90,30 50,50 10,30" fill="white" opacity="0.7"/>
        <polygon points="90,30 90,70 50,50" fill="white" opacity="0.3"/>
      </svg>
      <svg className="absolute -bottom-4 -right-4 w-36 h-36 opacity-[0.07] float-medium" viewBox="0 0 100 100">
        <polygon points="50,5 95,28 95,72 50,95 5,72 5,28" fill="none" stroke="white" strokeWidth="1.5"/>
        <polygon points="50,5 95,28 50,50 5,28" fill="white" opacity="0.15"/>
      </svg>
      <svg className="absolute top-20 right-12 w-12 h-12 opacity-10 float-slow" viewBox="0 0 50 50" style={{ animationDelay: '2s' }}>
        <rect x="10" y="10" width="30" height="30" rx="2" transform="rotate(45 25 25)" fill="white"/>
      </svg>
    </div>
  )
}

export default function Home() {
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState<string>("なし")
  const [reason, setReason] = useState<string>("")
  const [otherReason, setOtherReason] = useState<string>("")
  const [teacher, setTeacher] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true)
  const [databaseStudentCount, setDatabaseStudentCount] = useState(0)
  const [teachers, setTeachers] = useState<string[]>(FALLBACK_TEACHERS)
  // 手入力モード用
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const { toast } = useToast()
  const studentDatabaseRef = useRef<Map<string, StudentData>>(new Map())
  const allStudentsRef = useRef<Array<{ studentId: string } & StudentData>>([])

  useEffect(() => {
    const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL
    if (!GAS_URL) { setIsLoadingDatabase(false); return }

    const loadAllStudents = async () => {
      try {
        const response = await fetch(`${GAS_URL}?action=getStudents`)
        const data = await response.json()
        if (data.success && data.students) {
          const db = new Map<string, StudentData>()
          const allStudents: Array<{ studentId: string } & StudentData> = []
          for (const s of data.students) {
            const sd: StudentData = { grade: s.grade, classNum: s.classNum, number: s.number, name: s.name }
            db.set(String(s.studentId), sd)
            allStudents.push({ studentId: String(s.studentId), ...sd })
          }
          studentDatabaseRef.current = db
          allStudentsRef.current = allStudents
          setDatabaseStudentCount(db.size)
        }
      } catch (err) {
        console.error("生徒データベース読み込みエラー:", err)
        toast({ title: "データベース読み込みエラー", description: "生徒データの取得に失敗しました。", variant: "destructive" })
      } finally { setIsLoadingDatabase(false) }
    }

    const loadTeachers = async () => {
      try {
        const response = await fetch(`${GAS_URL}?action=getTeachers`)
        const data = await response.json()
        if (data.success && data.teachers && data.teachers.length > 0) {
          setTeachers(data.teachers.map((t: { name: string }) => t.name))
        }
      } catch (err) {
        console.error("教員データ読み込みエラー:", err)
      }
    }

    loadAllStudents()
    loadTeachers()
  }, [toast])

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem("defaultTeacher")
    if (saved) setTeacher(saved)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (teacher) window.localStorage.setItem("defaultTeacher", teacher)
    else window.localStorage.removeItem("defaultTeacher")
  }, [teacher])

  // 手入力モード用: ユニークな学年リスト
  const uniqueGrades = Array.from(new Set(allStudentsRef.current.map(s => s.grade)))
    .sort((a, b) => {
      const order = ['中1', '中2', '中3', '高1', '高2', '高3']
      return order.indexOf(a) - order.indexOf(b)
    })

  // 選択した学年のユニークなクラスリスト
  const classesForGrade = selectedGrade
    ? Array.from(new Set(allStudentsRef.current.filter(s => s.grade === selectedGrade).map(s => s.classNum)))
        .sort((a, b) => Number(a) - Number(b))
    : []

  // 選択した学年・クラスの生徒リスト（出席番号順）
  const studentsForClass = (selectedGrade && selectedClass)
    ? allStudentsRef.current
        .filter(s => s.grade === selectedGrade && s.classNum === selectedClass)
        .sort((a, b) => Number(a.number) - Number(b.number))
    : []

  // 手入力で生徒を選択
  const handleManualSelect = (student: { studentId: string } & StudentData) => {
    setScannedResult(student.studentId)
    setStudentInfo({ grade: student.grade, classNum: student.classNum, number: student.number, name: student.name })
    setError(null)
  }

  const handleScan = useCallback((result: string) => {
    setScannedResult(result)
    setStudentInfo(null)
    setError(null)
    setIsLoadingStudent(true)
    const student = studentDatabaseRef.current.get(result)
    if (student) setStudentInfo(student)
    else setError("生徒情報が見つかりません。「生徒マスター」に登録されているか確認してください。")
    setIsLoadingStudent(false)
  }, [])

  const getCurrentDateTime = () => {
    return new Date().toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
  }

  const handleSubmit = async () => {
    if (!scannedResult || !teacher || !reason) {
      toast({ title: "入力エラー", description: "必要な項目を入力してください", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL
      if (!GAS_URL) throw new Error("GAS URLが未設定")
      const payload = {
        dateTime: getCurrentDateTime(), studentId: scannedResult,
        studentClass: studentInfo ? `${studentInfo.grade} ${studentInfo.classNum}組` : '',
        studentName: studentInfo?.name || '', contact,
        reason: reason === "その他" ? otherReason : reason, teacher, notes: notes || ''
      }
      const res = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
      const text = await res.text()
      try {
        const r = JSON.parse(text)
        if (r.success) { toast({ title: "送信完了", description: "遅刻記録をスプレッドシートに送信しました" }); resetForm() }
        else throw new Error(r.error)
      } catch { toast({ title: "送信完了", description: "遅刻記録を送信しました" }); resetForm() }
    } catch (e) {
      console.error('Submit error:', e)
      toast({ title: "エラー", description: "送信に失敗しました。もう一度お試しください。", variant: "destructive" })
    } finally { setIsSubmitting(false) }
  }

  const resetForm = () => {
    setScannedResult(null); setStudentInfo(null); setError(null)
    setContact("なし"); setReason(""); setOtherReason(""); setNotes("")
    setSelectedGrade(""); setSelectedClass("")
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden app-bg">
      <IsometricDecorations />

      {/* ===== ヘッダー ===== */}
      <header className="relative z-10 shrink-0 px-4 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
            </svg>
          </div>
          <h1 className="text-base font-bold text-white">遅刻カード発行システム</h1>
        </div>

        {/* 担当教員セレクタ */}
        <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 border border-white/20">
          <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <Select value={teacher} onValueChange={setTeacher}>
            <SelectTrigger className="h-9 w-32 bg-transparent border-0 text-white text-sm px-1 shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:text-white/60">
              <SelectValue placeholder="担当教員" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t} value={t} className="text-sm py-2.5">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* ===== ステータスバー ===== */}
      <div className="relative z-10 shrink-0 px-4 py-1 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-white/70">
          <span>担当:</span>
          <span className="font-bold text-white">{teacher || "未選択"}</span>
        </div>
        <span className="text-white/30">|</span>
        {!isLoadingDatabase && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className={`w-1.5 h-1.5 rounded-full ${databaseStudentCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>DB: </span>
            <span className="font-bold text-white">{databaseStudentCount > 0 ? `${databaseStudentCount}名` : '未接続'}</span>
          </div>
        )}
      </div>

      {/* ===== メインコンテンツ ===== */}
      <main className="relative z-10 flex-1 min-h-0 px-2 pb-2 md:px-3 md:pb-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 h-full max-w-7xl mx-auto">

          {/* ---- 左: QRスキャナー / 手入力切替 ---- */}
          <div className="glass-card rounded-xl elevation-3 flex flex-col overflow-hidden">
            {/* タブ切替 */}
            <div className="shrink-0 bg-white/50 border-b border-slate-200/60">
              <div className="flex">
                <button
                  onClick={() => { setInputMode("qr"); setSelectedGrade(""); setSelectedClass("") }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
                    inputMode === "qr"
                      ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                  QRスキャン
                </button>
                <button
                  onClick={() => setInputMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
                    inputMode === "manual"
                      ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  学生証忘れ
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {inputMode === "qr" ? (
                /* QRスキャンモード */
                <div className="flex items-center justify-center h-full">
                  {isLoadingDatabase ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-500 mx-auto mb-2"></div>
                      <p className="text-sm text-slate-600 font-medium">データベース読み込み中...</p>
                      <p className="text-xs text-slate-400">スプレッドシートからデータを取得しています</p>
                    </div>
                  ) : databaseStudentCount === 0 ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">読み込みに失敗しました</p>
                      <Button onClick={() => window.location.reload()} size="sm" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs">
                        再読み込み
                      </Button>
                    </div>
                  ) : (
                    <QRScanner onScan={handleScan} />
                  )}
                </div>
              ) : (
                /* 手入力モード */
                <div className="space-y-2.5">
                  {/* ステップ1: 学年選択 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">1. 学年を選択</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {uniqueGrades.map((grade) => (
                        <button
                          key={grade}
                          onClick={() => { setSelectedGrade(grade); setSelectedClass(""); setScannedResult(null); setStudentInfo(null) }}
                          className={`py-3 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                            selectedGrade === grade
                              ? "bg-amber-500 text-white elevation-2"
                              : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 elevation-1"
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ステップ2: クラス選択 */}
                  {selectedGrade && classesForGrade.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">2. クラスを選択</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {classesForGrade.map((cls) => (
                          <button
                            key={cls}
                            onClick={() => { setSelectedClass(cls); setScannedResult(null); setStudentInfo(null) }}
                            className={`py-3 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                              selectedClass === cls
                                ? "bg-amber-500 text-white elevation-2"
                                : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 elevation-1"
                            }`}
                          >
                            {cls}組
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ステップ3: 生徒選択 */}
                  {selectedGrade && selectedClass && studentsForClass.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        3. 生徒を選択（{studentsForClass.length}名）
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[45vh] overflow-y-auto pr-1">
                        {studentsForClass.map((s) => (
                          <button
                            key={s.studentId}
                            onClick={() => handleManualSelect(s)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all active:scale-[0.97] ${
                              scannedResult === s.studentId
                                ? "bg-emerald-500 text-white elevation-2 ring-2 ring-emerald-300"
                                : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 elevation-1"
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              scannedResult === s.studentId
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {s.number}
                            </span>
                            <span className="text-sm font-bold truncate">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 生徒データが0件の場合 */}
                  {selectedGrade && selectedClass && studentsForClass.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-sm">このクラスの生徒データがありません</p>
                    </div>
                  )}

                  {/* 未選択時のガイド */}
                  {!selectedGrade && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3 elevation-1">
                        <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">学年を選択してください</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">学生証を忘れた生徒を手動で検索します</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ---- 右: フォーム ---- */}
          <div className="glass-card rounded-xl elevation-3 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-white/50">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {scannedResult ? "遅刻記録" : "待機中"}
              </h2>
              {scannedResult && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                  {getCurrentDateTime()}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {scannedResult ? (
                <div className="p-2.5 md:p-3 space-y-2.5">

                  {/* 学生情報 */}
                  <div className="rounded-lg p-2.5 border border-slate-200 bg-slate-50 elevation-1">
                    {isLoadingStudent ? (
                      <p className="text-sm text-slate-500 animate-pulse">生徒情報を取得中...</p>
                    ) : studentInfo ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-base font-bold text-indigo-700">
                          {studentInfo.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-900 leading-tight truncate">{studentInfo.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {studentInfo.grade} {studentInfo.classNum}組 {studentInfo.number}番
                            <span className="mx-1.5 text-slate-300">|</span>
                            <span className="font-mono text-slate-400">{scannedResult}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">学籍番号:</span>
                        <span className="font-mono font-bold text-slate-800">{scannedResult}</span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 text-xs">
                      {error}
                    </div>
                  )}

                  {/* フォーム 2カラム */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">連絡状況</label>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <RadioGroup value={contact} onValueChange={setContact} className="flex gap-5">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="あり" id="contact-yes" className="border-indigo-400 text-indigo-600 w-5 h-5" />
                            <Label htmlFor="contact-yes" className="text-base font-medium cursor-pointer text-slate-700">あり</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="なし" id="contact-no" className="border-indigo-400 text-indigo-600 w-5 h-5" />
                            <Label htmlFor="contact-no" className="text-base font-medium cursor-pointer text-slate-700">なし</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">遅刻理由</label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger className="h-11 text-sm rounded-lg bg-white border-slate-200 text-slate-800">
                          <SelectValue placeholder="理由を選択" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="交通機関遅延" className="py-2.5">交通機関遅延</SelectItem>
                          <SelectItem value="病院通院" className="py-2.5">病院通院</SelectItem>
                          <SelectItem value="体調不良" className="py-2.5">体調不良</SelectItem>
                          <SelectItem value="寝坊" className="py-2.5">寝坊</SelectItem>
                          <SelectItem value="忘れ物" className="py-2.5">忘れ物</SelectItem>
                          <SelectItem value="その他" className="py-2.5">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {reason === "その他" && (
                    <Input type="text" placeholder="その他の理由を入力" value={otherReason} onChange={(e) => setOtherReason(e.target.value)}
                      className="h-11 text-sm rounded-lg bg-white border-slate-200 text-slate-800" />
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">備考</label>
                    <Input type="text" placeholder="備考や共有事項（任意）" value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="h-11 text-sm rounded-lg bg-white border-slate-200 text-slate-800" />
                  </div>

                  {/* ボタン */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Button onClick={handleSubmit}
                      className="mat-btn h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-lg elevation-2 disabled:opacity-50"
                      disabled={!teacher || !reason || isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          送信中
                        </span>
                      ) : "送信"}
                    </Button>
                    <Button onClick={resetForm}
                      className="mat-btn h-14 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base rounded-lg border border-slate-300 elevation-1"
                      disabled={isSubmitting}>
                      新規スキャン
                    </Button>
                  </div>
                </div>
              ) : (
                /* 待機画面 */
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center elevation-2">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-400 elevation-1 float-slow"></div>
                    <div className="absolute -bottom-1 -left-2 w-2.5 h-2.5 rounded-full bg-emerald-400 elevation-1 float-medium"></div>
                  </div>
                  <p className="text-sm text-slate-600 font-semibold">QRコードをスキャンしてください</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">学生証をカメラに向けてスキャン</p>
                  {!teacher && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        右上から担当教員を選択してください
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
