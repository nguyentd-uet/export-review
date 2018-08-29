const request = require('request-promise')
const _ = require('lodash')
const cheerio = require('cheerio')
const json2csv = require('json2csv').parse
const fs = require('fs')
const {deplay} = require('./ultil')
const path = require('path')
const AMZ_PREFIX_PAGE_REVIEW = "https://www.amazon.com/hz/reviews-render/ajax/reviews/get/ref=cm_cr_arp_d_paging_btm_"
const AMZ_PREFIX_PRODUCT = "https://www.amazon.com/dp/"
const PAGE_SIZE = 50

module.exports = class crawlReviews {
    constructor(idProduct, productHandle, template, amzUrl, rating, maxReview) {
        this.idProduct = idProduct || null
        this.productHandle = productHandle
        this.template = template
        this.amzUrl = amzUrl || null
        this.rating = rating
        this.maxReview = maxReview || null
        this.client = request.defaults({
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.69 Safari/537.36',
            },
            'jar': true,
        })
    }

    async getReview(idProduct, pageNumber, dataResult) {
        let urlRquest = AMZ_PREFIX_PAGE_REVIEW + pageNumber
        urlRquest = encodeURI(urlRquest)
        let options = {
            method: 'POST',
            uri: urlRquest,
            form: {
                reviewerType: 'all_reviews',
                pageNumber: pageNumber,
                reftag: 'cm_cr_arp_d_paging_btm_' + pageNumber,
                pageSize: PAGE_SIZE,
                asin: idProduct
            },
            json: true
        };

        let result = await this.client(options)
        // result = result.replace(/&&&/g,',')
        result = result.split('&&&')
        result = result.join(',')
        result = result.substring(0, result.length - 1);
        result = result.slice(0, -1)
        result = `[${result}]`
        // console.log(result)
        let tmp = JSON.parse(result)

        _.forEach(tmp, data => {
            if (data[0] === 'append' && data[2] !== '' && data[2]) {
                let $ = cheerio.load(data[2])
                if ($('#cm_cr-pagination_bar').attr('data-hook') !== 'pagination-bar') {
                    // $('.a-section .review').each(async (index, element) => {
                    //     console.log(element)
                    // })
                    let rating = $('.a-link-normal').attr('title')[0]
                    let title = $('.review-title').text()
                    let body = $('.review-text').text()
                    let review_date = $('.review-date').text()
                    review_date = review_date.substr(3, review_date.length)
                    review_date = this.formatDate(review_date)
                    let reviewer_name = $('.author').text()
                    let pictures = $('.review-image-tile')
                    let picture_urls
                    pictures.each((index, item) => {
                        picture_urls = ''
                        if (index !== pictures.length - 1) {
                            picture_urls += $(item).attr('src') + ', '
                        } else {
                            picture_urls += $(item).attr('src')
                        }
                    })
                    if (this.template == '1') {
                        if (this.rating.indexOf(rating) !== -1) {
                            dataResult.push({
                                'title': title,
                                'body': body,
                                'rating': rating,
                                'review_date': review_date,
                                'reviewer_name': reviewer_name,
                                'reviewer_email': 'example@gmail.com',
                                'product_id': this.idProduct,
                                'product_handle': this.productHandle,
                                'picture_urls': picture_urls
                            })
                        }
                    } else if (this.template == '2') {
                        if (this.rating.indexOf(rating) !== -1) {
                            dataResult.push({
                                'product_handle': this.productHandle,
                                'state': 'published',
                                'rating': rating,
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
                }
            }
        })

    }

    async getInfoProduct(amzUrl) {
        console.log(amzUrl)
        if (_.isNull(amzUrl)) {
            return false;
        }
        return new Promise((resolve, reject) => {
            let urlRquest = encodeURI(amzUrl)
            this.client.get(urlRquest).then(function (result) {
                let $ = cheerio.load(result)
                let noReview = $('.totalReviewCount').text()
                let element = $('div[data-asin]')[0]
                let asin = $(element).attr('data-asin')
                if (asin) {
                    let data = {
                        noReview: noReview,
                        asin: asin
                    }
                    resolve(data)
                }
            })
            .catch(function (err) {
                reject(err)
            });
            
        })
    }

    async startCrawl() {
        try {
            if (_.isNull(this.amzUrl) && this.idProduct) {
                this.amzUrl = AMZ_PREFIX_PRODUCT + this.idProduct
            }
            let data = await this.getInfoProduct(this.amzUrl)

            if (data.noReview && data.asin) {
                if (parseInt(data.noReview.replace(/\D/g,'')) < this.maxReview || this.maxReview == null) {
                    this.maxReview = parseInt(data.noReview.replace(/\D/g,''))
                }

                let noPage = Math.ceil(parseInt(this.maxReview)/PAGE_SIZE)
                this.idProduct = this.amzUrl.split('/')[4]
                console.log(data)
                let dataResult = []
                for (let i = 1; i <= noPage; i++) {
                    console.log(`Crawling page : ${i}`)
                    await this.getReview(this.idProduct, i, dataResult)
                    await deplay(3000)
                }
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
                    withBOM: true
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