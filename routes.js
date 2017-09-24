const express = require('express');
const router = express.Router();

const audiosearch = require('./services/audiosearch');
// const soundcloud = require('./services/soundcloud');

router.get('/sounds', (req, res) => {
    // todo: join data from soundcloud and serve
    audiosearch.get_tastemaker()
    .then((tastemaker) => {
        res.json(tastemaker);
    });
});

router.get('/search/:query', (req, res) => {
    // todo: join data from soundcloud and serve
    var query = req.params.query;
    audiosearch.search_episode(query)
    .then((result) => {
        res.json(result);
    });
});

router.get('/api/health', (req, res) => {
    res.status(500).json({
        "err": 'not implemented'
    });
});

module.exports = router;
