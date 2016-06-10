var NYU = NYU || {}

NYU.setupSites = function(form, academicSessions) {

  var insertGroupedInputs = function(title, inputs) {
    if (inputs.length == 0) {
      return;
    }

    var div = $("<div>").addClass("site-manage-import-site-grouping");
    var header = $("<h4>").html(title).addClass("indnt3");
    div.append(header);
    inputs.each(function() {
      div.append($(this).closest("p"));
    });

    $(".instruction:first", form).after(div);
  };

  insertGroupedInputs("Projects", $(":input[name='importSites'][data-type='project']"));
  insertGroupedInputs("Other", $(":input[name='importSites'][data-type!='project'][data-type!='course']"));

  $.each(academicSessions, function(i, academicSession) {
    insertGroupedInputs(academicSession.title, $(":input[name='importSites'][data-term='"+academicSession.title+"']"));
  });
};
