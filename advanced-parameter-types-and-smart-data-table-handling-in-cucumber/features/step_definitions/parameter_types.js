const { defineParameterType } = require("@cucumber/cucumber");
const Email = require("../../src/models/Email");
const UserRole = require("../../src/models/UserRole");

// Custom parameter type for email addresses
defineParameterType({
  name: "email",
  regexp: /[^\s@]+@[^\s@]+\.[^\s@]+/,
  transformer: (emailString) => {
    return new Email(emailString);
  },
});

// Custom parameter type for user roles
defineParameterType({
  name: "user_role",
  regexp: /admin|user|guest|moderator/,
  transformer: (roleString) => {
    return new UserRole(roleString);
  },
});

// Custom parameter type for money amounts
defineParameterType({
  name: "money",
  regexp: /\$?(\d+(?:\.\d{2})?)/,
  transformer: (amountString) => {
    // Remove $ if present and convert to cents
    const amount = parseFloat(amountString.replace("$", ""));
    return {
      amount: amount,
      cents: Math.round(amount * 100),
      currency: "USD",
      toString: () => `$${amount.toFixed(2)}`,
    };
  },
});

// Custom parameter type for dates
defineParameterType({
  name: "date",
  regexp:
    /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|today|tomorrow|yesterday)/,
  transformer: (dateString) => {
    let date;

    switch (dateString.toLowerCase()) {
      case "today":
        date = new Date();
        break;
      case "tomorrow":
        date = new Date();
        date.setDate(date.getDate() + 1);
        break;
      case "yesterday":
        date = new Date();
        date.setDate(date.getDate() - 1);
        break;
      default:
        date = new Date(dateString);
    }

    return {
      value: date,
      format: (formatString = "YYYY-MM-DD") => {
        // Simple date formatting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      },
      isWeekend: () => {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      },
    };
  },
});
