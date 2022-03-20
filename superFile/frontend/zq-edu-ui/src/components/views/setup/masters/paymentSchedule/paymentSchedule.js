import React, { Component } from "react";
import '../../../../../scss/student.scss';
import '../../../../../scss/setup.scss';
import Loader from "../../../../../utils/loader/loaders";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ContainerNavbar from "../../../../../gigaLayout/container-navbar";
import ZqTable from "../../../../../utils/Table/table-component";
import PaginationUI from "../../../../../utils/pagination/pagination";
import ZenTabs from '../../../../../components/input/tabs';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import RestoreOutlinedIcon from '@material-ui/icons/RestoreOutlined';
import ZenForm from "../../../../input/zqform";
import GoodsData from "./paymentSchedule.json";
import axios from 'axios';
import moment from 'moment';
class paymentSchedule extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "List of Payment Schedules",
                isName: true,
                isSearch: true,
                isSort: true,
                isPrint: true,
                isDownload: false,
                isShare: false,
                isNew: false,
                newName: "New",
                isSubmit: false,
            },
            sampleStudentsData: [],
            paymentSchedulejson: {
                "General": [
                    {
                        "category": "input",
                        "type": "text",
                        "name": "dueDate",
                        "label": "Due Date",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "percentage",
                        "label": "Percentage",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    }
                ],
                "Schedule Details": [
                    {
                        "category": "input",
                        "type": "text",
                        "name": "id",
                        "label": "ID",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "title",
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
                        "name": "description",
                        "label": "Description",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    }
                ],
                "Fees Breakup": [
                    {
                        "type": "select",
                        "name": "collectEvery",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "Collect Every",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "Year",
                                "value": "Year"
                            },
                            {
                                "label": "Month",
                                "value": "Month"
                            }
                        ]
                    },
                    {
                        "type": "select",
                        "name": "byDueDate",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "By due Date",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "second",
                                "value": "second"
                            }
                        ]
                    }
                ]
            },
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            tableView: true,
            tableResTxt: "Fetching Data ..."
        }
    }
    componentDidMount() {
        this.getTableData()
    }
    getTableData = () => {
        this.setState({ sampleStudentsData: [] })
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/paymentSchedule?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                'Authorization': this.state.authToken,
            }
        })
            .then(res => {
                console.log(res);
                let paymantSchedule = [];
                res.data.data.map((data) => {
                    paymantSchedule.push(
                        {
                            "ID": data.displayName,
                            "TITLE": data.title,
                            "DESCRIPTION": data.description,
                            "BREAKUP": data.feesBreakUp[0].percentage + "%",
                            "DUE DATE": data.scheduleDetails.dueDate,
                            "CREATED ON": data.createdAt !== "" ? moment(data.createdAt).format('DD/MM/YYYY') : "-",
                            "CREATED BY": data.createdBy,
                            "Version": data.__v
                        }
                    )
                })
                console.log(paymantSchedule);
                this.setState({ sampleStudentsData: paymantSchedule, totalPages: res.data.totalPages, page: res.data.currentPage })
            })
            .catch(err => {
                console.log(err);
                this.setState({ tableResTxt: "Loading Error" })
            })
    }
    handleBackFun = () => {
        this.setState({ tableView: true, preview: false })
    }
    onPreviewStudentList = (e) => {
        console.log(e);
        this.setState({ tabViewForm: true })
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            console.log(page, limit);
            this.getTableData()
        });
    };
    moveBackTable = () => {
        this.setState({ tableView: true })
    }
    handleTabChange = (tabName, formDatas) => { console.log(tabName, formDatas) }
    onAddGoods = () => {
        this.setState({ GoodsFormData: GoodsData }, () => {
            this.setState({ tableView: false, preview: false });
        })
    };
    render() {
        return (
            <div className="list-of-programPlan-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tableView == true ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            {/* <ArrowBackIosIcon className="top-header-icon" />    */}
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            <p className="top-header-title">Masters</p>
                        </div>
                        <div className="masters-body-div">
                            {this.state.containerNav == undefined ? null :
                                <React.Fragment>
                                    <ContainerNavbar containerNav={this.state.containerNav} onAddNew={() => { this.onAddGoods(); }} />
                                    <div className="print-time">{this.state.printTime}</div>
                                </React.Fragment>}
                            <div className="remove-last-child-table">
                                {this.state.sampleStudentsData.length !== 0 ?
                                    <ZqTable
                                        data={this.state.sampleStudentsData}
                                        rowClick={(item) => { this.onPreviewStudentList(item) }}
                                        onRowCheckBox={(item) => { this.onPreviewStudentList(item) }}
                                    /> : <p className="noprog-txt">{this.state.tableResTxt}</p>
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
                                    <h6 className="preview-Id-content">New payment schedule</h6>
                                </div>
                                {/* <div className="notes-history-wrapper">
                                    <div className="history-icon-box" title="View History" onClick={this.showHistory}> <RestoreOutlinedIcon className="material-historyIcon" /> <p>History</p></div>
                                </div> */}
                            </div>
                            <div className="organisation-table">
                                <ZenTabs tabData={this.state.paymentSchedulejson} className="preview-wrap" tabEdit={this.state.preview} form={this.state.paymentSchedulejson} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        )
    }
}
export default paymentSchedule;