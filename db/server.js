const express = require('express');
const db = require('./database.js');
const QA = require('./router.js')

const app = express();

app.use(express.json());

app.use('/qa', QA);


let port = 3001;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});