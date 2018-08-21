var express = require('express');
var router = express.Router();
// const path = require('path');
// const fs = require('fs');
const Stream = require('stream');
const crawlReviews = require('../services/exportService');

router.post("/", async (req, res, next) => {
    try {
        const {amzUrl, idProduct, productHandle, template} = req.body
        if (!amzUrl && !idProduct) {
            res.json({success: false, message: 'Enter link product or product id'})
        }
        let crawl = new crawlReviews(idProduct, productHandle, template, amzUrl)
        const csv = await crawl.startCrawl()
        if (csv) {
            let stream = new Stream.Readable()
            stream.push(csv)
            stream.push(null)
            stream.pipe(res)

        }
    } catch (error) {
        res.json({success: false, message: error.message})
    }
    
  }
);

module.exports = router;