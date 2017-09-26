const chai = require('chai');
const youtube = require('../services/youtube');

const AudioModel = require('../models/audio_model');

const expect = chai.expect; // we are using the "expect" style of Chai

const testId = 'guATTI5NtyA';
const testURL = 'https://www.youtube.com/watch?v=';

describe('Youtube not in db', function() {
	it('should return an array of a single AudioModel', 
	function(done) {
		youtube(() => {
			return Promise.resolve([]);
		}, testURL + testId)
		.then((modelArr) => {
			expect(modelArr.length).to.equal(1);
			expect(modelArr[0]).to.be.instanceof(AudioModel);
			expect(modelArr[0].audio).to.not.be.null;

			done();
		})
		.catch(done);
	});
});

describe('Youtube found in db', function() {
	it('should return an array of a single AudioModel with null audio', 
	function(done) {
		youtube(() => {
			return Promise.resolve([testId]);
		}, testURL + testId)
		.then((modelArr) => {
			expect(modelArr.length).to.equal(1);
			expect(modelArr[0]).to.be.instanceof(AudioModel);
			expect(modelArr[0].audio).to.be.null;

			done();
		})
		.catch(done);
	})
});
