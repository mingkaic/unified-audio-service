const express = require('express');
const router = express.Router();

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');
const db = require('./database');

router.post('/sounds', (req, res) => {
	// todo: join data from soundcloud and serve
	audiosearch.get_tastemaker(db.exists)
	.then((audio) => {
		return db.save(audio);
	})
	.then((ids) => {
		// return lookup
		res.json({ "ids": ids });
	})
	.catch((err) => {
		res.status(500).json({ "err": err });
	});
});

router.post('/search/:query', (req, res) => {
	var query = req.params.query;
	var audioprom;
	switch (req.body.source) {
		case 'youtube':
			console.log('querying in youtube API');
			audioprom = youtube(db.exists, query);
			break;
		case 'audiosearch':
		default:
			console.log('querying in audiosearch API');
			audioprom = audiosearch.search_episode(db.exists, query);
			break;
	}
	audioprom.then((audio) => {
		// save to centralized database
		return db.save(audio);
	})
	.then((ids) => {
		// return lookup
		res.json({ "ids": ids });
	})
	.catch((err) => {
		res.status(500).json({ "err": err });
	});
});

module.exports = router;