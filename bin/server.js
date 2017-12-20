// Start the ShipEngineBot
require("../");

// Start an HTTP server to satisfy Heroku
const express = require("express");
const PORT = process.env.PORT || 5000;

let app = express();

// Redirect all requests to the website
app.use((req, res) => res.send(`
  <html>
    <head>
      <meta http-equiv="refresh" content="0; url=http://bigstickcarpet.com/ship-engine-bot/">
    </head>
    <body>
      <script>
        window.location = 'http://bigstickcarpet.com/ship-engine-bot/';
      </script>
    </body>
  </html>
`));

app.listen(PORT, () => console.log(`HTTP server is listening on ${PORT}`));

