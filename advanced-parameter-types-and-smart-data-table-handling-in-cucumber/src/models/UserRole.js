class UserRole {
  static VALID_ROLES = ["admin", "user", "guest", "moderator"];

  constructor(roleString) {
    if (!UserRole.VALID_ROLES.includes(roleString.toLowerCase())) {
      throw new Error(
        `Invalid role: ${roleString}. Valid roles: ${UserRole.VALID_ROLES.join(
          ", "
        )}`
      );
    }
    this.value = roleString.toLowerCase();
  }

  isAdmin() {
    return this.value === "admin";
  }

  canModerate() {
    return ["admin", "moderator"].includes(this.value);
  }

  toString() {
    return this.value;
  }
}

module.exports = UserRole;
