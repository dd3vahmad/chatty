export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
}

export enum SocketEvents {
  JOIN_ROOM = 'room:join',
  LEAVE_ROOM = 'room:leave',
  SEND_MESSAGE = 'message:send',
  RECEIVE_MESSAGE = 'message:receive',
  USER_JOIN = 'user:join',
  USER_LEAVE = 'user:leave'
}
