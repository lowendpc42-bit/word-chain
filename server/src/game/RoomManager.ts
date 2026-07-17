import { Room } from './Room';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(): Room {
    const code = this.generateRoomCode();
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  removeRoom(code: string) {
    this.rooms.delete(code.toUpperCase());
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, 1, I
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  cleanUpEmptyRooms() {
    for (const [code, room] of this.rooms.entries()) {
      const activePlayers = room.players.filter(p => p.connected).length;
      if (activePlayers === 0) {
        // Simple logic: if 0 connected players, we can delete the room immediately or after a delay.
        // For MVP, we'll remove it.
        room.clearTurnTimer();
        this.rooms.delete(code);
      }
    }
  }
}
