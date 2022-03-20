import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import '../../scss/payment-portal.scss';
import '../../scss/login.scss';
import ZenForm from '../input/form';
import Loader from '../../utils/loader/loaders';
import loginForm from './review-pay.json';
import Axios from 'axios';

class PaymentGateway extends Component {
    constructor(props) {
        super(props)
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            email: localStorage.getItem('email'),
            channel: localStorage.getItem('channel'),
            authToken: localStorage.getItem('auth_token'),
            loginFormData: [],
            isLoader: false
        }
    }
    componentDidMount = async () => {
        this.setState({ isLoader: true });
        console.log('Payment', this.props)
        // this.setState({ loginFormData: loginFormData }, async () => {
        //     if (this.props.invNo != undefined && this.props.orgId != undefined) {
        //         var resp = await axios.get(`${this.state.env['portal']}/invoiceDetails?inv=${this.props.invNo}&orgId=${this.props.orgId}`)
        //         var data = resp.data
        //         console.log('invoice details', data)
        let loginFormData = []
        this.setState({ loginFormData: loginFormData }, () => {
            loginForm.map(item => {
                console.log('payment item', item)
                if (item.name == 'invoice') {
                    item['defaultValue'] = this.props.amountFormat
                }
                if (item.name == 'paid') {
                    item['defaultValue'] = this.props.amountFormat
                }
                if (item.name == 'dueAmount') {
                    item['defaultValue'] = this.props.amountFormat
                }
                loginFormData.push(item)
            })
            this.setState({ isLoader: false }, () => {
                this.setState({ loginFormData: loginFormData });
            })
        })

        this.setState({ isLoader: false });
    }
    componentWillMount() {
    }

    onPaymentGateway = () => {
        this.setState({ isLoader: true })
        let payload =
        {
            "amount": this.props.amount,
            "paisa": this.props.amountFormat.split('.')[1],
            "paymentReferenceId": Date.now() + `#` + localStorage.getItem('demandNote'),
            "acceptPartial": true,
            "minPartialAmount": 100,
            "name": this.props.ParentName,
            "mobile": this.props.userInput,
            "email": this.props.email,
            "callBackUrl": `http://3.217.250.156/feeCollection?demandId=${localStorage.getItem('demandNote')}&orgId=${localStorage.getItem('orgId')}&type=demandNote`,
            "currencyCode": "INR",
            "description": "",
            "paidFor": "demandNote",
            "orgId": localStorage.getItem('orgId')
        }
        Axios.post(`${this.state.env['zqBaseUri']}/edu/payment`, payload, {
            headers: {
                "Authorization": localStorage.getItem('auth_token')
            }
        })
            .then(response => {
                window.open(response.data.data.short_url, '_self');
                // let shorturl = response.data.data.short_url
                this.setState({ isLoader: false })
                // this.props.onPaymentGateway(shorturl)
            }).catch(err => {
                console.log(err)
                this.setState({ isLoader: false })
            })

        // this.props.onPaymentGateway()
    }
    // onReviewAndPay = () => {
    //     window.open("https://netbanking.hdfcbank.com/netbanking", "_blank")
    //     setTimeout(() => {
    //         this.props.onReviewAndPay()
    //     }, 2000)
    // }

    onPaymentModeSelection = (type) => {
        this.setState({ paymentType: type })
    }
    onStepperBack = () => {
        this.props.onStepperBack()
    }
    render() {
        return (
            <React.Fragment>
                {this.state.isLoader ? <Loader /> : null}
                <div className="bank-review-wrapper" style={{ marginBottom: "70px" }}>
                    {/* {!this.state.newBank ? */}
                    <React.Fragment>
                        <div className="bank-review-body" >
                            <h5 className="bank-review-head" style={{ textAlign: 'center', paddingTop: '10px' }}>Review and proceed to pay</h5>
                            <div className="view-bank">
                                {this.state.loginFormData.length > 0 ? <ZenForm inputData={this.state.loginFormData} onSubmit={this.onPaymentGateway} /> : null}
                                <button style={{ visibility: 'hidden' }} id='rzp-button1'></button>
                                {/* <p className="add-new-account" onClick={this.addAccount}> + Add New</p> */}
                            </div>
                        </div>
                    </React.Fragment>
                    {/* : <React.Fragment>
                            <div className="bank-review-body">
                                <p className="bank-review-head">Add a new Account</p>
                                {this.state.isLoader ? <Loader /> : null}
                                <div className="add-bank-form">
                                    <ZenForm inputData={this.state.newBankData} onSubmit={this.submitAccount} />
                                </div>
                            </div>
                        </React.Fragment>} */}
                    <div className="payment-gateway-btn">
                        {/* <Button className="stepper-BackBtn" color="primary" onClick={this.onStepperBack} > Back </Button> */}
                        {/* <Button className="stepper-NextBtn" variant="contained" style={{ float: "right" }} color="primary" onClick={this.onPaymentGateway}>Next </Button> */}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(PaymentGateway);