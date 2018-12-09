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
var querryObj_parking;
server.listen(PORT, function () {
    console.log("Server running at address: " + ip.address() + ":" + PORT)
})
//////
//app.use(cookieParser());

app.get('/login', function (req, res) {
    res.sendfile('public/html/signin.html');
});
app.get('/', function (req, res) {
    res.sendfile('public/html/iot_parking.html');
});
app.get('/a', function (req, res) {
    res.sendfile('public/html/a.html');
});
app.get('/b', function (req, res) {
    res.sendfile('public/html/b.html');
});
//giai nen chuoi JSON thanh cac OBJECT
function ParseJson(jsondata) {
    try {
        return JSON.parse(jsondata);
    } catch (error) {
        return null;
    }
}


//Khi co mot ket noi duoc tao giua Socket Client và Socket Server
io.on('connection', function (socket) {	//'connection' (1) nay khac gi voi 'connection' (2)

    console.log("Connected"); //In ra windowm console la da co mot Socket Client ket noi thanh cong.

    //Gui di lenh 'welcome' voi mot tham so la mot bien JSON. Trong bien JSON nay co mot tham so va tham so do ten la message. Kieu du lieu cua tham so là mot chuoi.
    socket.emit('welcome', {
        message: 'Connected !!!!'
    });
    socket.on("type", function (message) {
        switch (message) {
            case 'login':
                socket.on('seasion-info', function (message) {
                    MongoClient.connect(mongodbUrl, function (err, db) {
                        assert.equal(null, err);

                        var querryObj = { 'username': message.username };

                        db.collection("admin").findOne(querryObj, function (err, result) {
                            assert.equal(null, err);
                            var dataObject = {};
                            if ((result) && (result.seasionKey == message.seasion)) {
                                dataObject.seasionStatus = true;
                                dataObject.userInfo = message;
                                socket.emit('queryLogin', dataObject);
                            } else {
                                dataObject.seasionKeyStatus = false;
                                socket.emit('queryLogin', dataObject);
                            }
                            db.close();
                        });
                    });
                })
                socket.on('login-info', function (message) {
                    checkLoginAccount(message.username, message.pass, (seasionKeyObject) => {
                        socket.emit('login-request', seasionKeyObject);
                    });
                });
                socket.on('signup-info', function (message) {
                    MongoClient.connect(mongodbUrl, function (err, db) {
                        assert.equal(null, err);
                        db.collection("admin").insert({
                            username: message.username,
                            pass: message.pass,
                            email: message.email,
                        })
                        db.close();
                    });
                });
                break;
            case 'index':
                var parking_lot_info;
                MongoClient.connect(mongodbUrl, function (err, db) {
                    assert.equal(null, err);
                    db.collection("parking_lot").find({}).toArray(function (err, result) {
                        if (err) throw err;
                        parking_lot_info = result;
                        db.close();
                    });
                    var querryObj = {
                        'parking_flag': 1,
                        'name_parking_lot': 'CEEC'
                    };
                    db.collection("user").find(querryObj).toArray(function (err, result) {
                        if (err) throw err;
                        parking_lot_info[0].freeSlot = parking_lot_info[0].amount - result.length;
                        console.log(parking_lot_info[0].amount);
                        db.close();
                    });
                    var querryObj = {
                        'parking_flag': 1,
                        'name_parking_lot': 'UIT'
                    };
                    db.collection("user").find(querryObj).toArray(function (err, result) {
                        if (err) throw err;
                        parking_lot_info[1].freeSlot = parking_lot_info[1].amount - result.length;
                        //console.log(parking_lot_info);
                        socket.emit('res_index', parking_lot_info);
                        db.close();
                    });
                })
                break;
            case 'a':
                MongoClient.connect(mongodbUrl, function (err, db) {
                    assert.equal(null, err);
                    var querryObj = {
                        'parking_flag': 1,
                        'name_parking_lot': 'UIT'
                    };
                    db.collection("user").find(querryObj).toArray(function (err, result) {
                        if (err) throw err;
                        socket.emit('res_a', result.length)
                        db.close();
                    });
                })
                break;
            case 'b':
                MongoClient.connect(mongodbUrl, function (err, db) {
                    assert.equal(null, err);
                    var querryObj = {
                        'parking_flag': 1,
                        'name_parking_lot': 'CEEC'
                    };
                    db.collection("user").find(querryObj).toArray(function (err, result) {
                        if (err) throw err;
                        socket.emit('res_b', result.length)
                        db.close();
                    });
                })
                break;
        }
    })
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
                id: message.id,
                parking_flag: 0,
                car_code: 0,
                is_member: 0,
                name_parking_lot: message.name
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
                    'is_member': 1
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

            var querryObj = {
                'id': message.id,
                'name_parking_lot': message.name
            };
            
            console.log(querryObj.id);
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
                        querryObj_parking = querryObj;
                        console.log('abc');
                        socket.emit('request_car_code');

                    }

                } else {
                    if (result.is_member == 1) {
                        updateValue = {
                            $set: {
                                'parking_flag': 0,
                            }
                        };
                        console.log(updateValue);
                        db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                            assert.equal(null, err);
                            console.log("MONGO: 1 document updated");
                            db.close();
                        })
                    } else {
                        updateValue = {
                            $set: {
                                'parking_flag': 0,
                                'car_code': 0,
                            }
                        };
                        console.log(updateValue);
                        db.collection("user").updateOne(querryObj, updateValue, function (err, res) {
                            assert.equal(null, err);
                            console.log("MONGO: 1 document updated");
                            db.close();
                        })
                    }
                }
                db.close();
            });
        });
    })

    socket.on('response_car_code', function (message) {
        console.log(message);
        console.log(querryObj_parking);
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);
            updateValue = {
                $set: {
                    'parking_flag': 1,
                    'car_code': message
                }
            };
            db.collection("user").updateOne(querryObj_parking, updateValue, function (err, res) {
                assert.equal(null, err);
                console.log("MONGO: 1 document updated");
                db.close();
            })
        })
    })
    function checkLoginAccount(username, password, callback) {
        var resultObject = {};
        MongoClient.connect(mongodbUrl, function (err, db) {
            assert.equal(null, err);

            var querryObj = { 'username': username };

            db.collection("admin").findOne(querryObj, function (err, result) {
                assert.equal(null, err);

                if ((result) && (result.pass == password)) {
                    resultObject.accountAvailability = true;

                    // Generate Seasion key
                    var str = "";
                    for (; str.length < 32; str += Math.random().toString(36).substr(2));
                    resultObject.seasionKey = str.substr(0, 32);

                    var updateValue = {
                        $set: {
                            'seasionKey': resultObject.seasionKey,
                        }
                    };

                    console.log(updateValue);
                    db.collection("admin").updateOne(querryObj, updateValue, function (err, res) {
                        assert.equal(null, err);
                        console.log("MONGO: 1 document updated");
                        db.close();
                    })
                    callback(resultObject);
                } else {
                    resultObject.accountAvailability = false;
                    callback(resultObject);
                }

                db.close();
            });
        });
    }


});