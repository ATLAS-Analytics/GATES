$(document).ready(function () {

    // called from profile.pug, team.pug

    $("#logout_button").click(function () {
        $.get("/logout");
        window.location.replace("/");
    });

    $("#user_delete_button").click(function (event) {
        event.preventDefault();
        $.get("/user/delete")
            .done(function () {
                alert("User deleted.");
                window.location.href = "/";
            });
    });

    $("#team_delete_button").click(function (event) {
        event.preventDefault();
        $.get("/team/delete")
            .done(function () {
                alert("Team deleted.");
                window.location.href = "/";
            });
    });

    $("#team_update_button").click(function (event) {
        event.preventDefault();
        console.log("team update called.");

        $("#name_valid").text("").show();
        $("#description_valid").text("").show();
        $("#members_valid").text("").show();

        data = {}
        if ($("#name").val() === "") {
            $("#name_valid").text("Name is mandatory!").show();
            return;
        }
        // else {
        //     inp = $("#name").val();
        //     inp = inp.toLowerCase();
        //     inp = inp.replace(" ", "-");
        //     inp = inp.replace(".", "-");
        //     inp = inp.replace(":", "-");
        //     inp = inp.replace("_", "-");
        //     $("#name").val(inp);
        // }

        if ($("#description").val() === "") {
            $("#description_valid").text("Description is mandatory!").show();
            return;
        }

        mems = []
        if ($("#members").val() !== "") {
            // $("#members_valid").text("At least one member is!").show();
            // TODO - parse the text string. call to check if all usernames exist and give feedback if there are problems.
            mems = $("#members").val();
            mems = mems.split(' ');
        }

        data['name'] = $("#name").val();
        data['description'] = $("#description").val();
        data['members'] = mems;
        data['teamurl'] = $("#teamurl").val();

        var jqxhr = $.ajax({
            type: 'post',
            url: '/team/update',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function () {
                alert('Team updated.');
                window.location.href = "/";
            },
            error: function (xhr, textStatus, errorThrown) {
                alert('Error code:' + xhr.status + '.  ' + xhr.responseText);
                window.location.href = "/";
            }
        });

    });

    $("#experiment_delete_button").click(function (event) {
        event.preventDefault();
        $.get("/experiment/delete")
            .done(function () {
                alert("Experiment deleted.");
                window.location.href = "/";
            });
    });

    $("#experiment_update_button").click(function (event) {

        event.preventDefault();
        console.log("experiment update called.");

        $("#name_valid").text("").show();
        $("#description_valid").text("").show();

        data = {}
        if ($("#name").val() === "") {
            $("#name_valid").text("Name is mandatory!").show();
            return;
        }

        if ($("#description").val() === "") {
            $("#description_valid").text("Description is mandatory!").show();
            return;
        }

        data['name'] = $("#name").val();
        data['description'] = $("#description").val();
        data['url'] = $("#exp_url").val();

        var jqxhr = $.ajax({
            type: 'post',
            url: '/experiment/update',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function () {
                alert('Experiment updated.');
                window.location.href = "/";
            },
            error: function (xhr, textStatus, errorThrown) {
                alert('Error code:' + xhr.status + '.  ' + xhr.responseText);
                window.location.href = "/";
            }
        });

    });
});