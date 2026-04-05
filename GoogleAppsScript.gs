// ========================================
// 生徒遅刻記録システム - Google Apps Script
// ========================================
// このコードをGoogle Apps Scriptエディタにコピーしてください
// 
// スプレッドシート構成:
//   シート1「全履歴」: 全ての遅刻記録を蓄積
//   シート2「本日の遅刻」: 当日のデータのみ自動表示
//   シート3「生徒マスター」: 学籍番号と生徒情報の対応（任意）
// ========================================

// 設定
const CONFIG = {
  SPREADSHEET_ID: '1dkUxgjDPDL_6sAhBzhZoKQjxBIF53kWnKYfYz3it-WE', // ご自身のスプレッドシートIDに変更
  SHEET_ALL_HISTORY: '全履歴',
  SHEET_TODAY: '本日の遅刻',
  SHEET_STUDENTS: '生徒マスター'
};

// ========================================
// メイン処理: データ受信（POST）
// ========================================
function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // POSTデータを解析
    const data = JSON.parse(e.postData.contents);
    
    // 現在の日時を取得
    const now = new Date();
    const dateOnly = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd');
    const timeOnly = Utilities.formatDate(now, 'Asia/Tokyo', 'HH:mm:ss');
    const dateTime = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    
    // 「全履歴」シートにデータを追加
    const allHistorySheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_ALL_HISTORY, getHistoryHeaders());
    const row = [
      data.dateTime || dateTime,  // A: 日時
      dateOnly,                    // B: 日付（フィルタ用）
      timeOnly,                    // C: 時刻
      data.studentId || '',        // D: 学籍番号
      data.studentClass || '',     // E: クラス
      data.studentName || '',      // F: 氏名
      data.contact || '',          // G: 連絡状況
      data.reason || '',           // H: 遅刻理由
      data.teacher || '',          // I: 担当教員
      data.notes || ''             // J: 備考
    ];
    allHistorySheet.appendRow(row);
    
    // 変更を強制的に反映
    SpreadsheetApp.flush();
    
    // 「本日の遅刻」シートを更新
    updateTodaySheet(spreadsheet);
    
    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データが正常に追加されました',
        timestamp: dateTime,
        studentId: data.studentId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    console.error('doPost Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// GETリクエスト処理（テスト・生徒情報取得）
// ========================================
function doGet(e) {
  try {
    const action = e.parameter.action || 'status';
    
    switch(action) {
      case 'getStudent':
        // 生徒情報を取得
        return getStudentInfo(e.parameter.studentId);
      
      case 'getStudents':
        // 全生徒リストを取得
        return getAllStudents();
      
      case 'getTodayRecords':
        // 本日の遅刻記録を取得
        return getTodayRecords();
      
      default:
        // ステータス確認
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'OK',
            message: 'Google Apps Script is ready!',
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            timestamp: new Date().toISOString(),
            availableActions: ['getStudent', 'getStudents', 'getTodayRecords']
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    console.error('doGet Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 生徒情報を取得
// ========================================
// 生徒マスター列: A=学籍番号, B=学年, C=組, D=番号, E=氏名
function getStudentInfo(studentId) {
  if (!studentId) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '学籍番号が指定されていません'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_STUDENTS);
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '生徒マスターシートが見つかりません'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(studentId)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          student: {
            studentId: String(data[i][0]),
            grade: String(data[i][1]),
            classNum: String(data[i][2]),
            number: String(data[i][3]),
            name: String(data[i][4])
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: '生徒が見つかりません',
      studentId: studentId
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 全生徒リストを取得
// ========================================
function getAllStudents() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_STUDENTS);
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '生徒マスターシートが見つかりません'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const students = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      students.push({
        studentId: String(data[i][0]),
        grade: String(data[i][1]),
        classNum: String(data[i][2]),
        number: String(data[i][3]),
        name: String(data[i][4])
      });
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      count: students.length,
      students: students
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 本日の遅刻記録を取得
// ========================================
function getTodayRecords() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_TODAY);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: 0,
        records: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const records = [];
  
  // ヘッダー行をスキップ
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      records.push({
        dateTime: data[i][0],
        time: data[i][2],
        studentId: String(data[i][3]),
        class: data[i][4],
        name: data[i][5],
        contact: data[i][6],
        reason: data[i][7],
        teacher: data[i][8],
        notes: data[i][9]
      });
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      date: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd'),
      count: records.length,
      records: records
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 「本日の遅刻」シートを更新
// ========================================
// トリガーから呼び出す場合（引数なし）
function updateTodaySheet(spreadsheet) {
  // 引数がない場合はスプレッドシートを開く
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  
  const todaySheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_TODAY, getHistoryHeaders());
  const allHistorySheet = spreadsheet.getSheetByName(CONFIG.SHEET_ALL_HISTORY);
  
  if (!allHistorySheet || allHistorySheet.getLastRow() <= 1) {
    console.log('全履歴シートにデータがありません');
    return;
  }
  
  // 今日の日付を取得
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
  console.log('今日の日付:', today);
  
  // 全履歴からデータを取得
  const allData = allHistorySheet.getDataRange().getValues();
  const headers = allData[0];
  
  // 本日のデータをフィルタリング
  const todayData = allData.filter((row, index) => {
    if (index === 0) return false; // ヘッダーはスキップ
    
    // B列の日付を取得して比較
    let rowDate = row[1];
    
    // Date型かどうかを確認（getTimeメソッドがあるかで判定）
    try {
      if (rowDate && typeof rowDate.getTime === 'function') {
        rowDate = Utilities.formatDate(rowDate, 'Asia/Tokyo', 'yyyy/MM/dd');
      } else {
        rowDate = String(rowDate).trim();
      }
    } catch (e) {
      rowDate = String(rowDate).trim();
    }
    
    const isMatch = rowDate === today;
    console.log('行の日付:', rowDate, '| 今日:', today, '| 一致:', isMatch);
    return isMatch;
  });
  
  console.log('本日のデータ件数:', todayData.length);
  
  // 「本日の遅刻」シートをクリアして再構築
  todaySheet.clearContents();
  
  // ヘッダーを設定
  todaySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  styleHeaderRow(todaySheet, headers.length, '#e91e63'); // ピンク色のヘッダー
  
  // 本日のデータを追加
  if (todayData.length > 0) {
    todaySheet.getRange(2, 1, todayData.length, todayData[0].length).setValues(todayData);
    
    // データ行のスタイル設定
    const dataRange = todaySheet.getRange(2, 1, todayData.length, todayData[0].length);
    dataRange.setFontSize(10);
    dataRange.setVerticalAlignment('middle');
  }
  
  // 変更を反映
  SpreadsheetApp.flush();
  
  console.log('本日の遅刻シートを更新しました');
}

// ========================================
// ヘルパー関数
// ========================================

// 履歴シートのヘッダーを取得
function getHistoryHeaders() {
  return [
    '日時',        // A
    '日付',        // B（フィルタ用）
    '時刻',        // C
    '学籍番号',    // D
    'クラス',      // E
    '氏名',        // F
    '連絡状況',    // G
    '遅刻理由',    // H
    '担当教員',    // I
    '備考'         // J
  ];
}

// シートを取得または作成
function getOrCreateSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // ヘッダー行を設定
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダーのスタイルを設定
    const bgColor = sheetName === CONFIG.SHEET_TODAY ? '#e91e63' : '#4285f4';
    styleHeaderRow(sheet, headers.length, bgColor);
    
    // 列幅を自動調整
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

// ヘッダー行のスタイルを設定
function styleHeaderRow(sheet, columnCount, bgColor) {
  const headerRange = sheet.getRange(1, 1, 1, columnCount);
  headerRange.setBackground(bgColor || '#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 30); // ヘッダー行の高さ
  sheet.setFrozenRows(1);
  
  // 列幅を内容に合わせて調整
  const columnWidths = [150, 100, 80, 100, 60, 80, 80, 100, 80, 150]; // 各列の推奨幅
  for (let i = 0; i < Math.min(columnCount, columnWidths.length); i++) {
    sheet.setColumnWidth(i + 1, columnWidths[i]);
  }
}

// ========================================
// 初期設定関数（手動実行用）
// ========================================

// スプレッドシートの初期設定
function initializeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // 1. 「全履歴」シートを作成
  const allHistorySheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_ALL_HISTORY, getHistoryHeaders());
  console.log('「全履歴」シートを作成/確認しました');
  
  // 2. 「本日の遅刻」シートを作成
  const todaySheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_TODAY, getHistoryHeaders());
  console.log('「本日の遅刻」シートを作成/確認しました');
  
  // 3. 「生徒マスター」シートを作成
  const studentHeaders = ['学籍番号', '学年', '組', '番号', '氏名'];
  const studentsSheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_STUDENTS, studentHeaders);
  
  // サンプルデータを追加（既存データがない場合）
  if (studentsSheet.getLastRow() <= 1) {
    const sampleStudents = [
      ['12344321', '中3', '1', '1', '山田太郎'],
      ['67890', '高1', '2', '5', '佐藤花子']
    ];
    studentsSheet.getRange(2, 1, sampleStudents.length, 5).setValues(sampleStudents);
  }
  console.log('「生徒マスター」シートを作成/確認しました');
  
  // 列幅を調整
  allHistorySheet.autoResizeColumns(1, 10);
  todaySheet.autoResizeColumns(1, 10);
  studentsSheet.autoResizeColumns(1, 5);
  
  console.log('初期設定が完了しました！');
}

// 毎日0時に「本日の遅刻」シートをクリア（トリガー設定用）
function clearTodaySheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const todaySheet = spreadsheet.getSheetByName(CONFIG.SHEET_TODAY);
  
  if (todaySheet) {
    // ヘッダー以外をクリア
    const lastRow = todaySheet.getLastRow();
    if (lastRow > 1) {
      todaySheet.getRange(2, 1, lastRow - 1, todaySheet.getLastColumn()).clearContent();
    }
    console.log('「本日の遅刻」シートをクリアしました');
  }
}

// テスト用：サンプルデータを送信
function testAddRecord() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        dateTime: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
        studentId: '12344321',
        studentClass: '3-A',
        studentName: '山田太郎',
        contact: 'あり',
        reason: '交通機関遅延',
        teacher: '山本先生',
        notes: 'テストデータ'
      })
    }
  };
  
  const result = doPost(testData);
  console.log(result.getContent());
}

// ========================================
// CSV取込 → 生徒マスター変換
// ========================================
// 使い方:
//   1. スプレッドシートに「CSV取込」シートを作成
//   2. 学事システムから出力したCSVの内容をそのまま貼り付け
//      (ヘッダー行: 学籍番号,生徒番号,本年,本組,本番,生徒氏名,性別,ふりがな)
//   3. GASエディタからこの関数を実行
//   4. 「生徒マスター」シートにデータが反映される
//
// 年度更新時:
//   「CSV取込」シートに新しいCSVを貼り直して再実行するだけでOK
// ========================================

const CONFIG_CSV = {
  SHEET_CSV_IMPORT: 'CSV取込'
};

// 本年（学事システムの値）→ 学年表示名の変換
// 1=中1, 2=中2, 3=中3, 4=高1, 5=高2, 6=高3
function convertYearToGrade(yearValue) {
  var y = parseInt(yearValue, 10);
  var gradeMap = {
    1: '中1', 2: '中2', 3: '中3',
    4: '高1', 5: '高2', 6: '高3'
  };
  return gradeMap[y] || (y + '年');
}

function importCSVToStudentMaster() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 「CSV取込」シートを取得
  const csvSheet = spreadsheet.getSheetByName(CONFIG_CSV.SHEET_CSV_IMPORT);
  if (!csvSheet) {
    console.error('「CSV取込」シートが見つかりません。シートを作成してCSVデータを貼り付けてください。');
    SpreadsheetApp.getUi().alert(
      'エラー',
      '「CSV取込」シートが見つかりません。\n\n' +
      '手順:\n' +
      '1. シートタブの「+」で新しいシートを追加\n' +
      '2. シート名を「CSV取込」に変更\n' +
      '3. 学事システムのCSVデータをA1に貼り付け\n' +
      '4. この関数を再実行',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const csvData = csvSheet.getDataRange().getValues();
  if (csvData.length <= 1) {
    console.error('CSV取込シートにデータがありません');
    SpreadsheetApp.getUi().alert('エラー', 'CSV取込シートにデータがありません。', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // ヘッダー行から列のインデックスを特定
  const headers = csvData[0].map(function(h) { return String(h).trim(); });
  const colIndex = {
    studentId: headers.indexOf('学籍番号'),
    year:      headers.indexOf('本年'),
    classNum:  headers.indexOf('本組'),
    number:    headers.indexOf('本番'),
    name:      headers.indexOf('生徒氏名')
  };

  // 必須列の存在チェック
  const missing = [];
  if (colIndex.studentId === -1) missing.push('学籍番号');
  if (colIndex.year === -1) missing.push('本年');
  if (colIndex.classNum === -1) missing.push('本組');
  if (colIndex.number === -1) missing.push('本番');
  if (colIndex.name === -1) missing.push('生徒氏名');

  if (missing.length > 0) {
    const msg = '必須列が見つかりません: ' + missing.join(', ') + '\nヘッダー行を確認してください。';
    console.error(msg);
    SpreadsheetApp.getUi().alert('エラー', msg, SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // CSVデータを生徒マスター形式に変換
  // [学籍番号, 学年, 組, 番号, 氏名]
  const students = [];
  for (var i = 1; i < csvData.length; i++) {
    var row = csvData[i];
    var studentId = String(row[colIndex.studentId]).trim();
    if (!studentId || studentId === '') continue;

    var grade = convertYearToGrade(row[colIndex.year]);
    var classNum = String(row[colIndex.classNum]).trim();
    var number = String(row[colIndex.number]).trim();
    var name = String(row[colIndex.name]).trim();

    students.push([studentId, grade, classNum, number, name]);
  }

  if (students.length === 0) {
    SpreadsheetApp.getUi().alert('エラー', '変換可能なデータが見つかりませんでした。', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // 「生徒マスター」シートを取得または作成
  const studentHeaders = ['学籍番号', '学年', '組', '番号', '氏名'];
  const masterSheet = getOrCreateSheet(spreadsheet, CONFIG.SHEET_STUDENTS, studentHeaders);

  // 既存データをクリア（ヘッダーは残す）
  var lastRow = masterSheet.getLastRow();
  if (lastRow > 1) {
    masterSheet.getRange(2, 1, lastRow - 1, masterSheet.getLastColumn()).clearContent();
  }

  // ヘッダーを再設定
  masterSheet.getRange(1, 1, 1, studentHeaders.length).setValues([studentHeaders]);
  styleHeaderRow(masterSheet, studentHeaders.length, '#4285f4');

  // 変換したデータを書き込み
  masterSheet.getRange(2, 1, students.length, 5).setValues(students);

  // 列幅を調整
  masterSheet.setColumnWidth(1, 120); // 学籍番号
  masterSheet.setColumnWidth(2, 60);  // 学年
  masterSheet.setColumnWidth(3, 50);  // 組
  masterSheet.setColumnWidth(4, 50);  // 番号
  masterSheet.setColumnWidth(5, 120); // 氏名

  SpreadsheetApp.flush();

  var msg = '生徒マスターへの取込が完了しました！\n\n' +
    '取込件数: ' + students.length + '名\n' +
    'クラス数: ' + getUniqueClassCount(students) + 'クラス';
  console.log(msg);
  SpreadsheetApp.getUi().alert('取込完了', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ユニークなクラス数をカウント（学年+組の組み合わせ）
function getUniqueClassCount(students) {
  var classes = {};
  for (var i = 0; i < students.length; i++) {
    classes[students[i][1] + '-' + students[i][2]] = true;
  }
  return Object.keys(classes).length;
}
