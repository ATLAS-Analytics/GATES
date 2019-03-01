
var elasticsearch = require('elasticsearch');
var es = new elasticsearch.Client({ host: 'atlas-kibana.mwt2.org:9200', log: 'error' });

testing = true
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

module.exports.User = class User {

    constructor() {
        this.created_at = new Date().getTime();
    }

    async create() {
        console.log("adding user to ES...");
        try {
            const response = await es.index({
                index: index_name, type: 'docs',
                refresh: true,
                body: {
                    "kind": "user",
                    "user": this.name,
                    "email": this.email,
                    "username": this.username,
                    "affiliation": this.affiliation,
                    "created_at": new Date().getTime()
                }
            });
            console.log(response);
        } catch (err) {
            console.error(err)
        }
        console.log("Done.");
    };

    async get() {
        console.log("getting user's info...");
        try {
            const response = await es.search({
                index: index_name, type: 'docs',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { kind: "user" } },
                                { match: { _id: this.id } }
                            ]
                        }
                    }
                }
            });
            // console.log(response);
            if (response.hits.total == 0) {
                console.log("user not found.");
                return false;
            }
            else {
                console.log("User found.");
                var obj = response.hits.hits[0]._source;
                // console.log(obj);
                this.name = obj.user;
                this.username = obj.username;
                this.email = obj.email;
                this.affiliation = obj.affiliation;
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
        console.log("deleting user from ES...");
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
        console.log("Updating user info in ES...");
        try {
            const response = await es.update({
                index: index_name, type: 'docs', id: this.id,
                body: {
                    doc: {
                        "email": this.email,
                        "username": this.username
                    }
                }
            });
            console.log(response);
        } catch (err) {
            console.error(err)
        }
        console.log("Done.");
    };

    // async approve() {
    //     this.approved = true;
    //     this.approved_on = new Date().getTime();
    //     await this.update();
    //     var body = {
    //         from: config.NAMESPACE + "<" + config.NAMESPACE + "@maniac.uchicago.edu>",
    //         to: this.email,
    //         subject: "Authorization approved",
    //         text: "Dear " + this.name + ", \n\n\t" +
    //             " your request for access to " + config.NAMESPACE +
    //             " ML front has been approved.\n\nBest regards,\n\tML front Approval system."
    //     }
    //     this.send_mail_to_user(body);
    // };

    async send_mail_to_user(data) {
        mg.messages().send(data, function (error, body) {
            console.log(body);
        });
    };


    async add_service(service) {
        try {
            service.owner = this.id;
            service.timestamp = new Date().getTime();
            service.user = this.name;
            console.log('creating service in es: ', service);
            await es.index({
                index: index_name, type: 'docs', body: service
            }, function (err, resp, status) {
                console.log("from ES indexer:", resp);
            });
        } catch (err) {
            console.error(err)
        }
    };

    async terminate_service(name) {
        console.log('terminating service in ES: ', name, 'owned by', this.id);
        console.log('not implemented yet.');
        // try {
        //     const response = await es.update({
        //         index: 'ml_front', type: 'docs', id: this.id,
        //         body: {
        //             doc: {
        //                 "terminated_on": new Date().getTime(),
        //                 "terminated": true
        //             }
        //         }
        //     });
        //     console.log(response);
        // } catch (err) {
        //     console.error(err)
        // }
        console.log("Done.");
    };

    async get_services(servicetype) {
        console.log('getting all services >', servicetype, '< of this user...');
        try {
            const resp = await es.search({
                index: "ml_front", type: "docs",
                body: {
                    query: { match: { "owner": this.id } },
                    sort: { "timestamp": { order: "desc" } }
                }
            });
            // console.log(resp);
            var toSend = [];
            if (resp.hits.total > 0) {
                // console.log(resp.hits.hits);
                for (var i = 0; i < resp.hits.hits.length; i++) {
                    var obj = resp.hits.hits[i]._source;
                    if (obj.service !== servicetype) continue;
                    console.log(obj);
                    var start_date = new Date(obj.timestamp).toUTCString();
                    if (servicetype === "privatejupyter") {
                        var end_date = new Date(obj.timestamp + obj.ttl * 86400000).toUTCString();
                        var serv = [obj.service, obj.name, start_date, end_date, obj.gpus, obj.cpus, obj.memory]
                        toSend.push(serv);
                    }
                    if (servicetype === "sparkjob") {
                        var serv = [obj.service, obj.name, start_date, obj.executors, obj.repository]
                        toSend.push(serv);
                    }
                }
            } else {
                console.log("no services found.");
            }
            return toSend;
        } catch (err) {
            console.error(err)
        }
        return [];
    };

    print() {
        console.log("- user id", this.id);
        console.log("- user name", this.name);
        console.log("- email", this.email);
        console.log("- affiliation", this.affiliation);
        console.log("- created at", this.created_at);
    };

    // async get_all_users() {

    //     console.log('getting all users info from es.');
    //     try {
    //         const resp = await es.search({
    //             index: 'mlfront_users', type: 'docs',
    //             body: {
    //                 size: 1000,
    //                 sort: { "created_at": { order: "desc" } }
    //             }
    //         });
    //         // console.log(resp);
    //         var toSend = [];
    //         if (resp.hits.total > 0) {
    //             // console.log("Users found:", resp.hits.hits);
    //             for (var i = 0; i < resp.hits.hits.length; i++) {
    //                 var obj = resp.hits.hits[i]._source;
    //                 // console.log(obj);
    //                 var created_at = new Date(obj.created_at).toUTCString();
    //                 var serv = [obj.user, obj.email, obj.affiliation, created_at, obj.approved]
    //                 toSend.push(serv);
    //             }
    //         } else {
    //             console.log("No users found.");
    //         }
    //         return toSend;
    //     } catch (err) {
    //         console.error(err)
    //     }
    //     console.log('Done.');
    // };

}



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
