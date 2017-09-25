const express = require('express');
const router = express.Router();

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');
const db = require('./database');

router.get('/sounds', (req, res) => {
	// todo: join data from soundcloud and serve
	audiosearch.get_tastemaker()
	.then((tastemaker) => {
		res.json(tastemaker);
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
			audioprom = youtube(db.exists, query);
			break;
		case 'audiosearch':
		default:
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

router.get('/api/health', (req, res) => {
	res.status(500).json({
		"err": 'not implemented'
	});
});

module.exports = router;
