const mongo = require('./mongo');
const {ObjectId} = require('mongodb');
mongo.connect();

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
    const fieldChanges   = req.body.fieldChanges;

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
                console.log(`Changing table description to ${newDescription}`);
                await collection.updateOne({name: collectionName}, { $set: { "description" : newDescription } }, { session: session });
            }

            // Apply any field changes requested
            if (fieldChanges?.length > 0) {
                const dataCollection = db.collection(collectionName);

                for (let n = 0; n < fieldChanges.length; n++) {
                    const oldName = fieldChanges[n].oldName;
                    const newName = fieldChanges[n].newName;
                    const removed = fieldChanges[n].removed;
                    const added   = fieldChanges[n].added;

                    if (oldName && newName && !removed) {
                        console.log(`Renaming field ${oldName} -> ${newName}`);
                        await dataCollection.updateMany({}, { $rename: { [oldName]: newName } }, { session: session });
                        await collection.updateOne({'name': collectionName, 'fields.name': oldName}, {$set: {"fields.$.name": newName}}, { session: session });
                    } else if (oldName && removed) {
                        console.log(`Removing field ${oldName}`);
                        await dataCollection.updateMany({}, { $unset: { oldName: '' } }, { session: session });
                        await collection.updateOne({'name': collectionName}, {$pull: {fields: {name: oldName}}}, {session: session});
                    } else if (newName && added){
                        console.log(`Adding field ${newName}`);
                        const resp = await collection.updateOne({'name': collectionName}, {$push: {'fields': {'name': newName, 'type': 'string'}}}, {session: session});
                        console.log();
                    }
                }
            }
        }, transactionOptions);

        if (!transactionResults) {
            status = 'ERR';
            statusMessage = 'Collection update transaction aborted';
        }
    } catch(err) {
        status = 'ERROR';
        statusMessage = err.message;
    } finally {
        res.status(200).json({status: status, message: statusMessage});
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
        res.status(200).json({status: 'OK'});
    } catch(err) {
        res.status(200).json({status: 'ERROR', message: err.message});
    }
}

async function insertDocument(req, res) {
    try {
        const db = mongo.getDB();
        const collectionName = req.body.collection;
        const document = req.body.document;
        const collection = db.collection(collectionName);

        const resp = await collection.insertOne(document);
        res.status(200).json({status: 'OK'});
    } catch(err) {
        res.status(200).json({status: 'ERROR', message: err.message});
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
        res.status(200).json({status: 'OK'});
    } catch(err) {
        res.status(200).json({status: 'ERROR', message: err.message});
    }
}

module.exports = {
    getTableNames,
    updateCollection,
    getTable,
    updateDocument,
    insertDocument,
    deleteDocument
}