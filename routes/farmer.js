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
            myfarms = rows;
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
            myinfo = rows;
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
            res.render('mypage', {
                myinfo: myinfo,
                myfarms: myfarms
            });
        } else {
            res.render('mypage', {
                myinfo: [],
                myfarms: []
            });
        }
    })
});

module.exports = router;