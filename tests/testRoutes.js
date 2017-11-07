require('dotenv').load();
const chai = require('chai');
const clean = require('mongo-clean');
const stream = require('fake-stream');
const db = require('shared_mongodb_api');
const grpc = require('shared_grpc');

const client = grpc.uas_cli;
const schemas = grpc.schemas;
const audDb = db.audio;
const audSchema = db.AudioSchema;
const mongoURL = db.Connection.url;

const expect = chai.expect; // we are using the "expect" style of Chai

const UPLOADED_id = "uploaded_id";
const YOUTUBE_id = "_GuOjXYl5ew";
const YOUTUBE_id2 = "at0v5EENDMM";

describe("UAS GRPC Route", function() {
	before(function(done) {
		require('../server');
		audDb.save([
			new audSchema({
				"id": YOUTUBE_id,
				"source": 'YOUTUBE',
				"title": 'captionfound',
				"audio": new stream()
			}),
			new audSchema({
				"id": YOUTUBE_id2,
				"source": 'YOUTUBE',
				"title": 'captionnotfound',
				"audio": new stream()
			}),
			new audSchema({
				"id": UPLOADED_id,
				"source": 'UPLOADED',
				"title": 'uploadedtitle',
				"audio": new stream()
			})
		], () => {}, done);
	});

	it('getCaption should return empty caption for non-existing audio', 
	function(done) {
		client.getCaption(new schemas.AudioRequest({
			"id": 'not an id'
		}))
		.then((captions) => {
			expect(captions.length).to.equal(0);
			done();
		})
		.catch(done);
	});
	
	it('getCaption should return empty caption for non-YOUTUBE audio', 
	function(done) {
		client.getCaption(new schemas.AudioRequest({
			"id": UPLOADED_id
		}))
		.then((captions) => {
			expect(captions.length).to.equal(0);
			done();
		})
		.catch(done);
	});
	
	it('getCaption should return caption of YOUTUBE audio', 
	function(done) {
		this.timeout(5000);
		client.getCaption(new schemas.AudioRequest({
			"id": YOUTUBE_id
		}))
		.then((captions) => {
			expect(captions.length).to.gt(0);
			expect(captions[0].word).to.equal('Bring');
			expect(captions[0].start).to.equal(13.54);
			expect(captions[0].end).to.equal(13.819999999999999);
			done();
		})
		.catch(done);
	});
	
	it('getCaption should return empty caption for YOUTUBE audio without captions', 
	function(done) {
		client.getCaption(new schemas.AudioRequest({
			"id": YOUTUBE_id2
		}))
		.then((captions) => {
			expect(captions.length).to.equal(0);
			done();
		})
		.catch(done);
	});
	
	it('getPopular should return some list of audio', 
	function(done) {
		this.timeout(7000);
		client.getPopular()
		.then((audios) => {
			expect(audios.length).to.gt(0);
			done();
		})
		.catch(done);
	});
	
	it('search for existing audio should return existing audio', 
	function(done) {
		client.search(new schemas.SearchParams({
			"query": YOUTUBE_id,
			"response_limit": 1,
			"source": 'YOUTUBE'
		}))
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal(YOUTUBE_id);
			expect(audios[0].title).to.equal('captionfound');
			expect(audios[0].source).to.equal('YOUTUBE');
			
			return audDb.query({ "id": audios[0].id });
		})
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal(YOUTUBE_id);
			expect(audios[0].title).to.equal('captionfound');
			expect(audios[0].source).to.equal('YOUTUBE');
			done();
		})
		.catch(done);
	});
	
	it('search for youtube video should return new youtube audio', 
	function(done) {
		this.timeout(60000); // audio extraction and saving could be slow
		client.search(new schemas.SearchParams({
			"query": 'KK9bwTlAvgo',
			"response_limit": 1,
			"source": 'YOUTUBE'
		}))
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal('KK9bwTlAvgo');
			expect(audios[0].title).to.equal('YouTube Rewind: Now Watch Me 2015 | #YouTubeRewind');
			expect(audios[0].source).to.equal('YOUTUBE');
			
			return audDb.query({ "id": audios[0].id });
		})
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal('KK9bwTlAvgo');
			expect(audios[0].title).to.equal('YouTube Rewind: Now Watch Me 2015 | #YouTubeRewind');
			expect(audios[0].source).to.equal('YOUTUBE');

			return audDb.get(audios[0].id);
		})
		.then((audio) => {
			expect(!audio).to.be.false;
			done();
		})
		.catch(done);
	});
	
	after(function(done) {
		clean(mongoURL, function (err, db) {
			done();
		});
	});
});
