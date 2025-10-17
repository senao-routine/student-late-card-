# 生徒遅刻記録システム

QRコードスキャンによる遅刻記録をGoogleスプレッドシートに自動送信するシステムです。

🌐 **デプロイ済みURL**: https://student-late-qrapp.web.app

## 🚀 特徴

- ✅ **完全無料**（Firebase Hosting + Google Apps Script）
- 📱 学生証のQRコードをスキャン
- 📝 遅刻理由・連絡状況の入力
- 📊 Googleスプレッドシートへの自動記録
- 👨‍🏫 担当教員の設定（ローカル保存）
- 📱 タブレット・スマートフォン対応
- 🔒 データベース不要のシンプル構成

## 📋 セットアップ手順

### 1. Google Apps Script（GAS）の設定

**重要**: この手順は必須です。GASを設定しないとデータ送信ができません。

1. `GAS_SETUP.md`の手順に従ってGoogle Apps Scriptを設定
2. デプロイ後に取得したURLをメモ

### 2. 環境変数の設定

`.env.local`ファイルを編集：
```env
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3. 依存関係のインストール

```bash
npm install --legacy-peer-deps
```

### 4. ローカル開発

```bash
npm run dev
```
http://localhost:3000 でアプリが起動します

### 5. デプロイ

```bash
# ビルド & デプロイ
npm run deploy

# または個別に実行
npm run build
firebase deploy --only hosting
```

## 📊 Googleスプレッドシート

- **スプレッドシートID**: `1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE`
- **URL**: [スプレッドシートを開く](https://docs.google.com/spreadsheets/d/1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE/)

### データ形式

| 列 | 内容 |
|---|------|
| A | 日時 |
| B | 学籍番号 |
| C | クラス |
| D | 氏名 |
| E | 連絡状況 |
| F | 遅刻理由 |
| G | 担当教員 |
| H | 備考 |

## 🔧 学生データの追加

`app/page.tsx`の`mockStudentDatabase`オブジェクトに学生データを追加：

```typescript
const mockStudentDatabase: Record<string, { class: string; name: string }> = {
  "12344321": { class: "3-A", name: "山田太郎" },
  "67890": { class: "2-B", name: "佐藤花子" },
  // 新しい学生データを追加
  "11111": { class: "1-C", name: "田中一郎" },
}
```

追加後は再ビルド・再デプロイが必要：
```bash
npm run deploy
```

## 💰 料金

- **完全無料**
  - Firebase Hosting（Sparkプラン）: 無料
  - Google Apps Script: 無料
  - Googleスプレッドシート: 無料

### 無料枠の制限
- Firebase Hosting: 10GB/月の転送量
- Google Apps Script: 20,000回/日のAPI呼び出し
- 通常の利用では十分な容量です

## 🛠️ トラブルシューティング

### データが送信されない
1. Google Apps ScriptのURLが正しく設定されているか確認
2. ブラウザの開発者コンソールでエラーを確認
3. Google Apps Scriptのログを確認（GASエディタ → 表示 → ログ）

### QRコードが読み取れない
- カメラへのアクセス許可を確認
- HTTPSでアクセスしているか確認（カメラはHTTPS必須）

## 📚 ドキュメント

- `GAS_SETUP.md` - Google Apps Scriptの詳細な設定手順
- `FREE_DEPLOY_GUIDE.md` - 無料デプロイの詳細ガイド

## 🔄 更新方法

1. コードを修正
2. `npm run build`でビルド
3. `firebase deploy --only hosting`でデプロイ

## 使用技術

- Next.js 14 (静的サイト生成)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase Hosting
- Google Apps Script
- html5-qrcode

## ライセンス

MIT