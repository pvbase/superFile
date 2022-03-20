import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import ZenForm from '../../input/form';
import LoginJSON from './student-portal-login.json'
import Axios from 'axios';
import Loader from '../../../utils/loader/loaders';
import { Alert } from 'rsuite';
class StudentPortalLogin extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loginFormData: [],
            mobileNo: '',
            env: JSON.parse(localStorage.getItem('env')),
        }
    }
    componentDidMount() {
        let loginFormData = []
        LoginJSON.map(item => {
            loginFormData.push(item)
        })
        this.setState({ loginFormData: loginFormData })
    }
    onSubmit = (data, item, format) => {
        this.setState({ isLoader: true });
        console.log('***data***', item)
        let mobileNo = data.phoneno.value;
        let payload = { "username": mobileNo }
        this.setState({ mobileNo: mobileNo });
        this.setState({ isOtp: true, isLoader: false })
        Axios.post(`${this.state.env['zqBaseUri']}/zqedu/otplogin`, payload)
            .then(value => {
                if (value.status == 400 || value.status == 404) {
                    Alert.error(value.data.errors[0].message)
                    this.setState({ isOtp: false, isLoader: false })
                }
                if (value.status == 201 || value.status == 200) {
                    Alert.info(`OTP sent to ${mobileNo}`)
                    this.setState({ isOtp: true, isLoader: false })
                    this.props.onMobileSubmit(mobileNo);
                }
            }).catch(err => {
                Alert.error("Login Failed !")
                this.setState({ isLoader: false });
            })
    }
    render() {
        return (
            <React.Fragment>
                {this.state.isLoader ? <Loader /> : null}
                <div className="student-data-portal-main">
                    <div className="student-data-portal-login-content">
                        <p className="login-desc-txt">Please login using your Mobile Number.</p>
                        {this.state.loginFormData.length > 0 ? <React.Fragment>
                            <ZenForm inputData={this.state.loginFormData} onSubmit={this.onSubmit} />
                            <p className="student-portal-separator-line"></p>
                        </React.Fragment> : null}
                    </div>
                </div>
            </React.Fragment >
        )
    }
}

export default withRouter(StudentPortalLogin)