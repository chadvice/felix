const express = require('express');
const router = express.Router();
const sylvesterService = require('./sylvester.service');

router.get('/felixtables', (req, res) => {
    sylvesterService.getFelixTables(req, res);
});
router.get('/felixtable/:tableName', (req, res) => {
    sylvesterService.getFelixTable(req, res);
});

router.get('/tables', (req, res) => {
    sylvesterService.getTables(req, res);
});
router.get('/table/:tableName', (req, res) => {
    sylvesterService.getTable(req, res);
});

module.exports=router;