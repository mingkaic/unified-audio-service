const Audiosearch = require('audiosearch-client-node');
var audiosearch = new Audiosearch(process.env.AUDIOSEARCH_APP_ID, process.env.AUDIOSEARCH_SECRET);

exports.get_tastemaker = () =>
{
	return audiosearch
	.getTastemakers()
	.then(function (tastemakers) {
		// filter out irrelevant data
		return tastemakers;
	});
};

exports.search_episode = (keyword, timeinfo) => {
	var params = {};
	if (timeinfo) {
		params.start_time = timeinfo.start;
		params.end_time = timeinfo.end;
	}

	return audiosearch
	.searchEpisodes(keyword, params)
	.then((results) => {
		// parse results

		return results;
	});
};
