const bookerApi = require("./bookerApi");
const assert = require("assert");

const room = {
  roomName: "39",
  type: "Twin",
  accessible: "true",
  description: "Test Room",
  image: "https://www.mwtestconsultancy.co.uk/img/room1.jpg",
  roomPrice: "15",
  features: ["WiFi"],
};
let sessionCookie, roomId, bookedRoom;

const stepDefinitions = {
  Arrange: {
    "Ensure that a twin room has not been booked": async () => {
      const roomsResponse = await bookerApi.getAllRooms();
      const rooms = roomsResponse.data.rooms;
      for (let i = 0; i < rooms.length; i++) {
        assert.notStrictEqual(rooms[i].type, "Twin");
      }
    },
    "Ensure that a booked room exists": async () => {
      bookedRoom = await bookerApi.getRoom(roomId);
      assert.strictEqual(bookedRoom.data.roomName, room.roomName);
    },
  },
  Act: {
    "Try to book a twin room": async () => {
      sessionCookie = await bookerApi.getSessionCookie();
      bookedRoom = await bookerApi.bookRoom(room, sessionCookie);
      roomId = bookedRoom.data.roomid;
    },
    "Try to remove the booked room": async () => {
      await bookerApi.removeRoom(bookedRoom.data.roomid, sessionCookie);
    },
  },
  Assert: {
    "Verify that the room was booked successfully": async () => {
      bookedRoom = await bookerApi.getRoom(roomId);
      assert.strictEqual(bookedRoom.data.type, "Twin");
    },
    "Verify that the booked room has been removed": async () => {
      const remainingRooms = await bookerApi.getAllRooms();
      for (let i = 0; i < remainingRooms.data.rooms.length; i++) {
        assert.notStrictEqual(
          remainingRooms.data.rooms[i].roomid,
          bookedRoom.data.roomid
        );
      }
    },
  },
};

module.exports = stepDefinitions;
