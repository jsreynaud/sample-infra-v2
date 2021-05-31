// Implementation with axios
const axios = require('axios');
const { ArgumentParser } = require('argparse');
const parser = new ArgumentParser({
  description: 'Client parameters'
});

parser.add_argument('-l', '--login', { help: 'Login to use',required:true });
parser.add_argument('-p', '--password', { help: 'Password',required:true });
parser.add_argument('-t', '--to', { help: 'Destination',type:"int" ,required:true});
let login = parser.parse_args().login;
let password = parser.parse_args().password;
let destination = parser.parse_args().to;



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
                                                 data:{complexdata:'ok',withnumber:iter_data},
                                                 destination:destination})
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
                          300);
          }).catch(function (error) {
              // handle error
              console.log("LOGIN ERROR",error);
          });
