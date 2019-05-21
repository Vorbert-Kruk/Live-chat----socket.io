module.exports = class Users {
    constructor() {
        this.list = new Array();
    }
    addUser(user) {
        this.list.push(user);
    }
    removeUser(user) {
        if(this.list.includes(user))
            this.list.splice(this.list.indexOf(user), 1);
    }
    removeUserByName(userName) {
        let userIndex = -1;
        this.list.forEach((user, uIndex) => {
            if(user.name == userName)
                userIndex = uIndex
        });
        if(userIndex != -1)
            this.list.splice(userIndex, 1);
    }
    get count(){
        return this.list.length;
    }
    getUserByName(userName){
        let wantedUser;
        this.list.forEach(user => {
            if(user.name == userName)
                wantedUser = user;
        });
        return wantedUser;
    }
}