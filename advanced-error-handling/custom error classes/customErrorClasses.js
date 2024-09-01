class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class DatabaseError extends Error {
  constructor(message, query) {
    super(message);
    this.name = "DatabaseError";
    this.query = query;
  }
}

// Usage example
try {
  throw new ValidationError("Invalid input", "email");
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Error: ${error.message} in field: ${error.field}`);
  }
}
