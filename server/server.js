const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
