var express = require('express');
var router = express.Router();
// const path = require('path');
const fs = require('fs');
const Stream = require('stream');
const crawlReviews = require('../services/exportService');
// const {create} = require('../queue/export');
const {sendMail} = require('../services/mailerService');

router.post("/", async (req, res, next) => {
    try {
        const {amzUrl, idProduct, productHandle, template, email, rating, maxReview} = req.body
        if (!amzUrl && !idProduct) {
            res.json({success: false, message: 'Enter link product or product id'})
        }
        if (!email) {
            res.json({success: false, message: 'Enter your email'})
        }
        // create({amzUrl, idProduct, productHandle, template, email, rating, maxReview}, (err) => {
        //     if (err) {
        //         return res.json({
        //             error: err,
        //             success: false,
        //             message: 'Could not create requirement',
        //         });
        //     } else {
        //         return res.json({
        //             error: null,
        //             success: true,
        //             message: 'Successfully created requirement',
        //         });
        //     }
        // })
        let crawl = new crawlReviews(idProduct, productHandle, template, amzUrl, rating, maxReview)
        crawl.startCrawl()
        return res.json({
            success: true,
            message: 'Crawling'
        })
        let link = 'https://serene-citadel-80799.herokuapp.com/api/export/download/' + filename
        let html = `<b>Click link to download file</b> ${link}`
        // sendMail(email, html)
        // if (csv) {
        //     let stream = new Stream.Readable()
        //     stream.push(csv)
        //     stream.push(null)
        //     stream.pipe(res)
        // }
        
    } catch (error) {
        res.json({success: false, message: error.message})
    }
    
  }
);

router.get("/download/:filename", async (req, res, next) => {
    try {
        const {filename} = req.params
        if (filename) {
            res.download(filename, (err) => {
                if (err) {
                    res.json({success: false, message: err.message})
                }
                fs.unlink(filename, (err) => {
                    if (err) {
                        res.json({success: false, message: err.message})
                    }
                    console.log('FILE [' + filename + '] REMOVED!');
                });
            });
        } else {
            res.json({success: false, message: 'File not found'})
        }
    } catch (error) {
        res.json({success: false, message: error.message})
    }
});

module.exports = router;