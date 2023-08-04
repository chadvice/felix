const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');
const routes = require('./routes');
const cors = require('cors');

const port = process.env.PORT || '3000';
const rootPath = path.resolve(__dirname, '../../dist');

// Ping JWT Authentication Stuff
// const eJwt = require('express-jwt');
var { expressjwt: eJwt } = require("express-jwt");
const jwks = require('jwks-rsa');
const jwtCheck = eJwt({
  secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://auth.pingone.com/2e6fb850-41fc-4f87-9fbe-18fe1447439c/as/jwks'
  }),
  // audience: 'https://agon-apollo.herokuapp.com/api',
  // issuer: 'https://agon.us.auth0.com/',
  algorithms: ['RS256']
});

const app = express();

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

// Redirect production requests to SSL site (taken from https://jaketrent.com/post/https-redirect-node-heroku/)
if(process.env.NODE_ENV === 'production') {
  app.use()
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https')
        res.redirect(`https://${req.header('host')}${req.url}`)
      else
        next()
    })
}

app.use(cors(corsOptions));

app.use(express.static(`${rootPath}/sylvester`));

// app.use('/api', routes, (err, req, res, next) => {
app.use('/api', jwtCheck, routes, (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({
      success: false,
      message: 'No token provided.'
    });
  }
});

app.get('/*', (req, res) => {
  res.sendFile(`${rootPath}/sylvester/index.html`);
});

app.listen(port, () => console.log(`API running on localhost:${port}`));