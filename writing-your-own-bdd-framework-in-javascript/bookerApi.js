const axios = require("axios");

const apiBaseUrl = "https://automationintesting.online";
const adminUser = { username: "admin", password: "password" };

async function makeRequest(url, method, body, headers = {}) {
  try {
    const response = await axios({
      url: `${apiBaseUrl}${url}`,
      method,
      data: body,
      headers,
    });
    return {
      statusCode: response.status,
      data: response.data,
      cookie: response.headers["set-cookie"],
    };
  } catch (error) {
    return {
      statusCode: error.response.status,
      data: error.response.data.error,
    };
  }
}

async function getRoom(roomId) {
  return makeRequest(`/room/${roomId}`, "get");
}

async function getAllRooms() {
  return makeRequest(`/room/`, "get");
}

async function removeRoom(roomId, cookie) {
  const headers = {
    "Content-Type": "application/json",
    Cookie: `banner=true; ${cookie}`,
  };
  return makeRequest(`/room/${roomId}`, "delete", null, headers);
}

async function bookRoom(body, cookie) {
  const headers = {
    "Content-Type": "application/json",
    Cookie: `banner=true; ${cookie}`,
  };
  return makeRequest("/room/", "post", body, headers);
}

async function authenticateUser(body) {
  return makeRequest("/auth/login", "post", body, {
    "Content-Type": "application/json",
  });
}

async function getSessionCookie() {
  const userData = await authenticateUser(adminUser);
  return userData.cookie[0].split(";")[0];
}

module.exports = {
  getRoom,
  getAllRooms,
  removeRoom,
  authenticateUser,
  bookRoom,
  getSessionCookie,
};
