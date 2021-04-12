// Implementation with axios
const axios = require('axios');

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
    axios.post("http://localhost:8000/pushdata",{jwt:jwt,
                                                 data:{complexdata:'ok',withnumber:iter_data}})
        .then(function(d) {
            axios.post("http://localhost:8000/pull",
                       {jwt:jwt})
                .then(function(d) {
                    apply_command(d.data);
                }).catch(function (error) {
                    console.log("PULL ERROR",error);
                });
        }).catch(function (error) {
            console.log("PUSHDATA ERROR",error);
        });

}

/* Doing POST ... Imbricate them*/
axios.post("http://localhost:8000/login",{username: login,
                                          password: password}
          ).then(function(d) {
              var jwt = d.data.message;
              setInterval(() => {
                  action(jwt);
              },
                          30000);
          }).catch(function (error) {
              // handle error
              console.log("LOGIN ERROR",error);
          });
