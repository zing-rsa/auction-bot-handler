const { MongoClient } = require('mongodb');
const { MONGO_URL, DB_NAME } = require('./config.js');

const mDBClient = new MongoClient(MONGO_URL);

let _db;

const connect = async () => {
        try {
            await mDBClient.connect();
            console.log('Connected to MongoDB');

            _db = mDBClient.db(DB_NAME);
            return _db;
    
        } catch (error) {
            console.log('Failed to connect to MongoDB')
            return Promise.reject(error)
        }
    }

const db = () => _db;

module.exports = {
    connect,
    db
}