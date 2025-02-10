export class ChatRoom {
  constructor() {
    this.roomName = "RRV_CHAT_ROOM";
    this.users = [];
  }
  userExist(id) {
    return this.users.find(user => user.id === id);
  }
  addUser(socketId, userId, name) {
    const newUser = { id: socketId, userId, name, room: this.roomName };
    if (this.userExist(socketId)) return this.userExist(socketId);
    this.users.push(newUser);
    return newUser;
  }
  removeUser(id) {
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex !== -1) return this.users.splice(userIndex, 1)[0];
    return null;
  }
  getRoomUsers() {
    return this.users;
  }
}
