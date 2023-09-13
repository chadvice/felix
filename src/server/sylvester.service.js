const mongo = require('./mongo');
const { ObjectId } = require('mongodb');
mongo.connect();

async function getTables(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Collections');

    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
}

async function getTablesForUserID(req, res) {
    const userID = req.params.userID;
    const db = mongo.getDB();
    const collection = db.collection('Users');

    const pipeline = [
        {
            $match: {
                userID: userID
            }
        },
        {
            $lookup: {
                from: 'Roles',
                localField: 'roleIDs',
                foreignField: '_id',
                as: 'roles'
            }
        },
        {
            $lookup: {
                from: 'Collections',
                localField: 'roles.tablePermissions.tableID',
                foreignField: '_id',
                as: 'tablePermissions'
            }
        },
        {
            $project: {
                '_id': 0,
                'tablePermissions': 1
            }
        }
    ];

    try {
        const resp = await collection.aggregate(pipeline).toArray();
        res.status(200).json(resp[0].tablePermissions);
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function getTableNames(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Collections');

    const options = {
        projection: { _id: 0, 'name': 1 }
    };

    const resp = await collection.find({}, options).toArray();

    res.status(200).json(resp.map(r => r.name));
}

async function createTable(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
    const collection = db.collection('Collections');
    const userID = req.body.userID;
    const tableName = req.body.table.name;

    try {
        await collection.insertOne(req.body.table);

        const auditLogMessage = `Created table ${tableName}.`;
        const auditLogDescription = `Added the ${tableName} table to the database.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'OK' });

    } catch (err) {
        const auditLogMessage = `Error creating new table ${tableName}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function updateTableSchema(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
    const collection = db.collection('Collections');
    const session = client.startSession();

    const userID = req.body.userID;
    const collectionName = req.body.collectionName;
    const newDescription = req.body.newDescription;
    const fieldChanges = req.body.fieldChanges;

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    let status = 'OK';
    let statusMessage = '';
    let logMessage = '';
    try {
        const transactionResults = await session.withTransaction(async () => {
            // Change the description, if requested
            if (newDescription?.length > 0) {
                statusMessage = `Description changed to ${newDescription}.  `;
                logMessage = `Description changed to ${newDescription}.  `;
                await collection.updateOne({ name: collectionName }, { $set: { "description": newDescription } }, { session: session });
            }

            // Apply any field changes requested
            let fieldDeleteCount = 0;
            let fieldChangeCount = 0;
            let fieldAddCount = 0;

            if (fieldChanges?.length > 0) {
                const dataCollection = db.collection(collectionName);
                let resp;

                for (let n = 0; n < fieldChanges.length; n++) {
                    const oldName = fieldChanges[n].oldName;
                    const newName = fieldChanges[n].newName;
                    const removed = fieldChanges[n].removed;
                    const added = fieldChanges[n].added;

                    if (oldName && removed) {
                        await dataCollection.updateMany({}, { $unset: { [oldName]: '' } }, { session: session });
                        resp = await collection.updateOne({ 'name': collectionName }, { $pull: { fields: { name: oldName } } }, { session: session });
                        if (resp?.modifiedCount > 0) {
                            logMessage += `Removed field ${oldName}. `;
                            fieldDeleteCount++;
                        }
                    } else if (oldName && newName) {
                        await dataCollection.updateMany({}, { $rename: { [oldName]: newName } }, { session: session });
                        resp = await collection.updateOne({ 'name': collectionName, 'fields.name': oldName }, { $set: { "fields.$.name": newName } }, { session: session });
                        if (resp?.modifiedCount > 0) {
                            logMessage += `Renamed field ${oldName} to ${newName}. `;
                            fieldChangeCount++;
                        }
                    } else if (newName && added) {
                        // Check to see if the field exists before we add it
                        resp = await collection.count({ $and: [{ 'name': collectionName }, { 'fields': { $elemMatch: { 'name': newName } } }] });
                        if (resp === 0) {
                            resp = await collection.updateOne({ 'name': collectionName }, { $push: { 'fields': { 'name': newName, 'type': 'string' } } }, { session: session });
                            if (resp?.modifiedCount > 0) {
                                logMessage += `Added field ${newName}. `;
                                fieldAddCount++;
                            }
                        }
                    }
                }
            }

            if (fieldAddCount > 0 || fieldChangeCount > 0 || fieldDeleteCount > 0) {
                statusMessage += `${fieldAddCount} field(s) added, ${fieldChangeCount} field(s) changed, ${fieldDeleteCount} field(s) removed.`
            } else {
                if (statusMessage === '') {
                    statusMessage = 'No changes made.';
                } else {
                    statusMessage += 'No field changes.';
                }
            }
        }, transactionOptions);
    } catch (err) {
        status = 'ERROR';
        statusMessage = err.message;
    } finally {
        let auditLogMessage;
        if (status === 'OK') {
            if (logMessage.length > 0) {
                auditLogMessage = `Updated table ${collectionName} structure`;
                auditLogDescription = logMessage;
            }
        } else {
            auditLogMessage = `Error attmpting to update table ${collectionName}`;
            auditLogDescription = `Error message: ${err.message}`;
        }

        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: status, message: statusMessage });
    }
}

async function getTable(req, res) {
    const tableName = req.params.tableName;
    const db = mongo.getDB();

    const colsCollection = db.collection('Collections');
    const query = { 'name': tableName };
    const options = {
        projection: { _id: 0, 'description': 1, 'fields': 1 }
    };
    const cols = await colsCollection.findOne(query, options);

    const rowsCollection = db.collection(tableName);
    const rows = await rowsCollection.find({}).toArray();

    const resp = {
        description: cols.description,
        columns: cols.fields,
        rows: rows
    }

    res.status(200).json(resp);
}

async function updateDocument(req, res) {
    try {
        const db = mongo.getDB();
        const userID = req.body.userID;
        const collectionName = req.body.collection;
        const document = req.body.document;
        const collection = db.collection(collectionName);
        const query = { _id: new ObjectId(req.body.document._id) };
        delete document._id;

        const oldDoc = await collection.findOne(query);
        await collection.replaceOne(query, document);
        const auditLogMessage = `Changed record in table ${collectionName}.`;
        const auditLogDescription = `A record was updated in the ${collectionName} table.`

        if (oldDoc) {
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldDoc, document);
        } else {
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);
        }

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error updating record in table ${collectionName}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function insertDocument(req, res) {
    const userID = req.body.userID;
    const collectionName = req.body.collection;
    const document = req.body.document;
    try {
        const db = mongo.getDB();
        const collection = db.collection(collectionName);

        const resp = await collection.insertOne(document);
        const auditLogMessage = `Added record to table ${collectionName}.`;
        const auditLogDescription = `A new record was added to the ${collectionName} table.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error adding record to table ${collectionName}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function deleteDocument(req, res) {
    const userID = req.params.userID;
    const collectionName = req.params.collection;
    const id = req.params.id;
    try {
        const db = mongo.getDB();
        const collection = db.collection(collectionName);
        const query = { _id: new ObjectId(id) };

        const oldDoc = await collection.findOne(query);
        const resp = await collection.deleteOne(query);
        const auditLogMessage = `Deleted record from the table ${collectionName}.`;
        const auditLogDescription = `A record was deleted from the ${collectionName} table.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldDoc);

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error deleting record ${id} from table ${collectionName}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function bulkInsert(req, res) {
    const userID = req.body.userID;
    const collectionName = req.body.collectionName;
    const documents = req.body.documents;
    try {
        const db = mongo.getDB();
        const collection = db.collection(collectionName);

        let bulkOperations = [];
        for (let n = 0; n < documents.length; n++) {
            bulkOperations.push({ "insertOne": { "document": documents[n] } });
        }

        const resp = await collection.bulkWrite(bulkOperations);
        const message = `${resp.insertedCount} records were inserted into the ${collectionName} table.`;
        const auditLogMessage = `Records inserted into the table ${collectionName}.`;
        await writeToAuditLog(userID, auditLogMessage, message);

        res.status(200).json({ status: 'OK', message: message });
    } catch (err) {
        const auditLogMessage = `Error inserting records into table ${collectionName}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function bulkReplace(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
    const userID = req.body.userID;
    const collectionName = req.body.collectionName;
    const documents = req.body.documents;
    const collection = db.collection(collectionName);
    const session = client.startSession();

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    let status = 'OK';
    let statusMessage = '';
    let auditLogMessage = '';
    try {
        const transactionResults = await session.withTransaction(async () => {
            await collection.deleteMany({}, { session: session });

            let bulkOperations = [];
            for (let n = 0; n < documents.length; n++) {
                bulkOperations.push({ "insertOne": { "document": documents[n] } });
            }

            const resp = await collection.bulkWrite(bulkOperations);
            auditLogMessage = `All records in the table ${collectionName} replaced.`;
            statusMessage = `All of the records in the ${collectionName} table were replaced with ${resp.insertedCount} new records.`
        }, transactionOptions);
    } catch (err) {
        status = 'ERROR';
        statusMessage = err.message;
        auditLogMessage = `Error inserting records into table ${collectionName}.`;
    } finally {
        await writeToAuditLog(userID, auditLogMessage, statusMessage);
        res.status(200).json({ status: status, message: statusMessage });
    }
}

async function bulkCreate(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
    const userID = req.body.userID;
    const collectionName = req.body.collectionName;
    const description = req.body.description;
    const documents = req.body.documents;
    const fields = req.body.fields;
    const collection = db.collection('Collections');
    const session = client.startSession();

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    let status = 'OK';
    let statusMessage = '';
    let auditLogMessage = '';
    try {
        const transactionResults = await session.withTransaction(async () => {
            const now = new Date();
            const doc = {
                created: now.toISOString(),
                name: collectionName,
                description: description,
                fields: fields
            }

            await collection.insertOne(doc, { session: session });

            let bulkOperations = [];
            for (let n = 0; n < documents.length; n++) {
                bulkOperations.push({ "insertOne": { "document": documents[n] } });
            }

            const dataCollection = db.collection(collectionName);
            const resp = await dataCollection.bulkWrite(bulkOperations);
            auditLogMessage = `New table ${collectionName} created.`;
            statusMessage = `New table ${collectionName} created with ${resp.insertedCount} records.`
        }, transactionOptions);
    } catch (err) {
        status = 'ERROR';
        statusMessage = err.message;
        auditLogMessage = `Error creating / adding data to new table ${collectionName}.`;
    } finally {
        await writeToAuditLog(userID, auditLogMessage, statusMessage);
        res.status(200).json({ status: status, message: statusMessage });
    }
}

async function deleteTable(req, res) {
    const userID = req.params.userID;
    const collectionName = req.params.collectionName;
    try {
        const db = mongo.getDB();
        const collection = db.collection('Collections');

        const oldDoc = await collection.findOne({ name: collectionName });
        if (oldDoc) {
            rolesCollection = db.collection('Roles');
            await rolesCollection.updateMany({}, {$pull: {tablePermissions: {tableID: new ObjectId(oldDoc._id)}}});
        }
        await collection.findOneAndDelete({ name: collectionName });

        const collections = await db.listCollections({}, { nameOnly: true }).toArray();
        if (collections.findIndex(coll => coll.name === collectionName) !== -1) {
            const dataCollection = db.collection(collectionName);
            await dataCollection.drop();
        }


        const auditLogMessage = `Deleted table ${collectionName}.`;
        const auditLogDescription = `The ${collectionName} table was deleted from the database.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error attmpting to delete table ${collectionName}.`;
        const auditLogDescription = `Error message: ${err.message}`;
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

/* #region  Users */
async function getUsers(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Users');

    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
}

async function getUser(req, res) {
    const db = mongo.getDB();
    const userID = req.params.userID;
    const colsCollection = db.collection('Users');

    const resp = await colsCollection.findOne({ 'userID': userID });

    res.status(200).json(resp);
}

async function updateUser(req, res) {
    const db = mongo.getDB();
    const document = req.body.document;
    const userID = req.body.userID;
    const collection = db.collection('Users');

    try {

        for (let n = 0; n < document.roleIDs.length; n++) {
            document.roleIDs[n] = new ObjectId(document.roleIDs[n]);
        }

        const oldDoc = await collection.findOne({userID: document.userID});
        await collection.findOneAndReplace({ userID: document.userID }, document, { upsert: true });
        
        const newRoleNames = await getRoleNamesForIDs(db, document.roleIDs);
        delete document.roleIDs;
        document.roles = newRoleNames;

        let auditLogMessage = '';
        let auditLogDescription = '';
        if (oldDoc) {
            const oldRoleNames = await getRoleNamesForIDs(db, oldDoc.roleIDs);
            delete oldDoc.roleIDs;
            oldDoc.roles = oldRoleNames;

            auditLogMessage = `Updated user ID ${document.userID}.`;
            auditLogDescription = `The settings for user ID ${document.userID} were changed.  See old & new records for details.`
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldDoc, document);
        } else {
            auditLogMessage = `Added new user ID ${document.userID}.`;
            auditLogDescription = `A new user record was created for user ID ${document.userID}.`
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);
        }

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error adding or updating user ID ${document.userID}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function getRoleNamesForIDs(db, roleIDs) {
    const collection = db.collection('Roles');
    let ids = [];
    for (let n = 0; n < roleIDs.length; n++) {
        ids.push(new ObjectId(roleIDs[n]));
    }
    try {
        const resp = await collection.find({_id: {$in: ids}}).project({_id: 0, name: 1}).toArray();
        const idNames = resp.reduce((res, role) => res.concat(role.name), []);
        return idNames;
    } catch(err) {
        return [];
    }
}

async function deleteUser(req, res) {
    try {
        const db = mongo.getDB();
        const userID = req.params.userID;
        const id = req.params.id;
        const collection = db.collection('Users');

        const oldDoc = await collection.findOne({ userID: id });
        await collection.findOneAndDelete({ userID: id });

        const oldRoleNames = await getRoleNamesForIDs(db, oldDoc.roleIDs);
        delete oldDoc.roleIDs;
        oldDoc.roles = oldRoleNames;

        const auditLogMessage = `Deleted user ID ${id}.`;
        const auditLogDescription = `The user with ID ${id} was deleted.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldDoc);

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error deleting user ID ${id}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}
/* #endregion */

/* #region  Roles */
async function getRoles(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Roles');

    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
}

async function getRolesForUserID(req, res) {
    const userID = req.params.userID;
    const db = mongo.getDB();
    const collection = db.collection('Users');

    const pipeline =
        [
            {
                $match: {
                    'userID': userID
                }
            },
            {
                $lookup: {
                    from: 'Roles',
                    localField: 'roleIDs',
                    foreignField: '_id',
                    as: 'roles'
                }
            },
            {
                $project: {
                    '_id': 0,
                    'roles.name': 1,
                    'roles.tablePermissions': 1
                }
            }
        ];

    try {
        const resp = await collection.aggregate(pipeline).toArray();
        res.status(200).json(resp[0].roles);
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function getRole(req, res) {
    const db = mongo.getDB();
    const roleID = req.params.roleID;
    const colsCollection = db.collection('Roles');

    const resp = await colsCollection.findOne({ '_id': new ObjectId(roleID) });

    res.status(200).json(resp);
}

async function updateRole(req, res) {
    try {
        const db = mongo.getDB();
        const userID = req.body.userID;
        const document = req.body.document;
        const documentID = document._id;
        delete document._id;
        const collection = db.collection('Roles');

        for (let n = 0; n < document.tablePermissions.length; n++) {
            document.tablePermissions[n].tableID = new ObjectId(document.tablePermissions[n].tableID);
        }

        newRoleDoc = await extractTablesForRole(db, document);

        if (documentID) {
            const oldDoc = await collection.findOne({_id: new ObjectId(documentID)});
            delete oldDoc._id;
            await collection.findOneAndReplace({ _id: new ObjectId(documentID) }, document, { upsert: true });

            oldRoleDoc = await extractTablesForRole(db, oldDoc);

            auditLogMessage = `Updated role ${document.name}.`;
            auditLogDescription = `The role record ${document.name} was updated.  See old & new records for details.`
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldRoleDoc, newRoleDoc);
        } else {
            await collection.insertOne(document);

            auditLogMessage = `Added new role ${document.name}.`;
            auditLogDescription = `A new role record was created with the name ${document.name}.`
            await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, newRoleDoc);
        }

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function extractTablesForRole(db, role) {
    let roleDoc = {
        name: role.name,
        description: role.description
    }

    const collection = db.collection('Collections');
    const tables = await collection.find({}).toArray();

    for (let n = 0; n < role.tablePermissions.length; n++) {
        tableIndex = tables.findIndex(table =>  table._id.equals(role.tablePermissions[n].tableID));
        if (tableIndex !== -1) {
            roleDoc[tables[tableIndex].name] = role.tablePermissions[n].canEdit ? 'Edit' : 'View';
        }
    }

    return roleDoc;
}

async function deleteRole(req, res) {
    try {
        const db = mongo.getDB();
        const userID = req.params.userID;
        const roleID = req.params.roleID;
        const collection = db.collection('Roles');

        const oldDoc = await collection.findOne({ _id: new ObjectId(roleID) });
        oldRoleDoc = await extractTablesForRole(db, oldDoc);
        await collection.findOneAndDelete({ _id: new ObjectId(roleID) });

        const auditLogMessage = `Deleted role ${oldDoc.name}.`;
        const auditLogDescription = `The ${oldDoc.name} role was deleted.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, oldRoleDoc);
        res.status(200).json({ status: 'OK' });
    } catch (err) {
        const auditLogMessage = `Error deleting role ID ${roleID}.`;
        const auditLogDescription = `Error message: ${err.message}.`
        await writeToAuditLog(userID, auditLogMessage, auditLogDescription, null, document);

        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}
/* #endregion */

/* #region  Audit Log */
async function writeToAuditLog(userID, logMessage, logDescription, oldData, newData) {
    try {
        const db = mongo.getDB();
        const userCollection = db.collection('Users');
        const auditLogCollection = db.collection('AuditLog');

        const user = await userCollection.findOne({ userID: userID });
        let firstName = '';
        let lastName = '';
        if (user) {
            firstName = user.firstName
            lastName = user.lastName;
        }

        const document = {
            timeStamp: new Date(),
            userID: userID,
            firstName: firstName,
            lastName: lastName,
            message: logMessage,
            description: logDescription
        }

        if (oldData) {
            document.oldData = oldData;
        }

        if (newData) {
            document.newData = newData;
        }

        await auditLogCollection.insertOne(document);
    } catch (err) {
        console.log(`Error writing to AuditLog for user ${userID}: ${err.message}`);
    }
}

async function getAuditLogs(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('AuditLog');
    const projection = {
        userID: 1,
        timeStamp: 1,
        firstName: 1,
        lastName: 1,
        message: 1
    }

    const resp = await collection.find({}).project(projection).toArray();

    res.status(200).json(resp);
}

async function getAuditLog(req, res) {
    const db = mongo.getDB();
    const colsCollection = db.collection('AuditLog');

    const query = { _id: new ObjectId(req.params.id) };
    const resp = await colsCollection.findOne(query);

    res.status(200).json(resp);
}
/* #endregion */

/* #region  CXOne API Endpoint */
async function getRecordFromTable(req, res) {
    const tableName = req.params.tableName;
    const fieldName = req.params.fieldName;
    const key = req.params.key;

    const db = mongo.getDB();
    const collection = db.collection(tableName);

    try {
        const query = { [fieldName]: key }
        const resp = await collection.find(query).toArray();

        if (resp.length === 0) {
            res.status(200).json({ message: 'No Content' });
        } else {
            res.status(200).json({ message: resp[0] });
        }
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}
/* #endregion */

module.exports = {
    getTables,
    getTablesForUserID,
    getTableNames,
    createTable,
    updateTableSchema,
    getTable,
    updateDocument,
    insertDocument,
    deleteDocument,
    bulkInsert,
    bulkReplace,
    bulkCreate,
    deleteTable,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getRoles,
    getRolesForUserID,
    getRole,
    updateRole,
    deleteRole,
    getAuditLogs,
    getAuditLog,
    getRecordFromTable
}