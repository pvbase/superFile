import React, { Component } from "react";
// import '../../../../../scss/student.scss';
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
import ZenForm from "../../../../input/zqform";
import GoodsData from "./feeStructure.json";
import axios from 'axios';
import moment from 'moment';
class feeStructure extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "Fees Structures",
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
            url: `https://apidev.zenqore.com/edu/master/feeStructure?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
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
                                    "ID": data.refId,
                                    "TITLE": data.title,
                                    "DESCRIPTION": data.description,
                                    "CONSISTING OF": data.feesManagers[0],
                                    "CREATED ON": data.createdAt !== "" ? moment(data.createdAt).format('DD/MM/YYYY') : "-",
                                    "CREATED BY": data.createdBy,
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
            <div className="list-of-programPlan-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tableView == true ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            {/* <ArrowBackIosIcon className="top-header-icon" /> */}
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
                        <div className="tab-form-wrapper">
                            <div className="goods-btns services-btns">
                                <div className="preview-header-wrap">
                                    <KeyboardBackspaceSharpIcon
                                        className="keyboard-back-icon"
                                        onClick={this.handleBackFun}
                                    />
                                    <h6 className="preview-Id-content">
                                        {this.state.preview
                                            ? this.state.serviceName
                                            : "New Fee Structure"}
                                    </h6>
                                    {this.state.preview ?
                                        <React.Fragment>
                                            <div
                                                className="active-status-wrapper"
                                                style={{ marginLeft: "10px" }}
                                            >
                                                <p className="active-status-content">Active</p>
                                            </div>
                                        </React.Fragment>
                                        : null}
                                </div>
                                <div className="goods-wrapper service-wrapper">
                                    <div className="goods-header">
                                        <p className="info-input-label">
                                            {this.state.preview
                                                ? "DATA INFORMATION"
                                                : "DATA INFORMATION"}
                                        </p>
                                    </div>
                                    <ZenForm
                                        formData={this.state.GoodsFormData}
                                        className="goods-wrap"
                                        onInputChanges={this.onInputChanges}
                                        onFormBtnEvent={(item) => {
                                            this.formBtnHandle(item);
                                        }}
                                        clear={true}
                                        onSubmit={(e) => this.onSubmit(e.target.elements)}
                                    />
                                </div>

                            </div>
                        </div>
                    </React.Fragment>
                }
            </div>
        )
    }
}
export default feeStructure;