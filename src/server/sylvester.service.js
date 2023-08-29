const mongo = require('./mongo');
const { ObjectId } = require('mongodb');
mongo.connect();

async function getTables(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Collections');

    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
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

async function updateCollection(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
    const collection = db.collection('Collections');
    const session = client.startSession();

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
    try {
        const transactionResults = await session.withTransaction(async () => {
            // Change the description, if requested
            if (newDescription?.length > 0) {
                statusMessage = `Description changed to ${newDescription}.  `;
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
                            fieldDeleteCount++;
                        }
                    } else if (oldName && newName) {
                        await dataCollection.updateMany({}, { $rename: { [oldName]: newName } }, { session: session });
                        resp = await collection.updateOne({ 'name': collectionName, 'fields.name': oldName }, { $set: { "fields.$.name": newName } }, { session: session });
                        if (resp?.modifiedCount > 0) {
                            fieldChangeCount++;
                        }
                    } else if (newName && added) {
                        // Check to see if the field exists before we add it
                        resp = await collection.count({ $and: [{ 'name': collectionName }, { 'fields': { $elemMatch: { 'name': newName } } }] });
                        if (resp === 0) {
                            resp = await collection.updateOne({ 'name': collectionName }, { $push: { 'fields': { 'name': newName, 'type': 'string' } } }, { session: session });
                            if (resp?.modifiedCount > 0) {
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
        const collectionName = req.body.collection;
        const document = req.body.document;
        const collection = db.collection(collectionName);
        const query = { _id: new ObjectId(req.body.document._id) };
        delete document._id;

        const resp = await collection.replaceOne(query, document);
        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function insertDocument(req, res) {
    try {
        const db = mongo.getDB();
        const collectionName = req.body.collection;
        const document = req.body.document;
        const collection = db.collection(collectionName);

        const resp = await collection.insertOne(document);
        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function deleteDocument(req, res) {
    try {
        const db = mongo.getDB();
        const collectionName = req.params.collection;
        const id = req.params.id;
        const collection = db.collection(collectionName);
        const query = { _id: new ObjectId(id) };

        const resp = await collection.deleteOne(query);
        res.status(200).json({ status: 'OK' });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function bulkInsert(req, res) {
    try {
        const db = mongo.getDB();
        const collectionName = req.body.collectionName;
        const documents = req.body.documents;
        const collection = db.collection(collectionName);

        let bulkOperations = [];
        for (let n = 0; n < documents.length; n++) {
            bulkOperations.push({ "insertOne": { "document": documents[n] } });
        }

        const resp = await collection.bulkWrite(bulkOperations);
        const message = `${resp.insertedCount} records were inserted.`

        res.status(200).json({ status: 'OK', message: message });
    } catch (err) {
        res.status(200).json({ status: 'ERROR', message: err.message });
    }
}

async function bulkReplace(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
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
    try {
        const transactionResults = await session.withTransaction(async () => {
            await collection.deleteMany({}, { session: session });

            let bulkOperations = [];
            for (let n = 0; n < documents.length; n++) {
                bulkOperations.push({ "insertOne": { "document": documents[n] } });
            }

            const resp = await collection.bulkWrite(bulkOperations);
            statusMessage = `${resp.insertedCount} records were inserted.`
        }, transactionOptions);
    } catch (err) {
        status = 'ERROR';
        statusMessage = err.message;
    } finally {
        res.status(200).json({ status: status, message: statusMessage });
    }
}

async function bulkCreate(req, res) {
    const db = mongo.getDB();
    const client = mongo.getClient();
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
            statusMessage = `${resp.insertedCount} records were inserted.`
        }, transactionOptions);
    } catch (err) {
        status = 'ERROR';
        statusMessage = err.message;
    } finally {
        res.status(200).json({ status: status, message: statusMessage });
    }
}

async function deleteCollection(req, res) {
    try {
        const db = mongo.getDB();
        const collectionName = req.params.collectionName;
        const collection = db.collection('Collections');

        await collection.findOneAndDelete({ name: collectionName });

        const dataCollection = db.collection(collectionName);
        await dataCollection.drop();

        res.status(200).json({ status: 'OK' });
    } catch (err) {
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
        const collection = db.collection('Roles');

        let resp;
        if (document._id) {
            resp = await collection.findOneAndReplace({ _id: new ObjectId(roleID) }, document, { upsert: true });
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

module.exports = {
    getTables,
    getTableNames,
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
    getRole,
    updateRole,
    deleteRole
}