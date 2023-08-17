const mongo = require('./mongo');
const {ObjectId} = require('mongodb');
mongo.connect();

async function getTables(req, res) {
    const db = mongo.getDB();
    const collection = db.collection('Collections');
    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
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
    getTables,
    getTable,
    updateDocument,
    insertDocument,
    deleteDocument
}