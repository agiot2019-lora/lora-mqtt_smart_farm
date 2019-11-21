var express = require('express');
var router = express.Router();
var request = require('request');
const util = require('util');

//get sensor info from farm_id
function get_sensor_info(farm_id, cb) {
    var sensor_info = new Array();
    var sqlquery = "SELECT  * FROM sensors WHERE farm_id = ?";
    connection.query(sqlquery, farm_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, []);
        } else {
            console.log("found sensor info");
            sensor_info = rows;
            cb(true,sensor_info);
        }
    });
}

//get soil moisture info from farm_id
function get_soil_moisture_info(farm_id, cb) {
    var soil_moisture = new Array();
    var sqlquery = "SELECT  * FROM farms WHERE farm_id = ?";
    connection.query(sqlquery, farm_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, []);
        } else {
            console.log("found soil_moisture array");
            soil_moisture=rows;
            cb(true,soil_moisture);
        }
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
            console.log("user login successfully");
            myfarm = rows;
            get_sensor_info(farm_id, function (result, sensor_info){
                if(result==true){
                    get_soil_moisture_info(farm_id, function (result, soil_moisture) {
                        if (result == true) {
                            cb(true, myfarm, sensor_info, soil_moisture);
                        } else {
                            cb(true,myfarm, sensor_info, []);
                        }
                    });
                }else{
                    cb(true,[],[],[])
                }
            });
        }
    });
}

/* GET users listing. */
router.get('/:farm_id', function (req, res, next) {
    var farm_id = req.query.farm_id;
    var user_id=req.session.user_id;
    get_farm_info(farm_id, function (result, myfarm, sensor_info, soil_moisture) {
        if (result == true) {
            console.log("myfarm: ", myfarm);
            console.log("sensor_info: ", sensor_info);
            console.log("soil_moisture : ", soil_moisture);
            res.render('farm', {
                user_id: user_id,
                myfarm: myfarm,
                sensor_info: sensor_info,
                soil_moisture: soil_moisture
            });
        } else {
            res.render('farm', {
                user_id: user_id,
                myfarm: [],
                sensor_info: [],
                soil_moisture: []
            });
        }
    })
});

// get farm form
router.get('/farm_form', function (req, res, next) {
    var user_id=req.session.user_id;
    res.render('farm', {
        user_id: user_id,
    });
});

// insert farm info to db
router.post('/farm_form', function (req, res, next) {
    var farm_name=req.body.farm_name;
    var farm_location =req.body.farm_location;
    var user_id= req.session.user_id;
    var sql2 = "INSERT INTO farms (farm_name, farm_location, user_id) VALUES (?,?,?)";
    connection.query(sql2, [farm_name, farm_location, user_id], function (err) {
        if (err) {
            console.log("inserting farms failed");
            throw err;
        } else {
            console.log("farm inserted successfully");
            res.redirect('/');
        }
    })
});
module.exports = router;