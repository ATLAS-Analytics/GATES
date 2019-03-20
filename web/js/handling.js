$(document).ready(function () {

    // called from profile.pug, team.pug

    var user_handlers = function () {
        $("#logout_button").click(function () {
            $.get("/logout");
            window.location.replace("/");
        });

        $("#user_delete_button").click(function () {
            $.get("/user/delete");
            window.location.replace("/");
        });
    }


    var team_handler = function () {
        $("#team_update").submit(
            function (event) {

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
                    mems = mems.toLowerCase();
                    mems = mems.replace(" ", ";")
                    mems = mems.split(';');
                }

                data['name'] = $("#name").val();
                data['description'] = $("#description").val();
                data['members'] = mems;
                data['teamurl'] = $("#teamurl").val();

                // call REST API to create/update team. 
                // can't this be done with simple $.post("/upsert_team",data??? ) 
                var jqxhr = $.ajax({
                    type: 'post',
                    url: '/team_update',
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function (link) {
                        alert('Team updated.');
                        // window.location.href = "PrivateJupyter_manage.html";
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        alert('Error code:' + xhr.status + '.  ' + xhr.responseText);
                        // window.location.href = "PrivateJupyter_manage.html";
                    }
                });

            }
        )
    };

    user_handlers();
    team_handler();

});