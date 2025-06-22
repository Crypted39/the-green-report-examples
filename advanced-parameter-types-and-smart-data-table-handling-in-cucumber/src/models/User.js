class User {
  constructor({ email, role, name = null }) {
    this.email = email;
    this.role = role;
    this.name = name;
    this.id = Math.random().toString(36).substr(2, 9);
    this.createdAt = new Date();
  }

  getDisplayName() {
    return this.name || this.email.localPart;
  }

  hasPermission(permission) {
    const permissions = {
      admin: ["read", "write", "delete", "manage_users"],
      moderator: ["read", "write", "moderate"],
      user: ["read", "write"],
      guest: ["read"],
    };

    return permissions[this.role.value]?.includes(permission) || false;
  }
}

module.exports = User;
