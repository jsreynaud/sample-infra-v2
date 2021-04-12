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
        var msg = 'Hello world';

        channel.assertQueue(queue, {
            durable: false
        });

        channel.sendToQueue(queue, Buffer.from(msg));
        console.log(" [x] Sent %s", msg);
    });

    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 500);

});
