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
import GoodsData from "./remainderplan.json";
import axios from "axios";
import moment from 'moment';
class reminderPlan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "List of Reminder Plan",
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
            reminderPlanjson: {
                "General": [
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
                    },
                    {
                        "type": "select",
                        "name": "noOfReminders",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "No of Reminders",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "1",
                                "value": "1"
                            },
                            {
                                "label": "2",
                                "value": "2"
                            },
                            {
                                "label": "3",
                                "value": "3"
                            },
                            {
                                "label": "4",
                                "value": "4"
                            }
                        ]
                    }
                ],
                "Schedule Details": [
                    {
                        "type": "select",
                        "name": "demandNoteDay",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "Demand Note Day",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "10",
                                "value": "10"
                            },
                            {
                                "label": "15",
                                "value": "15"
                            },
                            {
                                "label": "20",
                                "value": "20"
                            },
                            {
                                "label": "25",
                                "value": "25"
                            }
                        ]
                    },
                    {
                        "type": "select",
                        "name": "firstReminderDay",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "1st Reminder Day",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "10",
                                "value": "10"
                            },
                            {
                                "label": "15",
                                "value": "15"
                            },
                            {
                                "label": "20",
                                "value": "20"
                            },
                            {
                                "label": "25",
                                "value": "25"
                            }
                        ]
                    },
                    {
                        "type": "select",
                        "name": "secondReminderDay",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "2nd Reminder Day",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "10",
                                "value": "10"
                            },
                            {
                                "label": "15",
                                "value": "15"
                            },
                            {
                                "label": "20",
                                "value": "20"
                            },
                            {
                                "label": "25",
                                "value": "25"
                            }
                        ],
                        "defaultValue": "10"
                    }
                ]
            },
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            tableView: true,
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
            url: `https://apidev.zenqore.com/edu/master/reminders?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                'Authorization': this.state.authToken,
            }
        })
            .then(res => {
                if (res.data.status == "success") {
                    if (res.data.data.length == 0) {
                        this.setState({ tableResTxt: "No Data" })
                    }
                    else {
                        console.log(res);
                        let paymantSchedule = [];
                        res.data.data.map((data) => {
                            paymantSchedule.push(
                                {
                                    "Id": data.displayName,
                                    "Title": data.title,
                                    "Description": data.description,
                                    "Nos": data.nos,
                                    "created on": data.createdAt !== "" ? moment(data.createdAt).format('DD/MM/YYYY') : "-",
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
        this.setState({ tabViewForm: false })
    }
    handleTabChange = (tabName, formDatas) => { console.log(tabName, formDatas) }
    onAddGoods = () => {
        this.setState({ GoodsFormData: GoodsData }, () => {
            this.setState({ tableView: false, preview: false });
        })
    };
    render() {
        return (
            <div className="list-of-reminder-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tableView == true ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            {/* <ArrowBackIosIcon className="top-header-icon" /> */}
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
                                    < ZqTable
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
                                    <h6 className="preview-Id-content">Add New Reminder</h6>
                                </div>
                                {/* <div className="notes-history-wrapper">
                                    <div className="history-icon-box" title="View History" onClick={this.showHistory}> <RestoreOutlinedIcon className="material-historyIcon" /> <p>History</p></div>
                                </div> */}
                            </div>
                            <div className="organisation-table">
                                <ZenTabs tabData={this.state.reminderPlanjson} className="preview-wrap" tabEdit={this.state.preview} form={this.state.reminderPlanjson} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        )
    }
}
export default reminderPlan;