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
import axios from "axios";
import moment from 'moment';
import { FormatListNumberedOutlined } from "@material-ui/icons";
import { Timeline, Drawer } from 'rsuite';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import HistoryIcon from '@material-ui/icons/History';
import ZqHistory from "../../../../../gigaLayout/change-history";

class ListofStudents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "List of Students",
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
            tableResTxt: "Fetching Data...",
            studentsFormjson: {
                "Student Details": [
                    {
                        "category": "input",
                        "type": "text",
                        "name": "firstName",
                        "label": "First Name",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "lastName",
                        "label": "Last Name",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "category": "input",
                        "type": "email",
                        "name": "email",
                        "label": "Email",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "category": "input",
                        "type": "number",
                        "name": "contactStudent",
                        "label": "Contact",
                        "class": "input-wrap",
                        "readOnly": true,
                        "required": false,
                        "requiredBoolean": false,
                        "clear": false
                    },
                    {
                        "type": "select",
                        "name": "gender",
                        "class": "select-input-wrap setup-input-wrap",
                        "label": "Gender",
                        "readOnly": false,
                        "requiredBoolean": false,
                        "clear": false,
                        "options": [
                            {
                                "label": "Male",
                                "value": "male"
                            },
                            {
                                "label": "Female",
                                "value": "female"
                            }
                        ]
                    }
                ],
                "parent Details": [
                    {
                        "category": "input",
                        "type": "text",
                        "name": "fatherName",
                        "label": "Father's Name",
                        "class": "input-wrap branch-input",
                        "readOnly": false,
                        "required": false,
                        "requiredBoolean": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "motherName",
                        "label": "Mother's Name",
                        "class": "input-wrap branch-input",
                        "readOnly": false,
                        "required": false,
                        "requiredBoolean": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "contactParent",
                        "label": "Contact",
                        "class": "input-wrap branch-input",
                        "readOnly": false,
                        "required": false,
                        "requiredBoolean": false
                    },
                    {
                        "category": "input",
                        "type": "text",
                        "name": "addressParent",
                        "label": "Address",
                        "class": "input-wrap branch-input",
                        "readOnly": false,
                        "required": false,
                        "requiredBoolean": false
                    },
                    {
                        "category": "input",
                        "type": "email",
                        "name": "emailParent",
                        "label": "Email",
                        "class": "input-wrap branch-input",
                        "readOnly": false,
                        "required": false,
                        "requiredBoolean": false
                    }
                ]
            },
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            tabViewForm: false,
            studentName: "",
            history: false,
            showHistory: false,
            historyData: [
                {
                    createdAt: "2020-06-30T12:16:54",
                    created_at: "23/07/2020 (02:14 PM)",
                    currentData: "",
                    description: ["First Name was changed from Adibha to Adiba"],
                    entity: "Student",
                    entityInstanceId: "5efb2d36540313064d84f526",
                    orgEmail: "demouser233@demoautoparts.com",
                    orgId: "5eeb331b4ada2a1f00727980",
                    updatedAt: "2020-06-30T12:16:54",
                    userId: "justin@webdesignmagics.com",
                    userDetails: 'prashanth@wdm.com',
                    version: 2,
                    __v: 0,
                    _id: "5efb2d36540313064d84f527",
                },
                {
                    createdAt: "2020-06-30T12:16:54",
                    created_at: "23/07/2020 (12:14 PM)",
                    currentData: "",
                    description: ["Adibha Nisar was added"],
                    entity: "Student",
                    entityInstanceId: "5efb2d36540313064d84f526",
                    orgEmail: "demouser233@demoautoparts.com",
                    orgId: "5eeb331b4ada2a1f00727980",
                    updatedAt: "2020-06-30T12:16:54",
                    userId: "justin@webdesignmagics.com",
                    userDetails: 'prashanth@wdm.com',
                    version: 1,
                    __v: 0,
                    _id: "5efb2d36540313064d84f527",
                },
            ],
        }
    }
    componentDidMount() {
        this.getDetailsData()
    }
    getDetailsData = () => {
        this.setState({ sampleStudentsData: [] })
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/students?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                'Authorization': this.state.authToken
            }
        })
            .then(res => {
                console.log(res);
                let studentsDataTable = [];
                if (res.data.status == "success") {
                    if (res.data.data.length == 0) {
                        this.setState({ tableResTxt: "No Data" })
                    }
                    else {
                        res.data.data.map((data) => {
                            studentsDataTable.push({
                                "Reg No": data.regId,
                                "First Name": data.firstName,
                                "Last Name": data.lastName,
                                // "Admitted On": data.admittedOn !== "" || data.admittedOn !== null  ? moment(data.admittedOn).format('DD/MM/YYYY') : "-",
                                // "Class/Batch": data.category,    
                                "Program plan": data.programPlanId,
                                "parent name": data.guardianDetails[0],
                                "Phone no": data.phoneNo,
                                "Email": data.email
                            })
                        })
                        this.setState({ sampleStudentsData: studentsDataTable, totalApiRes: res.data.data, tabViewForm: false, totalRecord: res.data.totalRecord, totalPages: res.data.totalPages, page: res.data.currentPage })
                    }
                }
                else {
                    this.setState({ tableResTxt: "Error loading Data" })
                }
            })
    }
    handleBackFun = () => {
        this.props.history.goBack();
    }
    onPreviewStudentList = (e) => {
        console.log(e);
        this.setState({ tabViewForm: true, studentName: e['First Name'] + " " + e['Last Name'] })
    }
    onPreviewStudentList1 = (e) => {
        console.log(e);
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            console.log(page, limit);
            this.getDetailsData()
        });
    };
    moveBackTable = () => {
        this.setState({ tabViewForm: false })
    }
    handleTabChange = (tabName, formDatas) => { console.log(tabName, formDatas) }
    onFormSubmit = (data, item) => { console.log(data, item); }
    openHistory = () => {
        this.setState({ history: true, showHistory: true });
    };
    onCloseForm = () => {
        this.setState({ showHistory: false });
    };
    render() {
        return (
            <div className="list-of-students-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tabViewForm == false ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            <p className="top-header-title">Masters | Students</p>
                        </div>
                        <div className="masters-body-div">
                            {this.state.containerNav == undefined ? null :
                                <React.Fragment>
                                    <ContainerNavbar containerNav={this.state.containerNav} />
                                    <div className="print-time">{this.state.printTime}</div>
                                </React.Fragment>}
                            <div className="remove-last-child-table">
                                {this.state.sampleStudentsData.length !== 0 ?
                                    < ZqTable
                                        data={this.state.sampleStudentsData}
                                        rowClick={(item) => { this.onPreviewStudentList(item) }}
                                        onRowCheckBox={(item) => { this.onPreviewStudentList1(item) }}
                                    />
                                    :
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
                                    />
                                    :
                                    null
                                }
                            </div>
                        </div>
                    </React.Fragment> :
                    <React.Fragment>
                        <div className="tab-form-wrapper tab-table">
                            <div className="preview-btns">
                                <div className="preview-header-wrap">
                                    < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                    <h6 className="preview-Id-content">{this.state.studentName}</h6>
                                    {this.state.preview ? null : <React.Fragment> <div className="active-status-wrapper" style={{ marginLeft: '10px' }}> <p className="active-status-content">Active</p></div></React.Fragment>}
                                </div>
                                <div className="notes-history-wrapper" style={{ right: "86px" }}>
                                    <div className="history-icon-box" title="View History" onClick={this.openHistory}> <RestoreOutlinedIcon className="material-historyIcon" /> <p>History</p></div>
                                </div>
                            </div>
                            <div className="organisation-table">
                                <ZenTabs tabData={this.state.studentsFormjson} className="preview-wrap" tabEdit={this.state.preview} form={this.state.studentsFormjson} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                            </div>
                        </div>
                    </React.Fragment>
                }
                {this.state.history ?
                    <Drawer size='xs' placement='right' show={this.state.showHistory}>
                        <Drawer.Header style={{ display: 'flex', paddingRight: '0px' }}>
                            <Drawer.Title className="change-history-title">CHANGE HISTORY</Drawer.Title>
                            <HighlightOffIcon title="Close" onClick={this.onCloseForm} className="change-history-close-btn" />
                        </Drawer.Header>
                        <Drawer.Body>
                            <Timeline align='left'>
                                <ZqHistory historyData={this.state.historyData} onCloseForm={this.onCloseForm} />
                            </Timeline>
                        </Drawer.Body>
                    </Drawer>
                    : null
                }
            </div>
        )
    }
}
export default ListofStudents;