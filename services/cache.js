const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');


const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);


const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashkey = JSON.stringify(options.key || '');
    return this;
}

mongoose.Query.prototype.exec = async function () {

    if(!this.useCache) {
        return exec.apply(this, arguments);
    }

    const queryID = JSON.stringify({... this.getQuery(),
        collection: this.mongooseCollection.name
    });
    
    //See if we have a value for key
    
    const cachedValue = await client.hget(this.hashkey ,queryID);
    
    //Return result with redis
    
    if(cachedValue) {
        doc = JSON.parse(cachedValue);
        return Array.isArray(doc) 
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
    }
    
    //Otherwise, issue query and store result on redis
    
    const result = await exec.apply(this, arguments);
    client.hset(this.hashkey, queryID, JSON.stringify(result), 'EX', 10, (err)=> {
        console.log(JSON.stringify(err));
    });
    return result;
};

module.exports = {
    clearHash( hashkey ){
        client.del(JSON.stringify(hashkey));
    }
}