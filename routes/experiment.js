module.exports = function (app, config) {

    var elasticsearch = require('elasticsearch');
    var es = new elasticsearch.Client({ host: config.ES_HOST, log: 'error' });

    var module = {}

    module.Experiment = class Experiment {

        // statuses: stopped, running, paused, retired

        constructor(id) {
            this.created_at = new Date().getTime();
            this.status = 'stopped';
        }

        async create(team_id) {
            console.log("adding experiment to ES...");
            try {
                const response = await es.index({
                    index: index_name, type: 'docs',
                    refresh: true,
                    body: {
                        "kind": "experiment",
                        "name": this.name,
                        "description": this.description,
                        "team": team_id,
                        "status": this.status,
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
            console.log("getting experiment's info...");
            try {
                const response = await es.search({
                    index: index_name, type: 'docs',
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { _id: id } }
                                ]
                            }
                        }
                    }
                });
                // console.log(response);
                if (response.hits.total == 0) {
                    console.log("experiment not found.");
                    return false;
                }
                else {
                    console.log("experiment found.");
                    var obj = response.hits.hits[0]._source;
                    // console.log(obj);
                    this.id = response.hits.hits[0]._id;
                    this.name = obj.name;
                    this.description = obj.description;
                    this.team = obj.team;
                    this.status = obj.status;
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
            console.log("deleting experiment from ES...");
            try {
                const response = await es.deleteByQuery({
                    index: index_name, type: 'docs',
                    body: { query: { match: { "_id": this.id } } }
                });
                console.log(response);
            } catch (err) {
                console.error(err)
            }
            console.log("Done.");
        };

        async update() {
            console.log("Updating experiment info in ES...");
            try {
                const response = await es.update({
                    index: index_name, type: 'docs', id: this.id,
                    body: {
                        doc: {
                            "name": this.name,
                            "description": this.description,
                            "status": this.status
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

    const usr = require('./user')(app, config);

    app.get('/experiment/test', async function (req, res) {
        console.log('EXPERIMENT team creation');
        ex = new module.Experiment();
        req.session.experiment = {}
        req.session.experiment.id = 'XXXExperimentXXX';
        req.session.experiment.name = ex.name;
        req.session.experiment.url = 'http://best-team.team';
        req.session.experiment.description = 'bla bla bla';
        req.session.experiment.status = 'stopped';
        if (!config.TESTING) {
            await ex.create(req.session.team.team_id);
            await ex.delete();
        }
        res.redirect("/");
    });

    app.get('/experiment/new', function (req, res) {
        console.log("new experiment ");
        ex = new module.Experiment();
        req.session.experiment = {};
        res.render("experiment", req.session);
    });

    app.get('/experiment/delete', async function (req, res) {
        console.log('deleting experiment:', req.session.experiment.id);
        ex = new module.Team();
        await ex.get(req.session.experiment.id);
        await ex.delete();
        res.redirect("/user");
    });

    app.get('/experiment/use/:exp_id', async function (req, res) {
        var exp_id = req.params.exp_id;
        console.log("getting experiment ", exp_id);
        var ex = new module.Experiment();
        if (exp_id === 'new') {
            console.log('creating new experiment.');
        } else {
            console.log('getting existing experiment.');
            await ex.get(exp_id);
            req.session.experiment = {
                id: exp_id,
                name: ex.name,
                description: ex.description,
                status: ex.status,
                url: ex.url
            }
            console.log(req.session.experiment);
        }

        res.render("experiment", req.session);
    });

    app.post('/experiment/update', async function (req, res) {
        var data = req.body;
        console.log("updating experiment:", data);
        var ex = new module.Experiment();
        if (req.session.experiment.id) {
            await ex.get(req.session.experiment.id);
        }
        ex.name = data.name;
        ex.description = data.description;
        ex.status = data.status;
        ex.url = data.url;
        if (req.session.experiment.id) {
            ex.update();
        } else {
            ex.create(req.session.team.id);
        }
        res.redirect("/user");
    });



    return module;
}