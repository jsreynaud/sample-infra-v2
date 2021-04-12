require('dotenv').config();

var amqp = require('amqplib/callback_api');

const IP = process.env.IP || "127.0.0.1";
const username = process.env.username || 'guest';
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
        var queue = 'hello';

        channel.assertQueue(queue, {
            durable: false
        });
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
        }, {
            noAck: true
        });
    });
});
