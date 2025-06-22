class Email {
  constructor(emailString) {
    if (!this.isValid(emailString)) {
      throw new Error(`Invalid email format: ${emailString}`);
    }
    this.value = emailString;
    this.domain = emailString.split("@")[1];
    this.localPart = emailString.split("@")[0];
  }

  isValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString() {
    return this.value;
  }
}

module.exports = Email;
