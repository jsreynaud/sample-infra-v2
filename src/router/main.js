const authdb = require("../db/authdb");
const routingdb = require("../db/routingdb");
var amqp = require('amqplib/callback_api');
var validate = require('jsonschema').validate;

var global_channel;
const from_backend_queue = 'from_backend';



function check_permissions(login,target_queue) {
    let fnd = authdb.authdb.find(element => {
            return element.login == login && element.allowed_queues.includes(target_queue);
        });
    if (fnd) {
        return true;
    } else {
        return false;
    }
}

function on_message(msg) {
    // Extract the message
    msg = JSON.parse(msg.content.toString());
    // Check that destination is a valid value
    if (msg.destination < routingdb.routingdb.length && msg.destination >= 0) {
        // Check permissions
        if (check_permissions(msg.jwt.username,msg.destination)) {
            console.log("Send Message to queue",routingdb.routingdb[msg.destination],msg.data);
            // If ok: publich message on dedicated queue
            global_channel.sendToQueue(routingdb.routingdb[msg.destination], Buffer.from(JSON.stringify(msg.data)));
        } else {
            // Drop the message (an let an error message)
            console.error("Illegal submission from username",msg.jwt.username,"to",msg.destination);
        }
    } else {
        console.error("Invalid destination",msg.destination,routingdb.routingdb.length);
    }

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
                    // Create queue "from_backend"
                    channel.assertQueue(from_backend_queue, {
                        durable: true
                                });
                    global_channel = channel;
                    // Create all output queues
                    routingdb.routingdb.forEach(element => {
                            channel.assertQueue(element, {
                                durable: true
                                });
                        });

                    // Start consume input queue
                    channel.consume(from_backend_queue, on_message, {
                        noAck: true });

                });

        });



}

exports.run = run;
