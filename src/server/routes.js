const express = require('express');
const router = express.Router();
const sylvesterService = require('./sylvester.service');

router.get('/tables', (req, res) => {
    sylvesterService.getTables(req, res);
});

router.get('/tablenames', (req, res) => {
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

router.post('/bulkinsert', (req, res) => {
    sylvesterService.bulkInsert(req, res);
})

router.post('/bulkreplace', (req, res) => {
    sylvesterService.bulkReplace(req, res);
})

router.post('/bulkcreate', (req, res) => {
    sylvesterService.bulkCreate(req, res);
})

module.exports=router;