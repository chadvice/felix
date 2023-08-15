const { MongoClient } = require('mongodb');

//TODO: move these to .env
const url = 'mongodb+srv://sylvester_app:bERt3wMDSI6UG1kr@cluster0.flt5v5d.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'Sylvester';

let DB;

async function connect(callback) {
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to server');

    DB = client.db(dbName);
}

function getDB() {
    return DB;
}

module.exports = {
    connect,
    getDB,
    DB
};