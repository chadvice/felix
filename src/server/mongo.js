const { MongoClient } = require('mongodb');

let client;
let DB;

async function connect(callback) {
    client = new MongoClient(process.env.MONGO_DB_CONNECTION_STRING);
    await client.connect(process.env.MONGO_DB_DATABASE_NAME);

    DB = client.db(dbName);
}

function getDB() {
    return DB;
}

function getClient() {
    return client;
}

module.exports = {
    connect,
    getDB,
    getClient
};