// module
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");
var mysql = require("mysql");
var request = require("request");
const SequelizeAuto = require("sequelize-auto");
var async = require("async");

// routing
var index = require("./routes/index");
var farmer = require("./routes/farmer");
var farm = require("./routes/farm");

var ttn = require("ttn");

const appID = "ksw2019agiot";
const accessKey = "ttn-account-v2.nJAy-JFHF3lX1Pl6iy84cGHEw_MwdIc6h-nNGsgwL8k";
//var client = new ttn.Client(appID, accessKey, 'us.thethings.network:1883');
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(logger("dev"));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(
  session({
    key: "sid", // 세션키
    secret: "secret", // 비밀키
    cookie: {
      maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/", index);
app.use("/farm", farm);
app.use("/farmer", farmer);

connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  port: 3306,
  database: "agiot"
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
//ttn connection
ttn.data(appID, accessKey).then(function (client) {
        client.on("uplink", function (devID, payload) {
            console.log("Received uplink from ", devID)
            console.log(payload);
            var fields=payload.payload_fields;
            var metadata=payload.metadata;
            var soil_moisture=fields['luminosity_3'];
            var time=metadata['time'];
            var humidity=fields['relative_humidity_2'];
            var temperature=fields['temperature_1'];

            var farm_id=1; // needs to edit
            //insert to database
            var sql = "INSERT INTO soil_moisture (s_datetime, soil_moisture, farm_id) VALUES (?,?,?)";
            connection.query(sql, [time,soil_moisture,farm_id], function (err) {
                if (err) {
                    console.log("inserting data failed");
                    throw err;
                } else {
                    console.log("soil_moisture inserted successfully");
                    var sqlquery3 = "UPDATE sensors SET temperature=?, humidity=? WHERE farm_id=?";
                    connection.query(sqlquery3, [temperature, humidity,farm_id], function (err) {
                        if (err) {
                            console.log("inserting data failed");
                            throw err;
                        } else {
                            console.log("inserting sensor data successfully");
                        }
                    });
                }
            })
        })
    })
    .catch(function (error) {
        console.error("Error", error)
        process.exit(1)
    })

console.log("app");
var server = app.listen(3000);
module.exports = app;
