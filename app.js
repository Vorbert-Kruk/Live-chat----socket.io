const express = require('express');
const app = express();
const mysql = require('mysql');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const appPort = 3000;
const chatPort = 5000;

const User = require('./classes/User.js');
const Users = require('./classes/Users.js');

let users = new Users();

let conn = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: '',
    charset: 'utf8mb4'
});

conn.connect(err => {
    if(err)
        throw new Error(`Wystąpił problem podczas łączenia z bazą danych.\nKod błędu to: ${err}`);
    console.log('Pomyślnie połączono z bazą danych');
})

app.set('view engine', 'ejs');

app.use('/chat', express.static('./'));

app.get('/chat', (req, res) => {
    console.log(`${req.hostname} uzyskał dostęp do zasobów strony`);
    conn.query('SELECT * from chat', (err, data) => {
        if(err)
            return console.log(`Wystąpił problem z pobraniem wiadomości z bazy danych.\nKod błędu: ${err}`);
        res.render('chat.ejs', {
            messages: data
        });
    });
});

app.listen(appPort, () => {
    console.log(`Serwer nasłuchuje na porcie ${appPort}`);
});

io.on('connection', socket => {
    console.log(`Użytkownik o identyfikatorze: ${socket.id}, połączył się z serwerem czatu`);
    const userName = socket.id.substring(0, 8);
    const currentUser = new User(userName);
    users.addUser(currentUser);
    socket.emit('user-name', currentUser.name);
    socket.emit('active-users', JSON.stringify(users));
    socket.on('get-active-users', () => {
        socket.emit('active-users', JSON.stringify(users));
    });
    socket.on('new-message', msgContent => {
            conn.query(`INSERT INTO chat VALUES(null, \'${currentUser.name}\', \'${msgContent}\')`, err => {
                if(err)
                {
                    socket.emit('message-status', err);
                    return console.log(`Nie udało się dodać wiadomości do bazy danych.\nKod błędu: ${err}`);
                }
                    socket.emit('new-message', JSON.stringify({
                        messageAuthor: currentUser.name,
                        messageContent: msgContent
                    }), 'no-alert');
                    socket.broadcast.emit('new-message', JSON.stringify({
                        messageAuthor: currentUser.name,
                        messageContent: msgContent
                    }), 'alert');
                });
    });
    socket.broadcast.emit('userConnect', JSON.stringify(currentUser));
    socket.on('msg', msg => {
        console.log('Użytkownik przesłał wiadomość!', msg);
    });
    socket.on('user-is-typing', userName => {
        socket.broadcast.emit('user-is-typing', JSON.stringify(users.getUserByName(userName)));
    });
    socket.on('user-is-not-typing', userName => {
        socket.broadcast.emit('user-is-not-typing', JSON.stringify(users.getUserByName(userName)));
    });
    socket.on('disconnect', reason => {
        console.log(`Użytkownik opuścił serwer: ${reason}`);
        users.removeUser(currentUser);
        socket.broadcast.emit('userDisconnect', JSON.stringify(currentUser));
    });
});

server.listen(chatPort, () => {
    console.log(`Serwer czatu nasłuchuje na porcie ${chatPort}`);
});