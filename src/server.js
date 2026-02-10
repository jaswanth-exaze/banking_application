/**
 * HTTP server entry point.
 * Reads the runtime port and starts listening.
 */

const app = require("./app");


const PORT = process.env.PORT || 3000;

// Boot the API server.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
