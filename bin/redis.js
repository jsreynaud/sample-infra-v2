require('dotenv').config();
const redis = require("redis");


const IP = process.env.REDISIP || "127.0.0.1";
const password = process.env.REDISpassword || 'guest';


const client = redis.createClient({host:IP,password:password});

client.on("error", function(error) {
        console.error("ERROR",error);
});

client.set("key", "value35");
client.get("key", (err,reply) => {
        console.log("Reply:",err,reply);
    });
