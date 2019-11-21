var express = require('express');
var router = express.Router();
var request = require('request');
const util = require('util');

//get user's info from user_id
function get_user_info(user_id, cb) {
    var myinfo = new Array();
    var sqlquery = "SELECT  * FROM users WHERE user_id = ?";
    connection.query(sqlquery, user_id, function (err, rows) {
        if (err) {
            console.log("no match");
            cb(false, []);
        } else {
            console.log("user login successfully");
            myinfo = rows;
            cb(true, myinfo);
        }
    });
}

/* GET users listing. */
router.get('/', function (req, res, next) {
    var user_id = req.session.user_id;
    get_user_info(user_id, function (result, myinfo, mycompany, mytickets) {
        if (result == true) {
            console.log("mytickets: ", mytickets);
            console.log("myinfo: ", myinfo);
            console.log("mycompany : ", mycompany);
            res.render('emitter/mypage', {
                myinfo: myinfo,
                mycompany: mycompany,
                mytickets: mytickets
            });
        } else {
            res.render('emitter/mypage', {
                myinfo: [],
                mycompany: [],
                mytickets: []
            });
        }
    })
});

//전자 인계서 작성 페이지 불러오기
router.get('/form', function (req, res, next) {
    res.render('emitter/electronic_form', {
        waste_code: '',
        handler: '',
        handle_method: '',
        handle_address: '',
        conveyancer: '',
        conveyancer_car_num: '',
        user_id: req.session.user_id,
        waste_index: '',
    });
});






module.exports = router;