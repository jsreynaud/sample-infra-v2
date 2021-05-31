const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const schemas = require("../schemas");
const authdb = require("../db/authdb");

var amqp = require('amqplib/callback_api');
var validate = require('jsonschema').validate;

const app = express();
const host = 'localhost'; // Utiliser 0.0.0.0 pour être visible depuis l'exterieur de la machine
const port = 8000;
const queue = 'from_backend';

const ACCESS_TOKEN_SECRET = "123456789";
const ACCESS_TOKEN_LIFE = 120;

var from_backend_channel;

function push_to_queue(data,decoded_jwt) {
    let d = data;
    d.jwt = decoded_jwt;
    from_backend_channel.sendToQueue(queue, Buffer.from(JSON.stringify(d)));
    console.log(" [x] Sent %s", d);
}

function check_password(login,password) {
    // Check password against authdb
    let fnd = authdb.authdb.find(element => {
            return element.login == login && element.password == password;
        });

    if (fnd) {
        return true;
    } else {
        return false;
    }
}

function login(data,res) {
    console.log("login");
    console.log('Username:',data.username,'Passwd:',data.password);

    let validation = validate(data,schemas.login_schema);
    // Check result is valid
    if (validation.valid) {
        if (check_password(data.username, data.password)) {
            let j = jwt.sign({"username":data.username}, ACCESS_TOKEN_SECRET, {
                algorithm: "HS512",
                expiresIn: ACCESS_TOKEN_LIFE
                });
            // Reply to client as error code 200 (no error in HTTP); Reply data format is json
            res.writeHead(200, {'Content-Type': 'application/json'});
            // Send back reply content
            res.end(JSON.stringify({"error":0,"message":j}));
        } else {
            // Reply to client as error code 200 (no error in HTTP); Reply data format is json
            res.writeHead(401, {'Content-Type': 'application/json'});
            // Send back reply content
            res.end(JSON.stringify({"error":-1,"message":"login error"}));
        }
    } else {
        res.writeHead(401, {'Content-Type': 'application/json'});
        // Send back reply content
        res.end(JSON.stringify({"error":-1,
                        "message":"Invalid query: " + validation.errors.map(d => { return d.message + ";";})}));

    }
}

function postdata(data,res) {
    console.log("Post Data",data);
    // Check JWT validity
    let validation = validate(data,schemas.postdata_schema);
    if (validation.valid) {
        jwt.verify(data.jwt, ACCESS_TOKEN_SECRET, function(err, decoded) {
                if (err) { // There is an error: invalid jwt ...
                    res.writeHead(401, {'Content-Type': 'application/json'});
                    // Send back reply content
                    res.end(JSON.stringify({"error":-1,"message":"JWT error"}));
                } else {
                    // Ok no problem: Adding data
                    push_to_queue(data,decoded);
                    res.writeHead(201, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({"error":0,"message":"data added"}));

                }
            });
    } else {
        res.writeHead(401, {'Content-Type': 'application/json'});
        // Send back reply content
        res.end(JSON.stringify({"error":-1,
                        "message":"Invalid query: " + validation.errors.map(d => { return d.message + ";";})}));
    }
}


var action_iter = 0;
const action_array = [{type:"print",data:"Bonjour"},
                      {type:"print",data:"tout"},
                      {type:"print",data:"le"},
                      {type:"print",data:"monde"},
                      {type:"end"},
                     ];

function pull(data,res) {
    console.log("Pull",data);
    let validation = validate(data,schemas.pull_schema);
    if (validation.valid) {
        // Check JWT validity
        jwt.verify(data.jwt, ACCESS_TOKEN_SECRET, function(err, decoded) {
            if (err) { // There is an error: invalid jwt ...
                res.writeHead(401, {'Content-Type': 'application/json'});
                // Send back reply content
                res.end(JSON.stringify({"error":-1,"message":"JWT error"}));
            } else {
                res.writeHead(201, {'Content-Type': 'application/json'});
                // Serve back the action array at position action_iter
                res.end(JSON.stringify({"error":0,
                                        "message":action_array[action_iter++ % action_array.length]}));
            }
        });
    } else {
        res.writeHead(401, {'Content-Type': 'application/json'});
        // Send back reply content
        res.end(JSON.stringify({"error":-1,
                                "message":"Invalid query: " + validation.errors.map(d => { return d.message + ";";})}));
    }
}

/**
 *
 * Occur when an unkown url was called
 *
 */
function f404(data,res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(404);
    res.end(JSON.stringify({"error":-1,"message":"404"}));
}


function run() {
    const IP = process.env.IP || "127.0.0.1";
    const username = process.env.user || 'guest';
    const password = process.env.password || 'guest';
    const opt = { credentials: require('amqplib').credentials.plain(username, password) };

    amqp.connect('amqp://'+IP, opt, function(error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function(error1, channel) {
                    if (error1) {
                        throw error1;
                    }
                    channel.assertQueue(queue, {
                        durable: true
                                });
                    from_backend_channel = channel;
                    app.use(bodyParser.json());

                    app.post('/pushdata', (req, res) => {
                        var body = req.body;
                        console.log(body);
                        postdata(body,res);
                    });

                    app.post('/pull', (req, res) => {
                        var body = req.body;
                        console.log(body);
                        pull(body,res);
                    });

                    app.post("/login", (req, res) => {
                        var body = req.body;
                        console.log(body);
                        login(body,res);
                    });

                    app.get('/*', (req, res) => {
                        console.log("GET 404", req.originalUrl);
                        f404(null,res);
                    });
                    app.post('/*', (req, res) => {
                        console.log("POST 404",req.originalUrl);
                        f404(null,res);
                    });

                    app.listen(port, host, () => {
                        console.log(`Server is running at http://${host}:${port}`);
                    });
                });
            });
}


exports.run = run;
