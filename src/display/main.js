const routingdb = require("../db/routingdb");


const { ArgumentParser } = require('argparse');


function run() {
    const parser = new ArgumentParser({
        description: 'Client parameters'
        });

    parser.add_argument('-q', '--queue', { help: 'Queue',type:"int" ,required:true});

    // getting queue name from routingdb
    let queue_name = routingdb.routingdb[parser.parse_args().queue];


    var amqp = require('amqplib/callback_api');

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

                    channel.assertQueue(queue_name, {
                        durable: true
                                });
                    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue_name);
                    channel.consume(queue_name, function(msg) {
                            console.log(" [x] Received %s", msg.content.toString());
                        }, {
                        noAck: true
                                });
                });
        });

}

exports.run = run;
