import React, { Component } from 'react';
import './ExportForm.css'
import axios from 'axios'

class ExportForm extends Component {
    state = {
        template: '1',
        amzUrl: '',
        idProduct: '',
        productHandle: '',
        email: '',
        linkProductOrIdProduct: 'link_product',
        rating: ['1', '2', '3', '4', '5'],
        maxReview: 10000,
        isLoading: false
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleCheckbox(value) {
        let {rating} = this.state
        const index = rating.indexOf(value)
        if (index === -1) {
            rating.push(value)
        } else {
            rating.splice(index, 1)
        }
        this.setState({rating})
    }

    onCrawlBtnClick() {
        let {
            template, 
            productHandle, 
            idProduct, 
            amzUrl, 
            email, 
            isLoading, 
            linkProductOrIdProduct,
            maxReview, 
            rating
        } = this.state;

        const data = {...this.state}

        if (data.linkProductOrIdProduct === 'link_product') {
            delete data.idProduct
        } else {
            delete data.amzUrl
        }

        delete data.isLoading
        delete data.linkProductOrIdProduct

        console.log(data)
        
        if (data.template && data.productHandle && data.email && (data.idProduct || data.amzUrl)) {
            this.setState({isLoading: true})
            axios.post( '/api/export', data)
            .then(res => {
                console.log(res)
                // console.log(encodeURI(res))
                this.setState({isLoading: false})
                alert(res.data.message)
            })
            .catch(err => {
                this.setState({isLoading: false})
                alert(err)
            })
        } else {
            alert('Enter required fields')
        }
    }

    render() {
        const {
            template, 
            productHandle, 
            idProduct, 
            amzUrl, 
            email, 
            isLoading, 
            linkProductOrIdProduct,
            maxReview, 
            rating
        } = this.state;

        return (
            <section className="section export-form">
                <div className="container" style={{ marginBottom: "20px" }}>
                    <h1 className="title">
                        Crawl Review
                    </h1>
                </div>
                <div className="columns">
                    <div className="control column is-11 is-offset-1">
                        {/* <h4 className="subtitle">
                            Choose template want to export
                        </h4> */}
                        <label className="label">Choose template want to export</label>
                        <label className="radio">
                            <input type="radio" 
                                name="template" 
                                value='1' 
                                checked={template === '1'} 
                                onChange={this.handleInputChange.bind(this)}
                            /> 
                            Template 1 (title, body, rating, review_date, reviewer_name, reviewer_email, idProduct, productHandle,
                            picture_urls)
                        </label>
                        <br />
                        <label className="radio">
                            <input type="radio" 
                                name="template" 
                                value='2' 
                                checked={template === '2'}
                                onChange={this.handleInputChange.bind(this)}
                            /> 
                            Template 2 (productHandle, state, rating, title, author, email, location, body, reply, created_at,
                            replied_at)
                        </label>
                    </div>
                </div>

                <div className="columns">
                    <div className="control column is-11 is-offset-1">
                        {/* <h4 className="subtitle">
                            Use link product or product id to crawl
                        </h4> */}
                        <label className="label">Use link product or product id to crawl</label>
                        <label className="radio">
                            <input type="radio" 
                                name="linkProductOrIdProduct" 
                                value='link_product' 
                                checked={linkProductOrIdProduct === 'link_product'} 
                                onChange={this.handleInputChange.bind(this)}
                            /> 
                            Link product
                        </label>
                        <br/>
                        <label className="radio">
                            <input type="radio" 
                                name="linkProductOrIdProduct" 
                                value='id_product' 
                                checked={linkProductOrIdProduct === 'id_product'}
                                onChange={this.handleInputChange.bind(this)}
                            /> 
                            Product id
                        </label>
                    </div>
                </div>

                <div className="columns">
                    <div className="column is-5 is-offset-1">
                        {
                            linkProductOrIdProduct === 'link_product' ?
                            <div className="field">
                                <label className="label">Link product</label>
                                <div className="control">
                                    <input className="input" 
                                        type="text" 
                                        name='amzUrl' 
                                        value={amzUrl}
                                        onChange={this.handleInputChange.bind(this)}
                                        placeholder="e.g. https://www.amazon.com/dp/B01078GH6A" 
                                    />
                                </div>
                            </div>
                            :
                            <div className="field">
                                <label className="label">Product id</label>
                                <div className="control">
                                    <input className="input" 
                                        type="text" 
                                        name='idProduct'
                                        value={idProduct}
                                        onChange={this.handleInputChange.bind(this)}
                                        placeholder="e.g B01078GH6A" 
                                    />
                                </div>
                            </div>
                        }
                       
                        {/* <div class="is-divider" data-content="OR"></div> */}

                        <div className="field">
                            <label className="label">Product rating</label>
                            <label className="checkbox">
                                <input type="checkbox"
                                    checked={rating.indexOf('1') !== -1}
                                    onChange={this.handleCheckbox.bind(this, '1')}
                                />
                                1 star 
                            </label>
                            <label className="checkbox">
                                <input type="checkbox"
                                    checked={rating.indexOf('2') !== -1}
                                    onChange={this.handleCheckbox.bind(this, '2')}
                                />
                                2 star
                            </label>
                            <label className="checkbox">
                                <input type="checkbox"
                                    checked={rating.indexOf('3') !== -1}
                                    onChange={this.handleCheckbox.bind(this, '3')}
                                />
                                3 star
                            </label>
                            <label className="checkbox">
                                <input type="checkbox"
                                    checked={rating.indexOf('4') !== -1}
                                    onChange={this.handleCheckbox.bind(this, '4')}
                                />
                                4 star
                            </label>
                            <label className="checkbox">
                                <input type="checkbox"
                                    checked={rating.indexOf('5') !== -1}
                                    onChange={this.handleCheckbox.bind(this, '5')}
                                />
                                5 star
                            </label>
                        </div>

                        <div className="field">
                            <label className="label">Maximum number of reviews</label>
                            <div className="control">
                                <input className="input" 
                                    type="number" 
                                    name='maxReview'
                                    value={maxReview}
                                    onChange={this.handleInputChange.bind(this)}
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Product handle <span className='has-text-danger'>*</span></label>
                            <div className="control">
                                <input className="input" 
                                    type="text" 
                                    name='productHandle'
                                    value={productHandle}
                                    onChange={this.handleInputChange.bind(this)}
                                    placeholder="e.g. 77-PJ4D-9SM5" 
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Enter your email (We will send you an email after completing the crawl) <span className='has-text-danger'>*</span></label>
                            <div className="control">
                                <input className="input" 
                                    type="email" 
                                    name='email'
                                    value={email}
                                    onChange={this.handleInputChange.bind(this)}
                                    placeholder="e.g. example@gmail.com" 
                                />
                            </div>
                        </div>

                        <a className={"button is-primary " + (isLoading ? 'is-loading' : null)} onClick={this.onCrawlBtnClick.bind(this)}>Crawl</a>
                    </div>

                </div>
            </section>
        );
    }
}

export default ExportForm;