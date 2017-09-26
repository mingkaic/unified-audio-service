const chai = require('chai');
const clean = require('mongo-clean');
const fs = require('fs');
const mongoose = require('mongoose');
const uuidv1 = require('uuid/v1');

// connect mongoose to mongo then get service
const db = require('../database');
const AudioModel = require('../models/audio_model');

const dbSource = __dirname + '/data/dbtest.mp3';
const expect = chai.expect; // we are using the "expect" style of Chai
const mongoURL = require('../database/connect_mongo').url;

function sampleAudios () {
	var length = 5 + Math.round(Math.random() * 13);
	var sample = []
	for (var i = 0; i < length; i++) {
		sample.push(new AudioModel({
			"id": uuidv1(),
			"source": ".test",
			"title": uuidv1(),
			"audio": fs.createReadStream(dbSource)
		}));
	}
	return sample;
};


// behavior when database is empty
describe('Audio Database (When Empty):', function() {
	it('save should return a list of ids', 
	function(done) {
		this.timeout(10000);

		var testAudios = sampleAudios();
		var nulIdx = Math.floor(Math.random() * testAudios.length);
		testAudios[nulIdx].audio = null;
		db.save(testAudios)
		.then((ids) => {
			expect(ids).to.be.instanceof(Array);
			expect(ids.length).to.equal(testAudios.length);
			let idSet = new Set(ids);
			expect(testAudios.every((amodel) => idSet.has(amodel.id))).to.be.true;
			
			clean(mongoURL, function (err, db) {
				done();
			});
		})
		.catch(done);
	});

	it('exists should return null', 
	function(done) {
		var testAudios = sampleAudios();
		var testIds = testAudios.map((amodel) => amodel.id);
		db.exists(testIds)
		.then((infos) => {
			expect(infos.length).to.equal(0);
		
			done();
		})
		.catch(done);
	});
});

// behavior when database already has an entry
describe('Audio Database (With An Entry):', function() {
	var savedIds;
	before(function(done) {
		this.timeout(10000);

		var testAudios = sampleAudios();
		db.save(testAudios)
		.then((ids) => {
			savedIds = ids;
			done();
		})
		.catch((err) => {
			done();
		});
	});

	it('exists should return null', 
	function(done) {
		db.exists(savedIds)
		.then((infos) => {
			expect(infos.length).to.equal(savedIds.length);
			var testIdSet = new Set(savedIds);
			expect(infos.every((info) => testIdSet.has(info.id))).to.be.true;
		
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
