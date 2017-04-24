GbGradeTable = {};

GbGradeTable.unpack = function (s, rowCount, columnCount) {
  if (/^packed:/.test(s)) {
      return GbGradeTable.unpackPackedScores(s, rowCount, columnCount);
  } else if (/^json:/.test(s)) {
      return GbGradeTable.unpackJsonScores(s, rowCount, columnCount);
  } else {
      console.log("Unknown data format");
  }
};

GbGradeTable.unpackJsonScores = function (s, rowCount, columnCount) {
    var parsedArray = JSON.parse(s.substring('json:'.length));
    var result = [];
    var currentRow = [];

    for (var i = 0; i < parsedArray.length; i++) {
        if (i > 0 && (i % columnCount) == 0) {
            result.push(currentRow);
            currentRow = []
        }

        currentRow.push(parsedArray[i] < 0 ? "" : parsedArray[i]);
    }

    result.push(currentRow);

    return result;
}

GbGradeTable.unpackPackedScores = function (s, rowCount, columnCount) {
    var blob = atob(s.substring('packed:'.length));

    // Our result will be an array of Float64Array rows
    var result = [];

    // The byte from our blob we're currently working on
    var readIndex = 0;

    for (var row = 0; row < rowCount; row++) {
        var writeIndex = 0;
        var currentRow = [];

        for (var column = 0; column < columnCount; column++) {
            if (blob[readIndex].charCodeAt() == 127) {
                // This is a sentinel value meaning "null"
                currentRow[writeIndex] = "";
                readIndex += 1;
            } else if (blob[readIndex].charCodeAt() & 128) {
                // If the top bit is set, we're reading a two byte integer
                currentRow[writeIndex] = (((blob[readIndex].charCodeAt() & 63) << 8) | blob[readIndex + 1].charCodeAt());

                // If the second-from-left bit is set, there's a fraction too
                if (blob[readIndex].charCodeAt() & 64) {
                    // third byte is a fraction
                    var fraction = blob[readIndex + 2].charCodeAt();
                    currentRow[writeIndex] += (fraction / 100.0);
                    readIndex += 1;
                }

                readIndex += 2;
            } else {
                // a one byte integer and no fraction
                currentRow[writeIndex] = blob[readIndex].charCodeAt();
                readIndex += 1;
            }

            currentRow[writeIndex] = GbGradeTable.localizeNumber(currentRow[writeIndex]);

            writeIndex += 1;
        };

        result.push(currentRow);
    }

    return result;
};

$(document).ready(function() {
  // need TrimPath to load before parsing templates
  GbGradeTable.templates = {
    cell: TrimPath.parseTemplate(
        $("#cellTemplate").html().trim().toString()),
    courseGradeCell: TrimPath.parseTemplate(
        $("#courseGradeCellTemplate").html().trim().toString()),
    courseGradeHeader: TrimPath.parseTemplate(
        $("#courseGradeHeaderTemplate").html().trim().toString()),
    assignmentHeader: TrimPath.parseTemplate(
        $("#assignmentHeaderTemplate").html().trim().toString()),
    categoryScoreHeader: TrimPath.parseTemplate(
        $("#categoryScoreHeaderTemplate").html().trim().toString()),
    studentHeader: TrimPath.parseTemplate(
        $("#studentHeaderTemplate").html().trim().toString()),
    studentCell: TrimPath.parseTemplate(
        $("#studentCellTemplate").html().trim().toString()),
    metadata: TrimPath.parseTemplate(
        $("#metadataTemplate").html().trim().toString()),
    studentSummary: TrimPath.parseTemplate(
        $("#studentSummaryTemplate").html().trim().toString()),
    gradeItemSummary: TrimPath.parseTemplate(
        $("#gradeItemSummaryTemplate").html().trim().toString()),
    caption: TrimPath.parseTemplate(
        $("#captionTemplate").html().trim().toString())

  };

});

GbGradeTable.courseGradeRenderer = function (instance, td, row, col, prop, value, cellProperties) {

  var $td = $(td);
  var cellKey = GbGradeTable.cleanKey(row + '_' + col + '_' + value.join('_'));
  var wasInitialised = $.data(td, 'cell-initialised');

  if (wasInitialised === cellKey) {
    return;
  }

  if (!wasInitialised) {
    var html = GbGradeTable.templates.courseGradeCell.process({
      value: value[0]
    });

    td.innerHTML = html;
  } else if (wasInitialised != cellKey) {
    var valueCell = td.getElementsByClassName('gb-value')[0];
    GbGradeTable.replaceContents(valueCell, document.createTextNode(value[0]));
  }

  var student = instance.getDataAtCell(row, 0);

  $.data(td, 'studentid', student.userId);
  $.data(td, 'cell-initialised', cellKey);
  $.data(td, "metadata", {
    id: cellKey,
    student: student,
    courseGrade: value[0]
  });
  $td.removeAttr('aria-describedby');
};

GbGradeTable.cleanKey = function(key) {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
};


GbGradeTable.replaceContents = function (elt, newContents) {
  // empty it
  while (elt.firstChild) {
    elt.removeChild(elt.firstChild);
  }

  if ($.isArray(newContents)) {
    for (var i in newContents) {
      elt.appendChild(newContents[i]);
    }
  } else {
    elt.appendChild(newContents);
  }

  return elt;
};

// This function is called a *lot*, so avoid doing anything too expensive here.
GbGradeTable.cellRenderer = function (instance, td, row, col, prop, value, cellProperties) {

  var $td = $(td);
  var index = col - 2;
  var student = instance.getDataAtCell(row, 0);
  var column = instance.view.settings.columns[col]._data_;

  // key needs to contain all values the cell requires for render
  // otherwise it won't rerender when those values change
  var hasComment = column.type === "assignment" ? GbGradeTable.hasComment(student, column.assignmentId) : false;
  var scoreState = column.type === "assignment" ? GbGradeTable.getScoreState(student.userId, column.assignmentId) : false;
  var isReadOnly = column.type === "assignment" ? GbGradeTable.isReadOnly(student, column.assignmentId) : false;
  var hasConcurrentEdit = column.type === "assignment" ? GbGradeTable.hasConcurrentEdit(student, column.assignmentId) : false;
  var keyValues = [row, index, value, student.eid, hasComment, isReadOnly, hasConcurrentEdit, column.type, scoreState];
  var cellKey = GbGradeTable.cleanKey(keyValues.join("_"));

  var wasInitialised = $.data(td, 'cell-initialised');

  if (!GbGradeTable.forceRedraw && wasInitialised === cellKey) {
    // Nothing to do
    return;
  }

  var student = instance.getDataAtCell(row, 0);

  var valueCell;

  if (!wasInitialised) {
    // First time we've initialised this cell.
    var html = GbGradeTable.templates.cell.process({
      value: value
    });

    td.innerHTML = html;
  } else if (wasInitialised != cellKey) {
    valueCell = td.getElementsByClassName('gb-value')[0];

    // This cell was previously holding a different value.  Just patch it.
    GbGradeTable.replaceContents(valueCell, document.createTextNode(value));
  }

  if (!valueCell) {
    valueCell = td.getElementsByClassName('gb-value')[0];
  }

  $.data(td, "studentid", student.userId);
  if (column.type === "assignment") {
    $.data(td, "assignmentid", column.assignmentId);
    $.removeData(td, "categoryId");

    if (GbGradeTable.settings.isPercentageGradeEntry && value != null && value != "") {
      GbGradeTable.replaceContents(valueCell, document.createTextNode('' + value + '%'));
    }
  } else if (column.type === "category") {
    $.data(td, "categoryId", column.categoryId);
    $.removeData(td, "assignmentid");
    GbGradeTable.replaceContents(valueCell, document.createTextNode(GbGradeTable.formatCategoryAverage(value)));
  } else {
    throw "column.type not supported: " + column.type;
  }

  // collect all the notification
  var notifications = [];

  // comment notification
  var commentNotification = td.getElementsByClassName("gb-comment-notification")[0];
  if (commentNotification) {
    if (hasComment) {
      commentNotification.style.display = 'block';
      notifications.push({
        type: 'comment',
        // TODO This add real comment
        comment: "TODO comment goes here"
      });
    } else {
      commentNotification.style.display = 'none';
    }
  }


  // other notifications
  var gbNotification = td.getElementsByClassName('gb-notification')[0];
  var cellDiv = td.getElementsByClassName('relative')[0];

  cellDiv.className = 'relative';
  var $cellDiv = $(cellDiv);

  if (column.externallyMaintained) {
    $cellDiv.addClass("gb-read-only");
    notifications.push({
      type: 'external',
      externalId: column.externalId,
      externalAppName: column.externalAppName,
    });
  } else if (isReadOnly) {
    $cellDiv.addClass("gb-read-only");
    notifications.push({
      type: 'readonly'
    });
  } else if (scoreState == "saved") {
    $cellDiv.addClass("gb-save-success");

    setTimeout(function() {
      GbGradeTable.setScoreState(false, student.userId, column.assignmentId);
      $cellDiv.removeClass("gb-save-success", 2000);
    }, 2000);
  } else if (hasConcurrentEdit) {
    $cellDiv.addClass("gb-concurrent-edit");
    notifications.push({
      type: 'concurrent-edit',
      conflict: $.data(td, "concurrent-edit")
    });
  } else if (scoreState == "error") {
    $cellDiv.addClass("gb-save-error");
    notifications.push({
      type: 'save-error'
    });
  } else if (scoreState == "invalid") {
    $cellDiv.addClass("gb-save-invalid");
    notifications.push({
      type: 'save-invalid'
    });
  }
  var isExtraCredit = false;

  if (GbGradeTable.settings.isPointsGradeEntry) {
    isExtraCredit = parseFloat(value) > parseFloat(column.points);
  } else if (GbGradeTable.settings.isPercentageGradeEntry) {
    isExtraCredit = parseFloat(value) > 100;
  }

  if (isExtraCredit) {
    $cellDiv.addClass("gb-extra-credit");
    $(gbNotification).addClass("gb-flag-extra-credit");
    notifications.push({
      type: 'extra-credit'
    });
  } else {
    $(gbNotification).removeClass("gb-flag-extra-credit");
    $cellDiv.removeClass("gb-extra-credit");
  }

  // create notification tooltip
  if (column.type == 'assignment') {
    $.data(td, "metadata", {
      id: cellKey,
      student: student,
      value: value,
      assignment: column,
      notifications: notifications
    });
  } else if (column.type == 'category') {
    $.data(td, "metadata", {
      id: cellKey,
      student: student,
      categoryAverage: GbGradeTable.formatCategoryAverage(value),
      category: column,
      notifications: notifications
    });
  } else {
    td.removeAttribute('aria-describedby');
    $.data(td, "metadata", null);
  }

  $.data(td, 'cell-initialised', cellKey);
};


GbGradeTable.headerRenderer = function (col, column) {
  if (col == 0) {
    return GbGradeTable.templates.studentHeader.process({col: col, settings: GbGradeTable.settings});
  } else if (col == 1) {
    return GbGradeTable.templates.courseGradeHeader.process({col: col, settings: GbGradeTable.settings});
  }

  var templateData = $.extend({
    col: col,
    settings: GbGradeTable.settings
  }, column);

  if (column.type === "assignment") {
    return GbGradeTable.templates.assignmentHeader.process(templateData);
  } else if (column.type === "category") {
    return GbGradeTable.templates.categoryScoreHeader.process(templateData);
  } else {
    return "Unknown column type for column: " + col + " (" + column.type+ ")";
  }
};

GbGradeTable.studentCellRenderer = function(instance, td, row, col, prop, value, cellProperties) {
  var $td = $(td);

  $td.attr("scope", "row").attr("role", "rowHeader");

  var cellKey = (row + '_' + col);

  var data = $.extend({
    settings: GbGradeTable.settings
  }, value);

  var html = GbGradeTable.templates.studentCell.process(data);
  td.innerHTML = html;

  $.data(td, 'cell-initialised', cellKey);
  $.data(td, "studentid", value.userId);
  $.data(td, "metadata", {
    id: cellKey,
    student: value
  });

  $td.removeAttr('aria-describedby');
}


GbGradeTable.mergeColumns = function (data, fixedColumns) {
  var result = [];

  for (var row = 0; row < data.length; row++) {
    var updatedRow = []

    for (var i=0; i < fixedColumns.length; i++) {
      updatedRow.push(fixedColumns[i][row]);
    }

    for (var col = 0; col < data[row].length; col++) {
      updatedRow.push(data[row][col]);
    }

    result.push(updatedRow)
  }

  return result;
}

var nextRequestId = 0;
GbGradeTable.ajaxCallbacks = {}

GbGradeTable.ajaxComplete = function (requestId, status, data) {
  GbGradeTable.ajaxCallbacks[requestId](status, data);
};

GbGradeTable.ajax = function (params, callback) {
  params['_requestId'] = nextRequestId++;

  GbGradeTable.ajaxCallbacks[params['_requestId']] = callback || $.noop;;

  GbGradeTable.domElement.trigger("gbgradetable.action", params);
};

// FIXME: Hard-coded stuff here
GbGradeTable.renderTable = function (elementId, tableData) {
  GbGradeTable.domElement = $('#' + elementId);
  GbGradeTable.students = tableData.students;
  GbGradeTable.columns = tableData.columns;
  GbGradeTable.settings = tableData.settings;
  GbGradeTable.grades = GbGradeTable.mergeColumns(GbGradeTable.unpack(tableData.serializedGrades,
                                                                      tableData.rowCount,
                                                                      tableData.columnCount),
                                                  [
                                                    tableData.students,
                                                    tableData.courseGrades
                                                  ]);

  GbGradeTableEditor = Handsontable.editors.TextEditor.prototype.extend();

  GbGradeTableEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);
    var outOf = "<span class='out-of'></span>";
    $(this.TEXTAREA_PARENT).append(outOf);
  };

  GbGradeTableEditor.prototype.beginEditing = function() {
    Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

    var col = this.instance.getSelected()[1];

    if (GbGradeTable.settings.isPercentageGradeEntry) {
      $(this.TEXTAREA_PARENT).find(".out-of")[0].innerHTML = "100%";
    } else if (GbGradeTable.settings.isPointsGradeEntry) {
      var assignment = GbGradeTable.instance.view.settings.columns[col]._data_;
      var points = assignment.points;
      $(this.TEXTAREA_PARENT).find(".out-of")[0].innerHTML = "/" + points;
    }

    if ($(this.TEXTAREA).val().length > 0) {
      $(this.TEXTAREA).select();
    }
  };

  // If an entered score is invalid, we keep track of the last good value here
  var lastValidGrades = {};

  GbGradeTableEditor.prototype.saveValue = function() {
    var that = this;
    var row = this.row;

    var $td = $(this.TD);

    var oldScore = this.originalValue;
    var newScore = $(this.TEXTAREA).val();
    var studentId = $.data(this.TD, "studentid");
    var assignmentId = $.data(this.TD, "assignmentid");

    var assignment = GbGradeTable.colModelForAssignment(assignmentId);

    if (!lastValidGrades[studentId]) {
      lastValidGrades[studentId] = {};
    }

    var postData = {
      action: 'setScore',
      studentId: studentId,
      assignmentId: assignmentId,
      oldScore: (lastValidGrades[studentId][assignmentId] || oldScore),
      newScore: newScore,
      comment: ""
    };

    if (assignment.categoryId != null) {
      postData['categoryId']= assignment.categoryId;
    }

    GbGradeTable.setLiveFeedbackAsSaving();

    // FIXME: We'll need to pass through the original comment text here.
    GbGradeTable.ajax(postData, function (status, data) {
      if (status == "OK") {
        GbGradeTable.setScoreState("saved", studentId, assignmentId);
        delete lastValidGrades[studentId][assignmentId];

        if ($.isEmptyObject(lastValidGrades[studentId])) {
          delete(lastValidGrades[studentId])
        }
      } else if (status == "error") {
        GbGradeTable.setScoreState("error", studentId, assignmentId);

        if (!lastValidGrades[studentId][assignmentId]) {
          lastValidGrades[studentId][assignmentId] = oldScore;
        }
      } else if (status == "invalid") {
        GbGradeTable.setScoreState("invalid", studentId, assignmentId);

        if (!lastValidGrades[studentId][assignmentId]) {
          lastValidGrades[studentId][assignmentId] = oldScore;
        }
      } else if (status == "nochange") {
        // nothing to do!
      } else {
        console.log("Unhandled saveValue response: " + status);
      }

      that.instance.setDataAtCell(row, 0, GbGradeTable.modelForStudent(studentId));

      // update the course grade cell
      if (data.courseGrade) {
        that.instance.setDataAtCell(row, 1, data.courseGrade);
      }

      // update the category average cell
      if (assignment.categoryId) {
        var categoryScoreCol = GbGradeTable.colForCategoryScore(assignment.categoryId);
        var categoryScoreAsLocaleString = GbGradeTable.localizeNumber(data.categoryScore);
        that.instance.setDataAtCell(row, categoryScoreCol, categoryScoreAsLocaleString);
      }
    });

    Handsontable.editors.TextEditor.prototype.saveValue.apply(this, arguments);
  }


  GbGradeTable.container = $("#gradebookSpreadsheet");

  GbGradeTable.columnDOMNodeCache = {};

  GbGradeTable.instance = new Handsontable(document.getElementById(elementId), {
    data: GbGradeTable.getFilteredData(),
//    rowHeaderWidth: 220,
//    rowHeaders: GbGradeTable.studentCellRenderer,
    fixedColumnsLeft: 2,
    colHeaders: true,
    columns: GbGradeTable.getFilteredColumns(),
    colWidths: GbGradeTable.getColumnWidths(),
    autoRowSize: false,
    autoColSize: false,
    height: $(window).height() * 0.5,
    width: $("#gradebookSpreadsheet").width(),
    fillHandle: false,
    afterGetRowHeader: function(row,th) {
      $(th).
        attr("role", "rowheader").
        attr("scope", "row");
    },

    // This function is another hotspot.  Efficiency is paramount!
    afterGetColHeader: function(col, th) {
      var $th = $(th);

      // Calculate the HTML that we need to show
      var html = '';
      if (col < 2) {
        html = GbGradeTable.headerRenderer(col);
      } else {
        html = GbGradeTable.headerRenderer(col, this.view.settings.columns[col]._data_);
      }

      // If we haven't got a cached parse of it, do that now
      if (!GbGradeTable.columnDOMNodeCache[col] || GbGradeTable.columnDOMNodeCache[col].html !== html) {
        GbGradeTable.columnDOMNodeCache[col] = {
          html: html,
          dom: $(html).toArray()
        };
      }

      GbGradeTable.replaceContents(th, GbGradeTable.columnDOMNodeCache[col].dom);

      $th.
        attr("role", "columnheader").
        attr("scope", "col").
        addClass("gb-categorized"); /* TODO only if enabled */

      var columnModel = this.view.settings.columns[col]._data_;

      // assignment column
      if (col > 1) {
        var columnName = columnModel.title;

        $th.
          attr("role", "columnheader").
          attr("scope", "col").
          attr("abbr", columnName).
          attr("aria-label", columnName);

        $.data(th, "columnType", columnModel.type);
        $.data(th, "categoryId", columnModel.categoryId);

        if (columnModel.type == "assignment") {
          $.data(th, "assignmentid", columnModel.assignmentId);
        }

        if (GbGradeTable.settings.isCategoriesEnabled) {
          var color = columnModel.color || columnModel.categoryColor;
          $th.css("borderTopColor", color);
          $th.find(".swatch").css("backgroundColor", color);
        }
      }

      // show visual cue that columns are hidden
      // check for last of the fixed columns
      if (col == 1) { //GbGradeTable.instance.getSettings().fixedColumnsLeft - 1) {
        if (GbGradeTable.columns[0].hidden &&
            $th.find(".gb-hidden-column-visual-cue").length == 0) {
          $th.find(".relative").append("<a href='javascript:void(0);' class='gb-hidden-column-visual-cue'></a>");
        }
      } else if (col >= 2) { //GbGradeTable.instance.getSettings().fixedColumnsLeft) {
        var origColIndex = GbGradeTable.columns.findIndex(function(c, i) {
          return c == columnModel;
        });

        if (origColIndex < (GbGradeTable.columns.length - 1)) {
          if (GbGradeTable.columns[origColIndex+1].hidden &&
              $th.find(".gb-hidden-column-visual-cue").length == 0) {
            $th.find(".relative").append("<a href='javascript:void(0);' class='gb-hidden-column-visual-cue'></a>");
          }
        }
      }
    },
    beforeRender: function(isForced) {
      $(".gb-hidden-column-visual-cue").remove();
    },
    beforeOnCellMouseDown: function(event, coords, td) {
      if (coords.row < 0 && coords.col >= 0) {
        $(document).trigger('dragstarted', event);

        event.stopImmediatePropagation();
        this.selectCell(0, coords.col);
      } else if (coords.col < 0) {
        event.stopImmediatePropagation();
        this.selectCell(coords.row, 0);
      }
    },
    currentRowClassName: 'currentRow',
    currentColClassName: 'currentCol',
    multiSelect: false
  });

  GbGradeTable.instance.updateSettings({
    cells: function (row, col, prop) {
      var cellProperties = {};

      var column = GbGradeTable.instance.view.settings.columns[col]._data_;
      var student = GbGradeTable.instance.getDataAtCell(row, 0);

      if (column == null) {
         cellProperties.readOnly = true;
      } else {
        var readonly = column.type === "assignment" ? GbGradeTable.isReadOnly(student, column.assignmentId) : false;

        if (column.externallyMaintained || readonly) {
          cellProperties.readOnly = true;
        }
      }

      return cellProperties;
    }
  });

  // resize the table on window resize
  var resizeTimeout;
  $(window).on("resize", function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      GbGradeTable.instance.updateSettings({
        height: $(window).height() * 0.5,
        width: $("#gradebookSpreadsheet").width()
      });
    }, 200);
  });


  // append all dropdown menus to body to avoid overflows on table
  var $dropdownMenu;
  var $link;
  $(window).on('show.bs.dropdown', function (event) {
    $link = $(event.target);
    $dropdownMenu = $(event.target).find('.dropdown-menu');

    if ($link.closest("#gradeTable").length == 0) {
      return true;
    }

    $dropdownMenu.addClass("gb-dropdown-menu");

    $dropdownMenu.data("cell", $link.closest("td, th"));

    $dropdownMenu.width($dropdownMenu.outerWidth());

    $('body').append($dropdownMenu.detach());

    var linkOffset = $link.offset();

    $dropdownMenu.css({
        'display': 'block',
        'top': linkOffset.top + $link.outerHeight(),
        'left': linkOffset.left - $dropdownMenu.outerWidth() + $link.outerWidth()
    });
  });
  $(window).on('hide.bs.dropdown', function (event) {
    if ($link.closest("#gradeTable").length == 0) {
      return true;
    }
    $link.append($dropdownMenu.detach());
    $dropdownMenu.hide();
    $dropdownMenu = null;
  });
  $(".wtHolder").on('scroll', function (event) {
    if ($dropdownMenu && $dropdownMenu.length > 0) {
      var linkOffset = $link.offset();

      $dropdownMenu.css({
          'top': linkOffset.top + $link.outerHeight(),
          'left': linkOffset.left - $dropdownMenu.outerWidth() + $link.outerWidth()
      });
    }
  });


  var filterTimeout;
  $("#studentFilterInput").on("keyup", function(event) {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(function() {
      GbGradeTable.redrawTable(true);
    }, 500);
  }).on("focus", function() {
    // deselect the table so subsequent keyboard entry isn't entered into cells
    GbGradeTable.instance.deselectCell();
  });

  // Setup menu event bindings
  // View Log
  $(document).on("click", ".gb-dropdown-menu .gb-view-log", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'viewLog',
      studentId: $.data($cell[0], "studentid"),
      assignmentId: $.data($cell[0], "assignmentid")
    });
  }).
  // Edit Assignment
  on("click", ".gb-dropdown-menu .edit-assignment-details", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'editAssignment',
      assignmentId: $.data($cell[0], "assignmentid")
    });
  }).
  // View Assignment Statistics
  on("click", ".gb-dropdown-menu .gb-view-statistics", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'viewStatistics',
      assignmentId: $.data($cell[0], "assignmentid")
    });
  }).
  // Override Course Grade
  on("click", ".gb-dropdown-menu .gb-course-grade-override", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'overrideCourseGrade',
      studentId: $.data($cell[0], "studentid")
    });
  }).
  // Edit Comment
  on("click", ".gb-dropdown-menu .gb-edit-comments", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'editComment',
      assignmentId: $.data($cell[0], "assignmentid"),
      studentId: $.data($cell[0], "studentid")
    });
  }).
  // View Grade Summary
  on("click", ".gb-dropdown-menu .gb-view-grade-summary", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.viewGradeSummary($.data($cell[0], "studentid"));
  }).
  // Set Zero Score for Empty Cells
  on("click", ".gb-dropdown-menu .gb-set-zero-score", function() {
    GbGradeTable.ajax({
      action: 'setZeroScore'
    });
  }).
  // View Course Grade Override Log
  on("click", ".gb-dropdown-menu .gb-course-grade-override-log", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'viewCourseGradeLog',
      studentId: $.data($cell[0], "studentid")
    });
  }).
  // Delete Grade Item
  on("click", ".gb-dropdown-menu .gb-delete-item", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'deleteAssignment',
      assignmentId: $.data($cell[0], "assignmentid")
    });
  }).
  // Set ungraded values for assignment
  on("click", ".gb-dropdown-menu .gb-set-ungraded", function() {
    var $dropdown = $(this).closest(".gb-dropdown-menu");
    var $cell = $dropdown.data("cell");

    GbGradeTable.ajax({
      action: 'setUngraded',
      assignmentId: $.data($cell[0], "assignmentid")
    });
  }).
  // Student name sort order
  on("click", ".gb-student-name-order-toggle", function() {
    var $action = $(this);

        GbGradeTable.ajax({
          action: 'setStudentNameOrder',
          orderby: $action.data("order-by")
        });
  });

  GbGradeTable.setupToggleGradeItems();
  GbGradeTable.setupColumnSorting();
  GbGradeTable.setupConcurrencyCheck();
  GbGradeTable.setupKeyboardNavigation();
  GbGradeTable.setupCellMetaDataSummary();
  GbGradeTable.setupAccessiblityBits();
  GbGradeTable.refreshSummaryLabels();
  GbGradeTable.setupDragAndDrop();

  // Patch HandsonTable getWorkspaceWidth for improved scroll performance on big tables
  var origGetWorkspaceWidth = WalkontableViewport.prototype.getWorkspaceWidth;

  (function () {
    var cachedWidth = undefined;
    WalkontableViewport.prototype.getWorkspaceWidth = function () {
      var self = this;
      if (!cachedWidth) {
        cachedWidth = origGetWorkspaceWidth.bind(self)();
      }

      return cachedWidth;
    }
  }());
};

GbGradeTable.viewGradeSummary = function(studentId) {
  GbGradeTable.ajax({
    action: 'viewGradeSummary',
    studentId: studentId
  });
};


GbGradeTable.selectCell = function(assignmentId, studentId) {
  var row = 0;
  if (studentId != null){
    row = GbGradeTable.rowForStudent(studentId);
  }

  var col = 0;
  if (assignmentId != null) {
    col = GbGradeTable.colForAssignment(assignmentId);
  }

  return GbGradeTable.instance.selectCell(row, col);
};

GbGradeTable.selectCourseGradeCell = function(studentId) {
  var row = 0;
  if (studentId != null){
    row = GbGradeTable.rowForStudent(studentId);
  }

  return GbGradeTable.instance.selectCell(row, 1);
};

GbGradeTable.rowForStudent = function(studentId) {
  return GbGradeTable.instance.view.settings.data.findIndex(function(row, index, array) {
           return row[0].userId === studentId;
         });
};

GbGradeTable.indexOfFirstCategoryColumn = function(categoryId) {
  return GbGradeTable.columns.findIndex(function(column, index, array) {
           return column.categoryId == categoryId;
         });
};

GbGradeTable.modelForStudent = function(studentId) {
  for (var i=0; i<GbGradeTable.students.length; i++) {
    var student = GbGradeTable.students[i];
    if (student.userId === studentId) {
      return student;
    }
  }

  throw "modelForStudent: model not found for " + studentId;
};

GbGradeTable.colForAssignment = function(assignmentId) {
  return GbGradeTable.instance.view.settings.columns.findIndex(function(column, index, array) {
           return column._data_ && column._data_.assignmentId === parseInt(assignmentId);
         });
};

GbGradeTable.colForCategoryScore = function(categoryId) {
  return GbGradeTable.instance.view.settings.columns.findIndex(function(column, index, array) {
           return column._data_ && column._data_.categoryId === parseInt(categoryId);
         });
};

GbGradeTable.colModelForAssignment = function(assignmentId) {
  for (var i=0; i<GbGradeTable.columns.length; i++) {
    var column = GbGradeTable.columns[i];
    if (column.type == "assignment") {
      if (column.assignmentId === parseInt(assignmentId)) {
        return column;
      }
    }
  }
  
  throw "colModelForAssignment: column not found for " + assignmentId;
};

GbGradeTable.hasComment = function(student, assignmentId) {
  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(assignmentId), GbGradeTable.columns);
  return student.hasComments[assignmentIndex] === "1";
};


GbGradeTable.isReadOnly = function(student, assignmentId) {
  if (student.readonly == null) {
    return false;
  }

  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(assignmentId), GbGradeTable.columns);
  return student.readonly[assignmentIndex] === "1";
};


GbGradeTable.updateHasComment = function(student, assignmentId, comment) {
  var hasComments = student.hasComments;
  var flag = (comment == null || comment == "") ? '0' : '1';

  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(assignmentId), GbGradeTable.columns);

  student.hasComments = hasComments.substr(0, assignmentIndex) + flag + hasComments.substr(assignmentIndex+1);
}


GbGradeTable.hasConcurrentEdit = function(student, assignmentId) {
  if (student.hasConcurrentEdit == null) {
    student.hasConcurrentEdit = "";
    for(var i=0; i < GbGradeTable.columns.length; i++) {
      student.hasConcurrentEdit += "0";
    };
    return false;
  }

  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(assignmentId), GbGradeTable.columns);
  return student.hasConcurrentEdit[assignmentIndex] === "1";
};


GbGradeTable.setHasConcurrentEdit = function(conflict) {
  var student = GbGradeTable.modelForStudent(conflict.studentUuid);

  if (GbGradeTable.hasConcurrentEdit(student, conflict.assignmentId)) {
    // already marked grade as out of date
    return;
  }

  var hasConcurrentEdit = student.hasConcurrentEdit;

  var row = GbGradeTable.rowForStudent(conflict.studentUuid);
  var col = GbGradeTable.colForAssignment(conflict.assignmentId);

  $.data(GbGradeTable.instance.getCell(row, col), "concurrent-edit", conflict);

  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(conflict.assignmentId), GbGradeTable.columns);

  student.hasConcurrentEdit = hasConcurrentEdit.substr(0, assignmentIndex) + "1" + hasConcurrentEdit.substr(assignmentIndex+1);

  GbGradeTable.instance.setDataAtCell(row, 0, student);
  GbGradeTable.redrawCell(row, col);
}


GbGradeTable.colModelForCategoryScore = function(categoryName) {
  for (var i=0; i<GbGradeTable.columns.length; i++) {
    var column = GbGradeTable.columns[i];
    if (column.type == "category") {
      if (column.title === categoryName) {
        return column;
      }
    }
  }
  
  throw "colModelForCategoryScore: column not found for " + categoryName;
};


GbGradeTable.selectStudentCell = function(studentId) {
  var row = 0;
  if (studentId != null){
    row = GbGradeTable.rowForStudent(studentId);
  }

  return GbGradeTable.instance.selectCell(row, 0);
};

GbGradeTable.updateComment = function(assignmentId, studentId, comment) {
  var student = GbGradeTable.modelForStudent(studentId);

  var hasComments = student.hasComments;
  var flag = (comment == null || comment == "") ? '0' : '1';

  var assignmentIndex = $.inArray(GbGradeTable.colModelForAssignment(assignmentId), GbGradeTable.columns);

  student.hasComments = hasComments.substr(0, assignmentIndex) + flag + hasComments.substr(assignmentIndex+1);

  var row = GbGradeTable.rowForStudent(studentId);
  var col = GbGradeTable.colForAssignment(assignmentId);

  GbGradeTable.instance.setDataAtCell(row, 0, student);
  GbGradeTable.redrawCell(row, col);
};

GbGradeTable.redrawCell = function(row, col) {
  var $cell = $(GbGradeTable.instance.getCell(row, col));
  $cell.removeData('cell-initialised');

  GbGradeTable.instance.render();
};

GbGradeTable.formatCategoryAverage = function(value) {
  if (value != null && (value+"").length > 0 && value != "-") {
    var valueAsLocaleString = GbGradeTable.localizeNumber(value);
    return '' + valueAsLocaleString + '%';
  } else {
    return '-';
  }
};

GbGradeTable._redrawTableTimeout;
GbGradeTable.redrawTable = function(force) {
  clearTimeout(GbGradeTable._redrawTableTimeout);

  GbGradeTable._redrawTableTimeout = setTimeout(function() {
    GbGradeTable.forceRedraw = force || false;

    GbGradeTable.instance.loadData(GbGradeTable.getFilteredData());
    GbGradeTable.instance.updateSettings({
      columns: GbGradeTable.getFilteredColumns()
    });
    GbGradeTable.refreshSummaryLabels();
    GbGradeTable.forceRedraw = false;
  }, 100);
};

GbGradeTable.getFilteredColumns = function() {
  return [{
    renderer: GbGradeTable.studentCellRenderer,
    editor: false,
  },
  {
    renderer: GbGradeTable.courseGradeRenderer,
    editor: false,
  }].concat(GbGradeTable.columns.filter(function(col) {
    return !col.hidden;
  }).map(function (column) {
    if (column.type === 'category') {
      return {
        renderer: GbGradeTable.cellRenderer,
        editor: false,
        _data_: column
      };
    } else {
      var readonly = column.externallyMaintained;

      return {
        renderer: GbGradeTable.cellRenderer,
        editor: readonly ? false : GbGradeTableEditor,
        _data_: column
      };
    }
  }));
};

GbGradeTable.getFilteredColHeaders = function() {
  return GbGradeTable.getFilteredColumns().map(function() {
    return GbGradeTable.headerRenderer;
  });
};

GbGradeTable.getFilteredData = function() {
  var data = GbGradeTable.grades.slice(0);

  data = GbGradeTable.applyStudentFilter(data);
  data = GbGradeTable.applyColumnFilter(data);

  return data;
};

GbGradeTable.applyColumnFilter = function(data) {
  for (var i=GbGradeTable.columns.length-1; i>=0; i--) {
    var column = GbGradeTable.columns[i];
    if (column.hidden) {
      for(var row=0; row<data.length; row++) {
        data[row] = data[row].slice(0,i+2).concat(data[row].slice(i+3))
      }
    }
  } 

  return data;
};

GbGradeTable.applyStudentFilter = function(data) {
  var query = $("#studentFilterInput").val();

  if (query == "") {
    return data;
  } else {
    var queryStrings = query.split(" ");
    var filteredData = data.filter(function(row) {
      var match = true;

      var student = row[0];
      var searchableFields = [student.firstName, student.lastName, student.eid];
      var studentSearchString = searchableFields.join(";")

      for (var i=0; i<queryStrings.length; i++) {
        var queryString = queryStrings[i];

        if (studentSearchString.match(new RegExp(queryString, "i")) == null) {
          return false;
        }
      }
      return match;
    });

    return filteredData;
  }
};

GbGradeTable.getColumnWidths = function() {
  var studentColumnWidth = 240;
  var courseGradeColumnWidth = 140;

  // if showing course grade letter, percentage and points
  // make column a touch wider
  if (GbGradeTable.settings.isCourseLetterGradeDisplayed
        && GbGradeTable.settings.isCoursePointsDisplayed
        && GbGradeTable.settings.isCourseAverageDisplayed) {
    courseGradeColumnWidth = 220;
  }

  return [studentColumnWidth, courseGradeColumnWidth].
            concat(GbGradeTable.columns.map(function () { return 230 }));
};

GbGradeTable.setupToggleGradeItems = function() {
  var SUPPRESS_TABLE_REDRAW = true;

  var $panel = $("<div>").addClass("gb-toggle-grade-items-panel").hide();
  var $button = $("#toggleGradeItemsToolbarItem");
  $button.after($panel);

  // move the Wicket generated panel into this menu dropdown
  $panel.append($("#gradeItemsTogglePanel").show());

  function repositionPanel() {
    //TODO $panel.css("right",  - ($button.position().left + $button.outerWidth()));
  };

  var updateCategoryFilterState = function($itemFilter) {
    var $group = $itemFilter.closest(".gb-item-filter-group");
    var $label = $group.find(".gb-item-category-filter label");
    var $input = $group.find(".gb-item-category-filter input");

    var checkedItemFilters = $group.find(".gb-item-filter :input:checked, .gb-item-category-score-filter :input:checked").length;
    var itemFilters = $group.find(".gb-item-filter :input, .gb-item-category-score-filter :input").length;

    $label.
      removeClass("partial").
      removeClass("off").
      find(".gb-filter-partial-signal").remove();

    if (checkedItemFilters == 0) {
      $input.prop("checked", false);
      $label.addClass("off");
    } else if (checkedItemFilters == itemFilters) {
      $input.prop("checked", true);
    } else {
      $input.prop("checked", false);
      $label.addClass("partial");
      $label.find(".gb-item-filter-signal").
        append($("<span>").addClass("gb-filter-partial-signal"));
    }
  };


  function handleCategoryFilterStateChange(event) {
    var $input = $(event.target);
    var $label = $input.closest("label");
    var $filter = $input.closest(".gb-item-category-filter");

    // toggle all columns in this category
    if ($input.is(":checked")) {
      $label.removeClass("off");
      // show all
      $input.closest(".gb-item-filter-group").find(".gb-item-filter :input:not(:checked), .gb-item-category-score-filter :input:not(:checked)").trigger("click");
    } else {
      $label.addClass("off");
      // hide all
      $input.closest(".gb-item-filter-group").find(".gb-item-filter :input:checked, .gb-item-category-score-filter :input:checked").trigger("click");
    }

    updateCategoryFilterState($input);
  };


  function handleGradeItemFilterStateChange(event, suppressRedraw) {
    var $input = $(event.target);
    var $label = $input.closest("label");
    var $filter = $input.closest(".gb-item-filter");

    var assignmentId = $input.val();

    var column = GbGradeTable.colModelForAssignment(assignmentId);

    if ($input.is(":checked")) {
      $filter.removeClass("off");
      //self.gradebookSpreadsheet.showGradeItemColumn(assignmentId);
      // TODO
      column.hidden = false;
    } else {
      $filter.addClass("off");
      //self.gradebookSpreadsheet.hideGradeItemColumn(assignmentId);
      // TODO
      column.hidden = true;
    }

    updateCategoryFilterState($input);

    if (suppressRedraw != SUPPRESS_TABLE_REDRAW) {
      GbGradeTable.redrawTable(true);
    }
  };


  function handleCategoryScoreFilterStateChange(event, suppressRedraw) {
    var $input = $(event.target);
    var $label = $input.closest("label");
    var $filter = $input.closest(".gb-item-category-score-filter");

    var category = $input.val();

    var column = GbGradeTable.colModelForCategoryScore(category);

    if ($input.is(":checked")) {
      //self.gradebookSpreadsheet.showCategoryScoreColumn(category);
      // TODO
      $filter.removeClass("off");
      column.hidden = false;
    } else {
      //self.gradebookSpreadsheet.hideCategoryScoreColumn(category);
      // TODO
      $filter.addClass("off");
      column.hidden = true;
    }

    updateCategoryFilterState($input);
    if (!suppressRedraw) {
      GbGradeTable.redrawTable(true);
    }
  }


  function handleShowAll() {
    $panel.find(".gb-item-filter :input:not(:checked), .gb-item-category-score-filter :input:not(:checked)").trigger("click");
  };


  function handleHideAll() {
    $panel.find(".gb-item-filter :input:checked, .gb-item-category-score-filter :input:checked").trigger("click");
  };


  function handleShowOnlyThisCategory($filter) {
    var $input = $filter.find(":input");
    var $label = $filter.find("label");

    $panel.
        find(".gb-item-category-filter :input:checked:not([value='"+$input.val()+"'])").
        trigger("click");

    if ($input.is(":not(:checked)")) {
      $label.trigger("click");
    } else {
      $input.closest(".gb-item-filter-group").find(".gb-item-filter :input:not(:checked), .gb-item-category-score-filter :input:not(:checked)").trigger("click");
    }
  };


  function handleShowOnlyThisItem($filter) {
    var $input = $filter.find(":input");
    var $label = $filter.find("label");

    $panel.
        find(".gb-item-filter :input:checked:not(#"+$input.attr("id")+"), .gb-item-category-score-filter :input:checked").
        trigger("click");

    if ($input.is(":not(:checked)")) {
      $label.trigger("click");
    }
  };


  function handleShowOnlyThisCategoryScore($filter) {
    var $input = $filter.find(":input");
    var $label = $filter.find("label");

    $panel.
        find(".gb-item-filter :input:checked, .gb-item-category-score-filter :input:checked:not(#"+$input.attr("id")+")").
        trigger("click");

    if ($input.is(":not(:checked)")) {
      $label.trigger("click");
    }
  };


  $button.on("click", function(event) {
    event.preventDefault();

    $button.toggleClass("on");

    if ($button.hasClass("on")) {
      repositionPanel();
      $button.attr("aria-expanded", "true");
      $panel.show().attr("aria-hidden", "false");
    } else {
      $button.attr("aria-expanded", "false");
      $panel.hide().attr("aria-hidden", "true");
    }

    // Support click outside menu panel to close panel
    function hidePanelOnOuterClick(mouseDownEvent) {
      if ($(mouseDownEvent.target).closest(".gb-toggle-grade-items-panel, #toggleGradeItemsToolbarItem").length == 0) {
        $button.removeClass("on");
        $button.attr("aria-expanded", "false");
        $panel.hide().attr("aria-hidden", "true");
        $(document).off("mouseup", hidePanelOnOuterClick);
      }
      return true;
    };
    $(document).on("mouseup", hidePanelOnOuterClick);

    return false;
  });

  $button.on("keydown", function(event) {
    // up arrow hides menu
    if (event.keyCode == 38) {
      if ($panel.is(":visible")) {
        $(this).trigger("click");
        return false;
      }
    // down arrow shows menu or focuses first item in menu
    } else if (event.keyCode == 40) {
      if ($panel.is(":not(:visible)")) {
        $(this).trigger("click");
      } else {
        $panel.find("a:first").focus();
      }
      return false;
    }
  });

  $panel.
        on("click", "#showAllGradeItems", function() {
          handleShowAll();
          $(this).focus();
        }).
        on("click", "#hideAllGradeItems", function() {
          handleHideAll();
          $(this).focus();
        }).
        on("click", ".gb-show-only-this-category", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-category-filter");
          handleShowOnlyThisCategory($filter);
          $(this).focus();
        }).
        on("click", ".gb-show-only-this-item", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-filter");
          handleShowOnlyThisItem($filter);
          $(this).focus();
        }).
        on("click", ".gb-show-only-this-category-score", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-category-score-filter");
          handleShowOnlyThisCategoryScore($filter);
          $(this).focus();
        }).
        on("click", ".gb-toggle-this-category", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-category-filter");
          $filter.find(":input").trigger("click");
          $(this).focus();
        }).
        on("click", ".gb-toggle-this-item", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-filter");
          $filter.find(":input").trigger("click");
          $(this).focus();
        }).
        on("click", ".gb-toggle-this-category-score", function(event) {
          event.preventDefault();

          var $filter = $(event.target).closest(".gb-item-category-score-filter");
          $filter.find(":input").trigger("click");
          $(this).focus();
        });

  // any labels or action links will be included in the arrow navigation
  // we won't include dropdown toggles for this.. can get to those with tab keys
  var $menuItems = $panel.find("#hideAllGradeItems, #showAllGradeItems, label[role='menuitem']");
  $menuItems.on("keydown", function(event) {
    var $this = $(this);
    var currentIndex = $menuItems.index($this);

    // up arrow navigates up or back to button
    if (event.keyCode == 38) {
      if (currentIndex == 0) {
        $button.focus();
      } else {
        $menuItems[currentIndex-1].focus();
      }
      return false;
    // down arrow navigates down list
    } else if (event.keyCode == 40) {
      if (currentIndex + 1 < $menuItems.length) {
        $menuItems[currentIndex+1].focus();
        return false;
      }

    // if return then treat as click
    } else if (event.keyCode == 13) {
      $this.trigger("click");
      return false;
    }

    return true;
  });

  $panel.find(".gb-item-category-filter :input").on("change", handleCategoryFilterStateChange);
  $panel.find(".gb-item-filter :input").on("change", handleGradeItemFilterStateChange);
  $panel.find(".gb-item-category-score-filter :input").on("change", handleCategoryScoreFilterStateChange);

  $panel.find(":input:not(:checked)").trigger("change", [SUPPRESS_TABLE_REDRAW]);

  // setup hidden visual cue clicky
  $(GbGradeTable.instance.rootElement).on("click", ".gb-hidden-column-visual-cue", function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    var $th = $(this).closest("th");
    var data = $.data($th[0]);
    var index = 0;
    if (data.columnType == "assignment") {
      index = GbGradeTable.colForAssignment(data.assignmentid) - GbGradeTable.instance.getSettings().fixedColumnsLeft + 1;
    } else if (data.columnType == "category") {
      index = GbGradeTable.colForCategoryScore(data.categoryId) - GbGradeTable.instance.getSettings().fixedColumnsLeft + 1;
    }

    var columnsAfter = GbGradeTable.columns.slice(index);
    var done = false;
    $.each(columnsAfter, function(i, column) {
      if (!done && column.hidden) {
        if (column.type == "assignment") {
          $panel.find(".gb-item-filter :input[value='"+column.assignmentId+"']").trigger("click", [SUPPRESS_TABLE_REDRAW]);
        } else {
          $panel.find(".gb-item-category-score-filter :input[value='"+column.title+"']").trigger("click", [SUPPRESS_TABLE_REDRAW]);
        }
      } else {
        done = true;
      }
    });

    $(this).remove();
    GbGradeTable.redrawTable(true);
  });
};

GbGradeTable.setupColumnSorting = function() {
  var $table = $(GbGradeTable.instance.rootElement);

  $table.on("click", ".gb-title", function() {
    var $handle = $(this);

    var colIndex = $handle.closest("th").index();

    var direction = $handle.data("sortOrder");

    // remove all sort icons
    $table.find(".gb-title").each(function() {
      $(this).removeClass("gb-sorted-asc").removeClass("gb-sorted-desc");
      $(this).data("sortOrder", null);
    });

    if (direction == null) {
      direction = "desc";
    } else if (direction == "desc") {
      direction = "asc";
    } else {
      direction = null;
    }

    $handle.data("sortOrder", direction);
    if (direction != null) {
      $handle.addClass("gb-sorted-"+direction);
    }

    GbGradeTable.sort(colIndex, direction);
  });
};


GbGradeTable.sort = function(colIndex, direction) {
  if (direction == null) {
    // reset the table data to default order
    GbGradeTable.instance.loadData(GbGradeTable.grades);
    return;
  }

  var clone = GbGradeTable.grades.slice(0);

  clone.sort(function(row_a, row_b) {
    var a = row_a[colIndex];
    var b = row_b[colIndex];

    // sort by students
    if (colIndex == 0) {
      return GbGradeTable.studentSorter(a, b);

    // sort by course grade
    } else if (colIndex == 1) {
      var a_points = parseFloat(a[1]);
      var b_points = parseFloat(b[1]);

      if (a_points > b_points) {
        return 1;
      }
      if (a_points < b_points) {
        return -1;
      }
    } else {
      if (a == null || a == "") {
        return -1;
      }
      if (b == null || b == "") {
        return 1;
      }
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
    }

    return 0;
  });

  if (direction == "desc") {
    clone.reverse();
  }

  GbGradeTable.instance.loadData(clone);
};

GbGradeTable.setScoreState = function(state, studentId, assignmentId) {
  var student = GbGradeTable.modelForStudent(studentId);

  if (!student.hasOwnProperty('scoreStatus')) {
    student.scoreStatus = {};
  }

  student.scoreStatus[assignmentId] = state;
};

GbGradeTable.getScoreState = function(studentId, assignmentId) {
  var student = GbGradeTable.modelForStudent(studentId);

  if (student.hasOwnProperty('scoreStatus')) {
    return student.scoreStatus[assignmentId];
  } else {
    return false;
  }
};

GbGradeTable.studentSorter = function(a, b) {
  function generateSortStrings(student) {
    if (GbGradeTable.settings.isStudentOrderedByLastName) {
      return [student.lastName.toLowerCase(), student.firstName.toLowerCase(), student.eid];
    } else {
      return [student.firstName.toLowerCase(), student.lastName.toLowerCase(), student.eid];
    }
  }

  var sort_strings_a = generateSortStrings(a);
  var sort_strings_b = generateSortStrings(b);

  for (var i = 0; i < sort_strings_a.length; i++) {
    var sort_a = sort_strings_a[i];
    var sort_b = sort_strings_b[i];

    if (sort_a < sort_b) {
      return 1;
    } else if (sort_a > sort_b) {
      return -1;
    }
  }

  return 0;
};


GbGradeTable.setupConcurrencyCheck = function() {
  var self = this;

  function showConcurrencyNotification(data) {
    $.each(data, function(i, conflict) {
      console.log("CONFLICT!");
      console.log(conflict);

      GbGradeTable.setHasConcurrentEdit(conflict)
    });
  };

  function hideConcurrencyNotification() {
    GbGradeTable.container.find(".gb-cell-out-of-date").removeClass("gb-cell-out-of-date");
  };

  function handleConcurrencyCheck(data) {
    if ($.isEmptyObject(data) || $.isEmptyObject(data.gbng_collection)) {
      // nobody messing with my..
      hideConcurrencyNotification();
      return;
    }

    // there are *other* people doing things!
    showConcurrencyNotification(data.gbng_collection);
  };

  function performConcurrencyCheck() {
    GradebookAPI.isAnotherUserEditing(
        GbGradeTable.container.data("siteid"),
        GbGradeTable.container.data("gradestimestamp"),
        handleConcurrencyCheck);
  };

  // Check for concurrent editors.. and again every 10 seconds
  // (note: there's a 10 second cache)
  performConcurrencyCheck();
  var concurrencyCheckInterval = setInterval(performConcurrencyCheck, 10 * 1000);


  $("#gradeItemsConcurrentUserWarning").on("click", ".gb-message-close", function() {
    // dismiss the message
    $("#gradeItemsConcurrentUserWarning").addClass("hide");
    // and stop checking (they know!)
    clearInterval(concurrencyCheckInterval);
  });
};


GbGradeTable.setupDragAndDrop = function () {
  /* True if drag/drop is active */
  var currentlyDragging = false;

  /* Our floating drag indicator */
  var floatyFloat = undefined;

  /* The element we'll be dropping near */
  var dropTarget = undefined;

  /* And the side of the element we're targetting */
  var dropTargetSide = undefined;

  /* The thing we're dragging */
  var dragTarget = undefined;

  var LEFT_POSITION = 'left';
  var RIGHT_POSITION = 'right';

  function clearSelection() {
    if ( document.selection ) {
      document.selection.empty();
    } else if ( window.getSelection ) {
      window.getSelection().removeAllRanges();
    }
  }

  function isDraggable(th) {
    return ($(th).data('columnType') == 'assignment');
  }


  $(document).on('dragstarted', function (dragStartedEvent, e) {
    dragTarget = $(e.target).closest('th');

    if (isDraggable(dragTarget)) {
      currentlyDragging = true;
    } else {
      dragTarget = undefined;
      return;
    }

    floatyFloat = dragTarget.clone();
    floatyFloat.css('opacity', 0.8)
               .css('position', 'fixed')
               .css('width', dragTarget.width())
               .css('height', dragTarget.height())
               .css('background-color', 'white')
               .css('z-index', 5000)
               .css('top', $('#gradeTable').offset().top + 'px');

    /* Knock out input elements */
    $('.btn-group', floatyFloat).remove();

    $('#gradeTableWrapper').append(floatyFloat);
  });

  function cancelDrag() {
    if (currentlyDragging) {
      currentlyDragging = false;
      $('.column-marker').remove();

      if (floatyFloat) {
        floatyFloat.remove();
        floatyFloat = undefined;
      }

      return true;
    } else {
      return false;
    }
  }

  GbGradeTable._cancelDrag = cancelDrag;


  $(document).on('mouseup', function (e) {
    if (currentlyDragging) {
      cancelDrag();

      if (dropTarget) {
        var targetAssignmentId = $.data(dropTarget[0], "assignmentid");
        var sourceAssignmentId = $.data(dragTarget[0], "assignmentid");

        var targetColIndex = GbGradeTable.colForAssignment(targetAssignmentId);
        var sourceColIndex = GbGradeTable.colForAssignment(sourceAssignmentId);

        /* If we drop in a spot that would put our column in the same position,
           don't bother doing anything. */
        if (targetColIndex == sourceColIndex || 
            (dropTargetSide == LEFT_POSITION && targetColIndex == (sourceColIndex + 1)) ||
            (dropTargetSide == RIGHT_POSITION && targetColIndex == (sourceColIndex - 1))) {
              return true;
        }

        var numberOfFixedColumns = GbGradeTable.instance.getSettings().fixedColumnsLeft;
        var newIndex = targetColIndex - numberOfFixedColumns;

        if (dropTargetSide == RIGHT_POSITION) {
          newIndex = newIndex + 1;
        }

        // moving left to right
        if (sourceColIndex < targetColIndex) {
          newIndex = newIndex - 1;
        }

        var sourceModel = GbGradeTable.colModelForAssignment(sourceAssignmentId);

        if (GbGradeTable.settings.isGroupedByCategory) {
          // subtract the category column offset
          newIndex = newIndex - GbGradeTable.indexOfFirstCategoryColumn(sourceModel.categoryId);

          GradebookAPI.updateCategorizedAssignmentOrder(
            GbGradeTable.container.data("siteid"),
            sourceAssignmentId,
            sourceModel.categoryId,
            newIndex,
            $.noop,
            $.noop,
            function() {
              location.reload();
            }
          );
        } else {
          GradebookAPI.updateAssignmentOrder(
            GbGradeTable.container.data("siteid"),
            sourceAssignmentId,
            newIndex,
            $.noop,
            $.noop,
            function() {
              location.reload();
            }
          )
        }

        dragTarget = undefined;
      }
    }

    return true;
  });

  function isDroppable(dropTarget) {
    if (GbGradeTable.settings.isGroupedByCategory) {
      if (dragTarget.data('categoryId') != dropTarget.data('categoryId')) {
        return false;
      }
    }

    if (dropTarget.data('columnType') !== 'assignment') {
      return false;
    }

    return true;
  }

  $(document).on('mousemove', function (e) {
    if (currentlyDragging) {
      clearSelection();

      var margin = 10;
      floatyFloat.css('left', e.clientX + margin + 'px');

      var candidateTarget = $(e.target).closest('th');

      if (candidateTarget.length == 0) {
        return true;
      }

      if (!isDroppable(candidateTarget)) {
        return true;
      }

      dropTarget = candidateTarget;

      var leftX = $(dropTarget).offset().left;
      var candidateXMidpoint = leftX + ($(dropTarget).width() / 2.0);

      $('.column-marker').remove();

      var marker = $('<div class="column-marker" />')
        .css('display', 'inline-block')
        .css('position', 'absolute')
        .css('width', '2px')
        .css('height', '100%')
        .css('background-color', 'green');

      if (e.clientX < candidateXMidpoint) {
        dropTargetSide = LEFT_POSITION;
        marker.css('left', '0')
      } else {
        dropTargetSide = RIGHT_POSITION;
        marker.css('right', '0')
      }

      marker.prependTo($('.relative', dropTarget));
    }

    return true;
  });
};


GbGradeTable.setupKeyboardNavigation = function() {
  // add grade table to the tab flow
  $(GbGradeTable.instance.rootElement).attr("tabindex", 0);

  // enter handsontable upon return
  $(GbGradeTable.instance.rootElement).on("keydown", function(event) {
    if ($(this).is(":focus") && event.keyCode == 13) {
      $(this).blur();
      GbGradeTable.instance.selectCell(0,0);
    }
  });

  GbGradeTable.instance.addHook("afterSelection", function(event) {
    // ensure root element is out of tab index, so subsequent tabs are
    // handled by handsontable plugin
    setTimeout(function() {
      GbGradeTable.instance.rootElement.blur();
    });
  });

  GbGradeTable.instance.addHook("beforeKeyDown", function(event) {
    var handled = false;

    function iGotThis(allowDefault) {
      event.stopImmediatePropagation();
      if (!allowDefault) {
        event.preventDefault();
      }
      handled = true;
    }

    var $current = $(GbGradeTable.instance.rootElement).find("td.current:visible:last"); // get the last and visible, as may be multiple due to fixed columns
    var $focus = $(":focus");
    var editing = GbGradeTable.instance.getActiveEditor() && GbGradeTable.instance.getActiveEditor()._opened;

    if ($current.length > 0) {
      // Allow accessibility shortcuts (no conflicts they said.. sure..)
      if (event.altKey && event.ctrlKey) {
        return iGotThis(true);
      }

      // space - open menu
      if (!editing && event.keyCode == 32) {
        iGotThis();

        var $dropdown;

        // ctrl+space to open the header menu
        if (event.ctrlKey) {
          var $th = $(GbGradeTable.instance.rootElement).find("th.currentCol");
          $dropdown = $th.find(".dropdown-toggle");

        // space to open the current cell's menu
        } else {
           $dropdown = $current.find(".dropdown-toggle");
        }

        $dropdown.dropdown("toggle");
        setTimeout(function() {
          $(".dropdown-menu:visible a:first").focus();
        });
      }

      // menu focused
      if ($focus.closest(".dropdown-menu ").length > 0) {
        // up arrow
        if (event.keyCode == 38) {
          iGotThis(true);
          if ($focus.closest("li").index() == 0) {
            // first item, so close the menu
            $(".btn-group.open .dropdown-toggle").dropdown("toggle");
            $current.focus();
          } else {
            $focus.closest("li").prev().find("a").focus();
          }
        }
        // down arrow
        if (event.keyCode == 40) {
          iGotThis();
          $focus.closest("li").next().find("a").focus();
        }
        // esc
        if (event.keyCode == 27) {
          iGotThis(true);
          $(".btn-group.open .dropdown-toggle").dropdown("toggle");
          $current.focus();
        }
        // enter
        if (event.keyCode == 13) {
          iGotThis(true);
          // deselect cell so keyboard focus is given to the menu's action
          GbGradeTable.instance.deselectCell();
        }

        if (handled) {
          GbGradeTable.hideMetadata();
          return;
        }
      }

      // escape - return focus to table if not currently editing a grade
      if (!editing && event.keyCode == 27) {
        if (GbGradeTable._cancelDrag()) {
          /* Nothing else to do */
        } else {
          iGotThis();
          GbGradeTable.instance.deselectCell();
          GbGradeTable.instance.rootElement.focus();
        }
      }
    }
  });
};


GbGradeTable.clearMetadata = function() {
  $(".gb-metadata").remove();
};

GbGradeTable.hideMetadata = function() {
  $(".gb-metadata").hide();
};

GbGradeTable.setupCellMetaDataSummary = function() {

  function initializeMetadataSummary(row, col) {
    var cell = GbGradeTable.instance.getCell(row, col);
    if (cell != null) {
      var cellKey = $.data(cell, 'cell-initialised');

      var metadata = $.data(cell, 'metadata');

      if ($("#"+cellKey)[0]) {
        // already exists!
        return;
      }

      if (metadata) {
        $(cell).attr("aria-describedby", cellKey);

        $(GbGradeTable.instance.rootElement).after(
          GbGradeTable.templates.metadata.process(metadata)
        );

        $("#"+cellKey).hide().on("click", ".gb-metadata-close", function() {
          GbGradeTable.hideMetadata();
          GbGradeTable.instance.selectCell(row, col);
        });
      }
    }
  }


  function showMetadata(cellKey, $td, showCellNotifications, showCommentNotification) {
    var cellOffset = $td.offset();
    var wrapperOffset = $("#gradeTableWrapper").offset();
    var cellHeight = $td.height();
    var cellWidth = $td.width();

    var topOffset = Math.abs(wrapperOffset.top - cellOffset.top) + cellHeight + 5;
    var leftOffset = Math.abs(wrapperOffset.left - cellOffset.left) + parseInt(cellWidth/2) - parseInt($("#"+cellKey).width() / 2) - 8;

    var $metadata = $("#"+cellKey);

    if (showCellNotifications) {
      $metadata.find(".gb-metadata-notifications li:not(.gb-metadata-comment-notification)").show();
    } else {
      $metadata.find(".gb-metadata-notifications li:not(.gb-metadata-comment-notification)").hide();
    }

    if (showCommentNotification && $metadata.find(".gb-metadata-comment-notification").length > 0) {
      $metadata.find("blockquote").hide();

      setTimeout(function() {
        GradebookAPI.getComments(
          GbGradeTable.container.data("siteid"),
          $.data($td[0], "assignmentid"),
          $.data($td[0], "studentid"),
          function(comment) {
            // success
            $metadata.find("blockquote").html(comment).show();
          },
          function() {
            // error
            $metadata.find("blockquote").html("Unable to load comment. Please try again later.").show();
          })
      });

      $metadata.find(".gb-metadata-notifications li.gb-metadata-comment-notification").show()
    } else {
      $metadata.find(".gb-metadata-notifications li.gb-metadata-comment-notification").hide();
    }

    $metadata.css({
      top: topOffset,
      left: leftOffset
    }).toggle();
  }

  GbGradeTable.instance.addHook("afterSelection", function(row, col) {
    GbGradeTable.clearMetadata();

    // only care about data cells (not headers)
    if (row >= 0 && col >= 0) {
      initializeMetadataSummary(row, col);
    }
  });

  GbGradeTable.instance.addHook("beforeKeyDown", function(event) {
      // get the last and visible, as may be multiple due to fixed columns
      var $current = $(GbGradeTable.instance.rootElement).find("td.current:visible:last");

      if ($current[0]) {
        var cellKey = $.data($current[0], 'cell-initialised');

        if (event.keyCode == 83) { // s
          event.preventDefault();
          event.stopImmediatePropagation();

          showMetadata(cellKey, $current, true, true);
        } else {
          GbGradeTable.hideMetadata();
        }
      } else {
        GbGradeTable.clearMetadata();
      }
  });

  // PROTOTYPE: show metadata popover on mouse hover
  // GbGradeTable._hoverSummaryTimeout;
  // GbGradeTable._mouseCoords;
  // GbGradeTable.instance.addHook("afterOnCellMouseOver", function(event, coords, TD) {
  //   clearTimeout(GbGradeTable._hoverSummaryTimeout);
  //
  //   // only show something if mouse has actually moved!
  //   var newMouseCoords = event.clientX + "," + event.clientY;
  //   if (GbGradeTable._mouseCoords != newMouseCoords) {
  //     GbGradeTable._mouseCoords = newMouseCoords;
  //
  //     if (coords.row >= 0 && coords.col >= 0) {
  //       GbGradeTable._hoverSummaryTimeout = setTimeout(function() {
  //         var $cell = $(event.target).closest("td");
  //         if (!$cell[0]) {
  //             $cell = $(GbGradeTable.instance.getCell(coords.row, coords.col));
  //         }
  //         if ($cell[0]) {
  //           var cellKey = $.data($cell[0], 'cell-initialised');
  //           GbGradeTable.hideMetadata();
  //           initializeMetadataSummary(coords.row, coords.col);
  //           showMetadata(cellKey, $cell);
  //         }
  //       }, 2000);
  //     }
  //   }
  // });
  //
  // GbGradeTable.instance.addHook("afterSelection", function() {
  //   clearTimeout(GbGradeTable._hoverSummaryTimeout);
  // });

  // on mouse click on notification, toggle metadata summary
  $(GbGradeTable.instance.rootElement).on("click", ".gb-notification, .gb-comment-notification", function(event){
    var $cell = $(event.target).closest("td");
    if ($cell[0]) {
      var cellKey = $.data($cell[0], 'cell-initialised');
      var coords = GbGradeTable.instance.getCoords($cell[0]);
      initializeMetadataSummary(coords.row, coords.col);
      var showCellNotifications = $(event.target).is(".gb-notification");
      var showCommentNotification = $(event.target).is(".gb-comment-notification");
      showMetadata(cellKey, $cell, showCellNotifications, showCommentNotification);
    }
  });

  GbGradeTable.instance.addHook("afterScrollHorizontally", function() {
    GbGradeTable.hideMetadata();
  });

  GbGradeTable.instance.addHook("afterScrollVertically", function() {
    GbGradeTable.hideMetadata();
  });
};


GbGradeTable.setLiveFeedbackAsSaving = function() {
  var $liveFeedback = $(".gb-live-feedback");
  $liveFeedback.html($liveFeedback.data("saving-message"));
  $liveFeedback.show()
};


GbGradeTable.refreshSummaryLabels = function() {
  var $summary = $("#gradeTableSummary");

  function refreshStudentSummary() {
    $summary.find(".gb-student-summary").html(GbGradeTable.templates.studentSummary.process());
    var visible = GbGradeTable.instance.view.settings.data.length;
    var total = GbGradeTable.students.length;

    $summary.find(".gb-student-summary .visible").html(visible);
    $summary.find(".gb-student-summary .total").html(total);

    if (visible < total) {
      $summary.find(".gb-student-summary-counts").addClass("warn-students-hidden");
    }
  }

  function refreshGradeItemSummary() {
    $summary.find(".gb-grade-item-summary").html(GbGradeTable.templates.gradeItemSummary.process());
    var visible = 0;
    var total = GbGradeTable.columns.length;
    $.each(GbGradeTable.columns, function(i, col) {
      if (!col.hidden) {
        visible = visible + 1;
      }
    });
    $summary.find(".gb-grade-item-summary .visible").html(visible);
    $summary.find(".gb-grade-item-summary .total").html(total);
    if (visible < total) {
      $summary.find(".gb-item-summary-counts").addClass("warn-items-hidden");
    }
  }

  refreshStudentSummary();
  refreshGradeItemSummary();
};


GbGradeTable.setupAccessiblityBits = function() {

  var $wrapper = $("#gradeTable");

  function setupWrapperAccessKey() {
    $wrapper.on("click", function(event) {
      if ($(event.target).is("#gradeTable")) {
        $wrapper.focus();
      };
    });
  };

  function setupTableCaption() {
    var caption = GbGradeTable.templates.caption.process();
    var $table = $wrapper.find(".ht_master.handsontable table");
    $table.prepend(caption);

    var $captionToggle = $("#captionToggle");
    $captionToggle.on("click", function(event) {
      event.preventDefault();
      $table.find("caption").toggleClass("maximized");
    }).on("keyup", function(event) {
      if (event.keyCode == 27) { //ESC
        $table.find("caption").removeClass("maximized");
      }
    });

    $table.find("caption").on("click", function() {
      $(this).closest("caption").removeClass("maximized");
      $captionToggle.focus();
    });
  }

  setupWrapperAccessKey();
  setupTableCaption();
};


GbGradeTable.localizeNumber = function(number) {
    if (typeof number == 'string'){
      return number;
    }

    if (typeof number == 'undefined') {
        return;
    }

    if (sakai && sakai.locale && sakai.locale.userLanguage) {
        return number.toLocaleString(sakai.locale.userLanguage);
    }

    return '' + number;
};

/**************************************************************************************
 * GradebookAPI - all the GradebookNG entity provider calls in one happy place
 */
GradebookAPI = {};


GradebookAPI.isAnotherUserEditing = function(siteId, timestamp, onSuccess, onError) {
  var endpointURL = "/direct/gbng/isotheruserediting/" + siteId + ".json";
  var params = {
    since: timestamp
  };
  GradebookAPI._GET(endpointURL, params, onSuccess, onError);
};


GradebookAPI.getComments = function(siteId, assignmentId, studentUuid, onSuccess, onError) {
  var endpointURL = "/direct/gbng/comments";
  var params = {
    siteId: siteId,
    assignmentId: assignmentId,
    studentUuid: studentUuid
  };
  GradebookAPI._GET(endpointURL, params, onSuccess, onError);
};


GradebookAPI.updateAssignmentOrder = function(siteId, assignmentId, order, onSuccess, onError, onComplete) {
  GradebookAPI._POST("/direct/gbng/assignment-order", {
                                                        siteId: siteId,
                                                        assignmentId: assignmentId,
                                                        order: order
                                                      },
                                                      onSuccess, onError, onComplete)
};


GradebookAPI.updateCategorizedAssignmentOrder = function(siteId, assignmentId, categoryId, order, onSuccess, onError, onComplete) {
  GradebookAPI._POST("/direct/gbng/categorized-assignment-order", {
                                                        siteId: siteId,
                                                        assignmentId: assignmentId,
                                                        categoryId: categoryId,
                                                        order: order
                                                      },
                                                      onSuccess, onError, onComplete)
};


GradebookAPI._GET = function(url, data, onSuccess, onError, onComplete) {
  $.ajax({
    type: "GET",
    url: url,
    data: data,
    cache: false,
    success: onSuccess || $.noop,
    error: onError || $.noop,
    complete: onComplete || $.noop
  });
};


GradebookAPI._POST = function(url, data, onSuccess, onError, onComplete) {
  $.ajax({
    type: "POST",
    url: url,
    data: data,
    success: onSuccess || $.noop,
    error: onError || $.noop,
    complete: onComplete || $.noop
  });
};
