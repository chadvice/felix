const { MongoClient } = require('mongodb');

//TODO: move these to .env
const url = 'mongodb+srv://sylvester_app:bERt3wMDSI6UG1kr@cluster0.flt5v5d.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'Sylvester';

let client;
let DB;

async function connect(callback) {
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to server');

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