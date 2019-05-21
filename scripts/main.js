// import { createSecureServer } from "http2";

const serverPort = 5000;
const serverAddress = `http://localhost:${serverPort}`;
const basicUrl = `${serverAddress}/chat`;
const userInput = document.querySelector('.msg-input input');
const typeInterval = 1000;
const messageContainer = document.querySelector('.msg-container');
const emojiButton = document.querySelector('.emoji-button');
const emojiContainer = document.querySelector('.emoji-container');

let userName = '';
let socket = io.connect(serverAddress);
let typeTimeout;

/*
    [ ] Zrobienie alert-boxa, który informuje, że coś się spinkoliło xDD
    [x] Zrobienie wyskakujacego pop-upa z emotkami
    [x] Obsługa wysyłki emotek
    [x] Pasek: <Pojawiła się nowa wiadomość>, po naciśnięciu której scrolluje się do samego dołu
    [x] Ogarnięcie animacji dla scrolla. Ale scroll po wbiciu na strone ma być bez animacji xD
    [ ] Ogarnięcie limitu wysyłania wiadomości i zrobienie ich 'odświeżanie'. Tzn np ktoś będzie przy samej górze to da mu dodatkowo 5 starszych wiadomości xD
    [ ] Odbieranie i przetwarzanie błędów tentegujących się na serwerze
*/
scroll
Messages();

socket.on('user-name', name => {
    userName = name;
    console.log(`Nazywam się: ${userName}`);
});

socket.on('userConnect', newUser => {
    newUser = JSON.parse(newUser);
    console.log(`Użytkownik ${newUser.name} dołączył do czatu`);
    appendUser(newUser.name);
    // appendUser(msg.userName);
});

socket.on('active-users', usersData => {
    const users = JSON.parse(usersData).list;
    console.log(`Lista aktywnych użytkowników`, users);
    users.forEach(user => {
        appendUser(user.name);
    });
});

socket.on('userDisconnect', user => {
    user = JSON.parse(user);
    console.log(`Użytkownik ${user.name} opuścił czat.`);
    removeUser(user.name);
    // removeUser(userName);
});

socket.on('user-is-typing', typingUser => {
    typingUser = JSON.parse(typingUser);
    userStartsToType(typingUser.name);
});

socket.on('user-is-not-typing', user => {
    user = JSON.parse(user);
    userStopsTyping(user.name);
});

socket.on('new-message', (message, createAlert, newAuthor) => {
    message = JSON.parse(message);
    // Dodatkowe dane odnośnie nowego twórcy wiadomości
    // Czeba zrobić też zabawe w .ejs żeby gdy zczytując dane z bazy wiedzieć czy ten sam user wpinkolił kilka wiadomości jedna po drugiej xDDD
    // if(newAuthor != 'new')
    // {
    //     console.log('Przyszła wiadomość od tego samego użytkownika!');
    //     addMessageText(
    //         message.messageAuthor, 
    //         message.messageContent
    //     );
    // }
    console.log('Przyszła wiadomość od nowego użytkownika!');
    appendNewMessage(createNewMessage(
        message.messageAuthor, 
        message.messageContent
    ));
    if(createAlert == 'alert' && getCurrentScrollOffset())
        appendMessageAlert();
    else
        scrollMessages();
});

document.querySelector('.emoji-button').addEventListener('click', () => {
    socket.emit('msg', 'Henlo my friend xD', 'heh');
});

document.querySelector('.msg-container').addEventListener('scroll', e => {
    if(getCurrentScrollOffset() == 0)
        removeMessageAlert();
});

userInput.addEventListener('keypress', () => {
    if(typeTimeout) 
        clearTimeout(typeTimeout);

    // console.log('Piszesz C:');
    userStartsToType(userName);
    socket.emit('user-is-typing', userName);
    
    typeTimeout = setTimeout(() => {
        // console.log('Nie piszesz ;-;');
        userStopsTyping(userName);
        socket.emit('user-is-not-typing', userName);
    }, typeInterval);
});

userInput.addEventListener('keyup', e => {
    if(e.code == 'Enter' && userInput.value.trim().length > 0)
    {
        socket.emit('new-message', userInput.value);
        userInput.clear();
    }
});

emojiButton.addEventListener('click', () => {
    emojiContainer.toggleClassName('visible');
});

window.addEventListener('click', e =>{
    if(emojiContainer.classList.contains('visible') && !e.target.classList.contains('emoji') && !e.target.classList.contains('emoji-button'))
    {
        emojiContainer.removeClassName('visible');
    }
});

emojiContainer.addEventListener('click', e =>{
    if(e.target.classList.contains('emoji'))
    {
        const emoji = e.target.firstElementChild;
        userInput.value += emoji.innerText;
    }
});

function appendUser(userName){
    const userContainer = document.querySelector('.user-container');
    userContainer.appendChild(createUser(userName));
    // createUser(userName);
}

function createUser(userName){
    return user = document.createElement('div').addClassName('user').appendChildren(
        document.createElement('span').addClassName('active-user'),
        document.createElement('span').addClassName('user-name').appendText(userName),
        document.createElement('span').appendChildren(
            document.createElement('span').addClassName('dot-1').appendText('.'),
            document.createElement('span').addClassName('dot-2').appendText('.'),
            document.createElement('span').addClassName('dot-3').appendText('.'),
            null
        )
    );
}

function removeUser(userName){
    // console.log(`Usuwam uzytkownika ${userName}`);
    findUser(userName).removeNode();
    
}

function getActiveUsers(){
    return document.querySelectorAll('.user');
}

function removeCurrentUsers(){
    const currentUsers = getActiveUsers();
    currentUsers.forEach(user => {
        user.removeNode();
    });
}

function userStartsToType(userName){
    findUser(userName).querySelector('span:last-of-type').addClassName('typing');
}

function userStopsTyping(userName){
    findUser(userName).querySelector('span:last-of-type').removeClassName('typing');
}

function findUser(userName){
    let userToFind;
    getActiveUsers().forEach(user => {
        if(user.querySelector('.user-name').innerHTML == userName)
            userToFind = user;
    });
    return userToFind;
}

function createNewMessage(userName, messageContent){
    return document.createElement('div').addClassName('msg').appendChildren(
        document.createElement('span').addClassName('user-name').appendText(`${userName} :`),
        document.createElement('div').addClassName('msg-content').appendText(messageContent)
    );
}

function appendNewMessage(message){
    document.querySelector('.msg-container').appendChild(message);
}

function appendMessages(messages){
    messages.forEach(msg => {
        appendNewMessage(createNewMessage(msg.messageAuthor, msg.messageContent));
    });
}

function appendMessageAlert(){
    if(!document.querySelector('.message-alert'))
        userInput.parentElement.insertBefore(
            createMessageAlert(),
            userInput
        );
}

function removeMessageAlert(){
    if(document.querySelector('.message-alert'))
        document.querySelector('.message-alert').removeNode();
}

function createMessageAlert(){
    const messageAlert = document.createElement('div').addClassName('message-alert').appendText('Kliknij tutaj aby przejrzeć nowe wiadomości');
    messageAlert.addEventListener('click', () => {
        scrollMessages(20, removeMessageAlert);
    });
    return messageAlert;
}

function getCurrentScrollOffset(){
    return messageContainer.scrollHeight - (messageContainer.scrollTop + messageContainer.clientHeight);
}

function scrollMessages(scrolingTime, callback){
    scrolingTime = scrolingTime ? scrolingTime : 1;
    let scrollOffset = getCurrentScrollOffset();
    const scrollChunk = scrollOffset / scrolingTime;

    let scrollInterval = setInterval(() => {
        messageContainer.scrollBy(
            0,
            scrollChunk
        );
        scrollOffset -= scrollChunk;
        if(getCurrentScrollOffset() == 0)
            clearInterval(scrollInterval);
    }, scrolingTime);

    if(callback)
        callback();
}

function getLastAuthorMessage(authorName){
    let authorMessages = [];
    document.querySelectorAll('.msg .user-name').forEach(userMsg => {
        if(userMsg.textContent.split(' ')[0] == authorName)
            authorMessages.push(userMsg.parentElement);
    });
    return authorMessages.length > 0 ?
        authorMessages[authorMessages.length - 1] :
        null;
}

function addMessageText(authorName, messageContent){
    getLastAuthorMessage(authorName).parentElement.querySelector('.msg-content').addText(`\n${messageContent}`);
}

HTMLElement.prototype.removeNode = function(){
    this.parentElement.removeChild(this);
}

HTMLElement.prototype.addClassName = function(className){
    if(!this.classList.contains(className))
        this.classList.add(className);
    return this;
};

HTMLElement.prototype.removeClassName = function(className){
    if(this.classList.contains(className))
        this.classList.remove(className);
}

HTMLElement.prototype.addClassNames = function(...classNames){
    classNames.forEach(className => {
        this.addClassName(className);
    });
    return this;
}

HTMLElement.prototype.toggleClassName = function(className){
    this.classList.contains(className) ?
        this.classList.remove(className) :
        this.classList.add(className);
}


HTMLElement.prototype.appendChildren = function(...children){
    children.forEach(child => {
        if(child != null)
            this.appendChild(child);
    });
    return this;
};

HTMLElement.prototype.appendText = function(textToAppend){
    this.innerHTML = textToAppend;
    return this;
};

HTMLElement.prototype.addText = function(textToAdd){
    console.log(this, this.innerHTML);
    this.innerHTML += textToAdd;
    // console.log(this, this.innerHTML);
    return this;
}

HTMLInputElement.prototype.clear = function(){
    this.value = '';
}

String.prototype.capitalizeFirstLetter = function(){
    return this.substring(0, 1).toUpperCase() + this.substring(1);
}