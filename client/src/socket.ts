import { io } from "socket.io-client";

const { PROD, VITE_SERVER_URL, VITE_DEV_SERVER_URL } = import.meta.env;

const URL = PROD ? VITE_SERVER_URL : VITE_DEV_SERVER_URL;

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  extraHeaders: {
    "x-auth-token": "eughtea-iue"
  }
});
