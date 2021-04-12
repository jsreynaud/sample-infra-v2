// Implementation with http
const https = require('http');



/**
   Function POST: post the data "jdata" to the url "url".
   "f" is the callback when it's finished
*/
function POST(jdata,url,f) {

    const data = JSON.stringify(jdata);

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, res => {
        res.on('data', (d) => {
            let jd = JSON.parse(d.toString('utf-8'));
            f(jd);
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.write(data);
    req.end();
}

// Setting default value
let login = "test";
let password = "pass";
// If some parameters are there, use them...
if (process.argv.length > 3) {
    login = process.argv[2];
    password = process.argv[3];
}



/**
   Apply command received by pull
*/
function apply_command(cmd) {
    if (cmd.error == 0) {
        switch (cmd.message.type) {
        case "print":
            console.log(cmd.message.data);
            break;
        case "end":
            process.exit(0);
            break;
        default:
            console.error("Invalid command:",cmd.message.type);
        }
    } else {
        console.error("Command error",cmd);
    }
}


var iter_data = 0;
/*
  action performed each 30 seconds
*/
function action(jwt) {
    iter_data++;
    POST({jwt:jwt,data:{complexdata:'ok',withnumber:iter_data}},"/pushdata",d => {
        POST({jwt:jwt},"/pull", d => {
            apply_command(d);
        });
    });

}

/* Doing POST ... Imbricate them*/
POST({username: login,password: password},"/login",d => {
    var jwt = d.message;
    setInterval(() => {
        action(jwt);
    },
                30000);
});
