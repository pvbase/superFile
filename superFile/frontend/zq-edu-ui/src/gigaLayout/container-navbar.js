import React, { Component } from 'react';
import AddIcon from '@material-ui/icons/Add';
import SortIcon from '@material-ui/icons/Sort';
import SearchIcon from '@material-ui/icons/Search';
import SearchSVG from '../assets/icons/table-search-icon.svg';
import SortSVG from '../assets/icons/table-sort-icon.svg';
import DownloadSVG from '../assets/icons/table-download-icon.svg';
import ShareSVG from '../assets/icons/table-share-icon.svg';

import PrintSVG from '../assets/icons/table-print-icon.svg';
import PrintIcon from '@material-ui/icons/Print';
import ShareIcon from '@material-ui/icons/Share';
import { withRouter } from 'react-router-dom';
import GetAppIcon from '@material-ui/icons/GetApp';
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace';
import PublishSharpIcon from '@material-ui/icons/PublishSharp';
import { SelectPicker } from 'rsuite';

class ContainerNavbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            email: localStorage.getItem('email'),
            channel: localStorage.getItem('channel'),
            authToken: localStorage.getItem('auth_token'),
            tab: 0,
            containerNav: undefined,
            // printTimeStamp:''

        }

    }
    printScreen = () => {

        window.print()

    }
    onDownload=()=>{
        console.log('download event')
        this.props.onDownload()
    }
    componentWillMount = () => {
        console.log(this.props.containerNav)
        if (this.props.containerNav != undefined) {
            this.setState({ containerNav: this.props.containerNav })
        }
    }
    render() {
        return (<React.Fragment >
            {this.state.containerNav != undefined ? <div className="invoice-page-header container-nav-wrap">
                <div className="header-title">
                    {/* {this.state.containerNav.isBack ? <div className="icon-back-arrow-box"><KeyboardBackspaceIcon className="icon-back-arrow" onClick={() => { this.props.history.goBack() }} /></div> : null} */}
                    <p className="header-txt">{this.state.containerNav.name}
                        <span className="invoices-count-text">{this.state.containerNav.isTotalCount ? (this.state.containerNav.total) : null}</span>
                    </p>
                </div>
                <div className="header-tools">
                    {this.state.containerNav.isSearch ? <div className="icon-box" tooltip-title="Search">
                        {/* <SearchIcon className="material-searchIcon" /> */}
                        <img src={SearchSVG} alt="Search" className="material-searchIcon" ></img>
                    </div> : null}
                    {this.state.containerNav.isSort ? <div className="icon-box" tooltip-title="Filter">
                        {/* <SortIcon className="material-SortIcon" /> */}
                        <img src={SortSVG} alt="Sort" className="material-searchIcon"></img>
                    </div> : null}
                    {this.state.containerNav.isPrint ?
                        <div className="icon-box" tooltip-title="Print" onClick={this.printScreen}>
                            <img src={PrintSVG} alt="Print" className="material-searchIcon" ></img>
                        </div> : null}
                    {this.state.containerNav.isDownload ?
                        <div className="icon-box" tooltip-title={this.state.downloadTitle == undefined ? "Download" : this.state.downloadTitle}>
                            {/* <GetAppIcon className="material-SortIcon" /> */}
                            <img src={DownloadSVG} onClick={() => this.props.onDownload()} alt="Download" className="material-searchIcon"></img>
                        </div> : null}
                    {this.state.containerNav.isShare ? <div className="icon-box" tooltip-title="Share" style={{ marginRight: this.state.containerNav.isNew ? '10px' : '0px' }}>
                        {/* <ShareIcon className="material-SortIcon" /> */}
                        <img src={ShareSVG} alt="Share" className="material-searchIcon"></img>
                    </div> : null}
                    {this.state.containerNav.isNew ? <div>
                        <button className="add-item-btn" onClick={() => this.props.onAddNew()} tooltip-title={this.state.containerNav.name == "Support" ? 'Create New Ticket' : "Add New " + this.state.containerNav.name} >{!this.state.containerNav.isSubmit ? <AddIcon className="material-addIcon" /> : null}{this.state.containerNav.newName}</button>
                    </div> : null}
                    {this.state.containerNav.isDownloadTemp ? <div>
                        <button className="add-item-btn ctcDownload-btn" onClick={() => this.onDownload()} tooltip-title={"Download"} style={{ width: "162px", marginLeft: "-1px" }}>{!this.state.containerNav.isSubmit ? <GetAppIcon className="material-addIcon" /> : null}{this.state.containerNav.downloadName}</button>
                    </div> : null}
                    {this.state.containerNav.isDownloadTemp ? <div>
                        <button className="add-item-btn ctcUpload-btn" onClick={() => this.props.onUpload()} tooltip-title={"Upload"} style={{ width: "162px" }}>{!this.state.containerNav.isSubmit ? <PublishSharpIcon className="material-addIcon" /> : null}{this.state.containerNav.uploadName}</button>
                    </div> : null}
                    {this.state.containerNav.isPayslipBtn ? <div>
                        <button className="add-item-btn" onClick={() => this.props.onSendPayslip()} tooltip-title={"Send Payslip"} >{this.state.containerNav.PayslipBtnName}</button>
                    </div> : null}
                    {/* <div className="pay-receive-header-btns" style={{ width: '151px' }} title="Date Duration">
                                    <SelectPicker title="Select Duration" className="select-picker-duration" defaultValue={String('all')} placeholder="Select Duration" data={this.state.DateDuration} onChange={this.DurationSelect} />
                                </div> */}
                    {this.state.containerNav.isSelectPeriod ? <div className="pay-receive-header-btns" style={{ width: '151px' }} title="Date Duration">
                        <SelectPicker className="SelectPicker-branch" placeholder="Select Duration" data={this.state.DateDuration} onChange={this.DurationSelect} />
                    </div> : null}
                    {this.state.containerNav.isMasterPayslipName ? <div>
                        <button className="add-item-btn ctcUpload-btn SubmitPayslip" tooltip-title={"Submit Payslip"} onClick={() => this.props.onSubmitPayslip()} >{this.state.containerNav.masterPayslipName}</button>
                    </div> : null}

                </div>
            </div> : null}
        </React.Fragment >);
    }
}

export default withRouter(ContainerNavbar);