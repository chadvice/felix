const axios = require('axios');

async function getTables(req, res) {
    const resp = await axios.get(`${process.env.AWS_API_ENDPOINT}/table`, {
        headers: {
            'x-api-key': process.env.AWS_API_TOKEN
        }
    })

    res.status(200).json(resp.data);
}

async function getTable(req, res) {
    const tableName = req.params.tableName;

    const resp = await axios.get(`${process.env.AWS_API_ENDPOINT}/table/${tableName}`, {
        headers: {
            'x-api-key': process.env.AWS_API_TOKEN
        }
    })

    res.status(200).json(resp.data);
}

module.exports = {
    getTables,
    getTable
}