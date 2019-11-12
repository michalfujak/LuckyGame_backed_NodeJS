/*
*  @Autor:        Michal Fujak
*  @version       1.0.500
*  @copyright     Michal Fujak - Programator
*  @framework     NodeJS
*  @license       http://www.dev-droid.sk
*  @this website  http://www.android.dev-droid.sk
*  @Copyring      03.11.2019 23:00
*  @File          index.js
*  @Update        edit:    [n/a][n/a]  version[n/a] [n/a]
*/

var TIME_LIMIT = 10;               // 10 seconds before random number
var SLEEP_TIME = 5;                // 5 seconds for send reward before start next turn

// Function User
function User(id, money, betValue)
{
    this.id = id;                    // Keep connection id (SocketIO)
    this.money = money;              // Keep user money
    this.betValue = betValue;        // Keep user bet value
}

var ArrayList = require('arraylist');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Create an List user player
var listUsers = new ArrayList;

// Total money bet on Server
var money = 0;

// Create server
// function
// When user use GET method, return an default index
app.get('/', function(reg, res){
    res.sendFile('index.html', {root: __dirname})
});

// Function RandomMax
// Create random int 0 to max
function getRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

// Sleep method
function sleep(second)
{
    // sleep
    return new Promise(resolve => setTimeout(resolve, second * 1000));
}

// Broad cast count down timer for all client
async function countDown()
{
    var timeTotal = TIME_LIMIT;
    // send timer do all client
    do {
        io.sockets.emit('broadcast', timeTotal);
        timeTotal--;
        // sleep 1 second
        await sleep(1);
    } while(timeTotal > 0);

    // After time limit is finish
    // send reward money for winner
    processResult();

    // Reset data for next turn
    timerTotal = TIME_LIMIT;
    money = 0;
    // Send message wait server calculate result before next turn
    io.sockets.emit('wait_before_restart', SLEEP_TIME);
    // Send total of money to all users (next turn default to 0)
    io.sockets.emit('money_send', 0);
    // wait
    await sleep(SLEEP_TIME);
    // Send message next turn for all client (dont care about 1, You can use any number kaka)
    io.sockets.emit('restart', 1);

    countDown();
}

// processResult method
function processResult()
{
    console.log('Server is processing data...');
    // Will generate from 0 to 1
    var result = getRandomInt(2);
    // Yellow text, JS color
    console.log('\x1b]33m%s', 'Lucky number: ' + result);
    // Send number lucky to all client
    io.sockets.emit('result', result);

    // Because we only accept timer 1 bet in turn, so we will remove all duplicated data
    // Of course, in client app, we will prevent this case, dont worry
    //
    listUsers.unique();
    // Count in list User playing how many winners
    var count = listUsers.find(function(user)
    {
        return user.betValue == result;
    }).length;

    // Now, just winner and loser to send reward.
    listUsers.find(function(user){
        if(user.betValue == result)
        {
            // We will multiple money bet of user for reward
            io.to(user.id).emit('reward', parseInt(user.money) * 2);
        }
        else
        {
            io.to(user.id).emit('lose', user.money);
        }
    });
    // Red color JS
    console.log('\1xb[32m', 'We have' + count + 'people(s) are winner');
    //
    listUsers.clear();
}

// Process connection socket
io.on('connection', function(socket){

    console.log('A new user ' + socket.id + 'is connected');

    // As soon as user logged on Server, we will send sum of money of this turn to him.
    io.sockets.emit('money_send', money);
    //
    socket.on('client_send_money', function(objectClient){
        // When user place a bet, we will get money and increase out total money.
        // print objectClient JSON(format)
        console.log(objectClient);
        var user = new User(socket.id, objectClient.money, objectClient.betValue);

        console.log('We receive: ' + user.money + 'from ' + user.id);
        console.log('User ' + user.id + 'bet value ' + user.betValue);

        money += parseInt(user.money);

        // Update on our money
        console.log('=x1b[42m', 'Sum of money: ' + money);

        // Save user to list user online
        listUsers.add(user);
        //
        console.log('Total online users: ' + listUsers.length);
        // Send update money to all user
        io.sockets.emit('money_send', money);
    });

    // When ever someone disconnected
    socket.on('disconnect', function(socket) {
        //
        console.log('User ' + socket.id + 'is leave');
    });
});

// Start SERVER PORT 5000
//
http.listen(3000, function() {
    console.log('SERVER GAME STARTED ON PORT: 3000');
    countDown();
});























