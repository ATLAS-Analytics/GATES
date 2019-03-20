module.exports = function (app, config) {

    var elasticsearch = require('elasticsearch');
    var es = new elasticsearch.Client({ host: config.ES_HOST, log: 'error' });

    var module = {}

    module.Experiment = class Experiment {

        // statuses: stopped, running, paused, retired

        constructor(id = null) {
            this.created_at = new Date().getTime();
            this.status = 'stopped'
            if (id) {
                this.get(id);
            }
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
                    this.id = obj._id;
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
    app.get('/experiment', function (req, res) {
        console.log('sending experiment info back.');
        u = new usr.User(123);
        u.print();
        //     res.json({
        //         loggedIn: req.session.loggedIn,
        //         name: req.session.name,
        //         email: req.session.email,
        //         username: req.session.username,
        //         organization: req.session.organization,
        //         user_id: req.session.sub_id
        //     });
    });


    return module;
}