'use strict';
const crawlReviews = require('../services/exportService');
const {sendMail} = require('../services/mailerService');
import * as config from '../config.json'; 

let redisConfig;
if (process.env.NODE_ENV === 'production') {
    redisConfig = {
        redis: {
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
            auth: process.env.REDIS_PASS
        }
    };
} else {
    redisConfig = {};
}

const queue = require('kue').createQueue(redisConfig);

queue.watchStuckJobs(6000);

queue.on('ready', () => {
    // If you need to
    console.info('Queue is ready!');
});

queue.on('error', (err) => {
    // handle connection errors here
    console.error('There was an error in the main queue!');
    console.error(err);
    console.error(err.stack);
});

function createRequirement(data, done) {
    queue.create('exportRequirement', data)
        .priority('critical')
        .attempts(1)
        .backoff(true)
        .removeOnComplete(false)
        .save((err) => {
            if (err) {
                console.error(err);
                done(err);
            }
            if (!err) {
                done();
            }
        });
}

queue.process('exportRequirement', 2, async (job, done) => {
    // This is the data we sent into the #create() function call earlier
    // We're setting it to a constant here so we can do some guarding against accidental writes
    const {idProduct, productHandle, template, amzUrl, email} = job.data
    let crawl = new crawlReviews(idProduct, productHandle, template, amzUrl)
    crawl.startCrawl()
    .then(filename => {
        console.log(filename)
        let link = config.BASE_URL + 'api/export/download/' + filename
        let html = `<b>Click link to download file</b> ${link}`
        sendMail(email, html)
        //... do other stuff with the data.
        done();
    })
    .catch(err => {
        let html = `<b>Error when crawl data: </b> ${err.message}`
        sendMail(email, html)
        done(err)
    })
    
});

module.exports = {
    create: (data, done) => {
        createRequirement(data, done);
    }
};