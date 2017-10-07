const mongoose = require('mongoose');
const grid = require('gridfs-stream');

require('./connect_mongo');

var AudioModel = require('../models/audio_model');
var MongooseModel = require('./audio_mongoose');
var PopularModel = require('./popular_mongoose');

var gfs = null;
var connection = mongoose.connection;
connection.once('connected', () => {
	gfs = grid(connection.db, mongoose.mongo);
});

exports.save = (audios) => {
	return Promise.all(audios.map((aud) => {
		if (null === aud || 
			!(aud instanceof AudioModel) ||
			null == aud.audio) {
			return null;
		}

		// save to database
		var writeStream = gfs.createWriteStream({ filename: aud.id });
		aud.audio.pipe(writeStream);
		
		var instance = new MongooseModel({
			'id': aud.id,
			'source': aud.source,
			'title': aud.title
		});
		
		return new Promise((resolve, reject) => {
			writeStream
			.on('close', resolve)
			.on('error', reject);
		})
		.then(() => {
			return instance.save();
		})
		.then((data) => {
			console.log(aud.id, " saved");
		});
	}))
	.then(() => {
		return audios.map((aud) => aud.id);
	});
};

exports.exists = (ids) => {
	return MongooseModel.find({ "id": { $in: ids } }).exec();
};

exports.popularQuery = () => {
	var today = Math.floor(Date.now() / 1000);
	return PopularModel.findOne({ "date": today }).exec()
	.then((data) => {
		var ids = []
		if (data) {
			ids = data.ids;
		}
		return ids;
	});
};
