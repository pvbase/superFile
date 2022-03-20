import React, { Component } from 'react';
import Recaptcha from 'react-recaptcha';
import sitekey_config from '../../siteKey_config/sitekey_config';
export default class ZenRecaptcha extends Component {
    constructor(props) {
        super(props)
        this.state = {
            siteKey: sitekey_config,
            env: {},
        }
    }
    componentWillMount = () => {
        this.setState({ env: JSON.parse(localStorage.getItem('env')), inputData: this.props.inputData, inputIndex: this.props.inputIndex, })
        console.log('sitekey config', sitekey_config)
    }
    componentDidMount() {
        if (this.captchaDemo) {
            this.captchaDemo.reset();
        }
    }
    onLoadRecaptcha = () => {
        if (this.captchaDemo) {
            this.captchaDemo.reset();
        }
    }
    verifyCallback = (recaptchaToken, item) => {
        // Here you will get the final recaptchaToken!!!  
        if (recaptchaToken) {
            fetch(`${this.state.env['zqBaseUri']}/common/recaptcha?secret=${sitekey_config.Recaptcha.secret}&response=${recaptchaToken}`, {
                method: 'GET',
            }).then(res => res.json())
                .then(res => {
                    console.log(res)
                    if (res.success === true) {
                        // this.setState({ recaptchaClicked: true, recaptchaError: '' });
                        item['validation'] = true
                        this.setState({ inputData: item }, () => {
                            this.props.onInputChanges()
                        })
                    }
                    else {
                        alert('You are not human...!! ')
                        item['validation'] = false
                        this.setState({ inputData: item }, () => {
                            this.props.onInputChanges()
                        })
                    }
                }).catch(err => {
                    alert('Recaptcha user verify api failed.. ')
                    item['validation'] = false
                    this.setState({ inputData: item }, () => {
                        this.props.onInputChanges()
                    })
                })
        }
    }

    expiredCallback = (expired, item) => {
        if (expired === undefined) {
            item['validation'] = false
            this.setState({ inputData: item }, () => {
                this.props.onInputChanges()
            })
        }
    }
    render() {
        const { error, recaptchaError } = this.state
        return (
            <React.Fragment>
                <div className="recaptcha-position" style={{ marginBottom: `${error ? '15px' : recaptchaError ? '0px' : '15px'}` }}>
                    <Recaptcha
                        ref={(el) => { this.captchaDemo = el; }}
                        sitekey={sitekey_config.Recaptcha.key}
                        render="explicit"
                        onloadCallback={this.onLoadRecaptcha}
                        verifyCallback={(token) => this.verifyCallback(token, this.state.inputData)}
                        expiredCallback={(expired) => this.expiredCallback(expired, this.state.inputData)}
                        size="large"
                        id="g-recaptcha"
                    />
                </div>
                {recaptchaError && <p className="error-texts" style={{ color: `${"#ff5630"}` }}>{recaptchaError}</p>}
            </React.Fragment>
        )
    }
}