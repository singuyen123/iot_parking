const PORT = 3000;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var mongodbUrl = "mongodb://localhost:27017/iot_parking";
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(express.static(__dirname + '/'));
var ip = require('ip');
var http = require('http');					//#include thu vien http -
var socketio = require('socket.io');			//#include thu vien socketio
var server = http.createServer(app);
var io = socketio(server);
server.listen(PORT, function () {
    console.log("Server running at address: " + ip.address() + ":" + PORT)
})
//////
//app.use(cookieParser());
app.get('/', function (req, res) {
    res.sendfile('public/html/index.html');
});
//giai nen chuoi JSON thanh cac OBJECT
function ParseJson(jsondata) {
    try {
        return JSON.parse(jsondata);
    } catch (error) {
        return null;
    }
}

//Gui du lieu thông qua 
function sendTime() {

    //Ðay la mot chuoi JSON
    var json = {
        status: "bi ban", 	//kieu chuoi
        x: 12,									//so nguyên
        y: 3.14,							    //so thuc
        time: new Date()							//Ðoi tuong Thoi gian
    }
    io.sockets.emit('atime', json);
}

//Khi co mot ket noi duoc tao giua Socket Client và Socket Server
io.on('connection', function (socket) {	//'connection' (1) nay khac gi voi 'connection' (2)

    console.log("Connected"); //In ra windowm console la da co mot Socket Client ket noi thanh cong.

    //Gui di lenh 'welcome' voi mot tham so la mot bien JSON. Trong bien JSON nay co mot tham so va tham so do ten la message. Kieu du lieu cua tham so là mot chuoi.
    socket.emit('welcome', {
        message: 'Connected !!!!'
    });

    //Khi lang nghe duoc lenh "connection" voi mot tham so, va chung ta dat ten tham so la message.
    //'connection' (2)
    socket.on('connection', function (message) {
        console.log(message);
    });

    socket.on('RFID', function (message) {
        console.log(message);
    });

    socket.on('arduino', function (data) {
        io.sockets.emit('arduino', { message: 'R0' });
        console.log(data);
    });

    socket.on('signup_card', function (message) {
        console.log('signup_card')
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);
            db.collection("user").insert({
                id: message,
                parking_flag: 0,
                car_code: 0
            })
            db.close();
        });
    })

    socket.on('signup_member', function (message) {
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);
            var querryObj = { 'id': message };
            var updateValue = {
                $set: {
                    'is_member': 1,
                }
            };
            console.log(updateValue);
            db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                assert.equal(null, err);
                console.log("MONGO: 1 document updated");
                db.close();
            })
            socket.emit("request_signup_member", true);
        });
    })

    socket.on('parking', function (message) {
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);

            var querryObj = { 'id': message.id };
            console.log(message);
            var updateValue;

            db.collection("user").findOne(querryObj, function (err, result) {
                assert.equal(null, err);
                if ((result) && (result.parking_flag == 0)) {
                    if (result.is_member == 1) {
                        updateValue = {
                            $set: {
                                'parking_flag': 1,
                            }
                        };
                        console.log(updateValue);
                        db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                            assert.equal(null, err);
                            console.log("MONGO: 1 document updated");
                            db.close();
                        })
                        socket.emit('parked')
                    } else {
                        console.log(message)
                        updateValue = {
                            $set: {
                                'parking_flag': 1,
                                'car_code': message.car_code
                            }
                        };
                        console.log(updateValue);
                        db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                            assert.equal(null, err);
                            console.log("MONGO: 1 document updated");
                            db.close();
                        })
                        socket.emit('parked')

                    }

                } else {
                    updateValue = {
                        $set: {
                            'parking_flag': 0,
                            'car_code': 0
                        }
                    };
                    console.log(updateValue);
                    db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                        assert.equal(null, err);
                        console.log("MONGO: 1 document updated");
                        db.close();
                    })
                }
                db.close();
            });
        });
    })

    socket.on('end_devide', function (message) {
        var availeble_slot, member_slot, parked_slot, all_slot
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);
            var querryObj = { 'parking_flag': 1 };
            var querryObj1 = { 'is_member': 1, 'parking_flag': 0 };

            db.collection("user").find({}).toArray(function (err, result) {
                if (err) throw err;
                all_slot = result.length;
                db.close();
            });

            db.collection("user").find(querryObj).toArray(function (err, result) {
                if (err) throw err;
                parked_slot = result.length;
                db.close();
            });

            db.collection("user").find(querryObj1).toArray(function (err, result) {
                if (err) throw err;
                member_slot = result.length;
                availeble_slot = all_slot - (member_slot + parked_slot)
        console.log(availeble_slot);
                db.close();
            });
            
        });
        
        socket.emit('result_end_devide', availeble_slot);

    })
});