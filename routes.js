const db = require('shared_mongodb_api');
const grpc = require('shared_grpc');

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');

exports.getCaption = (call) => {
	console.log(call.request);
	var id = call.request.id;
	db.audioQuery({"id": id})
	.then((info) => {
		if (info[0].source != '.youtube' || info.length === 0) {
			call.end();
		}
		else {
			youtube.get_caption(id)
			.then((caption) => {
				caption.forEach((captionSegment) => {
					call.write(captionSegment);
				});
				call.end();
			})
			.catch((err) => {
				grpc.logError(500, err);
				call.end(); // return empty handed
			});
		}
	});
};

exports.getPopular = (call) => {
	console.log(call.request);
	audiosearch.get_tastemaker(db.audioQuery)
	.then((audios) => {
		db.audioSave(audios, call.write, call.end);
	})
	.catch((err) => {
		grpc.logError(500, err);
		call.end();
	});
};

exports.search = (call) => {
	console.log(call.request);
	var query = call.request.query;
	var response_limit = call.request.response_limit;
	var audioprom = null;
	switch (call.request.source) {
		case 'YOUTUBE':
			audioprom = youtube.get_audio(db.audioQuery, query);
			break;
		case 'AUDIOSEARCH':
			audioprom = audiosearch.search_episode(db.audioQuery, query);
			break;
	}
	if (audioprom) {
		audioprom.then((audios) => {
			// save to centralized database
			db.audioSave(audios, call.write, call.end);
		})
		.catch((err) => {
			grpc.logError(500, err);
			call.end();
		});
	}
	else {
		call.end();
	}
};
