const express = require('express');
const router = express.Router();

const audiosearch = require('./services/audiosearch');
const youtube = require('./services/youtube');
const db = require('./database');

router.get('/caption/:id', (req, res) => {
	var id = req.params.id;
	db.audioQuery({"id": id})
	.then((info) => {
		if (info.length === 0) {
			res.status(404).json({ "err": id + " audio not found" });
		}
		else {
			switch (info[0].source) {
				case 'audiosearch':
					// todo: implement
					break;
				case 'youtube':
					youtube.get_caption(id)
					.then((caption) => {
						res.json(caption);
					})
					.catch((err) => {
						res.status(404).json({ "err": err });
					});
					break;
			}
		}
	});
});

router.post('/popular', (req, res) => {
	db.popularQuery() // look up popular list in db
	.then((existing_ids) => {
		if (existing_ids.length === 0) {
			return audiosearch.get_tastemaker(db.audioQuery)
			.then((audios) => {
				return db.audioSave(audios);
			})
			.then((ids) => {
				// save newly discovered popular list to db
				return db.popularSave(ids)
				.then(() => {
					return ids;
				});
			});
		}
		return existing_ids;
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
			audioprom = youtube.get_audio(db.audioQuery, query);
			break;
		case 'audiosearch':
		default:
			audioprom = audiosearch.search_episode(db.audioQuery, query);
			break;
	}
	audioprom.then((audios) => {
		// save to centralized database
		return db.audioSave(audios);
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
