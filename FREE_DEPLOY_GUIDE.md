# 🆓 完全無料でデプロイする方法

このアプリを完全無料で運用する2つの方法を説明します。

## 方法1: Firebase Hosting + Google Apps Script（推奨）

### メリット
- ✅ 完全無料
- ✅ サーバー管理不要
- ✅ スケーラブル
- ✅ SSL証明書自動

### 手順

#### 1. Google Apps Script（GAS）の設定

1. Googleドライブにアクセス（https://drive.google.com）
2. 新規 → その他 → Google Apps Script
3. `GoogleAppsScript.gs`の内容をコピー＆ペースト
4. 保存（プロジェクト名：`遅刻記録API`など）
5. デプロイ → 新しいデプロイ
   - 種類：ウェブアプリ
   - 実行ユーザー：自分
   - アクセス：全員
6. デプロイ後に表示される**ウェブアプリのURL**をコピー

#### 2. 環境変数の設定

`.env.local`ファイルを作成：
```env
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

#### 3. アプリの修正

`app/page.tsx`を修正（Server ActionsをClient側に移動）：

```typescript
// importを変更
import { submitToGoogleSheets } from '@/lib/google-sheets-client'

// handleSubmit関数内を変更
const result = await submitToGoogleSheets({
  studentId: scannedResult,
  studentClass: studentInfo?.class || '',
  studentName: studentInfo?.name || '',
  dateTime: getCurrentDateTime(),
  contact: contact,
  reason: reason === "その他" ? otherReason : reason,
  teacher: teacher,
  notes: notes
})
```

#### 4. Next.js設定を静的エクスポートに変更

`next.config.mjs`：
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}
```

#### 5. ビルドとデプロイ

```bash
# ビルド
npm run build

# Firebaseにデプロイ（Sparkプラン = 無料）
firebase deploy --only hosting
```

---

## 方法2: Vercel + Google Apps Script

### メリット
- ✅ 完全無料（趣味利用）
- ✅ 自動デプロイ
- ✅ プレビュー環境
- ✅ 高速なCDN

### 手順

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)でインポート
3. 環境変数`NEXT_PUBLIC_GAS_URL`を設定
4. デプロイ

---

## 方法3: Netlify + Google Apps Script

### メリット
- ✅ 完全無料（300分/月のビルド時間）
- ✅ カスタムドメイン無料
- ✅ フォーム機能付き

### 手順

```bash
# ビルド
npm run build

# Netlifyにデプロイ
netlify deploy --prod --dir=out
```

---

## 🎯 推奨構成

**Firebase Hosting（無料） + Google Apps Script（無料）**

理由：
1. 完全無料で運用可能
2. Googleのインフラで高い信頼性
3. スプレッドシートとの親和性が高い
4. メンテナンスフリー

## ⚠️ 注意事項

### Google Apps Scriptの制限
- 実行時間：6分/実行
- リクエスト：同時実行30
- URL取得：20,000回/日

通常の利用では問題ありませんが、大規模利用の場合は要注意。

## 📊 料金比較

| サービス | 月額費用 | 特徴 |
|---------|---------|------|
| Firebase Sparkプラン | 無料 | Hosting、Auth、Firestore（制限あり） |
| Vercel Hobby | 無料 | 個人利用、商用不可 |
| Netlify Free | 無料 | 300分ビルド/月、100GB帯域 |
| Firebase Blazeプラン | 従量課金 | Cloud Functions利用可 |

## 切り替え手順

現在のCloud Functions構成から無料構成に切り替える：

1. Google Apps Scriptをセットアップ
2. 環境変数を設定
3. コードを修正（上記参照）
4. `npm run build`
5. `firebase deploy --only hosting`

これで完全無料で運用できます！