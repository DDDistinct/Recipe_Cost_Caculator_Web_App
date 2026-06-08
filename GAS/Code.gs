function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = JSON.parse(e.postData ? e.postData.contents : "{}");
    const token = params.token || "";
    const sheetId = params.sheetId || "";

    if (!sheetId) {
      return respond({ success: false, error: "Sheet ID is required" });
    }

    const ss = SpreadsheetApp.openById(sheetId);
    const action = params.action || "";

    switch (action) {
      case "test":
        return respond({ success: true, message: "Connection successful" });
      case "list":
        return handleList(ss, params);
      case "add":
        return handleAdd(ss, params);
      case "update":
        return handleUpdateIngredient(ss, params);
      case "delete":
        return handleDelete(ss, params);
      case "saveRecipe":
        return handleSaveRecipe(ss, params);
      case "listSelling":
        return handleListSelling(ss, params);
      case "updateSelling":
        return handleUpdateSelling(ss, params);
      case "deleteSelling":
        return handleDeleteSelling(ss, params);
      default:
        return respond({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function getOrCreateIngredientsSheet(ss) {
  let sheet = ss.getSheetByName("Ingredients");
  if (!sheet) {
    sheet = ss.insertSheet("Ingredients");
    sheet.appendRow(["Ingredient_No", "Ingredient_Name", "Unit", "Purchased_Quantity", "Purchased_Price", "Cost_Per_Unit"]);
    sheet.getRange("1:1").setFontWeight("bold");
  }
  return sheet;
}

function getOrCreateSellingPriceSheet(ss) {
  let sheet = ss.getSheetByName("Selling_Price");
  if (!sheet) {
    sheet = ss.insertSheet("Selling_Price");
    sheet.appendRow(["Item_No", "Item_Name", "Item_Description", "Selling_Price", "Total_Cost"]);
    sheet.getRange("1:1").setFontWeight("bold");
  }
  return sheet;
}

function handleList(ss, params) {
  const sheet = getOrCreateIngredientsSheet(ss);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return respond({ success: true, ingredients: [] });
  }

  const rows = data.slice(1).map(function(row, index) {
    return {
      rowIndex: index + 1,
      ingredientNo: Number(row[0]) || 0,
      name: row[1] || "",
      unit: row[2] || "g",
      purchasedQty: Number(row[3]) || 0,
      purchasedPrice: Number(row[4]) || 0,
      costPerUnit: Number(row[5]) || 0,
    };
  });

  return respond({ success: true, ingredients: rows });
}

function handleAdd(ss, params) {
  var sheet = getOrCreateIngredientsSheet(ss);
  var name = params.name, unit = params.unit, purchasedQty = params.purchasedQty, purchasedPrice = params.purchasedPrice;

  if (!name || !unit) {
    return respond({ success: false, error: "Name and unit are required" });
  }

  var qty = Number(purchasedQty) || 0;
  var price = Number(purchasedPrice) || 0;
  var costPerUnit = qty > 0 ? price / qty : 0;

  var data = sheet.getDataRange().getValues();
  var nextNo = 1;
  for (var i = 1; i < data.length; i++) {
    var no = Number(data[i][0]) || 0;
    if (no >= nextNo) nextNo = no + 1;
  }

  sheet.appendRow([nextNo, name.trim(), unit.trim(), qty, price, costPerUnit]);

  return respond({ success: true, message: "Ingredient added", costPerUnit: costPerUnit, ingredientNo: nextNo });
}

function handleDelete(ss, params) {
  var rowIndex = params.rowIndex;

  if (rowIndex === undefined || rowIndex < 1) {
    return respond({ success: false, error: "Invalid row index" });
  }

  var sheet = ss.getSheetByName("Ingredients");
  if (!sheet) {
    return respond({ success: false, error: "Ingredients sheet not found" });
  }

  var sheetGridId = sheet.getSheetId();

  Sheets.Spreadsheets.batchUpdate({
    requests: [{
      deleteDimension: {
        range: {
          sheetId: sheetGridId,
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }],
  }, ss.getId());

  return respond({ success: true, message: "Ingredient deleted" });
}

function handleSaveRecipe(ss, params) {
  var sheet = getOrCreateSellingPriceSheet(ss);
  var itemName = params.itemName, description = params.description || "", sellingPrice = params.sellingPrice, totalCost = params.totalCost;

  if (!itemName) {
    return respond({ success: false, error: "Item name is required" });
  }

  var data = sheet.getDataRange().getValues();
  var nextNo = 1;
  for (var i = 1; i < data.length; i++) {
    var no = Number(data[i][0]) || 0;
    if (no >= nextNo) nextNo = no + 1;
  }

  sheet.appendRow([nextNo, itemName.trim(), description.trim(), Number(sellingPrice) || 0, Number(totalCost) || 0]);

  return respond({ success: true, message: "Recipe saved", itemNo: nextNo });
}

function handleUpdateIngredient(ss, params) {
  var sheet = getOrCreateIngredientsSheet(ss);
  var rowIndex = params.rowIndex, name = params.name, unit = params.unit;
  var purchasedQty = params.purchasedQty, purchasedPrice = params.purchasedPrice, ingredientNo = params.ingredientNo;

  if (rowIndex === undefined || rowIndex < 1) {
    return respond({ success: false, error: "Invalid row index" });
  }

  var qty = Number(purchasedQty) || 0;
  var price = Number(purchasedPrice) || 0;
  var costPerUnit = qty > 0 ? price / qty : 0;

  var range = sheet.getRange(rowIndex + 1, 1, 1, 6);
  range.setValues([[Number(ingredientNo) || 0, name.trim(), unit.trim(), qty, price, costPerUnit]]);

  return respond({ success: true, message: "Ingredient updated", costPerUnit: costPerUnit });
}

function handleListSelling(ss, params) {
  var sheet = getOrCreateSellingPriceSheet(ss);
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return respond({ success: true, recipes: [] });
  }

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    rows.push({
      rowIndex: i,
      itemNo: Number(data[i][0]) || 0,
      itemName: data[i][1] || "",
      description: data[i][2] || "",
      sellingPrice: Number(data[i][3]) || 0,
      totalCost: Number(data[i][4]) || 0,
    });
  }

  return respond({ success: true, recipes: rows });
}

function handleUpdateSelling(ss, params) {
  var sheet = getOrCreateSellingPriceSheet(ss);
  var rowIndex = params.rowIndex;

  if (rowIndex === undefined || rowIndex < 1) {
    return respond({ success: false, error: "Invalid row index" });
  }

  var range = sheet.getRange(rowIndex + 1, 1, 1, 5);
  range.setValues([[
    Number(params.itemNo) || 0,
    (params.itemName || "").trim(),
    (params.description || "").trim(),
    Number(params.sellingPrice) || 0,
    Number(params.totalCost) || 0,
  ]]);

  return respond({ success: true, message: "Record updated" });
}

function handleDeleteSelling(ss, params) {
  var rowIndex = params.rowIndex;

  if (rowIndex === undefined || rowIndex < 1) {
    return respond({ success: false, error: "Invalid row index" });
  }

  var sheet = ss.getSheetByName("Selling_Price");
  if (!sheet) {
    return respond({ success: false, error: "Selling_Price sheet not found" });
  }

  var sheetGridId = sheet.getSheetId();

  Sheets.Spreadsheets.batchUpdate({
    requests: [{
      deleteDimension: {
        range: {
          sheetId: sheetGridId,
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }],
  }, ss.getId());

  return respond({ success: true, message: "Record deleted" });
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
