'use strict';
const crawlReviews = require('../services/exportService');

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

function createPayment(data, done) {
    queue.create('payment', data)
        .priority('critical')
        .attempts(2)
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

queue.process('payment', 2, async (job, done) => {
    // This is the data we sent into the #create() function call earlier
    // We're setting it to a constant here so we can do some guarding against accidental writes
    const {idProduct, productHandle, template, amzUrl} = job.data
    let crawl = new crawlReviews(idProduct, productHandle, template, amzUrl)
    const csv = await crawl.startCrawl()
    console.log(csv)
    //... do other stuff with the data.
    done();
});

module.exports = {
    create: (data, done) => {
        createPayment(data, done);
    }
};