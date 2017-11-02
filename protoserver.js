const grpc = require('grpc');

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');
const db = require('./database');
const routes = {
	"getCaption": (call) => {
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
					call.end(); // todo: handle error
				});
			}
		});
	},
	"getPopular": (call) => {
		console.log(call.request);
		audiosearch.get_tastemaker(db.audioQuery)
		.then((audios) => {
			db.audioSave(audios)
			.then(() => {
				audios.forEach((audio) => {
					call.write({
						"id": audio.id,
						"source": audio.source,
						"title": audio.title,
					});
				});
				call.end();
			});
		})
		.catch((err) => {
			call.end(); // todo: handle error
		});
	},
	"search": (call) => {
		console.log(call.request);
		var query = call.request.query;
		var response_limit = call.request.response_limit;
		var audioprom;
		switch (call.request.source) {
			case 1: // youtube
				audioprom = youtube.get_audio(db.audioQuery, query);
				break;
			case 2: // audiosearch
			default:
				audioprom = audiosearch.search_episode(db.audioQuery, query);
				break;
		}
		audioprom.then((audios) => {
			// save to centralized database
			db.audioSave(audios)
			.then(() => {
				audios.forEach((audio) => {
					call.write({
						"id": audio.id,
						"source": audio.source,
						"title": audio.title,
					});
				});
				call.end();
			});
		})
		.catch((err) => {
			call.end(); // todo: handle error
		});
	}
};

const PROTO_DIR = __dirname + '/grpc/_proto';
const MAIN_PROTO_PATH = PROTO_DIR + '/uas.proto';
const HEALTH_PROTO_PATH = PROTO_DIR + '/health.proto';

const uas_proto = grpc.load(UAS_PROTO_PATH).uas;
const health_proto = grpc.load(HEALTH_PROTO_PATH).health;

const port = process.env.PORT || '8080';
const uri = '0.0.0.0:' + port;

const server = new grpc.Server();

function lastError (call, callback) {
	call(null, { "type": 200, "msg": 'OK' });
}

server.addService(uas_proto.UnifiedAudioService.service, {
	"getCaption": routes.getCaption,
	"getPopular": routes.getPopular,
	"search": routes.search
}); // main service
server.addService(health_proto.HealthService.service, {
	"lastError": lastError
}); // health service
