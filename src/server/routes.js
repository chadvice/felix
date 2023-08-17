const express = require('express');
const router = express.Router();
const sylvesterService = require('./sylvester.service');

router.get('/tables', (req, res) => {
    sylvesterService.getTableNames(req, res);
});

router.put('/collection', (req, res) => {
    sylvesterService.updateCollection(req, res);
});

router.get('/table/:tableName', (req, res) => {
    sylvesterService.getTable(req, res);
});

router.put('/document', (req, res) => {
    sylvesterService.updateDocument(req, res);
});

router.post('/document', (req, res) => {
    sylvesterService.insertDocument(req, res);
});

router.delete('/document/:collection/:id', (req, res) => {
    sylvesterService.deleteDocument(req, res);
});

module.exports=router;