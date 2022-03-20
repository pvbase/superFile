import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

export default class InputText extends Component {
    constructor(props) {
        super(props)
        this.state = {
            inputData: {},
            error: false,
            showPassword: false
        }
    }

    componentWillMount = () => {
        // console.log('props', this.props)
        this.setState({ inputData: this.props.inputData, inputIndex: this.props.inputIndex })
    }

    inputChanges = (e, item) => {
        let value = e.target.value
        if (item.type == "email" || item.type == "orgemail" || item.name == 'emailaddress' || item.name == 'branchemail') {
            var emailId = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (emailId.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            } else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid Email ID"
                this.setState({ inputData: item })
            }
        }
        if (item.type == "emailph") {
            var phoneNum = /^(\+\d{1,3}[- ]?)?\d{10}$/
            var emailId = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (emailId.test(value)) {
                console.log('email check')
                item['validation'] = true
                item['format'] = 'email'
                this.setState({ inputData: item, error: false })
            } else if (phoneNum.test(value)) {
                console.log('ph check')
                item['validation'] = true
                item['format'] = 'ph'
                this.setState({ inputData: item, error: false })
            } else {
                console.log('email erroe check')
                item['validation'] = false
                item['error'] = false
                item['errorMsg'] = isNaN(value) ? "Invalid Email" : "Invalid Mobile Number"
                this.setState({ inputData: item, error: true })
            }
        }
        if (item.name == 'undergroup') {
            var idRegx = /^([a-zA-Z0-9])$/
            if (idRegx.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid Undergroup"
                this.setState({ inputData: item })
            }
        }
        if (item.type == "password" || item.name == 'password') {
            let pwd = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,20})/;
            if (pwd.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Password must contain at least 8 characters, including uppercase, lowercase letters and numbers."
                this.setState({ inputData: item })
            }
        }

        if ((item.type == "text" || item.type == "number") && item.name !== 'password' || item.type == "select") {
            if (value.length == 0 && item['requiredBoolean'] != undefined) {
                if (item['requiredBoolean']) {
                    console.log('iside')
                    item['validation'] = false
                    item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                    item['error'] = false
                    item['errorMsg'] = `Invalid ${item.label}`
                    this.setState({ inputData: item })
                }
                else {
                    item['validation'] = true
                    this.setState({ inputData: item, error: false })
                }
            }
            else {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
        }
        if ((item.type == "number")) {
            if (value.length == 0 && item['requiredBoolean'] != undefined && String(item['defaultValue']).includes('e')) {
                if (item['requiredBoolean']) {
                    console.log('iside')
                    item['validation'] = false
                    item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                    item['error'] = false
                    item['errorMsg'] = `Invalid ${item.label}`
                    this.setState({ inputData: item })
                }
                else {
                    item['validation'] = true
                    this.setState({ inputData: item, error: false })
                }
            }
            else {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
        }
        if (item.name == "gstin") {
            let gstValue = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (value.length == 15) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })

            }
        }
        if (item.name == "phoneno" || item.name == "phonenumber1" || item.name == "phonenumber" || item.name == "phonenumber2" || item.name == 'branchPhoneNumber1' || item.name == 'branchPhoneNumber2' || item.name == 'branchphonenumber1' || item.name == 'branchphonenumber2' || item.name == 'organisationphonenumber') {
            var phoneno = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/
            if (value.length != 10) {
                console.log('iside')
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
            else {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
        }
        if (item.name == 'pincode') {
            var pinccode = new RegExp("^[1-9][0-9]{5}$")
            var newpin = new RegExp("^[1-9][0-9]{4}$")
            if (pinccode.test(value) || newpin.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'pan' || item.name == 'promoterpan') {
            var panno = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/
            if (panno.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'bankifsc') {
            // var ifscno = /^([A-Z]){4}([0-9]){7}?$/
            if (String(value.length) == 11) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'esiaccountnumber') {
            if (String(value.length) == 17) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'ESIIP') {
            if (String(value.length) == 10) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'aadhaar' || item.name == 'promoteraadharcardnumber' || item.name == 'pfaccountnumber' || item.name == 'UAN') {
            if (String(value.length) == 12) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid Aadhaar Number"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'bankaccountname' || item.name == 'firstname' || item.name == 'lastname' || item.name == 'bankname' || item.name == 'city/town') {
            var bankname = /^[a-zA-Z][a-zA-Z\s]*$/
            if (bankname.test(value)) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['error'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['errorMsg'] = "Invalid ${item.label}"
                this.setState({ inputData: item })
            }
        }
        if (item.name == 'bankaccountnumber' || item.name == 'bankaccountno') {
            if (String(value.length) <= 18) {
                item['validation'] = true
                this.setState({ inputData: item, error: false })
            }
            else {
                item['validation'] = false
                item['required'] = String(value).length > 0 ? true : item['requiredBoolean'] == undefined ? false : item['requiredBoolean']
                item['error'] = false
                item['errorMsg'] = "Invalid Aadhaar Number"
                this.setState({ inputData: item })
            }
        }

        this.props.onInputChanges(value, item, e)
        console.log('asdaf')
        this.setState({ error: false })
        // if (String(value).length < 5) {
        //     this.setState({ error: true })
        // } else {
        //     this.setState({ error: false })
        // }
    }
    onShowPassword = (item) => {
        this.setState({ showPassword: !this.state.showPassword }, () => {
            item['type'] = this.state.showPassword ? 'text' : 'password'
            this.setState({ inputData: item })
        })
    }
    render() {
        return (
            <React.Fragment>
                <div className={this.state.inputData.class}>
                    <p className="input-label">{this.state.inputData.label} {this.state.inputData.requiredBoolean === false ? null : <span className="mandatory">*</span>}</p>
                    {/* <p className="input-label">{this.state.inputData.label} {this.state.inputData.label === "Remarks" ? null : <span className="mandatory">*</span> }</p> */}
                    <TextField
                        name={this.state.inputData.name}
                        rows={this.state.inputData.row != undefined ? this.state.inputData.row : null}
                        multiline={this.state.inputData.row != undefined ? true : false}
                        id={this.state.inputData.name}
                        placeholder={"Enter" + " " + this.state.inputData.label}
                        // label={this.state.inputData.label}
                        value ={this.state.inputData.defaultValue}
                        defaultValue={this.state.inputData.defaultValue === undefined ? "" : this.state.inputData.defaultValue}
                        variant="filled"
                        required={this.state.inputData.required}
                        InputProps={{
                            readOnly: this.state.inputData.readOnly,
                        }}
                        type={this.state.inputData.type}
                        helperText={this.state.inputData.error ? this.state.inputData.errorMsg : ""}
                        error={this.state.inputData.error}
                        onChange={(e) => this.inputChanges(e, this.state.inputData)}
                        autoFocus={this.state.inputData.focus === undefined ? false : this.state.inputData.focus}
                        autoComplete="off"
                        >
                    </TextField>

                    {this.state.inputData.password ?
                        <IconButton onClick={() => this.onShowPassword(this.state.inputData)}>
                            <React.Fragment>
                                {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                            </React.Fragment>
                        </IconButton>
                        : null}
                </div>
            </React.Fragment>
        )
    }
}