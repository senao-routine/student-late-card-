"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const QRScanner = dynamic(() => import("../components/QRScanner"), { ssr: false })

const teachers = ["山本先生", "佐藤先生", "鈴木先生", "高橋先生"]

// フォールバック用のローカル生徒データ（GASが使えない場合用）
const fallbackStudentDatabase: Record<string, { class: string; name: string }> = {
  "12344321": { class: "3-A", name: "山田太郎" },
  "67890": { class: "2-B", name: "佐藤花子" },
}

export default function Home() {
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<{ class: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState<string>("なし")
  const [reason, setReason] = useState<string>("")
  const [otherReason, setOtherReason] = useState<string>("")
  const [teacher, setTeacher] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedTeacher = window.localStorage.getItem("defaultTeacher")
    if (savedTeacher) {
      setTeacher(savedTeacher)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (teacher) {
      window.localStorage.setItem("defaultTeacher", teacher)
    } else {
      window.localStorage.removeItem("defaultTeacher")
    }
  }, [teacher])

  // Googleスプレッドシートから生徒情報を取得
  const fetchStudentFromGAS = useCallback(async (studentId: string): Promise<{ class: string; name: string } | null> => {
    const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL
    if (!GAS_URL) {
      console.warn("GAS URLが設定されていません。フォールバックデータを使用します。")
      return null
    }

    try {
      const response = await fetch(`${GAS_URL}?action=getStudent&studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      
      if (data.success && data.student) {
        return {
          class: data.student.class,
          name: data.student.name
        }
      }
      return null
    } catch (error) {
      console.error("生徒情報取得エラー:", error)
      return null
    }
  }, [])

  const handleScan = useCallback(async (result: string) => {
    setScannedResult(result)
    setStudentInfo(null)
    setError(null)
    setIsLoadingStudent(true)

    try {
      // まずGoogleスプレッドシートから取得を試みる
      const student = await fetchStudentFromGAS(result)
      
      if (student) {
        setStudentInfo(student)
      } else {
        // フォールバック: ローカルデータを使用
        const fallbackStudent = fallbackStudentDatabase[result]
        if (fallbackStudent) {
          setStudentInfo(fallbackStudent)
        } else {
          setError("生徒情報が見つかりません。管理者にスプレッドシートへの登録を依頼してください。")
        }
      }
    } catch (err) {
      console.error("スキャン処理エラー:", err)
      setError("生徒情報の取得中にエラーが発生しました。")
    } finally {
      setIsLoadingStudent(false)
    }
  }, [fetchStudentFromGAS])

  const getCurrentDateTime = () => {
    const now = new Date()
    return now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const handleSubmit = async () => {
    if (!scannedResult || !teacher || !reason) {
      toast({
        title: "入力エラー",
        description: "必要な項目を入力してください",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Google Apps Script WebアプリのURL（環境変数から取得）
      const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL
      
      if (!GAS_URL) {
        throw new Error("Google Apps Script URLが設定されていません")
      }

      // 送信データの準備
      const data = {
        dateTime: getCurrentDateTime(),
        studentId: scannedResult,
        studentClass: studentInfo?.class || '',
        studentName: studentInfo?.name || '',
        contact: contact,
        reason: reason === "その他" ? otherReason : reason,
        teacher: teacher,
        notes: notes || ''
      }

      // Google Apps Scriptに送信
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(data),
      })

      // レスポンスを確認
      const responseText = await response.text()
      
      try {
        const result = JSON.parse(responseText)
        if (result.success) {
          toast({
            title: "送信完了",
            description: "遅刻記録がGoogleスプレッドシートに送信されました",
          })
          resetForm()
        } else {
          throw new Error(result.error || "送信に失敗しました")
        }
      } catch (parseError) {
        // JSONパースに失敗した場合でも、リクエストは成功した可能性がある
        toast({
          title: "送信完了",
          description: "遅刻記録を送信しました",
        })
        resetForm()
      }
      
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: "エラー",
        description: "送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setScannedResult(null)
    setStudentInfo(null)
    setError(null)
    setContact("なし")
    setReason("")
    setOtherReason("")
    setNotes("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">生徒遅刻カード発行システム</h1>
      </div>

      <div className="container mx-auto p-4 md:p-6">
        {/* iPad横向き対応: 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] gap-6 max-w-7xl mx-auto">
          {/* 左側: QRスキャナー */}
          <Card className="shadow-lg">
            <CardHeader className="bg-white border-b">
              <CardTitle className="text-xl font-bold text-gray-800">QRコードスキャン</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <QRScanner onScan={handleScan} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* 右側: 学生情報と遅刻理由 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-xl font-bold text-gray-800">
                  {scannedResult ? "学生情報・遅刻理由入力" : "スキャン待機中"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {scannedResult ? (
                  <div className="space-y-6">
                  {/* 学生情報表示 */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">スキャン結果</h2>
                    <div className="space-y-2">
                      <p className="text-base">
                        <span className="font-semibold text-gray-700">学籍番号:</span>{" "}
                        <span className="text-blue-600 font-medium">{scannedResult}</span>
                      </p>
                      {isLoadingStudent ? (
                        <p className="text-base text-gray-500 animate-pulse">
                          生徒情報を取得中...
                        </p>
                      ) : studentInfo ? (
                        <>
                          <p className="text-base">
                            <span className="font-semibold text-gray-700">クラス:</span>{" "}
                            <span className="text-blue-600 font-medium">{studentInfo.class}</span>
                          </p>
                          <p className="text-base">
                            <span className="font-semibold text-gray-700">名前:</span>{" "}
                            <span className="text-blue-600 font-medium">{studentInfo.name}</span>
                          </p>
                        </>
                      ) : null}
                      <p className="text-base">
                        <span className="font-semibold text-gray-700">日時:</span>{" "}
                        <span className="text-blue-600 font-medium">{getCurrentDateTime()}</span>
                      </p>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  {/* フォーム入力部分 */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">連絡状況</h3>
                      <RadioGroup value={contact} onValueChange={setContact} className="flex space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="あり" id="contact-yes" />
                          <Label htmlFor="contact-yes" className="text-base font-medium">あり</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="なし" id="contact-no" />
                          <Label htmlFor="contact-no" className="text-base font-medium">なし</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">遅刻理由</h3>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger className="w-full h-12 text-base">
                          <SelectValue placeholder="理由を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="交通機関遅延" className="text-base py-3">交通機関遅延</SelectItem>
                          <SelectItem value="病院通院" className="text-base py-3">病院通院</SelectItem>
                          <SelectItem value="体調不良" className="text-base py-3">体調不良</SelectItem>
                          <SelectItem value="寝坊" className="text-base py-3">寝坊</SelectItem>
                          <SelectItem value="忘れ物" className="text-base py-3">忘れ物</SelectItem>
                          <SelectItem value="その他" className="text-base py-3">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      {reason === "その他" && (
                        <Input
                          type="text"
                          placeholder="その他の理由を入力してください"
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          className="mt-3 h-12 text-base"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">備考</h3>
                      <Input
                        type="text"
                        placeholder="備考や共有事項を入力してください"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Button
                      onClick={handleSubmit}
                      className="h-14 bg-green-500 hover:bg-green-600 text-white font-semibold text-lg rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!teacher || !reason || isSubmitting}
                    >
                      {isSubmitting ? "送信中..." : "📨 遅刻記録を送信"}
                    </Button>
                    <Button
                      onClick={resetForm}
                      className="h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-lg rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
                      disabled={isSubmitting}
                    >
                      新規スキャン
                    </Button>
                  </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.293l8.707 8.707a1 1 0 001.414-1.414L3.414 4.707A1 1 0 002 4V3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-500 font-medium">左側でQRコードをスキャンしてください</p>
                    <p className="text-sm text-gray-400 mt-2">学生証のQRコードをカメラに向けてスキャンしてください</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 担当教員設定カード */}
            <Card className="shadow-lg border-l-4 border-blue-400 bg-white">
              <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-xl font-bold text-gray-800">担当教員設定</CardTitle>
                <p className="text-sm text-blue-600 font-medium">
                  一度選択した担当教員はこの端末で保持されます
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <Select value={teacher} onValueChange={setTeacher}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="担当教員を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacherName) => (
                      <SelectItem key={teacherName} value={teacherName} className="text-base py-3">
                        {teacherName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">現在の担当教員</p>
                  <p className="text-xl font-semibold text-blue-700 mt-1">
                    {teacher || "未選択"}
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  別の教員が対応する場合は上のリストから選び直してください。新規スキャンを押しても選択は保持されます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  )
}