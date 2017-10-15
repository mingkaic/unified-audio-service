const request = require('request-promise');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const numconverter = require('number-to-words');
const parseString = require('xml2js').parseString;
const Entities = require('html-entities').XmlEntities;
const hype = require('hypher');

const hypher = new hype(require('hyphenation.en-us'));

const AudioSchema = require('../database/_schemas/audio_schema');
const entities = new Entities();

const source = ".youtube";
const ytSetting = {
	vidFormat: 'mp4',
	quality: 'lowest',
	audioFormat: 'mp3'
};

const utubeReg = /^.*youtu(?:be\.com\/watch\?(?:.*&)*v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?.*/;

function xmlfilter(str) {
	var clean = str.replace(/<[^>]*>/g, "");
	return entities.decode(clean.replace(/[^\S ]+/g, ""));
}

exports.get_audio = (local_query, query) => {
	var id = query;
	if (utubeReg.test(query)) { // if query is in youtube.com form
		id = utubeReg.exec(query)[1];
	}
	// otherwise assume query is in id form

	// search local db
	return local_query({ "id": id })
	.then((docs) => {
		if (docs.length > 0) {
			var doc = docs[0];
			return [new AudioSchema({
				"id": doc.id,
				"title": doc.title,
				"audio": null,
				"source": doc.source,
			})];
		}
		
		const requestUrl = 'http://www.youtube.com/watch?v=' + id;
		return new Promise((resolve, reject) => {
			ytdl.getInfo(requestUrl, (err, info) => {
				if (err) {
					console.log(err);
					reject(err);
				}
				else {
					var video = ytdl(requestUrl, {
						"filter": (format) => {
							return format.container === ytSetting.vidFormat && format.audioEncoding;
						},
						"quality": ytSetting.quality
					});
					var astream = ffmpeg(video)
					.format(ytSetting.audioFormat)
					.on('error', (err) => { console.log(err); });

					resolve([new AudioSchema({
						"id": id, 
						"title": info.title,
						"audio": astream, 
						"source": source
					})]);
				}
			});
		});
	});
};

// untested
exports.get_caption = (id) => {
	const requestUrl = 'http://www.youtube.com/watch?v=' + id;
	return new Promise((resolve, reject) => {
		ytdl.getInfo(requestUrl, (err, info) => {
			if (info.player_response && info.player_response.captions) {
				var caption = info.
					player_response.
					captions.
					playerCaptionsTracklistRenderer.
					captionTracks[0];
				resolve(caption.baseUrl);
			}
			reject("caption not found");
		});
	})
	.then((url) => {
		return request({
			"encoding": 'utf8',
			"method": 'GET',
			"uri": url,
			"json": true
		});
	})
	.then((response) => {
		return new Promise((resolve, reject) => {
			parseString(response, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	})
	.then((data) => {
		var texts = data.transcript.text;
		var transcript = [];
		texts.forEach((block, i) => {
			var time = block['$'];
			var start = parseFloat(time.start);
			var duration = parseFloat(time.dur);
			if (i + 1 < texts.length) {
				next_block = texts[i + 1];
				duration = Math.min(duration, parseFloat(next_block['$'].start) - start);
			}

			var potentialwords = xmlfilter(block['_']).split(' ');
			var words = [];
			potentialwords.forEach((potword) => {
				if (isNaN(potword)) {
					words.push(potword);
				}
				else {
					words = words.concat(numconverter.toWords(potword).split(' '));
				}
			});

			var est_syllables = words.map((word) => {
				return hypher.hyphenate(word).length;
			});
			var dur_per_syll = duration / est_syllables.reduce((acc, v) => acc + v, 0);
			var est_dur = est_syllables.map((n_syll) => n_syll * dur_per_syll);
			var wordInfos = words.map((word, i) => {
				var end = start + est_dur[i];
				var info = {
					"word": word,
					"start": start,
					"end": end,
				};
				start = end;
				return info;
			});
			transcript = transcript.concat(wordInfos);
		});
		return transcript;
	});
};
