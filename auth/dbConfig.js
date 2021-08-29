const { MongoClient } = require("mongodb");
require('dotenv').config();

class Connection {

    static async open() {
        this.client = await MongoClient.connect(this.uri, this.options);
        this.db = this.client.db(process.env.DB_NAME);
        this.collection = this.db.collection(process.env.COLLECTION);
        return this.client;
    }

}

Connection.db = process.env.DB_NAME;
Connection.uri = process.env.DB_URI;
Connection.client = null;
Connection.options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

module.exports = Connection;