const crypto = require("crypto");

// Generate a random token for invitation links
const generateToken = (length = 32) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex") // convert to hexadecimal
    .slice(0, length); // trim to desired length
};

module.exports = {
  generateToken,
};
