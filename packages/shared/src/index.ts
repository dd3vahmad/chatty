export interface IPublicMessage {
  id?: string;
  text: string;
  media?: ImageData;
  sender: string;
  timestamp: Date;
}

export interface IPublicChat {
  id: number;
  name: string;
  pic: string;
  lastMessage: string;
  lastMessageStatus: string;
  isOnline: boolean;
  time: Date | string;
}

export interface IPublicUser {
  id: string;
  username: string;
}

export enum SocketEvents {
  CONNECT = "connect",
  CONNECTION = "connection",
  DISCONNECT = "disconnect",
  ERROR = "error",
  RECONNECT = "reconnect",
  JOIN_ROOM = "room:join",
  LEAVE_ROOM = "room:leave",
  SEND_MESSAGE = "message:send",
  NEW_MESSAGE = "message:new",
  RECEIVE_MESSAGE = "message:receive",
  DELETE_MESSAGE = "message:delete",
  USER_JOIN = "user:join",
  USER_ONLINE = "user:online",
  USER_TYPING = "user:typing",
  USER_IDLE = "user:idle",
  USER_OFFLINE = "user:offline",
  USER_LEAVE = "user:leave",
}
