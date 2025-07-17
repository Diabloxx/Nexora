import { Server as SocketServer } from 'socket.io';

class SocketManager {
  private static instance: SocketManager;
  private io: SocketServer | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public setIO(io: SocketServer): void {
    this.io = io;
  }

  public getIO(): SocketServer | null {
    return this.io;
  }

  public emitToChannel(channelId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit(event, data);
    }
  }

  public emitToServer(serverId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`server:${serverId}`).emit(event, data);
    }
  }

  public emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }
}

export default SocketManager.getInstance();
