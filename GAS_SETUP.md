# 📝 Google Apps Script 設定手順

## ステップ1: Google Apps Scriptプロジェクトを作成

1. Googleアカウント（s-otobe@kyoto-hanazono-h.ed.jp）でログイン
2. [Google Apps Script](https://script.google.com/) にアクセス
3. 「新しいプロジェクト」をクリック

## ステップ2: コードをコピー

1. デフォルトの`コード.gs`ファイルの内容をすべて削除
2. 以下のコードをコピーして貼り付け：

```javascript
function doPost(e) {
  try {
    // スプレッドシートIDを設定
    const SPREADSHEET_ID = '1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE';
    const SHEET_NAME = '遅刻記録';
    
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // ヘッダー行を追加
      const headers = ['日時', '学籍番号', 'クラス', '氏名', '連絡状況', '遅刻理由', '担当教員', '備考'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // ヘッダーのスタイル設定
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    // POSTデータを解析
    const data = JSON.parse(e.postData.contents);
    
    // データを配列に整形
    const row = [
      data.dateTime || new Date().toLocaleString('ja-JP'),
      data.studentId || '',
      data.studentClass || '',
      data.studentName || '',
      data.contact || '',
      data.reason || '',
      data.teacher || '',
      data.notes || ''
    ];
    
    // スプレッドシートに追加
    sheet.appendRow(row);
    
    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data added successfully',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    // エラーレスポンス
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト用（テスト用）
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Google Apps Script is ready!',
      spreadsheetId: '1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. ファイル名を「遅刻記録API」などわかりやすい名前に変更（オプション）

## ステップ3: プロジェクトを保存

1. Ctrl+S（Mac: Cmd+S）で保存
2. プロジェクト名を「生徒遅刻記録システム」などに設定

## ステップ4: デプロイ

1. 右上の「デプロイ」ボタンをクリック
2. 「新しいデプロイ」を選択
3. 歯車アイコン → 「ウェブアプリ」を選択
4. 以下の設定を行う：
   - **説明**: 任意（例：v1.0）
   - **次のユーザーとして実行**: 自分（s-otobe@kyoto-hanazono-h.ed.jp）
   - **アクセスできるユーザー**: 全員
5. 「デプロイ」ボタンをクリック

## ステップ5: URLを取得

1. デプロイ完了後、表示される「ウェブアプリ」のURLをコピー
   - 形式: `https://script.google.com/macros/s/AKfycbx.../exec`
2. このURLを`.env.local`ファイルに設定

## ステップ6: 権限の承認

初回実行時に権限の承認が必要な場合：

1. 「権限を確認」をクリック
2. Googleアカウントを選択
3. 「詳細」をクリック → 「安全でないページに移動」
4. 必要な権限を承認

## ステップ7: テスト

ブラウザでURLにアクセスして、以下のようなJSONが表示されれば成功：

```json
{
  "message": "Google Apps Script is ready!",
  "spreadsheetId": "1KllPnAs1EpifheKLmNRIAYR7aXeHGFtW0cFeYuXiCjE",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

## トラブルシューティング

### エラー: スプレッドシートにアクセスできない
- スプレッドシートIDが正しいか確認
- Google Apps Scriptがスプレッドシートにアクセスする権限があるか確認

### エラー: CORS
- アクセスできるユーザーが「全員」に設定されているか確認

### データが追加されない
- Google Apps Scriptのログを確認（表示 → ログ）
- スプレッドシートのシート名が「遅刻記録」になっているか確認

## 更新方法

コードを変更した場合：
1. コードを編集
2. 保存（Ctrl+S / Cmd+S）
3. デプロイ → デプロイを管理
4. 編集（鉛筆アイコン）
5. バージョン：「新バージョン」を選択
6. 「デプロイ」

## セキュリティ上の注意

- このURLは公開URLのため、知っている人なら誰でもアクセス可能
- 重要な個人情報を扱う場合は、追加のセキュリティ対策を検討してください