const request = require('request-promise')
const _ = require('lodash')
const cheerio = require('cheerio')
const json2csv = require('json2csv').parse
const fs = require('fs')
const {deplay} = require('./ultil')
const path = require('path')
const puppeteer = require('puppeteer');
const AMZ_PREFIX_PAGE_REVIEW = "https://www.amazon.com/hz/reviews-render/ajax/reviews/get/ref=cm_cr_arp_d_paging_btm_"
const AMZ_PREFIX_PRODUCT = "https://www.amazon.com/dp/"
const PAGE_SIZE = 10

const optionEmulate = {
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_2 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) CriOS/63.0.3239.73 Mobile/15B202 Safari/604.1',
  }
  
  var optionLaunch = {
    headless: false, args: ['--disable-notifications']
  }

module.exports = class crawlReviews {
    constructor(idProduct, productHandle, template, amzUrl, rating, maxReview) {
        this.idProduct = idProduct || null
        this.productHandle = productHandle
        this.template = template
        this.amzUrl = amzUrl || null
        this.rating = rating
        this.maxReview = maxReview || null
    }

    async getReview(page, idProduct, noPage) {
        try {
            const dataResult = [];
            
            for (let i = 1; i <= noPage; i++) {
                console.log('crawling page: ' + i)
                await page.goto(
                    `https://www.amazon.com/product-reviews/${idProduct}/ref=cm_cr_getr_d_paging_btm_${i}?reviewerType=all_reviews&pageNumber=${i}`, 
                    {waitUntil: 'networkidle2', timeout: 0}
                );
                await page.evaluate(() => {
                    window.formatDate = (currDate) => {
                        let date = new Date(currDate)
                        let dd = date.getDate();
                        let mm = date.getMonth() + 1;
                        let yyyy = date.getFullYear();
                        if (dd < 10) {
                            dd = '0' + dd;
                        }
                        if (mm < 10) {
                            mm = '0' + mm;
                        }
                        return mm + '/' + dd + '/' + yyyy;
                    }
                })

                const itemsTmp = await page.evaluate((idProduct, productHandle, template, rating) => {
                    let reviews = [];
                    const reviewList = document.querySelectorAll('#cm_cr-review_list > div[data-hook=review-content]');
                    reviewList.length > 0 && reviewList.forEach(divEl => {
                        const ratingDiv = divEl.querySelector('i[data-hook=review-star-rating]');
                        const ratingClassList = ratingDiv.className;
                        const ratingText = ratingClassList && ratingClassList.match(/\d/g).join('');

                        const title = divEl.querySelector('span[data-hook=review-title]').innerText;
                        const body = divEl.querySelector('div[data-hook=review-body]').innerText;
                        let review_date = divEl.querySelector('span[data-hook=review-date]').innerText;
                        review_date = formatDate(review_date);

                        const reviewer_name = divEl.querySelector('.a-profile-name').innerText;
                        const pictures = divEl.querySelectorAll('.review-image-thumbnail');
                        let picture_urls
                        pictures.forEach((item, index) => {
                            picture_urls = ''
                            const style = item.currentStyle || window.getComputedStyle(item, false);
                            const src = style.backgroundImage.slice(4, -1).replace(/"/g, "");
                            if (index !== pictures.length - 1) {
                                picture_urls += src + ', '
                            } else {
                                picture_urls += src
                            }
                        })
                        
                        if (template == '1') {
                            if (rating.indexOf(ratingText) !== -1) {
                                reviews.push({
                                    'title': title,
                                    'body': body,
                                    'rating': ratingText,
                                    'review_date': review_date,
                                    'reviewer_name': reviewer_name,
                                    'reviewer_email': 'example@gmail.com',
                                    'product_id': idProduct,
                                    'product_handle': productHandle,
                                    'picture_urls': picture_urls
                                })
                            }
                        } else if (template == '2') {
                            if (rating.indexOf(ratingText) !== -1) {
                                reviews.push({
                                    'product_handle': productHandle,
                                    'state': 'published',
                                    'rating': ratingText,
                                    'title': title,
                                    'author': reviewer_name,
                                    'email': 'example@gmail.com',
                                    'location': 'USA',
                                    'body': body,
                                    'reply': null,
                                    'created_at': review_date,
                                    'replied_at': null
                                })
                            }
                        }
                    })
                    return reviews;
                }, this.idProduct, this.productHandle, this.template, this.rating);
                dataResult.push(...itemsTmp);
                await page.waitFor(3000);
            }
            
			return dataResult;
        } catch (error) {
            throw error
        }
    }

    async getInfoProduct(page, amzUrl) {
        if (_.isNull(amzUrl)) {
            return false;
        }
        try {
            await page.goto(amzUrl, {waitUntil: 'networkidle2', timeout: 0});

			const asin = await page.evaluate(() => {
				const temp = document.querySelector('div[data-asin]');
				if (temp) return temp.getAttribute('data-asin');
			});
			const noReview = await page.evaluate(() => {
                const temp = document.querySelector('[data-hook=total-review-count]');
                if (temp) return temp.innerText.match(/\d/g).join('');
            })

			let data = {
				noReview: noReview,
				asin: asin
            }
			return data;
        } catch (error) {
            throw error
        }
    }

    async startCrawl() {
        const browser = await puppeteer.launch(optionLaunch);
        const page = await browser.newPage();
        await page.emulate(optionEmulate);
        try {
            console.log('start')
            if (_.isNull(this.amzUrl) && this.idProduct) {
                this.amzUrl = AMZ_PREFIX_PRODUCT + this.idProduct
            }

            let data = await this.getInfoProduct(page, this.amzUrl)
            if (data.noReview && data.asin) {
                if (parseInt(data.noReview.replace(/\D/g,'')) < this.maxReview || this.maxReview == null) {
                    this.maxReview = parseInt(data.noReview.replace(/\D/g,''))
                }

                let noPage = Math.ceil(parseInt(this.maxReview)/PAGE_SIZE)
                this.idProduct = this.amzUrl.split('/')[4]
                console.log(data)
                let dataResult = await this.getReview(page, this.idProduct, noPage);
                await browser.close();
                let fields;
                if (this.template == '1') {
                    fields = ['title', 'body', 'rating', 'review_date', 'reviewer_name', 'reviewer_email',
                        'product_id', 'product_handle', 'picture_urls'
                    ]
                } else if (this.template == '2') {
                    fields = ['product_handle', 'state', 'rating', 'title', 'author', 'email', 'location',
                        'body', 'reply', 'created_at', 'replied_at'
                    ]
                }
    
                const opts = {
                    fields,
                    excelStrings: false,
                    // quote: ''
                }
                const csv = json2csv(dataResult, opts)
                let datetime = new Date().getTime();
                let fileName = this.idProduct + '_' + datetime + '.csv'
                return new Promise((resolve, reject) => {
                    fs.writeFile(fileName, csv, function (err) {
                        if (err) reject(err);
                        console.log('file saved');
                        resolve(fileName);
                    });
                });
                // return csv
            }
        } catch (error) {
            browser.close();
            throw error
        }
        
    }

    formatDate(currDate) {
        let date = new Date(currDate)
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return mm + '/' + dd + '/' + yyyy;
    }

}