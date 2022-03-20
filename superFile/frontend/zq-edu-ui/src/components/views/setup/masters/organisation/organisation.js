import React from 'react';
import '../../../../../scss/organisation.scss';
import '../../../../../scss/setup.scss';
import ZqTable from '../../../../../utils/Table/table-component';
import ZenTabs from '../../../../input/tabs';
import RestoreOutlinedIcon from '@material-ui/icons/RestoreOutlined';
import ContainerNavbar from '../../../../../gigaLayout/container-navbar';
import orgForm from './organisation.json';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import ZqHistory from '../../../../../gigaLayout/change-history';
import { Drawer } from 'rsuite';
import moment from 'moment';
import Axios from 'axios';
import zq_api from '../../../../../utils/api-service';
import Loader from '../../../../../utils/loader/loaders';
import { Alert } from 'rsuite';


class Organisation extends React.Component {
    constructor(props) {
        super(props);
        this.zq_api = new zq_api();
        this.state = {
            OrganisationDetails: [],
            phone: localStorage.getItem('phone'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            channel: localStorage.getItem("channel"),
            useremail: localStorage.getItem('email'),
            orgId: localStorage.getItem('orgId'),
            orgname: localStorage.getItem('orgName'),
            username: localStorage.getItem('username'),
            userID: localStorage.getItem('userID'),
            noProg: 'Fetching Details..',
            isLoader: false,
            tabview: true,
            orgFormData: [],
            orgName: '',
            globalSearch: false,
            containerNav: {
                isBack: false,
                name: 'Organization',
                isName: true,
                total: 0,
                isTotalCount: false,
                isSearch: false,
                isSort: false,
                isPrint: false,
                isDownload: false,
                isShare: false,
                isNew: false,
                newName: "New",
                isSubmit: false
            },
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            idosBranchId: '',
            entityInstanceId: '',
            history: false,
            showHistory: false,
            historyData: [],
            idosId: '',
            dateofregistration: '',
            toggleForm: false
        }

    }


    componentWillMount() {
        this.getOrganisation();
        this.setState({ orgFormData: orgForm }, () => {
            if (this.props.location.data != undefined) {
                this.setState({ globalSearch: true }, () => {
                    this.onPreviewOrganisation(this.props.location.data)
                })
            }
        })
        console.log(this.props)

    }



    getOrganisation = () => {
        this.setState({ isLoader: true })
        Axios.get(`${this.state.env['zqBaseUri']}/master/get/organization?orgId=${this.state.orgId}`)
            // Axios.get(`${this.state.env['zqBaseUri']}/master/get/organization?orgId=5f65dd7f7791680008d07d2e `)
            .then(res => {
                let orgArray = [];
                var respData = res.data.data
                orgArray.push({
                    'Company Name': respData.orgDetails['tradeName'],
                    'Email': respData.orgDetails['email'],
                    'GSTIN': respData.orgDetails['companyGSTIN'],
                    'Phone Number': String(respData.orgDetails['phoneNumber1']).length > 0 ? respData.orgDetails['phoneNumber1'] : '-',
                    'Address': respData.orgDetails['address3'],
                    'Website': respData.orgDetails['website'] ? respData.orgDetails['website'] : '-',
                    'Item': JSON.stringify(respData)
                })

                this.setState({ OrganisationDetails: orgArray, noProg: 'No Data' })
                this.setState({ isLoader: false })

            })

            .catch(err => {
                this.setState({ OrganisationDetails: [], noProg: 'No Data' })
                this.setState({ isLoader: false })

            })

    }
    getChangeHistory = (entityInstanceId) => {
        Axios.get(`${this.state.env['newMasterId']}/master/changeHistory/getChangeHistory?org=${this.state.orgId}&entity=org&entityInstanceId=${entityInstanceId}`)
            .then((response) => {
                let api_data = response.data
                let historyData = []
                api_data.sort((data1, data2) => { return Number(data2.created_at) - Number(data1.created_at) })

                api_data.map(item => {
                    let date = new Date(new Intl.DateTimeFormat('en-US', { month: '2-digit', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(item['created_at']))
                    let descriptionData = item.description['0'].split(',').map((desc, i) => {
                        return <p key={i}><div style={{ display: "flex" }}><span className="span-hist" style={{ width: "5%" }}>-</span>{desc}</div></p>;
                    })
                    historyData.push({
                        "description": descriptionData,
                        "time": moment(date).format("hh:mm"),
                        "created_at": item['created_at'] ? moment(date).format('DD/MM/YYYY (hh:mm A)') : "-",
                        "version": item.version,
                        "btn": false


                    })
                })
                this.setState({ historyData: historyData })

            })
            .catch(err => {
                console.log(err)

            })

    }

    onPreviewOrganisation = (item) => {
        let orgFormData = this.state.orgFormData
        let details = this.state.globalSearch ? item : JSON.parse(item.Item)
        let entityInstanceId = details['_id']
        this.setState({ orgName: item['Company Name'], entityInstanceId: entityInstanceId, idosId: details['idos_id'] })
        this.setState({ tabview: false, preview: true })
        Object.keys(details).map(mainKey => {
            Object.keys(details[mainKey]).map(key => {
                Object.keys(orgFormData).forEach(dataKey => {
                    orgFormData[dataKey].map(item => {

                        let itemName = item.name != undefined ? item.name.toLowerCase().replace(/ /g, "") : ""
                        let keyName = key.toLowerCase().replace(/ /g, "")
                        if (keyName == itemName) {
                            item['defaultValue'] = details[mainKey][key]
                            item['required'] = false
                        }
                        if (itemName === 'orgemail') {
                            item['defaultValue'] = details['orgDetails']['email']
                            item['readOnly'] = true
                            item['error'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'firstname') {
                            item['defaultValue'] = details['ownerDetails']['firstName']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'lastname') {
                            item['defaultValue'] = details['ownerDetails']['lastName']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'email') {
                            item['defaultValue'] = details['ownerDetails']['email']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'aadhaar') {
                            item['defaultValue'] = details['ownerDetails']['aadhaar']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'pan') {
                            item['defaultValue'] = details['ownerDetails']['PAN']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'phonenumber1') {
                            item['defaultValue'] = details['ownerDetails']['phoneNumber1']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'phonenumber2') {
                            item['defaultValue'] = details['ownerDetails']['phoneNumber2']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'bankname') {
                            item['defaultValue'] = details['financialDetails']['bankName']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                            item['required'] = true
                        }
                        if (itemName === 'bankaccountname') {
                            item['defaultValue'] = details['financialDetails']['bankAccountName']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                            item['required'] = true
                        }
                        if (itemName === 'bankaccountnumber') {
                            item['defaultValue'] = details['financialDetails']['bankAccountNumber']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                            item['required'] = true
                        }
                        if (itemName === 'bankifsc') {
                            item['defaultValue'] = details['financialDetails']['bankIFSC']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                            item['required'] = true
                        }
                        if (itemName === 'branchphonenumber1') {
                            item['defaultValue'] = details['orgDetails']['phoneNumber1']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                        }
                        if (itemName === 'branchphonenumber2') {
                            item['defaultValue'] = details['orgDetails']['phoneNumber2']
                            item['readOnly'] = false
                            item.validation = item['defaultValue'] != null ? true : item.requiredBoolean ? false : true
                            item['required'] = false
                        }
                        if (itemName == 'dateofregistration') {
                            item['defaultValue'] = moment(details[mainKey]['dateOfRegistration']).format('YYYY-MM-DD')
                            item['readOnly'] = true
                            this.setState({ dateofregistration: details[mainKey]['dateOfRegistration'] })
                        }

                    })
                })
            })
        })
        this.getChangeHistory(entityInstanceId)
    }


    handleBack = () => {

        if (this.props.location.status != "active") {
            this.resetform()
            this.setState({ tabview: true })
        }
        else {
            this.props.history.goBack();
        }
    }
    handleTabChange = (tabName, formDatas) => {
        console.log(tabName)
        console.log(formDatas)
    }
    onCloseForm = () => {
        this.setState({ showHistory: false })
    }
    showHistory = () => {
        this.getChangeHistory();
        this.setState({ history: true, showHistory: true })
    }
    onFormSubmit = (data, item) => {
        console.log(data, item);
        const { channel, useremail } = this.state;
        this.setState({ isLoader: true })
        let defaultValue1 = {}
        Object.keys(data).forEach(dataKey => {
            data[dataKey].map(item => {
                if (item['name'] == "companygstin") {
                    defaultValue1['companygstin'] = item['defaultValue']
                }
                if (item['name'] == "gstin/uinstatus") {
                    defaultValue1['gstin/uinstatus'] = item['defaultValue']
                }
                if (item['name'] == "fieldvisitconducted?") {
                    defaultValue1['fieldvisitconducted?'] = item['defaultValue']
                }
                if (item['name'] == "dateofregistration") {
                    let val = new Date(item['defaultValue']).valueOf()
                    defaultValue1['dateofregistration'] = val
                }
                if (item['name'] == "website") {
                    defaultValue1['website'] = item['defaultValue']
                }
                if (item['name'] == "orgemail") {
                    defaultValue1['orgemail'] = item['defaultValue']
                }
                if (item['name'] == "branchphonenumber1") {
                    defaultValue1['BranchPhonenumber1'] = item['defaultValue']
                }
                if (item['name'] == "branchphonenumber2") {
                    defaultValue1['BranchPhonenumber2'] = item['defaultValue']
                }
                if (item['name'] == "phonenumber2") {
                    defaultValue1['Phonenumber2'] = item['defaultValue']
                }
                if (item['name'] == "firstname") {
                    defaultValue1['firstname'] = item['defaultValue']
                    item['readOnly'] = false
                    item['required'] = true
                }
                if (item['name'] == "lastname") {
                    defaultValue1['lastname'] = item['defaultValue']
                }
                if (item['name'] == "email") {
                    defaultValue1['email'] = item['defaultValue']
                }
                if (item['name'] == "aadhaar") {
                    defaultValue1['Aadhaar'] = item['defaultValue']
                }
                if (item['name'] == "pan") {
                    defaultValue1['PAN'] = item['defaultValue']
                }
                if (item['name'] == "phonenumber1") {
                    defaultValue1['phonenumber1'] = item['defaultValue']
                }
                if (item['name'] == "phonenumber2") {
                    defaultValue1['phonenumber2'] = item['defaultValue']
                }
                if (item['name'] == "bankname") {
                    defaultValue1['BankName'] = item['defaultValue']
                }
                if (item['name'] == "bankaccountname") {
                    defaultValue1['BankAccountName'] = item['defaultValue']
                }
                if (item['name'] == "bankaccountnumber") {
                    defaultValue1['BankAccountNumber'] = item['defaultValue']
                }
                if (item['name'] == "bankifsc") {
                    defaultValue1['BankIFSC'] = item['defaultValue']
                }
            })
        })
        let payload = {
            "companyGSTIN": defaultValue1['companygstin'],
            "contact": this.state.channel,
            "email": defaultValue1['orgemail'],
            "fieldVisitConducted": defaultValue1['fieldvisitconducted?'],
            "financialDetails": {
                "bankAccountName": defaultValue1['BankAccountName'],
                "bankAccountNumber": defaultValue1['BankAccountNumber'],
                "bankIFSC": defaultValue1['BankIFSC'],
                "bankName": defaultValue1['BankName']
            },
            "ownerDetails": {
                "aadhaar": defaultValue1['Aadhaar'],
                "email": defaultValue1['email'],
                "firstName": defaultValue1['firstname'],
                "lastName": defaultValue1['lastname'],
                "PAN": defaultValue1['PAN'],
                "phoneNumber1": defaultValue1['phonenumber1'],
                "phoneNumber2": defaultValue1['phonenumber2'] ? defaultValue1['phonenumber2'] : null
            },
            "phoneNumber1": defaultValue1['BranchPhonenumber1'],
            "phoneNumber2": defaultValue1['BranchPhonenumber2'] ? defaultValue1['BranchPhonenumber2'] : null,
            "UINStatus": defaultValue1['gstin/uinstatus'],
            "website": defaultValue1['website'],
            "_id": this.state.entityInstanceId,
            "userId": this.state.userID

        }
        fetch(`${this.state.env['zqBaseUri']}/master/update/organization`, {
            method: 'PUT', body: JSON.stringify(payload),
            headers: {
                "Authorization": this.state.authToken,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.status == 200) {
                this.getOrganisation();
                setTimeout(() => {
                    this.resetform()
                    this.setState({ tabview: true });
                    this.setState({ isLoader: false })
                    Alert.success("Organization Updated Successfully.")
                }, 1500);
            }
        })
            .catch(err => {
                this.resetform()
                Alert.error("Something went wrong. Please try again !")
                this.setState({ isLoader: false })
                this.setState({ tabview: true });
            })
    }
    onInputChanges = (value, item, e, dataS) => {
        if (dataS != undefined) {
        } else {
            if (item.name === "branchphonenumber2") {
                if (value.length != 10) {
                    item['requiredBoolean'] = true
                }
            }
        }
    }
    resetform = () => {
        let orgFormData = this.state.orgFormData
        Object.keys(orgFormData).forEach(tab => {
            orgFormData[tab].forEach(task => {
                if (tab != ['GSTIN Based Details'] && task.name != "orgemail") {
                    delete task['defaultValue']
                } else { return null }
                if (task['requiredBoolean'] == true) {
                    task['required'] = true
                } else {
                    task['required'] = false
                }
                task['readOnly'] = false
                task['error'] = false
            })
        })
        this.setState({ orgFormData })
    }


    formBtnHandle = (item) => {
        return item === "clear" ? this.cleartabData() : this.canceltabData();
    };
    cleartabData = () => {
        this.resetform()
        this.setState({ toggleForm: !this.state.toggleForm })
    }
    canceltabData = () => {
        this.resetform()
        this.setState({ tabview: true })

    }
    render() {
        const { loader, } = this.state;
        return (<React.Fragment >
            {this.state.isLoader ? <Loader /> : null}
            <div className="setup-wrap">
                {this.state.tabview ?
                    <React.Fragment>
                        <div className="invoice-page-wrapper new-table-wrap">
                            <div className="headermenu-title">
                                <p className="overall-top-header-title">Setup</p>
                            </div>
                            {this.state.containerNav == undefined ? null : <ContainerNavbar containerNav={this.state.containerNav} />}
                            <div className="table-wrapper" style={{ marginTop: "10px" }}>
                                {this.state.OrganisationDetails.length == 0 ? <p className="noprog-txt">{this.state.noProg}</p> : <React.Fragment>
                                    <div className="remove-last-child-table" >
                                        <ZqTable data={this.state.OrganisationDetails} rowClick={(item) => { this.onPreviewOrganisation(item) }} />
                                    </div> </React.Fragment>}
                            </div>

                        </div>
                    </React.Fragment> :
                    <div className="tab-form-wrapper tab-table">
                        <div className="preview-btns">
                            <div className="preview-header-wrap">
                                < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.handleBack} />
                                <h6 className="preview-Id-content">{this.state.preview ? this.state.orgName : null} </h6>
                                {this.state.preview ? null : <React.Fragment> <div className="active-status-wrapper" style={{ marginLeft: '10px' }}> <p className="active-status-content">Active</p></div></React.Fragment>}
                            </div>



                            <div className="notes-history-wrapper">
                                <div className="history-icon-box" title="View History" onClick={this.showHistory}> <RestoreOutlinedIcon className="material-historyIcon" /> <p>History</p></div>
                            </div>
                        </div>
                        <div className="organisation-table">
                            {this.state.toggleForm ?
                                <ZenTabs tabData={this.state.orgFormData} tabEdit={this.state.preview} className="preview-wrap" form={orgForm} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                                : <ZenTabs tabData={this.state.orgFormData} className="preview-wrap" form={orgForm} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} clear={true} key={1} />}
                        </div>
                    </div>}
            </div>
            {this.state.history ?
                <Drawer
                    show={this.state.showHistory}
                    onHide={this.close}
                >
                    <ZqHistory historyData={this.state.historyData} onCloseForm={this.onCloseForm} />
                </Drawer>
                : null

            }
        </React.Fragment >)
    }
}
export default Organisation;