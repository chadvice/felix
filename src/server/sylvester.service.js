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

async function updateCollection(req, res) {
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

async function deleteCollection(req, res) {
    const userID = req.params.userID;
    const collectionName = req.params.collectionName;
    try {
        const db = mongo.getDB();
        const collection = db.collection('Collections');

        await collection.findOneAndDelete({ name: collectionName });

        const collections = await db.listCollections({}, {nameOnly: true}).toArray();
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
    try {
        const db = mongo.getDB();
        const document = req.body;
        const collection = db.collection('Users');

        for (let n = 0; n < document.roleIDs.length; n++) {
            document.roleIDs[n] = new ObjectId(document.roleIDs[n]);
        }

        const resp = await collection.findOneAndReplace({ userID: document.userID }, document, { upsert: true });
        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function deleteUser(req, res) {
    try {
        const db = mongo.getDB();
        const userID = req.params.userID;
        const collection = db.collection('Users');

        const resp = await collection.findOneAndDelete({ userID: userID });
        res.status(200).json({ status: 'OK' });
    } catch (err) {
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
        const document = req.body;
        const documentID = req.body._id;
        delete document._id;
        const collection = db.collection('Roles');

        for (let n = 0; n < document.tablePermissions.length; n++) {
            document.tablePermissions[n].tableID = new ObjectId(document.tablePermissions[n].tableID);
        }

        let resp;
        if (documentID) {
            resp = await collection.findOneAndReplace({ _id: new ObjectId(documentID) }, document, { upsert: true });
        } else {
            resp = await collection.insertOne(document);
        }

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function deleteRole(req, res) {
    try {
        const db = mongo.getDB();
        const roleID = req.params.roleID;
        const collection = db.collection('Roles');

        const resp = await collection.findOneAndDelete({ _id: new ObjectId(roleID) });
        res.status(200).json({ status: 'OK' });
    } catch (err) {
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

async function test(req, res) {
    const db = mongo.getDB();

    try {
        const collections = await db.listCollections({}, {nameOnly: true}).toArray();
        res.status(200).json(collections);
    } catch(err) {
        res.status(200).json(err.message);
    }

}

module.exports = {
    test,
    getTables,
    getTablesForUserID,
    getTableNames,
    createTable,
    updateCollection,
    getTable,
    updateDocument,
    insertDocument,
    deleteDocument,
    bulkInsert,
    bulkReplace,
    bulkCreate,
    deleteCollection,
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
    getAuditLog
}