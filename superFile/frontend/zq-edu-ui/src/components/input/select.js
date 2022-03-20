import React, { Component } from 'react';
import { SelectPicker } from 'rsuite';
import { CheckPicker } from 'rsuite';
import { TreePicker } from 'rsuite';

export default class InputSelect extends Component {
    constructor(props) {
        super(props)
        this.state = {
            inputData: {},
            labelFloat: false
        }
    }
    componentWillMount = () => {
        console.log('props', this.props)
        this.setState({ inputData: this.props.inputData }, () => {
            if (this.state.inputData.defaultValue === undefined) {
                this.setState({ labelFloat: false })
            } else {
                this.setState({ labelFloat: true })
            }
        })
    }
    onSelect = (value, item, event, dataS) => {
        console.log(value, item, event)
        console.log(dataS)
        this.props.onInputChanges(value, item, event, dataS)
        dataS['defaultValue'] = value
        item['validation'] = true
        dataS['validation'] = true
        dataS['defaultValue'] = value
        this.setState({ labelFloat: true })
    }
    onSelectTree = (value, item, event, dataS) => {
        console.log(value, item, event)
        this.props.onInputChanges(value, item, event, dataS)
        this.setState({ labelFloat: true })
    }
    onClean = (value, item, event, dataS) => {
        this.setState({ labelFloat: false })
        item['required'] = true
        item['requiredBoolean'] = true
        this.props.cleanData(value, item, event, dataS)
    }
    render() {
        return (
            <React.Fragment>
                {this.state.inputData.selection !== undefined ?
                    <React.Fragment>
                        {this.state.inputData.selection === "multiple" ?
                            <div className={this.state.inputData.class + " material-select-ui"}>
                                <p className="input-label">{this.state.inputData.label}</p>
                                <CheckPicker className="select-input-wrap"
                                    data={this.state.inputData.options}
                                    onSelect={(value, item, event) => this.onSelect(value, item, event, this.state.inputData)}
                                    onClean={this.onClean}
                                    placeholder={"Enter" + " " + this.state.inputData.label}
                                    defaultValue={this.state.inputData.defaultValue === undefined ? "" : this.state.inputData.defaultValue}
                                    disabled={this.state.inputData.readOnly}
                                    helperText={this.state.inputData.error ? this.state.inputData.errorMsg : ""}
                                    error={this.state.inputData.error}
                                />
                                {/* <label className={this.state.labelFloat ? "material-select-label material-select-label-float" : "material-select-label"}>{this.state.inputData.label}</label> */}
                            </div>
                            : <div className={this.state.inputData.class + " material-select-ui"}>
                                <p className="input-label">{this.state.inputData.label} <span className="mandatory">*</span></p>
                                <TreePicker className="select-input-wrap"
                                    data={this.state.inputData.options}
                                    onSelect={(value, item, event) => this.onSelectTree(value, item, event, this.state.inputData)}
                                    onClean={this.onClean}
                                    id={this.state.inputData.name}
                                    placeholder={"Enter" + " " + this.state.inputData.label}
                                    defaultExpandAll
                                    defaultValue={this.state.inputData.defaultValue === undefined ? "" : this.state.inputData.defaultValue}
                                    disabled={this.state.inputData.readOnly}
                                    helperText={this.state.inputData.error ? this.state.inputData.errorMsg : ""}
                                    error={this.state.inputData.error}
                                />
                                {/* <label className={this.state.labelFloat ? "material-select-label material-select-label-float" : "material-select-label"}>{this.state.inputData.label}</label> */}
                            </div>
                        }
                    </React.Fragment>
                    :
                    <div className={this.state.inputData.error ? `${this.state.inputData.class} material-select-ui error-select ` : `${this.state.inputData.class} material-select-ui`}>
                        <p className="input-label">{this.state.inputData.label} {this.state.inputData.requiredBoolean === false ? null : <span className="mandatory">*</span>}</p>
                        <SelectPicker className="select-input-wrap"
                            id={this.state.inputData["name"]}
                            data={this.state.inputData.options}
                            onSelect={(value, item, event) => this.onSelect(value, item, event, this.state.inputData)}
                            onClean={(value) => this.onClean(value, this.state.inputData)}
                            placeholder="Select"
                            defaultValue={this.state.inputData.defaultValue === undefined ? "" : this.state.inputData.defaultValue}
                            disabled={this.state.inputData.readOnly}
                            placement={this.state.inputData.placement === undefined ? "bottom" : this.state.inputData.placement}
                            searchable={this.state.inputData.search === undefined ? true : this.state.inputData.search}
                            helperText={this.state.inputData.error ? this.state.inputData.errorMsg : ""}
                            error={this.state.inputData.error}
                            groupBy={this.state.inputData.role ? "role" : null}
                        />
                        {/* <label className={this.state.labelFloat ? "material-select-label material-select-label-float" : "material-select-label"}>{this.state.inputData.label}</label> */}
                        {this.state.inputData.error ? <p className="MuiFormHelperText-root MuiFormHelperText-contained Mui-error Mui-required" id={this.state.inputData.name}>{this.state.inputData.errorMsg} </p> : null}
                    </div>}
            </React.Fragment>
        )
    }
}