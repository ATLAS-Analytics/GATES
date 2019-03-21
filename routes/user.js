
module.exports = function (app, config) {

    var elasticsearch = require('elasticsearch');
    var es = new elasticsearch.Client({ host: config.ES_HOST, log: 'error' });

    var mg_config;
    if (config.TESTING) {
        mg_config = require('../kube/secrets/mg-config.json');
    }
    else {
        mg_config = require('/etc/mg-conf/config.json');
    }
    var mg = require('mailgun-js')({ apiKey: mg_config.APPROVAL_MG, domain: mg_config.MG_DOMAIN });

    var module = {}

    module.User = class User {

        constructor(id = null) {
            this.id = id;
            this.created_at = new Date().getTime();
        }

        async create() {
            console.log("adding user to ES...");
            try {
                const response = await es.index({
                    index: config.ES_INDEX, type: 'docs',
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
                    index: config.ES_INDEX, type: 'docs',
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
            console.log("Updating user info in ES...");
            try {
                const response = await es.update({
                    index: config.ES_INDEX, type: 'docs', id: this.id,
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

        async get_teams() {
            console.log('getting all teams of user...', this.username);
            try {
                const resp = await es.search({
                    index: config.ES_INDEX, type: "docs",
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { "kind": "team" } },
                                    { match: { "members": this.id } },
                                ]
                            }
                        },
                        sort: { "created_at": { order: "desc" } }
                    }
                });
                // console.log(resp);
                var res = [];
                if (resp.hits.total > 0) {
                    // console.log(resp.hits.hits);
                    for (var i = 0; i < resp.hits.hits.length; i++) {
                        var name = resp.hits.hits[i]._source.name;
                        var id = resp.hits.hits[i]._id;
                        res.push({ id: name });
                    }
                } else {
                    console.log("no teams found.");
                }
                return res;
            } catch (err) {
                console.error(err)
            }
            return [];
        };


        async send_mail_to_user(data) {
            mg.messages().send(data, function (error, body) {
                console.log(body);
            });
        };



        // async add_service(service) {
        //     try {
        //         service.owner = this.id;
        //         service.timestamp = new Date().getTime();
        //         service.user = this.name;
        //         console.log('creating service in es: ', service);
        //         await es.index({
        //             index: config.ES_INDEX, type: 'docs', body: service
        //         }, function (err, resp, status) {
        //             console.log("from ES indexer:", resp);
        //         });
        //     } catch (err) {
        //         console.error(err)
        //     }
        // };

        // async terminate_service(name) {
        //     console.log('terminating service in ES: ', name, 'owned by', this.id);
        //     console.log('not implemented yet.');
        //     // try {
        //     //     const response = await es.update({
        //     //         index: 'ml_front', type: 'docs', id: this.id,
        //     //         body: {
        //     //             doc: {
        //     //                 "terminated_on": new Date().getTime(),
        //     //                 "terminated": true
        //     //             }
        //     //         }
        //     //     });
        //     //     console.log(response);
        //     // } catch (err) {
        //     //     console.error(err)
        //     // }
        //     console.log("Done.");
        // };

        // async get_services(servicetype) {
        //     console.log('getting all services >', servicetype, '< of this user...');
        //     try {
        //         const resp = await es.search({
        //             index: "ml_front", type: "docs",
        //             body: {
        //                 query: { match: { "owner": this.id } },
        //                 sort: { "timestamp": { order: "desc" } }
        //             }
        //         });
        //         // console.log(resp);
        //         var toSend = [];
        //         if (resp.hits.total > 0) {
        //             // console.log(resp.hits.hits);
        //             for (var i = 0; i < resp.hits.hits.length; i++) {
        //                 var obj = resp.hits.hits[i]._source;
        //                 if (obj.service !== servicetype) continue;
        //                 console.log(obj);
        //                 var start_date = new Date(obj.timestamp).toUTCString();
        //                 if (servicetype === "privatejupyter") {
        //                     var end_date = new Date(obj.timestamp + obj.ttl * 86400000).toUTCString();
        //                     var serv = [obj.service, obj.name, start_date, end_date, obj.gpus, obj.cpus, obj.memory]
        //                     toSend.push(serv);
        //                 }
        //                 if (servicetype === "sparkjob") {
        //                     var serv = [obj.service, obj.name, start_date, obj.executors, obj.repository]
        //                     toSend.push(serv);
        //                 }
        //             }
        //         } else {
        //             console.log("no services found.");
        //         }
        //         return toSend;
        //     } catch (err) {
        //         console.error(err)
        //     }
        //     return [];
        // };

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

    app.get('/user', async function (req, res) { // refresh
        console.log('updating ...');

        u = new module.User(req.session.user_id);
        await u.get();
        req.session.teams = await u.get_teams();
        // res.json({
        //     loggedIn: req.session.loggedIn,
        //     name: req.session.name,
        //     email: req.session.email,
        //     username: req.session.username,
        //     organization: req.session.organization,
        //     user_id: req.session.user_id
        // });
        res.redirect("/");
    });

    app.get('/user/delete', function (req, res) {
        console.log('deleting user:', req.session.user_id);
        u = new module.User(req.session.user_id);
        u.delete();
        req.session.destroy();
        res.redirect("/");
    });

    app.get('/user/test', async function (req, res) {
        console.log('TESTING User...');
        console.log('fake login');

        u = new module.User("XXXUSERIDXXX");

        u.name = "test user";
        u.organization = "test organization";
        u.username = "testUser";
        u.email = "testUser@test.organization.org";

        req.session.loggedIn = true;
        req.session.user_id = u.id;
        req.session.name = u.name;
        req.session.username = u.username;
        req.session.email = u.email;
        req.session.affiliation = u.organization;

        req.session.teams = {
            'idabc': 'team_1', 'idbcd': 'team_2', 'idcab': 'team_3'
        }

        console.log("create user in ES");
        u.print();
        if (!config.TESTING) {
            await u.create();
            req.session.teams = await u.get_teams();
            await u.delete();
        }
        res.redirect("/");
    });

    app.get('/profile', function (req, res) {
        res.render("profile", req.session);
    });

    return module;
}