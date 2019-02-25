var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
// const JSONStream = require('json-stream'); need for events only

testing = true

console.log('GATES server starting ... ');

console.log('config load ... ');
var config;
var privateKey;
var certificate;

if (testing) {
    config = require('./kube/config.json');
    privateKey = fs.readFileSync('./kube/secrets/certificates/gates.key.pem');//, 'utf8'
    certificate = fs.readFileSync('./kube/secrets/certificates/gates.cert.cer');
    config.SITENAME = 'localhost'
}
else {
    config = require('/etc/gates/config.json');
    privateKey = fs.readFileSync('/etc/https-certs/key.pem');//, 'utf8'
    certificate = fs.readFileSync('/etc/https-certs/cert.pem');
}

console.log(config);

// const userm = require('./user.js');

var credentials = { key: privateKey, cert: certificate };

var elasticsearch = require('elasticsearch');
var session = require('express-session');

// App
const app = express();

app.use(express.static(config.STATIC_BASE_PATH));

app.set('view engine', 'pug');
app.use(express.json());       // to support JSON-encoded bodies
app.use(session({
    secret: 'kujduhvbleflvpops', resave: false,
    saveUninitialized: true, cookie: { secure: false, maxAge: 3600000 }
}));

// require('./routes/user')(app);
// require('./routes/spark')(app);
// require('./routes/jupyter')(app);

var client;

// called on every path
// app.use(function (req, res, next) {
//     next();
// })


// async function get_user(id) {
//     var user = new userm();
//     user.id = id;
//     await user.load();
//     return user;
// }



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
})

app.get('/about', async function (request, response) {
    response.render("about")
})

app.get('/get_services_from_es/:servicetype', async function (req, res) {
    console.log(req.params);
    var servicetype = req.params.servicetype;
    console.log('user:', req.session.sub_id, 'service:', servicetype);
    var user = await get_user(req.session.sub_id);
    var services = await user.get_services(servicetype);
    console.log(services);
    res.status(200).send(services);
});

app.get('/healthz', function (req, res) {
    // console.log('Checking health.');
    try {
        res.status(200).send('OK');
    } catch (err) {
        console.log("something wrong", err);
    }
});

// app.get('/plugins', function (req, res) {
//     // console.log('sending plugins info back.');
//     res.json({
//         PRIVATE_JUPYTER: ml_front_config.PRIVATE_JUPYTER,
//         TFAAS: ml_front_config.TFAAS,
//         PUBLIC_INSTANCE: ml_front_config.PUBLIC_INSTANCE,
//         MONITOR: ml_front_config.MONITOR,
//         SPARK: ml_front_config.SPARK
//     });
// });


// app.post('/spark', requiresLogin, sparkCreator, (req, res) => {
//     console.log('Spark job created!');
//     res.status(200).send("OK");
// });

// app.get('/login', (req, res) => {
//     console.log('Logging in');
//     red = `${globConf.AUTHORIZE_URI}?scope=urn%3Aglobus%3Aauth%3Ascope%3Aauth.globus.org%3Aview_identities+openid+email+profile&state=garbageString&redirect_uri=${globConf.redirect_link}&response_type=code&client_id=${globConf.CLIENT_ID}`;
//     // console.log('redirecting to:', red);
//     res.redirect(red);
// });

// app.get('/logout', function (req, res, next) {

//     if (req.session.loggedIn) {

//         // logout from Globus
//         let requestOptions = {
//             uri: `https://auth.globus.org/v2/web/logout?client_id=${globConf.CLIENT_ID}`,
//             headers: {
//                 Authorization: `Bearer ${req.session.token}`
//             },
//             json: true
//         };

//         request.get(requestOptions, function (error, response, body) {
//             if (error) {
//                 console.log("logout failure...", error);
//             }
//             console.log("globus logout success.\n");
//         });


//     }
//     req.session.destroy();

//     res.redirect('index.html');

// });

// app.get('/authcallback', (req, res) => {
//     console.log('AUTH CALLBACK query:', req.query);
//     let code = req.query.code;
//     if (code) {
//         console.log('there is a code. first time around.');
//         code = req.query.code;
//         let state = req.query.state;
//         console.log('AUTH CALLBACK code:', code, '\tstate:', state);
//     }
//     else {
//         console.log('NO CODE call...');
//     }

//     red = `${globConf.TOKEN_URI}?grant_type=authorization_code&redirect_uri=${globConf.redirect_link}&code=${code}`;

//     let requestOptions = {
//         uri: red, method: 'POST', headers: { "Authorization": auth }, json: true
//     };

//     // console.log(requestOptions);

//     request.post(requestOptions, function (error, response, body) {
//         if (error) {
//             console.log("failure...", err);
//             res.redirect("index.html");
//         }
//         console.log("success");//, body);

//         req.session.loggedIn = true;

//         console.log('==========================\n getting name.');
//         id_red = `https://auth.globus.org/v2/oauth2/userinfo`;
//         let idrequestOptions = {
//             uri: id_red, method: 'POST', json: true,
//             headers: { "Authorization": `Bearer ${body.access_token}` }
//         };

//         request.post(idrequestOptions, async function (error, response, body) {
//             if (error) {
//                 console.log('error on geting username:\t', error);
//             }
//             console.log('body:\t', body);
//             const user = new userm();
//             user.id = req.session.sub_id = body.sub;
//             user.username = req.session.username = body.preferred_username;
//             user.affiliation = req.session.organization = body.organization;
//             user.name = req.session.name = body.name;
//             user.email = req.session.email = body.email;
//             var found = await user.load();
//             if (found === false) {
//                 await user.write();
//             }
//             req.session.authorized = user.approved;
//             if (user.approved === false) {
//                 user.ask_for_approval();
//             }
//             res.redirect("index.html");
//         });

//     });

// });

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
    } catch (err) {
        console.error('Error: ', err);
    }
}

main();