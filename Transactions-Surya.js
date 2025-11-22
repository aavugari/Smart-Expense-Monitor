// ============================================================================
// SURYA'S TRANSACTION EXTRACTOR - CONSOLIDATED VERSION
// ============================================================================

const CONFIG = {
  HEADERS: ["Bank", "Date", "Amount", "Transaction Info", "Transaction Type", "Category", "Month", "Year"],
  DATE_FORMAT: "MM/dd/yyyy",
  TIMEZONE: Session.getScriptTimeZone(),
  AMEX_FORMAT_CUTOFF: new Date("2025-04-01T00:00:00"),
  DEFAULT_SEARCH_DATE: "2025/01/01"
};

const BASE_CATEGORIES = {
  "Amazon": "Amazon",
  "Swiggy Instamart": "Grocery",
  "Swiggy": "Food",
  "Zomato": "Food",
  "Zepto": "Grocery",
  "Blinkit": "Grocery",
  "Ratnadeep": "Grocery",
  "Apollo": "Health",
  "Netflix": "Netflix",
  "YouTube": "Youtube Subscription",
  "Google": "Google Subscription",
  "Fuel": "Fuel",
  "HP PAY": "Fuel",
  "Petrol": "Fuel",
  "Donation": "Donation",
  "Milaap": "Donation",
  "Akshaya": "Donation",
  "Nykaa": "Shopping",
  "Myntra": "Shopping",
  "BigBasket": "Grocery",
  "LICIOUS": "Food",
  "Food": "Food",
  "Sweet": "Food",
  "Cake": "Food",
  "Voucher": "Amex Voucher",
  "Yashoda": "Health",
  "Vijaya": "Health",
  "Medical": "Health",
  "Hospital": "Health",
  "Drug": "Health",
  "Fashion": "Shopping",
  "Car E GH": "Car Maintainance",
  "Automotive": "Car Maintainance",
  "ABR CAFE": "Cafe Niloufer",
  "CAFE NILOUFER": "Cafe Niloufer",
  "Dadus": "Food",
  "Pista": "Food",
  "Mixture": "Food"
};

function extractBankTransactions() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(CONFIG.HEADERS);
    }
    
    var cutoffDate = new Date();
    cutoffDate.setTime(cutoffDate.getTime() - (24 * 60 * 60 * 1000));
    
    removeRecentTransactions(sheet, cutoffDate);
    
    Logger.log("Extracting transactions from last 24 hours: " + cutoffDate.toString());
    
    var extractedCounts = {
      "ICICI": 0,
      "HDFC": 0,
      "AMEX": 0
    };
    
    extractedCounts["ICICI"] = extractICICITransactions(sheet, cutoffDate);
    extractedCounts["HDFC"] = extractHDFCTransactions(sheet, cutoffDate);
    extractedCounts["AMEX"] = extractAmexTransactions(sheet, cutoffDate);
    
    formatDateColumn(sheet);
    
    var total = 0;
    for (var bank in extractedCounts) {
      Logger.log(bank + ": " + extractedCounts[bank] + " transactions");
      total += extractedCounts[bank];
    }
    Logger.log("TOTAL: " + total + " transactions extracted");
    
  } catch (error) {
    Logger.log("ERROR: " + error.toString());
    throw error;
  }
}

// Removed getExtractionMode and getCutoffDate functions - no longer needed

function removeRecentTransactions(sheet, cutoffDate) {
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
    
    var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var rowsToDelete = [];
    
    values.forEach(function(row, index) {
      var rowDate = new Date(row[1]);
      if (rowDate >= cutoffDate) {
        rowsToDelete.push(index + 2);
      }
    });
    
    rowsToDelete.reverse().forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
    
  } catch (error) {
    Logger.log("Error removing recent transactions: " + error.toString());
  }
}

function extractICICITransactions(sheet, cutoffDate) {
  var threads = GmailApp.search('from:credit_cards@icicibank.com OR from:alerts@icicibank.com subject:"Transaction alert"');
  var messages = GmailApp.getMessagesForThreads(threads);
  var count = 0;

  messages.forEach(function(thread) {
    thread.forEach(function(message) {
      try {
        var messageDate = message.getDate();
        if (messageDate < cutoffDate) return;
        
        var body = message.getBody();
        var amountMatch = body.match(/INR\s([\d,]+\.\d{2})/);
        var amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
        
        var infoMatch = body.match(/Info:\s(.*?)\./);
        var transactionInfo = infoMatch ? infoMatch[1].trim() : null;
        
        var transactionType = (body.includes("credited") || body.includes("Payment received")) ? "Credit" : "Debit";
        
        if (appendIfValid(sheet, "ICICI", messageDate, amount, transactionInfo, transactionType)) {
          count++;
        }
      } catch (error) {
        Logger.log("Error processing ICICI message: " + error.toString());
      }
    });
  });
  
  return count;
}

function extractHDFCTransactions(sheet, cutoffDate) {
  var threads = GmailApp.search('from:alerts@hdfcbank.net subject:("Alert : Update on your HDFC Bank Credit Card" OR "debited via Credit Card")');
  var messages = GmailApp.getMessagesForThreads(threads);
  var count = 0;

  messages.forEach(function(thread) {
    thread.forEach(function(message) {
      try {
        var messageDate = message.getDate();
        if (messageDate < cutoffDate) return;
        
        var body = message.getBody();
        var amountMatch = body.match(/Rs\.?\s?([\d,]+\.\d{2})/i);
        var amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
        
        var infoMatch = body.match(/towards\s(.+?)\son/i) || 
                       body.match(/at\s(.+?)\son/i) || 
                       body.match(/for\s(.+?)\son/i);
        var transactionInfo = infoMatch ? infoMatch[1].trim() : null;
        
        var transactionType = (body.includes("credited") || body.includes("Payment received")) ? "Credit" : "Debit";
        
        if (appendIfValid(sheet, "HDFC", messageDate, amount, transactionInfo, transactionType)) {
          count++;
        }
      } catch (error) {
        Logger.log("Error processing HDFC message: " + error.toString());
      }
    });
  });
  
  return count;
}

function extractAmexTransactions(sheet, cutoffDate) {
  var threads = GmailApp.search('(from:AmericanExpress@welcome.americanexpress.com OR from:alerts@americanexpress.com)');
  var messages = GmailApp.getMessagesForThreads(threads);
  var count = 0;

  messages.forEach(function(thread) {
    thread.forEach(function(message) {
      try {
        var messageDate = message.getDate();
        if (messageDate < cutoffDate) return;
        
        var subject = message.getSubject();
        var body = message.getBody();
        var plainBody = message.getPlainBody();
        
        var amount = null;
        var transactionInfo = null;
        var finalDate = messageDate;
        
        if (messageDate < CONFIG.AMEX_FORMAT_CUTOFF && subject.includes("One-Time Password")) {
          var amountMatch = body.match(/INR\s([\d,]+\.\d{2})/);
          amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
          
          var infoMatch = body.match(/at\s([A-Za-z0-9\s\-\&\.\,]+)/i);
          transactionInfo = infoMatch ? infoMatch[1].trim() : "Unknown Merchant";
          
        } else if (plainBody.includes("Merchant:")) {
          var merchantMatch = plainBody.match(/Merchant:\s*\n*\s*(.*?)\s*\n/i);
          var amountMatch = plainBody.match(/Amount:\s*\n*INR\s*([\d,]+\.\d{2})/i);
          var dateMatch = plainBody.match(/Date:\s*\n*\s*([0-9]{1,2}\s\w+,\s20\d{2})/i);
          
          transactionInfo = merchantMatch ? merchantMatch[1].trim() : "Unknown Merchant";
          amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
          
          if (dateMatch) {
            finalDate = new Date(dateMatch[1]);
          }
        } else {
          return;
        }
        
        if (appendIfValid(sheet, "Amex", finalDate, amount, transactionInfo, "Debit")) {
          count++;
        }
      } catch (error) {
        Logger.log("Error processing Amex message: " + error.toString());
      }
    });
  });
  
  return count;
}

function appendIfValid(sheet, bank, date, amount, transactionInfo, transactionType) {
  if (!sheet || !date || !amount || isNaN(amount)) return false;
  
  if (!transactionInfo) transactionInfo = "Unknown";
  
  var category = getCategory(transactionInfo);
  var month = Utilities.formatDate(date, CONFIG.TIMEZONE, "MMMM");
  var year = Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy");
  
  sheet.appendRow([bank, date, amount, transactionInfo, transactionType, category, month, year]);
  return true;
}

function formatDateColumn(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 2, lastRow - 1, 1).setNumberFormat(CONFIG.DATE_FORMAT);
  }
}

function getCategory(transactionInfo) {
  if (!transactionInfo) return "Others";
  
  var lowerInfo = transactionInfo.toLowerCase();
  
  for (var keyword in BASE_CATEGORIES) {
    if (lowerInfo.includes(keyword.toLowerCase())) {
      return BASE_CATEGORIES[keyword];
    }
  }
  
  return "Others";
}

function extractICICIOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var cutoffDate = new Date("2025-01-01T00:00:00");
  
  var count = extractICICITransactions(sheet, cutoffDate);
  formatDateColumn(sheet);
  Logger.log("ICICI extraction complete: " + count + " transactions from Jan 1st");
}

function extractHDFCOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var cutoffDate = new Date("2025-01-01T00:00:00");
  
  var count = extractHDFCTransactions(sheet, cutoffDate);
  formatDateColumn(sheet);
  Logger.log("HDFC extraction complete: " + count + " transactions from Jan 1st");
}

function extractAmexOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var cutoffDate = new Date("2025-01-01T00:00:00");
  
  var count = extractAmexTransactions(sheet, cutoffDate);
  formatDateColumn(sheet);
  Logger.log("Amex extraction complete: " + count + " transactions from Jan 1st");
}