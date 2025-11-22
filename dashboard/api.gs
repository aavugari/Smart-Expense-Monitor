// ============================================================================
// GOOGLE APPS SCRIPT WEB APP API FOR DASHBOARD
// ============================================================================

/**
 * Web App entry point - handles GET requests from dashboard
 */
function doGet(e) {
  try {
    const data = getDashboardData();
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    const output = ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * Get dashboard data from master sheet
 */
function getDashboardData() {
  const MASTER_SPREADSHEET_ID = "1q4VPBVPNVE10MUc-3INvawEjF9TrIOIK4KLvbq4keqA";
  const masterSheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID).getSheetByName("Master");
  
  if (!masterSheet) {
    throw new Error("Master sheet not found. Please create Master sheet first.");
  }
  
  const today = new Date();
  const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "MM/dd/yyyy");
  const monthStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "MMMM yyyy");
  
  const lastRow = masterSheet.getLastRow();
  if (lastRow <= 1) {
    return {
      todayTotal: 0,
      monthTotal: 0,
      todayBreakdown: {},
      monthBreakdown: {},
      recentTransactions: []
    };
  }
  
  const data = masterSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  
  let todayBreakdown = {};
  let monthBreakdown = {};
  let todayTotal = 0;
  let monthTotal = 0;
  let recentTransactions = [];
  
  data.forEach(row => {
    const bank = row[0];
    const date = new Date(row[1]);
    const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/dd/yyyy");
    const monthYear = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMMM yyyy");
    const amount = parseFloat(row[2]);
    const info = row[3];
    const type = row[4];
    const person = row[9];
    
    if (type === "Debit" && !isNaN(amount)) {
      // Today's totals
      if (dateStr === todayStr) {
        if (!todayBreakdown[person]) todayBreakdown[person] = {};
        if (!todayBreakdown[person][bank]) todayBreakdown[person][bank] = 0;
        todayBreakdown[person][bank] += amount;
        todayTotal += amount;
      }
      
      // Month totals
      if (monthYear === monthStr) {
        if (!monthBreakdown[person]) monthBreakdown[person] = {};
        if (!monthBreakdown[person][bank]) monthBreakdown[person][bank] = 0;
        monthBreakdown[person][bank] += amount;
        monthTotal += amount;
      }
      
      // Recent transactions (last 10)
      recentTransactions.push({
        bank: bank,
        date: dateStr,
        amount: amount,
        info: info,
        person: person
      });
    }
  });
  
  // Sort recent transactions by date (newest first)
  recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    todayTotal: todayTotal,
    monthTotal: monthTotal,
    todayBreakdown: todayBreakdown,
    monthBreakdown: monthBreakdown,
    recentTransactions: recentTransactions.slice(0, 10)
  };
}