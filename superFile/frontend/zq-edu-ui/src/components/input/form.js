import React, { Component } from "react";
import InputField from './input';
import ButtonField from './button';
import InputSelect from './select';
import Switch from './switch';
import InputDate from './date';
import ZenRecaptcha from './recaptcha';
import '../../scss/input.scss';
import Button from '@material-ui/core/Button';
import InputRadio from './radio';
import InputTextArea from './text';
import Axios from 'axios';
// import { Alert } from 'rsuite';
// import HistoryIcon from '../../assets/icons/history-icon.svg';
class ZenForm extends Component {
    constructor() {
        super();
        this.state = {
            formData: [],
            formClass: undefined,
            formHeading: undefined,
            submitCheck: false,
            env: JSON.parse(localStorage.getItem('env')),
            clear: false
        };
        this.formRef = React.createRef();
    }
    componentDidMount() {
        this.setState({ formData: this.props.inputData, formClass: "", formHeading: "", clear: this.props.clear == undefined ? false : this.props.clear })

    }
    onSubmit = async (e) => {
        e.preventDefault();
        let formElts = e.target.elements
        // console.log('***e***', e.target.elements.email.value)
        // console.log('***this***', this)
        if (String(window.location.href).includes('login') || String(window.location.href) == "http://3.6.111.111:3000/#/") {
            if (localStorage.getItem('channel') == undefined) {
                localStorage.setItem('channel', e.target.elements.email.value)
            }
        }
        // if (!this.state.submitCheck) {
        let fd = this.state.formData
        let submitCheck = false
        if (this.state.env['type'] === 'passive') {
            var recptResp = (String(window.location.href).includes('login') || String(window.location.href).includes('register') || String(window.location.href) == "http://3.6.111.111:3000/#/") ?
                await Axios.get(`${this.state.env['automationUri']}/34xfyEFCT914faghsrH35?contact=${localStorage.getItem('channel')}`) :
                { data: { Automation: "false" } }
            fd.map(item => {
                if (item.required && item.requiredBoolean && item.category != 'button') {
                    if (item.category == "recaptcha") {
                        console.log(recptResp)
                        // .then(resp => {
                        if (recptResp.data.Automation == "true") {
                            submitCheck = submitCheck
                        } else {
                            if (!item.validation) {
                                submitCheck = true
                                item['error'] = true
                                item['errorMsg'] = `Invalid ${item.label}`
                            } else {
                                submitCheck = submitCheck
                                item['error'] = false
                            }
                        }
                        // })
                        // .catch(err => {
                        // })
                    } else {
                        if (!item.validation) {
                            submitCheck = true
                            item['error'] = true
                            item['errorMsg'] = `Invalid ${item.label}`
                        } else {
                            submitCheck = submitCheck
                            item['error'] = false
                        }
                    }
                }
                // if (item.type == 'submit') {
                //     this.props.onSubmit(e.target.elements, item)
                // }
            })

        } else {
            fd.map(item => {
                if (item.required && item.category != 'button') {
                    if (!item.validation) {
                        submitCheck = true
                        item['error'] = true
                        item['errorMsg'] = `Invalid ${item.label}`
                    } else {
                        submitCheck = submitCheck
                        item['error'] = false
                    }
                }
                // if (item.type == 'submit') {
                //     this.props.onSubmit(e.target.elements, item)
                // }
            })
        }
        this.setState({ submitCheck: submitCheck, formData: fd }, () => {
            if (!this.state.submitCheck) {
                let format = ""
                fd.map(item => {
                    if (item.type == "emailph") {
                        format = item.format
                    }
                    if (item.type == 'submit') {
                        this.props.onSubmit(formElts, item, this.state.formData, format)
                    }
                })
            } else {
                // Alert.error("Please check your data!")
            }
        })
        // }
    }
    onInputChanges = (value, item, event, dataS) => {
        // this.props.onInputChanges(value, item, event, dataS)
        if (this.props.onInputChanges != undefined) {
            if (dataS != undefined) {
                dataS['error'] = false
            } else {
                if (item != undefined) {
                    item['error'] = false
                }
            }
            this.props.onInputChanges(value, item, event, dataS)
        }

        // let submitCheck = false
        // this.setState({ formData: this.state.formData }, () => {
        //     let fd = this.state.formData
        //     fd.map(item => {
        //         if (item.required) {
        //             if (!item.validation) {
        //                 submitCheck = true
        //             } else {
        //                 submitCheck = submitCheck
        //             }
        //         }
        //     })
        //     fd.map(item => {
        //         if (item.type == 'submit' && !submitCheck) {
        //             item['class'] = item['class'].replace('disabled-btn', '')
        //         } else if (item.type == 'submit' && submitCheck) {
        //             if (item['class'].includes("disabled-btn")) {
        //                 item['class'] = item['class']
        //             } else {
        //                 item['class'] = item['class'] + ' ' + 'disabled-btn'
        //             }
        //         }
        //     })
        //     this.setState({ formData: this.state.formData }, () => {
        //         this.setState({ submitCheck: submitCheck })
        //     })
        // })
    }
    onFormBtnEvent = (item) => {
        console.log('check')
        this.props.onFormBtnEvent(item)
    }
    cleanData = (value, item, event, dataS) => {
        this.props.cleanData(value, item, event, dataS)
    }
    onClearForm = (formDatas) => {
        console.log('***Form Datas***', formDatas)
        formDatas.forEach(task => {
            if (task.clear == undefined) {
                delete task['defaultValue']
                task['required'] = task['requiredBoolean']
                task['validation'] = false
                task['error'] = false
            }
        })
        this.setState({ formData: [] }, () => {
            this.setState({ formData: formDatas })
        })
        // this.props.onClearForm(formDatas)
    }
    render() {

        return (
            <React.Fragment>
                {/* <React.Fragment>
                <div className="history-icon-box" title="View History" style={{ width: '8%', marginTop: '10px', display: 'flex',justifyContent:'space-evenly' }} onClick={this.showHistory}> <img src={HistoryIcon} /><p style={{ padding: '0px', paddingLeft: '0px', paddingTop: '3px' }}>Change History</p></div>
                <button onClick={() => this.resetform()}>CLEAR</button>
                </React.Fragment> */}
                {this.state.formData.length > 0 ? <form noValidate ref={this.formRef} className={this.props.formClass} onSubmit={(e) => this.onSubmit(e)}>
                    {this.state.clear ? <Button variant="contained" type="clear" className="secondary-btn form-clear-btn organi-clr-btn" onClick={() => this.onClearForm(this.state.formData)}>Clear</Button> : null}

                    {this.state.formData.map((item, index) => {
                        if (item.category == 'input') {
                            return <InputField inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.type == 'select') {
                            return <InputSelect inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} cleanData={(value, item, event, dataS)=>{this.cleanData(value, item, event, dataS)}} />
                        }
                        if (item.type == 'switch') {
                            return <Switch inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.type == 'date') {
                            return <InputDate inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.category == 'radio') {
                            return <InputRadio inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.category == "textarea") {
                            return <InputTextArea inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.type == "heading") {
                            return <p className={item.class} key={index}>{item.label}</p>
                        }
                        if (item.category == "recaptcha") {
                            return <ZenRecaptcha inputData={item} key={index} inputIndex={index} onInputChanges={this.onInputChanges} />
                        }
                        if (item.category == 'button' && item.type == 'submit') {
                            return <ButtonField inputData={item} key={index} inputIndex={index} />
                        }
                    })}
                </form> : null}
                {this.state.formData.length > 0 ? <React.Fragment>
                    {this.state.formData.map((item, index) => {
                        if (item.category == 'button' && item.type != 'submit') {
                            return <Button type={item.type} className={item.class} key={index} onClick={() => this.onFormBtnEvent(item)}>{item.label}</Button>
                        }
                    })}
                </React.Fragment> : null}
            </React.Fragment>
        )
    }
}
export default ZenForm;