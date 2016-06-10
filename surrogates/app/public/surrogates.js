var surrogates = (function () {
    "use strict";

    var selected_page;

    function add_selection(selection) {
        var stem = selection.split(" -- ", 2)[0];

        if ($('.selection[data-selection="' + stem + '"]').length > 0) {
            return;
        }

        var elt = $("<div class='selection' />").append($('<i class="type icon-book" />')).append($('<span class="selection-label" />').text(selection));
        elt.attr('data-selection', stem);

        var remove = $('<span> [<a href="#">remove</a>]</span>');
        elt.append(remove);

        remove.click(function () {
            elt.remove();
        });

        $("#selected_courses").append(elt);
    }


    function user_entry(netid) {
        var remove = $('<span> [<a href="#">remove</a>]</span>');
        var elt = $('<div class="user-entry">').append($('<i class="type icon-user" />')).append($('<span class="user" />').text(netid)).append(remove);
        remove.click(function () {
            elt.remove();
        });

        return elt;
    }


    function show_errors(errors) {
        var $error_pane = $('#error-pane');
        $error_pane.empty();
        $(errors).each(function (idx, error) {
            $error_pane.append($('<div class="error" />').text(error));
        });
        $error_pane.show();
    }


    return {
        course_search: function (substring, callback) {
            $.ajax({
                url: "list_courses",
                type: "GET",
                cache: false,
                data: {session: $("#academic_session").val(),
                       school: $("#school").val(),
                       department: $("#department").val(),
                       substring: substring},
                success: function (data) {
                    callback(data);
                }
            });

            return false;
        },

        next_page: function () {
            surrogates.show_table(selected_page + 1);
        },

        previous_page: function () {
            surrogates.show_table(selected_page - 1);
        },

        load_departments: function () {
            var $select = $('#department');

            $select.attr('disabled', 'disabled');

            var previous_selection = $select.val();

            $.ajax({
                url: "list_departments",
                type: "GET",
                cache: false,
                data: {session: $("#academic_session").val(),
                       school: $("#school").val()},
                success: function (data) {
                    $('option.department').remove();

                    $(data).each(function (idx, department) {
                        var $option = $('<option class="department" />');
                        $option.val(department).text(department);
                        $select.append($option);
                    });

                    $select.attr('disabled', false);
                    $select.val(previous_selection);
                }
            });

        },

        load_subjects: function () {
            var $select = $('#subject');

            $select.attr('disabled', 'disabled');

            var previous_selection = $select.val();

            $.ajax({
                url: "list_subjects",
                type: "GET",
                cache: false,
                data: {session: $("#academic_session").val(),
                       school: $("#school").val(),
                       department: $("#department").val()},
                success: function (data) {
                    $('option.subject').remove();

                    $(data).each(function (idx, subject) {
                        var $option = $('<option class="subject" />');
                        $option.val(subject).text(subject);
                        $select.append($option);
                    });

                    $select.attr('disabled', false);
                    $select.val(previous_selection);
                }
            });

        },

        load_dropdowns: function () {
            surrogates.load_departments();
            surrogates.load_subjects();
        },

        selected: function (selection) {
            add_selection(selection);
        },

        apply_updates: function (e) {
            e.preventDefault();

            var users = $('.user-entry .user').map(function (idx, user) {
                return $(user).text();
            });

            var courses = $('.selection-label').map(function (idx, course) {
                return $(course).text().split(" -- ", 2)[0];
            });

            var errors = [];
            if (users.length === 0) {
                errors.push("You need to specify at least one user");
            }

            if (courses.length === 0) {
                errors.push("You need to specify at least one course");
            }

            if (errors.length > 0) {
                show_errors(errors);
            } else {
                $.ajax({
                    url: "apply_update",
                    type: "POST",
                    cache: false,
                    data: {users: users.toArray(),
                           courses: courses.toArray(),
                           school: $("#school").val(),
                           session: $("#academic_session").val()},
                    success: function (data) {
                        document.location.reload(true);
                    },
                    error: function () {
                        show_errors(["Applying your updates failed.  Sorry!"]);
                    }
                });
            }
        },


        reset_form: function (e) {
            e.preventDefault();

            $('#error-pane').hide();
            $('.selection').remove();
            $('.user-entry').remove();
            $('#add_user').val('');
            $('#course_typeahead').val('');
        },


        show_table: function (page) {
            selected_page = page;

            var netid = $('#limit_netid').val();
            var course = $('#limit_course').val();

            $.ajax({
                url: "show_users",
                type: "GET",
                cache: false,
                data: {page: page,
                       netid: netid,
                       course: course},
                success: function (data) {
                    var $table = $("#existing-user-display");
                    $("tr.entry", $table).remove();

                    var $actions =  $("<td class='actions' />");
                    var $remove_button = $('<button class="remove-entry btn action btn-mini">remove</button>');

                    $remove_button.click(function (e) {
                        e.preventDefault();

                        var row = $(this).parents('.entry');
                        var user = $('.user', row).text();
                        var course = $('.course', row).text();

                        $.ajax({
                            url: "remove_entry",
                            type: "POST",
                            cache: false,
                            data: {user: user, course: course},
                            success: function (data) {
                                surrogates.show_table(page);
                            }
                        });
                    });

                    $actions.append($remove_button);

                    $(data.rows).each(function (idx, row) {
                        var $row = $('<tr class="entry" />');
                        $row.append($('<td class="user" />').text(row[0]));
                        $row.append($('<td class="course" />').text(row[1]));
                        $row.append($actions);

                        // Clone event handlers too!
                        $table.append($row.clone(true));
                    });


                    if (page > 0) {
                        $('#previous-button').show();
                    } else {
                        $('#previous-button').hide();
                    }

                    if (data.has_more) {
                        $('#next-button').show();
                    } else {
                        $('#next-button').hide();
                    }

                    if (data.rows.length === 0) {
                        if (page > 0) {
                            surrogates.show_table(page - 1);
                        }

                        $("#no-entries").show();
                    } else {
                        $("#no-entries").hide();
                    }
                }
            });
        },


        add_user: function () {
            var netid = $('#add_user').val();

            $('#add-user-group').removeClass('error');
            $('#user-not-found').hide();

            if (netid.length > 0) {
                $.ajax({
                    url: "user_exists",
                    type: "GET",
                    cache: false,
                    data: {netid: netid},
                    success: function (data) {
                        $('#user-display').append(user_entry(netid));

                        $('#add_user').val('');
                        $('#add_user').focus();
                    },
                    error: function () {
                        $('#add-user-group').addClass('error');
                        $('#user-not-found').show();
                    }
                });
            }
            return false;
        },


        bulk_select_find: function () {
            $.ajax({
                url: "bulk_search",
                type: "POST",
                cache: false,
                data: {text: $("#bulk_select").val()},
                success: function (data) {
                    $(data).each(function (idx, course) {
                        add_selection(course);
                    });

                    $('#bulk-select-modal').modal('hide');
                    $('#bulk_select').val('');
                }
            });
        },

        apply_limits: function () {
            surrogates.show_table(0);
        },
    };
}());
