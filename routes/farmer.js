var express = require('express');
var router = express.Router();
var request = require('request');
const util = require('util');

//get user's farm information
function get_user_farm_info(user_id, cb) {
    var myfarms = new Array();
    var sqlquery = "SELECT  * FROM farms WHERE user_id = ?";
    connection.query(sqlquery, user_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, []);
        } else {
            console.log("found my farms list successfully");
            for(var i=0; i<rows.length; i++){
                var farm_info={
                    farm_id :rows[i].farm_id,
                    farm_name: rows[i].farm_name,
                    farm_location: rows[i].farm_location
                };
                myfarms.push(farm_info);
            }

            cb(true, myfarms);
        }
    });
}

//get user's info from user_id
function get_user_info(user_id, cb) {
    var myinfo = new Array();
    var sqlquery = "SELECT  * FROM users WHERE user_id = ?";
    connection.query(sqlquery, user_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, [], []);
        } else {
            console.log("user login successfully");
            var user_info={
                user_name : rows[0].user_name,
                user_contact : rows[0].user_contact,
                user_id : rows[0].user_id
        };
            myinfo.push(user_info);
            get_user_farm_info(user_id, function (result, myfarms){
                if(result==true){
                    cb(true,myinfo,myfarms);
                }else{
                    cb(true,myinfo,[])
                }
            });
        }
    });
}

/* GET users listing. */
router.get('/', function (req, res, next) {
    var user_id = req.session.user_id;
    get_user_info(user_id, function (result, myinfo, myfarms) {
        if (result == true) {
            res.render('farmer', {
                myinfo: myinfo,
                myfarms: myfarms,
                user_id: user_id
            });
        } else {
            res.render('farmer', {
                myinfo: [],
                myfarms: [],
                user_id: user_id
            });
        }
    })
});

module.exports = router;