var express = require('express');
var router = express.Router();
var request = require('request');
const util = require('util');
var async = require('async');

//get sensor info from farm_id
function get_sensor_info(farm_id, cb) {
    var sensor_info = new Array();
    var sqlquery = "SELECT  * FROM sensors WHERE farm_id = ?";
    connection.query(sqlquery, farm_id, function (err, rows) {
        if (err) {
            console.log("no match");
            s_info={
                temperature: "",
                humidity:"",
                actuator:""
            };
            sensor_info.push(s_info);
            cb(true, sensor_info);
        } else {
            console.log("found sensor info");
            if(rows.length!=0){
                var temperature=rows[0].temperature;
                var humidity=rows[0].humidity;
                var actuator=rows[0].actuator;
                s_info={
                    temperature:temperature,
                    humidity:humidity,
                    actuator:actuator
                };
                sensor_info.push(s_info);
            }else{
                s_info={
                    temperature: "",
                    humidity:"",
                    actuator:""
                };
                sensor_info.push(s_info);
            }
            cb(true,sensor_info);
        }
    });
    
}

//get soil moisture info from farm_id
function get_soil_moisture_info(farm_id, cb) {
    console.log("farm ID : ", farm_id);
    var soil_moisture = new Array();
    var sqlquery = "SELECT  * FROM soil_moisture WHERE farm_id = ?";
    connection.query(sqlquery, farm_id, function (err, rows) {
        if (err) {
            console.log("no match");
            var s_moisture = {
                soil_moisture : "",
                s_datetime : ""
            }
            soil_moisture.push(s_moisture);
        } else {
            console.log("found soil_moisture array");
            if(rows.length!=0){
                if(rows.length>6){
            for (var i=rows.length-7; i<rows.length; i++){
                var s_moisture = {
                    soil_moisture : rows[i].soil_moisture,
                    s_datetime : rows[i].s_datetime
                }
                soil_moisture.push(s_moisture);
            }
                }else{
                for (var i=0; i<rows.length; i++){
                    var s_moisture = {
                        soil_moisture : rows[i].soil_moisture,
                        s_datetime : rows[i].s_datetime
                    }
                    soil_moisture.push(s_moisture);
                }
                }
            }else{
                var s_moisture = {
                    soil_moisture : "",
                    s_datetime : ""
                }
                soil_moisture.push(s_moisture);
            }
        }
        cb(true,soil_moisture);
    });
}

//get farm's info from farm_id
function get_farm_info(farm_id, cb) {
    var myfarm = new Array();
    var sqlquery = "SELECT  * FROM farms WHERE farm_id = ?";
    connection.query(sqlquery, farm_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, [],[], []);
        } else {
            console.log("got farm info successfully");
            console.log(rows);
            var farm_info={
                farm_name: rows[0].farm_name,
                farm_location:rows[0].farm_location,
                farm_technology_type : rows[0].farm_technology_type
            }
            myfarm.push(farm_info);
            get_sensor_info(farm_id, function (result, sensor_info){
                if(result==true){
                    get_soil_moisture_info(farm_id, function (result, soil_moisture) {
                        if (result == true) {
                            cb(true, myfarm, sensor_info, soil_moisture);
                        } else {
                            cb(true,myfarm, sensor_info, soil_moisture);
                        }
                    });
                }else{
                    cb(true,myfarm, sensor_info, soil_moisture);
                }
            });
        }
    });
}

/* GET users listing. */
router.get('/:farm_id', function (req, res, next) {
    var farm_id = req.params.farm_id;
    var user_id=req.session.user_id;
    console.log("farm_id : ",farm_id);
    get_farm_info(farm_id, function (result, myfarm, sensor_info, soil_moisture) {
        if (result == true) {
            //console.log("myfarm: ", myfarm);
            //console.log("sensor_info: ", sensor_info);
            console.log("soil_moisture : ", soil_moisture);
            res.render('index', {
                user_id: user_id,
                myfarm: myfarm,
                sensor_info: sensor_info,
                soil_moisture: soil_moisture,
                farm_id: farm_id
            });
        } else {
            res.redirect('back');
        }
    })
});

// get farm form
router.get('/create/form', function (req, res, next) {
    console.log("get farm_form!")
    var user_id=req.session.user_id;
    res.render('farm_form', {
        user_id: user_id,
    });
});

// get soil_moisture json
router.post('/get/soil/moisture', function (req, res, next) {
    console.log("get soil_moisture_array!")
    var farm_id=req.body.farm_id;
    get_soil_moisture_info(farm_id,function(result, soil_moisture){
        if(result==true){
            res.jsonp({success : true, soil_moisture: soil_moisture})
        }else{
            res.render('soil_moisture', {
                soil_moisture:soil_moisture
            });
        }
    })
});

// insert farm info to db
router.post('/farm_form', function (req, res, next) {
    var farm_name=req.body.farm_name;
    var farm_location =req.body.farm_location;
    var user_id= req.session.user_id;
    var farm_technology_type= req.body.farm_technology_type;
    console.log("tech : ", farm_technology_type);
    //farm_technology_type==1 (APRS), ==0 (LoRa)
    var sql2 = "INSERT INTO farms (farm_name, farm_location, user_id, farm_technology_type) VALUES (?,?,?,?)";
    connection.query(sql2, [farm_name, farm_location, user_id, farm_technology_type], function (err) {
        if (err) {
            console.log("inserting farms failed");
            throw err;
        } else {
            console.log("farm inserted successfully");
            var sql4 = "SELECT farm_id farms WHERE user_id=? AND farm_name = ? AND farm_location=? AND farm_technology_type=?";
            connection.query(sql4, [user_id, farm_name, farm_location,farm_technology_type], function (err, rows) {
                if (err) {
                    console.log("finding farmid failed");
                    throw err;
                } else {
                    var farm_id=rows[0].farm_id;            
                    var sql3 = "INSERT INTO sensors (farm_id, temperature, humidity, actuator) VALUES (?,?,?,?)";
                    connection.query(sql3, [farm_id, -1, -1, false], function (err) {
                    if (err) {
                        console.log("inserting farms failed");
                        throw err;
                    } else {
                        res.redirect('/farmer');
                    }
                    });
                }
            })
        }
    });
});

//mqtt subscribe
function mqtt_publish(result, farm_id, cb) {
    var mqtt = require('mqtt')
    var client  = mqtt.connect('mqtt://test.mosquitto.org')
    if(result=="on"){
        console.log("ON")
        client.on('connect', function () {
            console.log("connected");
            client.publish('smartfarm', '1', function(err){
                if(!err){
                    var sqlquery3 = "UPDATE sensors SET actuator=? WHERE farm_id=?";
                    connection.query(sqlquery3, [true, farm_id], function (err) {
                        if (err) {
                            console.log("inserting data failed");
                            throw err;
                        } else {
                            console.log("inserting sensor data successfully");
                            cb(true);
                        }
                    });
                }else{
                    cb(false);
                }
            });
        }); 
    }else if ("off"){
        console.log("OFF")
        client.on('connect', function () {
            client.publish('smartfarm', '0', function(err){
            if(!err){
                console.log("connected");
                var sqlquery3 = "UPDATE sensors SET actuator=? WHERE farm_id=?";
                    connection.query(sqlquery3, [false, farm_id], function (err) {
                        if (err) {
                            console.log("inserting data failed");
                            throw err;
                        } else {
                            console.log("inserting sensor data successfully");
                            cb(true);
                        }
                    });
            }else{
                cb(false);
            }
          })
        });
    }
}

// insert farm info to db
router.post('/actuator', function (req, res, next){
    console.log("ACTUATOR !");
    var result=req.body.result;
    var farm_id=req.body.farm_id;
    console.log("result : ", result);
    console.log("farm id : ", farm_id);
    mqtt_publish(result, farm_id, function (temp) {
        if(temp == true){
             res.jsonp({success : true})
            }
        else{
             res.jsonp({success : false})
        }
    })
});

module.exports = router;