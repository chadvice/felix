const mongo = require('./mongo');
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
      projection: { _id: 0, 'fields': 1 }
    };
    const cols = await colsCollection.findOne(query, options);

    const rowsCollection = db.collection(tableName);
    const rows = await rowsCollection.find({}).toArray();

    const resp = {
        columns: cols.fields,
        rows: rows
    }

    res.status(200).json(resp);
}

module.exports = {
    getTables,
    getTable
}