/////////////////////////////////////
///// FELIX STUFF - REMOVE THIS /////
const axios = require('axios');

async function getFelixTables(req, res) {
    const resp = await axios.get(`${process.env.AWS_API_ENDPOINT}/table`, {
        headers: {
            'x-api-key': process.env.AWS_API_TOKEN
        }
    })

    res.status(200).json(resp.data);
}

async function getFelixTable(req, res) {
    const tableName = req.params.tableName;

    const resp = await axios.get(`${process.env.AWS_API_ENDPOINT}/table/${tableName}`, {
        headers: {
            'x-api-key': process.env.AWS_API_TOKEN
        }
    })

    res.status(200).json(resp.data);
}
/////                           /////
/////////////////////////////////////
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
    const collection = db.collection(tableName);
    
    const resp = await collection.find({}).toArray();

    res.status(200).json(resp);
}

module.exports = {
    getFelixTables,
    getFelixTable,
    getTables,
    getTable
}