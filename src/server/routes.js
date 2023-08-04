const express = require('express');
const router = express.Router();
const sylvesterService = require('./sylvester.service');

router.get('/tables', (req, res) => {
    sylvesterService.getTables(req, res);
});
router.get('/table/:tableName', (req, res) => {
    sylvesterService.getTable(req, res);
});

module.exports=router;