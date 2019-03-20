
var elasticsearch = require('elasticsearch');
var es = new elasticsearch.Client({ host: 'atlas-kibana.mwt2.org:9200', log: 'error' });

testing = true;
var index_name = 'gates' // stores info on users, teams, experiments

var config;
var mg_config;

if (testing) {
    config = require('./kube/config.json');
    mg_config = require('./kube/secrets/mg-config.json');
}
else {
    config = require('/etc/gates/config.json');
    mg_config = require('/etc/mg-conf/config.json');
}

var mg = require('mailgun-js')({ apiKey: mg_config.APPROVAL_MG, domain: mg_config.MG_DOMAIN });


module.exports.Team = class Team {
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
                index: index_name, type: 'docs',
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
                index: index_name, type: 'docs',
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
        console.log("Updating team info in ES...");
        try {
            const response = await es.update({
                index: index_name, type: 'docs', id: this.id,
                body: {
                    doc: {
                        "name": this.name,
                        "description": this.description,
                        "members": this.members
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

module.exports.Experiment = class Experiment {

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
