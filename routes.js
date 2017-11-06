const grpc = require('shared_grpc');
const db = require('shared_mongodb_api');

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');

const audDb = db.audio;

exports.getCaption = (call) => {
	var id = call.request.id;
	audDb.query({"id": id})
	.then((info) => {
		if ((info[0] && info[0].source !== 'YOUTUBE') || info.length === 0) {
			call.end();
		}
		else {
			youtube.get_caption(id)
			.then((caption) => {
				caption.forEach((captionSegment) => {
					db.captions.saveWord({
						"id": id,
						"word": captionSegment.word,
						"start": captionSegment.start,
						"end": captionSegment.end
					});
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
	audiosearch.get_tastemaker(audDb.query)
	.then((audios) => {
		audDb.save(audios, 
		(audio) => {
			call.write({
				"id": audio.id,
				"title": audio.title,
				"source": audio.source
			});
		},
		(err) => {
			if (err) {
				throw err;
			}
			call.end();
		});
	})
	.catch((err) => {
		grpc.logError(500, err);
		call.end();
	});
};

exports.search = (call) => {
	var query = call.request.query;
	var response_limit = call.request.response_limit;
	var audioprom = null;
	switch (call.request.source) {
		case 'YOUTUBE':
			audioprom = youtube.get_audio((q) => audDb.query(q, response_limit), query);
			break;
		case 'AUDIOSEARCH':
			audioprom = audiosearch.search_episode((q) => audDb.query(q, response_limit), query);
			break;
	}
	if (audioprom) {
		audioprom.then((audios) => {
			// save to centralized database
			audDb.save(audios, 
			(audio) => {
				call.write({
					"id": audio.id,
					"title": audio.title,
					"source": audio.source
				});
			}, 
			(err) => {
				if (err) {
					throw err;
				}
				call.end();
			});
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
