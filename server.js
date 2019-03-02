var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
// const JSONStream = require('json-stream'); need for events only

testing = false

console.log('GATES server starting ... ');

console.log('config load ... ');
var config;
var privateKey;
var certificate;
var gConfig;

if (testing) {
    config = require('./kube/config.json');
    privateKey = fs.readFileSync('./kube/secrets/certificates/gates.key.pem');//, 'utf8'
    certificate = fs.readFileSync('./kube/secrets/certificates/gates.cert.cer');
    config.SITENAME = 'localhost'
    gConfig = require('./kube/secrets/globus-config.json');
}
else {
    config = require('/etc/gates/config.json');
    privateKey = fs.readFileSync('/etc/https-certs/key.pem');//, 'utf8'
    certificate = fs.readFileSync('/etc/https-certs/cert.pem');
    gConfig = require('/etc/globus-conf/globus-config.json');
}

var auth = "Basic " + new Buffer(gConfig.CLIENT_ID + ":" + gConfig.CLIENT_SECRET).toString("base64");

console.log(config);

const ent = require('./entities.js');

var credentials = { key: privateKey, cert: certificate };

var elasticsearch = require('elasticsearch');
var session = require('express-session');

const app = express();
app.use(express.static(config.STATIC_BASE_PATH));

app.set('view engine', 'pug');
app.use(express.json());       // to support JSON-encoded bodies
app.use(session({
    secret: 'kujduhvbleflvpops', resave: false,
    saveUninitialized: true, cookie: { secure: false, maxAge: 3600000 }
}));

require('./routes/user')(app);
require('./routes/team')(app);
require('./routes/experiment')(app);

// k8s stuff
const kClient = require('kubernetes-client').Client;
const kConfig = require('kubernetes-client').config;
var kclient;

async function configureKube() {
    try {
        console.log("configuring k8s client");
        kclient = new kClient({ config: kConfig.getInCluster() });
        await kclient.loadSpec();
        console.log("client configured");
        return kclient;
    } catch (err) {
        console.log("error in configureKube\n", err);
        process.exit(2);
    }
}

async function get_user(id) {
    var user = new ent.User();
    user.id = id;
    await user.get();
    return user;
}

const requiresLogin = async (req, res, next) => {
    // to be used as middleware

    if (req.session.loggedIn !== true) {
        error = new Error('You must be logged in to view this page.');
        error.status = 403;
        return next(error);
    }
    return next();
};

// called on every path
// app.use(function (req, res, next) {
//     next();
// })

// app.get('/delete/:jservice', requiresLogin, function (request, response) {
//     var jservice = request.params.jservice;
//     cleanup(jservice);
//     response.redirect("/index.html");
// });

// app.get('/log/:podname', requiresLogin, async function (request, response) {
//     var podname = request.params.podname;
//     plog = await get_log(podname);
//     console.log(plog.body);
//     response.render("podlog", { pod_name: podname, content: plog.body });
// });

app.get('/', async function (request, response) {
    response.render("index")
});

app.get('/about', async function (request, response) {
    response.render("about")
});

app.get('/healthz', function (request, response) {
    try {
        response.status(200).send('OK');
    } catch (err) {
        console.log("something wrong", err);
    }
});

// app.get('/get_services_from_es/:servicetype', async function (req, res) {
//     console.log(req.params);
//     var servicetype = req.params.servicetype;
//     console.log('user:', req.session.sub_id, 'service:', servicetype);
//     var user = await get_user(req.session.sub_id);
//     var services = await user.get_services(servicetype);
//     console.log(services);
//     res.status(200).send(services);
// });



// app.post('/spark', requiresLogin, sparkCreator, (req, res) => {
//     console.log('Spark job created!');
//     res.status(200).send("OK");
// });

app.get('/login', (request, response) => {
    console.log('Logging in');
    red = `${gConfig.AUTHORIZE_URI}?scope=urn%3Aglobus%3Aauth%3Ascope%3Aauth.globus.org%3Aview_identities+openid+email+profile&state=garbageString&redirect_uri=${gConfig.redirect_link}&response_type=code&client_id=${gConfig.CLIENT_ID}`;
    // console.log('redirecting to:', red);
    response.redirect(red);
});

app.get('/logout', function (req, res, next) {

    if (req.session.loggedIn) {    // logout from Globus
        let requestOptions = {
            uri: `https://auth.globus.org/v2/web/logout?client_id=${gConfig.CLIENT_ID}`,
            headers: {
                Authorization: `Bearer ${req.session.token}`
            },
            json: true
        };

        request.get(requestOptions, function (error, response, body) {
            if (error) {
                console.log("logout failure...", error);
            }
            console.log("globus logout success.\n");
        });
    }
    req.session.destroy();
    res.render('index');
});

app.get('/authcallback', (req, res) => {
    console.log('AUTH CALLBACK query:', req.query);
    let code = req.query.code;
    if (code) {
        console.log('there is a code. first time around.');
        code = req.query.code;
        let state = req.query.state;
        console.log('AUTH CALLBACK code:', code, '\tstate:', state);
    }
    else {
        console.log('NO CODE call...');
    }

    red = `${gConfig.TOKEN_URI}?grant_type=authorization_code&redirect_uri=${gConfig.redirect_link}&code=${code}`;

    let requestOptions = {
        uri: red, method: 'POST', headers: { "Authorization": auth }, json: true
    };

    // console.log(requestOptions);

    request.post(requestOptions, function (error, response, body) {
        if (error) {
            console.log("failure...", err);
            res.render("index");
        }
        console.log("success");//, body);

        console.log('==========================\n getting name.');
        id_red = `https://auth.globus.org/v2/oauth2/userinfo`;
        let idrequestOptions = {
            uri: id_red, method: 'POST', json: true,
            headers: { "Authorization": `Bearer ${body.access_token}` }
        };

        request.post(idrequestOptions, async function (error, response, body) {
            if (error) {
                console.log('error on geting username:\t', error);
            }
            console.log('body:\t', body);
            const user = new ent.User();
            user.id = req.session.sub_id = body.sub;
            user.username = req.session.username = body.preferred_username;
            user.affiliation = req.session.organization = body.organization;
            user.name = req.session.name = body.name;
            user.email = req.session.email = body.email;
            var found = await user.get();
            if (found === false) {
                await user.create();
                var body = {
                    from: config.NAMESPACE + "<" + config.NAMESPACE + "@maniac.uchicago.edu>",
                    to: user.email,
                    subject: "GATES membership",
                    text: "Dear " + user.name + ", \n\n\t" +
                        " Your have been added to GATES. You may create a new team and run experiments. To be added to an existing team ask one of its members to add you to it (provide your username)." +
                        "\n\nBest regards,\n\tGATES mailing system."
                }
                user.send_mail_to_user(body);
            }
            req.session.loggedIn = true;
            res.redirect("/");
        });

    });

});

app.get('/reg', async function (req, res) {
    req.session.loggedIn = true;
    req.session.name = "Ilija";
    req.session.email = "Ilija@asdf";
    res.render("index");
});

app.get('/test', async function (req, res) {
    console.log('TEST starting...');
    console.log('User...');
    // create user
    u = new ent.User();
    u.name = "test user";
    u.organization = "test organization";
    u.username = "testUser";
    u.email = "testUser@test.organization.org";
    u.create();

    t = new ent.Team();
    t.name = "test team";
    t.desription = "test description";
    t.create();
    res.render("index");
});

// app.get('/authorize/:user_id', async function (req, res) {
//     console.log('Authorizing user...');
//     var user = await get_user(req.params.user_id);
//     user.approve();
//     res.redirect("/users.html");
// });


app.use((err, req, res, next) => {
    console.error('Error in error handler: ', err.message);
    res.status(err.status).send(err.message);
});


var httpsServer = https.createServer(credentials, app).listen(443);

// redirects if someone comes on http.
http.createServer(function (req, res) {
    res.writeHead(302, { 'Location': 'https://' + config.SITENAME });
    res.end();
}).listen(80);


async function main() {
    try {
        if (!testing) {
            await configureKube();
        }
    } catch (err) {
        console.error('Error: ', err);
    }
}

main();