

module.exports = function (app) {

    const ent = require('./../entities.js');


    // app.get('/team', function (req, res) {
    //     console.log('sending profile info back.');

    //     res.json({
    //         loggedIn: req.session.loggedIn,
    //         name: req.session.name,
    //         email: req.session.email,
    //         username: req.session.username,
    //         organization: req.session.organization,
    //         user_id: req.session.sub_id
    //     });
    // });


    app.get('/team/:teamid', function (req, res) {
        var teamid = req.params.teamid;
        console.log("getting team ", teamid);
        var team;
        if (teamid === 'new') {
            team = new ent.Team();
        } else {
            team = new ent.Team(teamid);
        }
        res.render("team", { name: team.name, description: team.description, members: team.members });
    });


    // app.get('/users_data', async function (req, res) {
    //     console.log('Sending all users info...');
    //     const user = new userm();
    //     var data = await user.get_all_users();
    //     res.status(200).send(data);
    //     console.log('Done.');
    // });

}