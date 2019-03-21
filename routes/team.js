module.exports = function (app, config) {

    var elasticsearch = require('elasticsearch');
    var es = new elasticsearch.Client({ host: config.ES_HOST, log: 'error' });

    var module = {}

    module.Team = class Team {
        // functions needed:
        // create team - user can create a new team
        // get team 
        // delete team
        // update team - add members, change descriptions, change name

        constructor(id = null) {
            this.name = 'Default team name';
            this.description = 'Default description';
            this.members = [];
            this.created_at = new Date().getTime();
            if (id) {
                this.get(id);
            }
        }

        async create(user_id) {
            console.log("adding team to ES...");
            this.members = [user_id];
            try {
                const response = await es.index({
                    index: config.ES_INDEX, type: 'docs',
                    refresh: true,
                    body: {
                        "kind": "team",
                        "name": this.name,
                        "description": this.description,
                        "members": this.members,
                        "created_at": new Date().getTime()
                    }
                });
                console.log(response);
            } catch (err) {
                console.error(err)
            }
            console.log("Done.");
        };

        async get(id) {
            console.log("getting team's info...");
            try {
                const response = await es.search({
                    index: config.ES_INDEX, type: 'docs',
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { kind: "team" } },
                                    { match: { _id: id } }
                                ]
                            }
                        }
                    }
                });
                // console.log(response);
                if (response.hits.total == 0) {
                    console.log("team not found.");
                    return false;
                }
                else {
                    console.log("team found.");
                    var obj = response.hits.hits[0]._source;
                    // console.log(obj);
                    this.id = obj._id;
                    this.name = obj.name;
                    this.description = obj.description;
                    this.members = obj.members;
                    this.created_at = obj.created_at;
                    return true;
                };
            } catch (err) {
                console.error(err)
            }
            console.log('Done.');
            return false;
        };

        async delete() {
            console.log("deleting team from ES...");
            try {
                const response = await es.deleteByQuery({
                    index: config.ES_INDEX, type: 'docs',
                    body: { query: { match: { "_id": this.id } } }
                });
                console.log(response);
            } catch (err) {
                console.error(err)
            }
            console.log("Done.");
        };

        async update() {
            console.log("Updating team info in ES...");
            try {
                const response = await es.update({
                    index: config.ES_INDEX, type: 'docs', id: this.id,
                    body: {
                        doc: {
                            "name": this.name,
                            "description": this.description,
                            "members": this.members,
                            "url": this.url
                        }
                    }
                });
                console.log(response);
            } catch (err) {
                console.error(err)
            }
            console.log("Done.");
        };
    }

    app.get('/team/test', async function (req, res) {
        console.log('TEST team creation');
        t = new module.Team();
        req.session.team = {}
        req.session.team.team_id = 'asdf';
        req.session.team.name = t.name;
        req.session.team.url = 'http://best-team.team';
        req.session.team.description = 'bla bla bla';
        req.session.team.members = 'abc bca cba';
        if (!config.TESTING) {
            await t.create(req.session.user_id);
            await t.delete();
        }
        res.redirect("/");
    });

    app.get('/team/new', function (req, res) {
        console.log("new team ");
        team = new module.Team();
        req.session.team = {};
        res.render("team", req.session);
    });

    app.get('/team/delete', async function (req, res) {
        console.log('deleting team:', req.session.team.id);
        t = new module.Team(req.session.team.id);
        await t.delete();
        res.redirect("/user");
    });

    app.get('/team/use/:team_id', function (req, res) {
        var team_id = req.params.team_id;
        console.log("getting team ", team_id);
        var team;
        if (team_id === 'new') {
            team = new module.Team();
        } else {
            team = new module.Team(team_id);
            req.session.team = {
                id: team_id,
                name: team.name,
                experiments: team.experiments
            }
        }

        res.render("team", req.session);
    });

    app.post('/team/update', function (req, res) {
        var data = req.body;
        console.log("updating team:", data);
        var team = null;
        if (req.session.team.id) {
            //update
            team = new module.Team(req.session.team.id);
        } else {
            team = new module.Team();
        }
        team.name = data.name;
        team.description = data.description;
        team.members = data.members;
        team.url = data.teamurl;
        if (req.session.team.id) {
            team.update();
        } else {
            team.create();
        }
        res.redirect("/user");
    });

    return module;
}