const chai = require('chai');
const uuidv1 = require('uuid/v1');

const search = require('../services/audiosearch');
const AudioModel = require('../models/audio_model');

const expect = chai.expect; // we are using the "expect" style of Chai

function generateAudioSamples () {
	var length = 5 + Math.round(Math.random() * 13);
	var sample = []
	for (var i = 0; i < length; i++) {
		sample.push({
			"id": uuidv1(),
			"title": uuidv1(),
			"audio_files": [
				{'url': 'http://www.noiseaddicts.com/samples_1w72b820/280.mp3'}
			]
		});
	}
	return sample;
}

const keyword = 'book';
const tastemakerSamples = generateAudioSamples();
const tastemakerIds = tastemakerSamples.map((sample) => sample.id);
const searchSamples = generateAudioSamples();
const searchIds = searchSamples.map((sample) => sample.id);

var mockAudioSearch = {
	"getTastemakers": () => {
		return Promise.resolve(tastemakerSamples);
	},
	"searchEpisodes": (keyword, params) => {
		return Promise.resolve({ "results": searchSamples });
	}
}

describe('Audiosearch not in db', function() {
	before(function() {
		search.set_audiosearch(mockAudioSearch);
	});

	it('get_tastemaker should return an array of AudioModel', 
	function(done) {
		search.get_tastemaker(() => {
			return Promise.resolve([]);
		})
		.then((modelArr) => {
			var n = modelArr.length;
			expect(n).to.equal(tastemakerSamples.length);
			for (var i = 0; i < n; i++) {
				expect(modelArr[i]).to.be.instanceof(AudioModel);
				expect(modelArr[i].id).to.equal(tastemakerSamples[i].id);
				expect(modelArr[i].title).to.equal(tastemakerSamples[i].title);
				expect(modelArr[i].audio).to.not.be.null;
			}

			done();
		})
		.catch(done);
	});

	it('search should return an array of AudioModel', 
	function(done) {
		search.search_episode(() => {
			return Promise.resolve([]);
		}, keyword)
		.then((modelArr) => {
			var n = modelArr.length;
			expect(n).to.equal(searchSamples.length);
			for (var i = 0; i < n; i++) {
				expect(modelArr[i]).to.be.instanceof(AudioModel);
				expect(modelArr[i].id).to.equal(searchIds[i]);
				expect(modelArr[i].title).to.equal(searchSamples[i].title);
				expect(modelArr[i].audio).to.not.be.null;
			}

			done();
		})
		.catch(done);
	});
});

describe('Audiosearch found in db', function() {
	before(function() {
		search.set_audiosearch(mockAudioSearch);
	});
	
	it('get_tastemaker should return an array of AudioModel', 
	function(done) {
		search.get_tastemaker(() => {
			return Promise.resolve(tastemakerIds);
		})
		.then((modelArr) => {
			var n = modelArr.length;
			expect(n).to.equal(tastemakerSamples.length);
			for (var i = 0; i < n; i++) {
				expect(modelArr[i]).to.be.instanceof(AudioModel);
				expect(modelArr[i].id).to.equal(tastemakerSamples[i].id);
				expect(modelArr[i].title).to.equal(tastemakerSamples[i].title);
				if (null !== modelArr[i].audio) {
					console.log(tastemakerIds);
					console.log(modelArr[i].id);
				}
				expect(modelArr[i].audio).to.be.null;
			}

			done();
		})
		.catch(done);
	});

	it('search should return an array of AudioModel', 
	function(done) {
		search.search_episode(() => {
			return Promise.resolve(searchIds);
		}, keyword)
		.then((modelArr) => {
			var n = modelArr.length;
			expect(n).to.equal(searchSamples.length);
			for (var i = 0; i < n; i++) {
				expect(modelArr[i]).to.be.instanceof(AudioModel);
				expect(modelArr[i].id).to.equal(searchIds[i]);
				expect(modelArr[i].title).to.equal(searchSamples[i].title);
				expect(modelArr[i].audio).to.be.null;
			}

			done();
		})
		.catch(done);
	});
});
