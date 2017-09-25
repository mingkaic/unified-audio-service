const request = require('request');
const Audiosearch = require('audiosearch-client-node');

var audiosearch = new Audiosearch(process.env.AUDIOSEARCH_APP_ID, process.env.AUDIOSEARCH_SECRET);
var AudioModel = require('../models/audio_model');

const source = ".audiosearch";

exports.get_tastemaker = () =>
{
	return audiosearch
	.getTastemakers()
	.then(function (tastemakers) {
		// filter out irrelevant data
		return tastemakers;
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
		// parse results
		results = results.results;
		// check local
		var ids = results.map((info) => info.id);
		return local_query(ids)
		.then((docs) => {
			var discovery = new Set(docs.map((doc) => doc.id));

			return results.map((info) => {
				if (info.audio_files.length === 0) {
					return null;
				}
				var audio = null;
				if (!discover.has(info.id)) {
					var link = info.audio_files[0].audiosearch_mp3;
					audio = request.get(link);
				}
				// in the future, change schema here
				return new AudioModel({
					"id": info.id,
					"title": info.title,
					"audio": audio,
					"source": source
				});
			});
		})
	});
};
