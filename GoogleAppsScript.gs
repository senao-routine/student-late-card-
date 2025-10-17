// Google Apps Script コード
// このコードをGoogle Apps Scriptエディタにコピーしてください
// ファイル → 新規作成 → Google Apps Script

function doPost(e) {
  try {
    // スプレッドシートIDを設定
    const SPREADSHEET_ID = '1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE';
    const SHEET_NAME = '遅刻記録';
    
    // スプレッドシートを開く
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME) 
                  || SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    
    // POSTデータを解析
    const data = JSON.parse(e.postData.contents);
    
    // 現在の日時を取得
    const now = new Date();
    const dateTime = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    
    // データを配列に整形
    const row = [
      data.dateTime || dateTime,
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
        message: 'Data added successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    // エラーレスポンス
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
      message: 'Google Apps Script is working!',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 初期設定：ヘッダー行を追加
function initializeSheet() {
  const SPREADSHEET_ID = '1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  
  // シート名を設定
  sheet.setName('遅刻記録');
  
  // ヘッダー行を設定
  const headers = [
    '日時',
    '学籍番号', 
    'クラス',
    '氏名',
    '連絡状況',
    '遅刻理由',
    '担当教員',
    '備考'
  ];
  
  // 最初の行にヘッダーを設定
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // ヘッダーのスタイルを設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  // 列幅を自動調整
  sheet.autoResizeColumns(1, headers.length);
}