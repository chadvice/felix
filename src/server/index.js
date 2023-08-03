const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');

const port = process.env.PORT || '3000';
const rootPath = path.resolve(__dirname, '../../dist');

const app = express();

// app.use(express.static(__dirname + '/dist'));
app.use(express.static(`${rootPath}/sylvester`));
app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname + '/dist/index.html'));
  res.sendFile(`${rootPath}/sylvester/index.html`);
});

// app.listen(process.env.PORT || 4200);
app.listen(port, () => console.log(`API running on localhost:${port}`));