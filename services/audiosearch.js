const request = require('request');
const Audiosearch = require('audiosearch-client-node');

var audiosearch = new Audiosearch(process.env.AUDIOSEARCH_APP_ID, process.env.AUDIOSEARCH_SECRET);
var AudioModel = require('../models/audio_model');

const source = ".audiosearch";

function local_filter (local_query, results) {
	var ids = results.map((info) => info.id);
	return local_query(ids)
	.then((docs) => {
		var discovery = new Set(docs.map((doc) => doc.id));
		return results.map((info) => {
			var audio = null;
			if (!discover.has(info.id)) {
				var link = info.audio_files[0].url || info.audio_files[0].audiosearch_mp3;
				audio = request.get(link);
			}
			return new AudioModel({
				"id": info.id,
				"title": info.title,
				"audio": audio,
				"source": source
			});
		});
	});
}

exports.get_tastemaker = (local_query) =>
{
	return audiosearch
	.getTastemakers()
	.then((tastemakers) => {
		return local_filter(tastemakers);
	});
};

exports.search_episode = (local_query, keyword, timeinfo) => {
	var params = {};
	if (timeinfo) {
		params.start_time = timeinfo.start;
		params.end_time = timeinfo.end;
	}

	return audiosearch
	.searchEpisodes(keyword, params)
	.then((results) => {
		results = results.results;
		return local_filter(results);
	});
};
