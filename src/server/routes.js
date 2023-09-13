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

router.post('/table', (req, res) => {
    sylvesterService.createTable(req, res);
});

router.put('/table', (req, res) => {
    sylvesterService.updateTableSchema(req, res);
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

router.delete('/document/:table/:userID/:id', (req, res) => {
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

router.delete('/table/:userID/:tableName', (req, res) => {
    sylvesterService.deleteTable(req, res);
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

router.delete('/user/:userID/:id', (req, res) => {
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

router.delete('/role/:userID/:roleID', (req, res) => {
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