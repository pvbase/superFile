import React, { Component } from "react";
import '../../../../../scss/fees-type.scss';
import '../../../../../scss/setup.scss';
import Loader from "../../../../../utils/loader/loaders";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ContainerNavbar from "../../../../../gigaLayout/container-navbar";
import ZqTable from "../../../../../utils/Table/table-component";
import PaginationUI from "../../../../../utils/pagination/pagination";
import ZenTabs from '../../../../../components/input/tabs';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import RestoreOutlinedIcon from '@material-ui/icons/RestoreOutlined';
import ZenForm from "../../../../../components/input/zqform";
import axios from "axios";
import moment from 'moment';
class FeesTypes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "List of Fee Type",
                isName: true,
                isSearch: true,
                isSort: true,
                isPrint: true,
                isDownload: false,
                isShare: false,
                isNew: true,
                newName: "New",
                isSubmit: false,
            },
            sampleStudentsData: [],
            studentsFormjson: [
                {
                    "category": "input",
                    "type": "text",
                    "name": "feesId",
                    "label": "Id",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "feesTitle",
                    "label": "Title",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "feesDescription",
                    "label": "feesDescription",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "feesUnits",
                    "label": "Units",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false
                },
                {
                    "type": "select",
                    "name": "feesFrequency",
                    "class": "select-input-wrap setup-input-wrap",
                    "label": "Frequency",
                    "readOnly": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "options": [
                        {
                            "label": "3 months",
                            "value": "3"
                        },
                        {
                            "label": "6 months",
                            "value": "6"
                        }
                    ]
                },
                {
                    "category": "button",
                    "type": "save",
                    "label": "Save",
                    "class": "secondary-btn form-save-btn goods-save-btn"
                },
                {
                    "category": "button",
                    "type": "submit",
                    "label": "Submit",
                    "class": "primary-btn form-submit-btn goods-sbt-btn",
                    "apiDetails": []
                }
            ],
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            tabViewForm: false,
            studentName: "",
            tableResTxt: "Fetching Data..."
        }
    }
    componentDidMount() {
        this.getTableData()
    }
    getTableData = () => {
        this.setState({ sampleStudentsData: [] })
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/feeTypes?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                'Authorization': this.state.authToken,
            }
        })
            .then(res => {
                console.log(res);
                if (res.data.status == "success") {
                    if (res.data.data.length == 0) {
                        this.setState({ tableResTxt: "No Data" })
                    }
                    else {
                        let paymantSchedule = [];
                        res.data.data.map((data) => {
                            paymantSchedule.push(
                                {
                                    "Id": data.displayName,
                                    "Title": data.title,
                                    "Description": data.description,
                                    "Unit": data.unit,
                                    "frequency": data.frequency,
                                    "Created by": data.createdBy,
                                    "Version": data.__v
                                }
                            )
                        })
                        console.log(paymantSchedule);
                        this.setState({ sampleStudentsData: paymantSchedule, totalPages: res.data.totalPages, page: res.data.currentPage })
                    }
                }
            })
            .catch(err => {
                console.log(err);
                this.setState({ tableResTxt: "Loading Error" })
            })
    }
    handleBackFun = () => {
        this.props.history.goBack();
    }
    onSubmit = (e) => { console.log(e); }
    formBtnHandle = () => { }
    onPreviewStudentList = (e) => {
        console.log(e);
        this.setState({ tabViewForm: true, studentName: "Fee Type Preview" })
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            console.log(page, limit);
            this.getTableData()
        });
    };
    moveBackTable = () => {
        this.setState({ tabViewForm: false })
    }
    handleTabChange = (tabName, formDatas) => { console.log(tabName, formDatas) }
    onFormSubmit = (data, item) => { console.log(data, item); }
    onAddBranches = (e) => {
        this.setState({ tabViewForm: true, studentName: "New Fee Type" })
    }
    render() {
        return (
            <div className="list-of-feeType-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tabViewForm == false ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            <p className="top-header-title">Masters</p>
                        </div>
                        <div className="masters-body-div">
                            {this.state.containerNav == undefined ? null :
                                <React.Fragment>
                                    <ContainerNavbar containerNav={this.state.containerNav} onAddNew={this.onAddBranches} />
                                    <div className="print-time">{this.state.printTime}</div>
                                </React.Fragment>}
                            <div className="remove-last-child-table">
                                {this.state.sampleStudentsData.length !== 0 ?
                                    <ZqTable
                                        data={this.state.sampleStudentsData}
                                        rowClick={(item) => { this.onPreviewStudentList(item) }}
                                        onRowCheckBox={(item) => { this.onPreviewStudentList(item) }}
                                    /> :
                                    <p className="noprog-txt">{this.state.tableResTxt}</p>
                                }
                            </div>
                            <div>
                                {this.state.sampleStudentsData.length !== 0 ?
                                    <PaginationUI
                                        total={this.state.totalRecord}
                                        onPaginationApi={this.onPaginationChange}
                                        totalPages={this.state.totalPages}
                                        limit={this.state.limit}
                                        currentPage={this.state.page}
                                    /> : null}
                            </div>
                        </div>
                    </React.Fragment> :
                    <React.Fragment>
                        <div className="tab-form-wrapper tab-table">
                            <div className="preview-btns">
                                <div className="preview-header-wrap">
                                    < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                    <h6 className="preview-Id-content">{this.state.studentName}</h6>
                                </div>
                                {/* <div className="notes-history-wrapper">
                                    <div className="history-icon-box" title="View History" onClick={this.showHistory}> <RestoreOutlinedIcon className="material-historyIcon" /> <p>History</p></div>
                                </div> */}
                            </div>
                            <div className="goods-header">
                                <p className="info-input-label">DATA INFORMATION</p>
                            </div>
                            <div className="goods-wrapper goods-parent-wrap">
                                <ZenForm
                                    formData={this.state.studentsFormjson}
                                    className="goods-wrap"
                                    onInputChanges={this.onInputChanges}
                                    onFormBtnEvent={(item) => {
                                        this.formBtnHandle(item);
                                    }}
                                    clear={true}
                                    // onSubmit={(e) => this.onSubmit(e)}
                                    onSubmit={(e) => this.onSubmit(e.target.elements)}
                                />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        )
    }
}
export default FeesTypes;