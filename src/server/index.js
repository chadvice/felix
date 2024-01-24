const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');
const routes = require('./routes');
const cors = require('cors');
const bodyParser = require('body-parser');
const sylvesterService = require('./sylvester.service');

const port = process.env.PORT || '3030';
const rootPath = path.resolve(__dirname, '../../dist');

// CXOne API Call Authentication
const cxoneApiKey = process.env.FELIX_CXONE_API_KEY;
const verifyCXOneApiKey = (req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (apiKey === cxoneApiKey) {
    next();
  } else {
    if (process.env.CXONE_API_LOGGING === 'on') {
      console.log('[felix] CXone API request failed due to invalid or mising API key');
    }
    res.status(401).json({message: 'Missing Authentication Token'})
  }
}

// Ping JWT Authentication Stuff
let jwksUri = '';
if(process.env.NODE_ENV === 'production') {
  jwksUri = 'https://ssodev.nelnet.com/pf/JWKS';
} else {
  jwksUri = 'https://auth.pingone.com/2e6fb850-41fc-4f87-9fbe-18fe1447439c/as/jwks';
}
var { expressjwt: eJwt } = require("express-jwt");
const jwks = require('jwks-rsa');
const jwtCheck = eJwt({
  secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: jwksUri
  }),
  algorithms: ['RS256']
});

const app = express();

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(`${rootPath}/sylvester`));

// CXOne Table Query
app.get('/api/cx/:tableName/:fieldName/:key', verifyCXOneApiKey, (req, res) => {
  sylvesterService.getRecordFromTable(req, res);
})

app.use('/api', jwtCheck, routes, (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({
      success: false,
      message: err.message
    });
  }
});

app.get('/*', (req, res) => {
  res.sendFile(`${rootPath}/sylvester/index.html`);
});

app.listen(port, () => console.log(`[felix] API running on localhost:${port}`));