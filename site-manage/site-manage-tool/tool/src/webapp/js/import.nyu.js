var NYU = NYU || {}

NYU.setupSites = function(form, academicSessions) {

  var insertGroupedInputs = function(title, inputs, container) {
    if (inputs.length == 0) {
      return;
    }

    var div = $("<div>").addClass("site-manage-import-site-grouping");
    var header = $("<h4>").html(title).addClass("indnt3");
    div.append(header);
    inputs.each(function() {
      div.append($(this).closest("p"));
    });

    container.append(div);
  };

  var sessions = $("<div>").addClass("site-manage-import-sessions");
  var other = $("<div>").addClass("site-manage-import-other");

  $(".instruction:first", form).after(other);
  $(".instruction:first", form).after(sessions);


  insertGroupedInputs("Other", $(":input[name='importSites'][data-type!='project'][data-type!='course']"), other);
  insertGroupedInputs("Projects", $(":input[name='importSites'][data-type='project']"), other);

  $.each(academicSessions, function(i, academicSession) {
    insertGroupedInputs(academicSession.title, $(":input[name='importSites'][data-term='"+academicSession.title+"']"), sessions);
  });
};
