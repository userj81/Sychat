import { Socket } from "phoenix";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  if (socket) socket.disconnect();
  
  socket = new Socket("http://localhost:4000/socket", {
    params: { token, tenant_id: localStorage.getItem("tenant_id") }
  });
  
  socket.connect();
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
