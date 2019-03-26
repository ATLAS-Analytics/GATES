module.exports = function (app, config) {

    var elasticsearch = require('elasticsearch');
    var es = new elasticsearch.Client({ host: config.ES_HOST, log: 'error' });

    var module = {}

    module.Team = class Team {

        constructor() {
            this.name = 'Default team name';
            this.description = 'Default description';
            this.members = [];
            this.created_at = new Date().getTime();
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
                        "url": this.url,
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
                    this.id = response.hits.hits[0]._id;
                    this.name = obj.name;
                    this.description = obj.description;
                    this.members = obj.members;
                    this.url = obj.url;
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
                    refresh: true,
                    body: { query: { match: { "_id": this.id } } }
                });
                console.log(response);
            } catch (err) {
                console.error(err)
            }
            console.log("Done.");
        };

        async update() {
            console.log("Updating team info in ES. id: ", this.id);
            try {
                const response = await es.update({
                    index: config.ES_INDEX, type: 'docs', id: this.id,
                    refresh: true,
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

        async get_experiments() {
            console.log('getting all experiments of team:', this.id);
            try {
                const resp = await es.search({
                    index: config.ES_INDEX, type: "docs",
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { "kind": "experiment" } },
                                    { match: { "team": this.id } },
                                ]
                            }
                        },
                        sort: { "created_at": { order: "desc" } }
                    }
                });
                // console.log(resp);
                var res = {};
                if (resp.hits.total > 0) {
                    // console.log(resp.hits.hits);
                    for (var i = 0; i < resp.hits.hits.length; i++) {
                        var name = resp.hits.hits[i]._source.name;
                        var id = resp.hits.hits[i]._id;
                        console.log('experiment: ', id, name);
                        res[id] = name;
                    }
                } else {
                    console.log("no experiments found.");
                }
                return res;
            } catch (err) {
                console.error(err)
            }
            return [];
        };

        async get_usernames() {
            console.log('getting usernames of all team members:', this.id);
            this.usernames = "";
            console.log(this.members);
            for (const uid of this.members) {
                try {
                    const resp = await es.search({
                        index: config.ES_INDEX, type: "docs",
                        body: {
                            query: {
                                bool: {
                                    must: [
                                        { match: { "kind": "user" } },
                                        { match: { "_id": uid } },
                                    ]
                                }
                            }
                        }
                    });
                    // console.log(resp);
                    if (resp.hits.total > 0) {
                        // console.log(resp.hits.hits);
                        var name = resp.hits.hits[0]._source.username;
                        console.log(uid, 'username: ', name);
                        this.usernames += " " + name;
                    }
                    else {
                        console.log("user with that id not found.");
                    }
                } catch (err) {
                    console.error(err)
                }
            };
        };

        async get_members(usernames) {
            console.log('getting ids of all usernames of team:', this.id, usernames);
            var res = [];
            for (const un of usernames) {
                console.log('checking username:', un);
                try {
                    const resp = await es.search({
                        index: config.ES_INDEX, type: "docs",
                        body: {
                            query: {
                                bool: {
                                    must: [
                                        { match: { "kind": "user" } },
                                        { match: { "username": un } },
                                    ]
                                }
                            }
                        }
                    });
                    // console.log(resp);
                    if (resp.hits.total > 0) {
                        // console.log(resp.hits.hits);
                        var member = resp.hits.hits[0]._id;
                        console.log('user: ', member);
                        res.push(member);
                    }
                    else {
                        console.log("user with that username not found.");
                    }
                } catch (err) {
                    console.error(err)
                }
            };
            return res;
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
        console.log("New team");
        team = new module.Team();
        req.session.team = {};
        res.render("team", req.session);
    });

    app.get('/team/delete', async function (req, res) {
        console.log('deleting team:', req.session.team.id);
        t = new module.Team()
        t.id = req.session.team.id;
        await t.delete();
        req.session.team = {};
        res.status(200).send('OK');
    });

    app.get('/team/use/:id', async function (req, res) {
        var id = req.params.id;
        console.log("------------- getting team:", id, '--------------');
        var team = new module.Team();
        await team.get(id);
        var exps = await team.get_experiments();
        await team.get_usernames();
        req.session.team = {
            id: id,
            name: team.name,
            description: team.description,
            members: team.members,
            usernames: team.usernames,
            url: team.url,
            experiments: exps
        }
        req.session.experiment = {}
        console.log(req.session.team);
        console.log('----------------------');

        res.render("team", req.session);
    });

    app.post('/team/update', async function (req, res) {
        var data = req.body;
        console.log("updating team:", data);
        var team = new module.Team();
        if (req.session.team.id) {
            await team.get(req.session.team.id);
        }
        team.name = data.name;
        team.description = data.description;
        team.members = await team.get_members(data.members);
        team.url = data.teamurl;
        if (req.session.team.id) {
            await team.update();
        } else {
            await team.create(req.session.user_id);
        }
        res.status(200).send('OK');
    });

    return module;
}