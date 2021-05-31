
const authdb = [
    {'login': 'test', 'password': 'pass',"allowed_queues": [0]},
    {'login': 'test1', 'password': 'pass1',"allowed_queues": [1]},
    {'login': 'test2', 'password': 'pass2',"allowed_queues": [2]},
    {'login': 'test3', 'password': 'pass3',"allowed_queues": [3]},
    {'login': 'test4', 'password': 'pass4',"allowed_queues": [0,1]},
    {'login': 'test5', 'password': 'pass5',"allowed_queues": [1,2]},
    {'login': 'test6', 'password': 'pass6',"allowed_queues": [1,3]},
    {'login': 'test7', 'password': 'pass7',"allowed_queues": [2,3]},
    {'login': 'test8', 'password': 'pass8',"allowed_queues": [0,2]},
    {'login': 'test9', 'password': 'pass9',"allowed_queues": [0,3]},
];

exports.authdb = authdb;
