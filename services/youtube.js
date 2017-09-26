const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

var AudioModel = require('../models/audio_model');

const source = ".youtube";
const ytSetting = {
	vidFormat: 'mp4',
	quality: 'lowest',
	audioFormat: 'mp3'
};

const utubeReg = /^.*youtu(?:be\.com\/watch\?(?:.*&)*v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?.*/;

module.exports = (local_query, query) => {
	var id = query;
	if (utubeReg.test(query)) { // if query is in youtube.com form
		id = utubeReg.exec(query)[1];
	}
	// otherwise assume query is in id form

	// search local db
	return local_query(id)
	.then((docs) => {
		if (docs.length === 0) {
			var doc = docs[0];
			return [new AudioModel({
				"id": doc.id,
				"title": doc.title,
				"audio": null,
				"source": doc.source,
			})];
		}
		
		const requestUrl = 'http://www.youtube.com/watch?v=' + id;
		var video = ytdl(requestUrl, {
			"filter": (format) => {
				return format.container === ytSetting.vidFormat && format.audioEncoding;
			},
			"quality": ytSetting.quality
		});
		var astream = ffmpeg(video).format(ytSetting.audioFormat);
		return ytdl.getInfo(requestUrl)
		.then((err, info) => {
			if (err) throw err;
			return [new AudioModel({
				"id": id, 
				"title": info.title,
				"audio": astream, 
				"source": source
			})];
		});
	});
};
