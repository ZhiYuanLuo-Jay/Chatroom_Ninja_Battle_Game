// require express
var express = require("express");

// path module -- try to figure out where and why we use this
var path = require("path");

// create the express app
var app = express();

// static content
app.use(express.static(path.join(__dirname, "./static")));

// setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// setting up npm module
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Obj constructor
function Ninja(name) {
    this.name = name;
    this.health = 100;
    this.items = 3;  // backpack items init
    var speed = 3;
    var strength = 3;

    this.sayName = function() {
        console.log("My ninija name is " + this.name);
    }

    this.showStats = function() {
        console.log("Ninja Status -> Name: " + this.name + ", Health: " + this.health +
            ", Speed: " + speed + ", Strength: " + strength);
    }

    this.drinkSake = function() {
        this.health += 10;
        if(this.health > 100){
            this.health = 100;
          }
        return this;
    }

    this.readStrength = function() {
        return strength;
    }

}

// Ninja skill set
Ninja.prototype.punch = function(nj) {
    // console.log(this);
    // console.log(nj);
    nj.health -= 5;
    console.log(nj.name + ' was punched by ' +
        this.name + ' and lost 5 Health! ');
    str_result = nj.name + ' was punched by ' +
        this.name + ' and lost 5 Health!';
    chat_arr.push(str_result);
};

Ninja.prototype.kick = function(nj) {
    // console.log(this.readStrength()*5);
    // console.log(nj);
    // console.log(nj.health);
    nj.health -= this.readStrength() * 5;
    console.log(nj.name + ' was kicked by ' + this.name +
        ' and lost ' + this.readStrength() * 5 + ' Health!');
    str_result = nj.name + ' was kicked by ' + this.name +
        ' and lost ' + this.readStrength() * 5 + ' Health!';
    chat_arr.push(str_result);
};

Ninja.prototype.remedy = function(nj) {
    // console.log(nj);
    // console.log(nj.health);
    nj.health += 10;
    console.log(nj.name + ' was treated by ' + this.name +
        ' and increased 10 Health!');
    str_result = nj.name + ' was treated by ' + this.name +
        ' and increased 10 Health!';
    chat_arr.push(str_result);
};

// using socket
const server = app.listen(1999);
const io = require('socket.io')(server);
var counter = 0;
var usr_list = [],
    obj_arr = [],
    str_result = "",
    chat_arr = [];

io.on('connection', function(socket) { //2

    // Part 1
    socket.on('usr_button', function(data) { // first receiving
        usr_list.push({
            usr: data.usr // get new username into array
        });

        var newNinja = new Ninja(data.usr);
        // console.log(newNinja);
        newNinja.sayName();
        newNinja.showStats();

        obj_arr.push(newNinja);

        // console.log(usr_list); // list of users entered to the chatroom
        io.emit('created_usr', { newUsr: newNinja });
    });


    // Part 2
    socket.on('find_button', function(data) { // first receiving
        console.log(usr_list);
        socket.emit('send_list', { info: usr_list });
    });


    // Part 3
    socket.on('launch_button', function(data) { // first receiving
        console.log(data.msg.comment); //(note: this log will be on your server's terminal)
        if (data.msg.comment){
            // console.log("inserting comment to array");
            chat_arr.push(data.msg.comment);
        }
        var curUsr = data.msg.name;
        var oppUsr = data.msg.ninja;
        var obj_1, obj_2;
        var is_treated = false;

        obj_arr.forEach(function(x) {
            // console.log(x['name']);
            if (curUsr == x['name']) {
                obj_1 = x;
            };
            if (oppUsr == x['name']) {
                obj_2 = x;
            }; 
        })

        // console.log("obj_1: " + JSON.stringify(obj_1));
        // console.log("obj_2: " + JSON.stringify(obj_2));

        if (obj_2 != null && data.msg.skill == "punch") {
            // obj_2.showStats();
            obj_1.punch(obj_2);
            obj_2.showStats();
            // console.log(obj_2.health);
            // console.log(obj_2.name);
            if (obj_2.health > 50) {
                io.emit('turn_blue', { name: obj_2.name });
            }
            if (obj_2.health <= 50) {
                io.emit('turn_yellow', { name: obj_2.name });
            }
            if (obj_2.health <= 20) {
                io.emit('turn_red', { name: obj_2.name });
            }
            if (obj_2.health <= 0) {
                io.emit('turn_grey', { name: obj_2.name });
            }
        }

        if (obj_2 != null && data.msg.skill == "kick") {
            obj_1.kick(obj_2);
            obj_2.showStats();
            // console.log(obj_2.health);
            // console.log(obj_2.name);
            if (obj_2.health <= 50) {
                io.emit('turn_yellow', { name: obj_2.name });
            }
            if (obj_2.health <= 20) {
                io.emit('turn_red', { name: obj_2.name });
            }
            if (obj_2.health <= 0) {
                io.emit('turn_grey', { name: obj_2.name });
            }
        }

        if (obj_2 != null && data.msg.item == "remedy") {
            obj_1.remedy(obj_2);
            obj_2.showStats();
            // console.log(obj_2.health);
            // console.log(obj_2.name);
            is_treated = true;
            if (obj_2.health <= 50) {
                io.emit('turn_yellow', { name: obj_2.name });
            }
            if (obj_2.health <= 20) {
                io.emit('turn_red', { name: obj_2.name });
            }
            if (obj_2.health <= 0) {
                io.emit('turn_grey', { name: obj_2.name });
            }
        }

        console.log(chat_arr);

        io.emit('updated_chat', {
            name: data.msg['name'],
            msg: data.msg['comment'],
            result: str_result,
            log: chat_arr,
            treat: is_treated,
        });

        // console.log(obj_arr);
        obj_1 = null;
        obj_2 = null;
        str_result = "";
    });

});

// root route to render the index.ejs view
app.get('/', function(req, res) {
    res.render("index");
})