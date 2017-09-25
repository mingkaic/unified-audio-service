require('./connect_mongo');
const mongoose = require('mongoose');
const grid = require('gridfs-stream');

var AudioModel = require('../models/audio_model');

var gfs = null;

var MongooseModel = require('./audio_mongoose');
var connection = mongoose.connection;
connection.once('connected', () => {
	gfs = grid(connection.db, mongoose.mongo);
});

exports.save = (audios) => {
    return audios.map((aud) => {
        if (null === aud || !(aud instanceof AudioModel)) {
            return null;
        }
        // save to database
        if (aud.audio) {
            var writeStream = gfs.createWriteStream({ filename: aud.source + aud.id });
            
            var instance = new vidModel({
                'id': aud.id,
                'source': aud.source,
                'title': aud.title
            });

            instance.save()
            .then((data) => {
                console.log('saved ', data);
            });
        }

        return aud.id;
    });
};

exports.exists = (ids) => {
    return MongooseModel.find({ "id": ids }).exec();
};
