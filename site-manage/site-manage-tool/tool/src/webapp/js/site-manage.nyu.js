$(document).ready(function() {
    // init the collapsible panels
    $(".collapsible-panel").each(function() {
        var $this = $(this);

        var $header = $(".collapsible-panel-header", $this);
        var $content = $(".collapsible-panel-content", $this);

        var toggle = function() {
            if ($this.hasClass("expanded")) {
                $this.removeClass("expanded").addClass("collapsed");
            } else {
                $this.removeClass("collapsed").addClass("expanded");
            };
            utils.resizeFrame('grow');
        };

        if ($this.attr("data-default_state") === "expanded") {
            $this.addClass("expanded");
        } else if ($this.attr("data-default_state") === "collapsed") {
            $this.addClass("collapsed");
        } else if ($(":input:checked", $this).length) {
            $this.addClass("expanded");
        } else {
            $this.addClass("collapsed");
        }

        $header.click(toggle);
    });

    var refreshCoursePanels = function() {
        $("#findCoursePanels .collapsible-panel").each(function() {
            if ($(":checkbox[name=providerCourseAdd]:checked", this).length) {
                $(this).addClass("active");
            } else {
                $(this).removeClass("active");
            }
        });
        if ($("#findCoursePanels .collapsible-panel.active").length) {
            $(":checkbox", "#findCoursePanels .collapsible-panel:not(.active)").removeAttr("checked").attr("disabled", "disabled");
            $("#findCoursePanels .collapsible-panel:not(.active)").addClass("inactive");
        } else {
            $(":checkbox:not([name=crossListedCourse])", "#findCoursePanels").removeAttr("checked").removeAttr("disabled");
            $("#findCoursePanels .collapsible-panel:not(.force-inactive)").removeClass("inactive");
        }        
    };

    $("#findCoursePanels :checkbox").click(refreshCoursePanels);
    refreshCoursePanels();
  
    var onClickSectionCheckbox = function() {
        var $this = $(this);
        if ($this.is(":checked")) {            
            $(":checkbox", $this.siblings(".cross-listed-sections")).each(function() {
                // check all cross listed checkboxes
                $(this).attr("checked", "checked");
                // add hidden inputs for the cross listed courses
                var hiddenInputEl = $("<input type='hidden'>");
                hiddenInputEl.attr("name", "providerCourseAdd");
                hiddenInputEl.attr("value", $(this).val());
                $(this).after(hiddenInputEl);
            });            
        } else {
            // uncheck all cross listed checkboxes
            $(":checkbox", $this.siblings(".cross-listed-sections")).removeAttr("checked");
            
            // remove all cross listed hidden inputs
            $(":input[name=providerCourseAdd]", $this.siblings(".cross-listed-sections")).remove();
        }
    };
    $("#findCoursePanels :checkbox[name=providerCourseAdd]").click(onClickSectionCheckbox);

    // move any courses that has a sponsorSectionEId as a cross-listed course under the sponsor
    $("#findCoursePanels li[data-sponsorsectioneid]").each(function() {        
        var $this = $(this);

        // which section does this cross reference?
        var sponsorEid = $this.attr("data-sponsorsectioneid");

        if (sponsorEid != "") {
            // get that section's checkbox...
            var $targetListItem = $("#findCoursePanels li[data-eid="+sponsorEid+"]");

            // If the sponsor section isn't listed (i.e. if the
            // sponsor is attached to the site but the nonsponsor
            // isn't), leave the nonsponsor one alone.
            if ($targetListItem.length === 0) {
                return true;
            }

            // add a cross-list list
            if ($(".cross-listed-sections", $targetListItem).length === 0) {
                $targetListItem.append("<ul class='cross-listed-sections'><li class='text-info'>Cross listed:</li></ul>");
            }

            var $listItemEl = $("<li>");

            if ($("> .section-attached-icon", $this).length) {
                // this site is already sorted
                $listItemEl.html($this.html());
            } else {
                // create a new checkbox to represent the cross-listed section
                var $crossListedCourseCheckbox = $("<input type='checkbox'>");
                $crossListedCourseCheckbox.attr("name", "crossListedCourse");
                $crossListedCourseCheckbox.val($this.attr("data-eid"));
                $crossListedCourseCheckbox.attr("disabled", "disabled");

                var $labelEl = $("<label>").html($("label",$this).html());        

                $listItemEl.append($crossListedCourseCheckbox);
                $listItemEl.append($labelEl);

                if ($(" > :checkbox", $targetListItem).is(":checked")) {
                    $crossListedCourseCheckbox.attr("checked", "checked");

                    var $hiddenInputEl = $("<input type='hidden'>");
                    $hiddenInputEl.attr("name", "providerCourseAdd");
                    $hiddenInputEl.attr("value", $crossListedCourseCheckbox.val());
                    $listItemEl.append($hiddenInputEl);
                }   
            }

            // add it to the list
            $(".cross-listed-sections", $targetListItem).append($listItemEl);

            // remove the original list item and checkbox!
            $this.remove();
        }
    });

    // update the panel counts!
    $("#findCoursePanels .collapsible-panel").each(function() {
        var count = $(":checkbox[name=providerCourseAdd]", this).length;
        $(".section-count", this).html("("+count+")");
    });


    // *************************************************************************
    // Methods specifically for the newSiteCourse.vm (form#addCourseForm)
    // - CLASSES-388 display a warning dialog if two sections are selected
    
    var primNewSiteCourseContinue = function() {
      showNotif('submitnotif','continueButton','addCourseForm');
      document.addCourseForm.option.value='continue';
      document.addCourseForm.submit();
      return false;
    };

    $("form#addCourseForm #continueButton").click(function() {
      if ($("#findCoursePanels :checkbox[name=providerCourseAdd]:checked").length > 1) {
        // multiple sections selected -- show a dialog warning
        // first insert the selected courses into the dialog list
        $("#multipleSectionsWarningDialog .course-listing").html("");
        $("#findCoursePanels :checkbox[name=providerCourseAdd]:checked").each(function() {
          $("#multipleSectionsWarningDialog .course-listing").append($("<div>").append($("label", $(this).parent()).html()));
        });
        $("#multipleSectionsWarningDialog").dialog({ width: 540, modal: true }).dialog("open");
      } else {
        // post away
        primNewSiteCourseContinue();
      }
      return false;
    });

    $("form#addCourseForm #continueDialogButton").click(function() {
      $("#dialogsubmitnotif").show();
      $("#continueDialogButton, #cancelContinueDialogButton").attr("disabled","disabled");
      primNewSiteCourseContinue();
    });

    $("form#addCourseForm #cancelContinueDialogButton").click(function() {
      $("#multipleSectionsWarningDialog").dialog("close");
    });

});
