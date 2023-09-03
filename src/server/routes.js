const express = require('express');
const router = express.Router();
const sylvesterService = require('./sylvester.service');

router.get('/tables', (req, res) => {
    sylvesterService.getTables(req, res);
});

router.get('/tables/:userID', (req, res) => {
    sylvesterService.getTablesForUserID(req, res);
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

router.delete('/document/:collection/:userID/:id', (req, res) => {
    sylvesterService.deleteDocument(req, res);
});

router.post('/bulkinsert', (req, res) => {
    sylvesterService.bulkInsert(req, res);
});

router.post('/bulkreplace', (req, res) => {
    sylvesterService.bulkReplace(req, res);
});

router.post('/bulkcreate', (req, res) => {
    sylvesterService.bulkCreate(req, res);
});

router.delete('/collection/:userID/:collectionName', (req, res) => {
    sylvesterService.deleteCollection(req, res);
});

/* #region  Users */
router.get('/users', (req, res) => {
    sylvesterService.getUsers(req, res);
});

router.get('/user/:userID', (req, res) => {
    sylvesterService.getUser(req, res);
});

router.put('/user/', (req, res) => {
    sylvesterService.updateUser(req, res);
});

router.delete('/user/:userID', (req, res) => {
    sylvesterService.deleteUser(req, res);
});
/* #endregion */

/* #region  Roles */
router.get('/roles', (req, res) => {
    sylvesterService.getRoles(req, res);
});

router.get('/roles/:userID', (req, res) => {
    sylvesterService.getRolesForUserID(req, res);
});

router.get('/role/:roleID', (req, res) => {
    sylvesterService.getRole(req, res);
});

router.put('/role/', (req, res) => {
    sylvesterService.updateRole(req, res);
});

router.delete('/role/:roleID', (req, res) => {
    sylvesterService.deleteRole(req, res);
});
/* #endregion */

/* #region  Audit Log */
router.get('/auditlogs', (req, res) => {
    sylvesterService.getAuditLogs(req, res);
});

router.get('/auditlog/:id', (req, res) => {
    sylvesterService.getAuditLog(req, res);
});
/* #endregion */

module.exports = router;