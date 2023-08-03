const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');

const port = process.env.PORT || '3000';
const rootPath = path.resolve(__dirname, '../../dist');

const app = express();

// Redirect production requests to SSL site (taken from https://jaketrent.com/post/https-redirect-node-heroku/)
if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https')
        res.redirect(`https://${req.header('host')}${req.url}`)
      else
        next()
    })
}  

app.use(express.static(`${rootPath}/sylvester`));
app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname + '/dist/index.html'));
  res.sendFile(`${rootPath}/sylvester/index.html`);
});

// app.listen(process.env.PORT || 4200);
app.listen(port, () => console.log(`API running on localhost:${port}`));