import React, { Component } from 'react';
import './ExportForm.css'
import axios from 'axios'

class ExportForm extends Component {
    state = {
        template: '1',
        amzUrl: '',
        idProduct: '',
        productHandle: '',
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

    onCrawlBtnClick() {
        const {template, productHandle, idProduct, amzUrl} = this.state;
        if (template && productHandle && (idProduct || amzUrl)) {
            this.setState({isLoading: true})
            axios.post( '/api/export', {...this.state})
            .then(res => {
                console.log(res)
                // console.log(encodeURI(res))
                this.setState({isLoading: false})
                let filename = amzUrl !== '' && amzUrl.split('/')[4] ? amzUrl.split('/')[4] : idProduct
                let tempLink = document.createElement('a');
                tempLink.href = 'data:text/csv;charset=utf-8,'  + encodeURI(res.data);
                tempLink.setAttribute('download', filename + '.csv');
                tempLink.click();
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
        const {template, productHandle, idProduct, amzUrl, isLoading} = this.state;
        return (
            <section className="section export-form">
                <div className="container" style={{ marginBottom: "20px" }}>
                    <h1 className="title">
                        Crawl Review
                    </h1>
                </div>
                <div className="columns">
                    <div className="control column is-11 is-offset-1">
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
                    <div className="column is-5 is-offset-1">
                        <h4 className="subtitle">
                            Enter link product or product id. Link product will be preferred over product id
                        </h4>
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
                        {/* <div class="is-divider" data-content="OR"></div> */}
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

                        <a className={"button is-primary " + (isLoading ? 'is-loading' : null)} onClick={this.onCrawlBtnClick.bind(this)}>Crawl</a>
                    </div>

                </div>
            </section>
        );
    }
}

export default ExportForm;