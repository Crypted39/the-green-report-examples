const express = require("express");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let user = {
  username: "", // Enter your username for testing
  password: "", // Enter your password for testing
  temp_secret: null, // Temporarily stores the TOTP secret for QR code generation
  otp_url: null, // URL for QR code
};

// Display the login page
app.get("/login", (req, res) => {
  res.render("login", { error: null }); // Ensure error is null on first load
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Basic username/password validation
  if (username === user.username && password === user.password) {
    // Generate TOTP secret if not already done
    if (!user.temp_secret) {
      const secret = speakeasy.generateSecret({ name: "TGR App" });
      user.temp_secret = secret.base32;
      user.otp_url = secret.otpauth_url;
    }

    // Generate QR code for the user to scan in their authenticator app
    qrcode.toDataURL(user.otp_url, (err, data_url) => {
      res.render("otp", { qrCodeDataURL: data_url, error: null });
    });
  } else {
    // Return to login page with an error message
    res.render("login", { error: "Invalid username or password" });
  }
});

// Handle OTP submission
app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  // Verify the OTP using the TOTP secret
  const isValid = speakeasy.totp.verify({
    secret: user.temp_secret,
    encoding: "base32",
    token: otp,
  });

  if (isValid) {
    // Render success page with a message and ID for testing
    res.render("success", { message: "Login successful!" });
  } else {
    // Generate the QR code again for the OTP page
    qrcode.toDataURL(user.otp_url, (err, data_url) => {
      res.render("otp", { qrCodeDataURL: data_url, error: "Invalid OTP" });
    });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
