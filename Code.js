var widget = HtmlService.createHtmlOutput("<h1>Sidebar</h1>");
widget.setTitle("Admin page");

// create the sidebar immediately upon opening the sheet
function onOpen() {
 try {
    SpreadsheetApp.getUi().createMenu('Admin')
        .addItem("Admin page", "showAdminSidebar")
        .addItem('Show prompt', 'showPrompt')
        .addToUi();
        window.print("passed");
  } catch (e) {
    // TODO (Developer) - Handle exception
    console.log('Failed with error: %s', e.error);
  } 
}

// Drop Down Listener
function dropDown() {
const dropdownMenu = document.getElementById("dropdown-menu");

dropdownMenu.addEventListener("change", (event) => {
  const selectedOption = event.target.value;
  console.log(`You selected: ${selectedOption}`);
});
}

function showAdminSidebar() {
 var widget = HtmlService.createHtmlOutputFromFile("Adminpage.html");
 widget.setTitle("Admin page");
 SpreadsheetApp.getUi().showSidebar(widget);
}

// prompt for input: user's name instead of button
function showPrompt() {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  var result = ui.prompt(
      'Please enter your name:',
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    // User clicked "OK".
    ui.alert('Entered name ' + text + '.');
  } else if (button == ui.Button.CANCEL) {
    // User clicked "Cancel".
    ui.alert('I didn\'t get your name.');
  } else if (button == ui.Button.CLOSE) {
    // User clicked X in the title bar.
    ui.alert('You closed the dialog.');
  }
}

/**
 * onEdit function is automatically triggered by AppsScript when a change is made in the spreadsheet
 * The edit event object e is manipulated slightly
 * Then a new row is added to the log with the corresponding event info
 * Then the updateHistory function is called with the modified event object
 */
function onEdit(e) {
  console.log('onEdit trigger called by ', Session.getActiveUser())
  var editEvent = e
  editEvent.sheet = e.range.getSheet().getName()
  var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
  var currSheet = e.range.getSheet().getName();
  var formula = e.range.getFormulaR1C1();
  var cell = e.range.getA1Notation();
  var timestamp = new Date();
  if (formula == '') {
    formula = 'Manual Entry'
  } else {
    formula = "'" + formula;
  }
  if(currSheet != 'Log') {
    log.appendRow([timestamp, cell, currSheet, e.oldValue, e.value, formula, e.user]);
    log.getDataRange().setHorizontalAlignment('left');
  }
  updateHistory(editEvent)
}

/**
 * loadCell function is called from the HTML file to check if the data has changed at all
 * It gets all the information for the currently selected cell and necessary global properties
 * Then cellChanged global variable is set to false
 * Then a cell object is returned to the HTML with all of the updated cell info
 */
function loadCell() {
  sheet = SpreadsheetApp.getActiveSheet();
  cell = sheet.getCurrentCell();
  row = cell.getRow();
  col = cell.getColumn();
  currValue = cell.getValue();
  cellChanged = false;
  const properties = PropertiesService.getScriptProperties();
  cellChanged = properties.getProperty('cellChanged');
  properties.setProperty('cellChanged', false);
  history = cellHistory(sheet.getCurrentCell());
  returnObj = {row: row, col: col, currValue: currValue, history: history, cellChanged: cellChanged};
  console.log('loadCell return obj: ', returnObj, "called by ", Session.getActiveUser())
  return returnObj;
}

/**
 * onSelectionChange function is automatically triggered by AppsScript when the user changes the cell that is currently selected
 * This function sets the global cellChanged variable to true
 */
function onSelectionChange(e) {
  const properties = PropertiesService.getScriptProperties()
  properties.setProperty('cellChanged', true)
}


/**
 * updatehistory function is called when the onEdit trigger has fired
 * It creates a history object using the info from the editEvent object and the corresponding range
 * It retrieves the history object from the global history property
 * If the current sheet and cell already exist in history, then the historyObj is just added to the corresponding array
 * If either of these don't already exist, then the historyObj is added to a new empty array for the corresponding cell
 */
function updateHistory(editEvent) {
  console.log('updateHistory called with editEvent: ', editEvent)
  const properties = PropertiesService.getScriptProperties();
  range = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(editEvent.sheet).getRange(editEvent.range.rowStart, editEvent.range.columnStart)
  currSheet = editEvent.sheet;
  var historyObject = {
    timestamp: new Date(),
    oldValue: editEvent.oldValue,
    newValue: range.getFormulaR1C1() == editEvent.value ? math.evaluate(editEvent.value.substring(1)) : editEvent.value,
    formula: range.getFormulaR1C1().substring(1)
  };
  cell = range.getA1Notation();
  tempHistory = JSON.parse(properties.getProperty('history'));
  if(currSheet in tempHistory == false) {
    tempHistory[currSheet] = {};
    tempHistory[currSheet][cell] = [historyObject];
  } else {
    if(cell in tempHistory[currSheet] == false) {
      tempHistory[currSheet][cell] = [historyObject];
    } else {
      tempHistory[currSheet][cell].push(historyObject);
    }
  }
  properties.setProperty('history', JSON.stringify(tempHistory));
}


/**
 * createFilter function is called when creating the Log sheet
 * It creates a filter for the entire active dataRange
 */
function createFilter() {
  var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log').getDataRange();
  var filter = log.createFilter();
  var criteria = SpreadsheetApp.newFilterCriteria();
  filter.setColumnFilterCriteria(1, criteria);
}

/**
 * cellHistory function is called by the loadCell function to get the updated history for a specific cell
 * It retrieves the current history object and seearches for the specific sheet and cell
 * If the cell exists in the history object, it returns that array
 * If not, it returns and empty array
 */
function cellHistory(cell) {
  var currSheet = cell.getSheet().getName();
  var currCell = cell.getA1Notation();
  const properties = PropertiesService.getScriptProperties()
  tempHistory = JSON.parse(properties.getProperty('history'));
  if(tempHistory[currSheet] && tempHistory[currSheet][currCell]) {
    return tempHistory[currSheet][currCell];
  } else {
    return []
  }
}




