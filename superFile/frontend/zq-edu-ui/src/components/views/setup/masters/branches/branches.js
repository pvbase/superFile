import React from 'react';
import '../../../../../scss/branches.scss';
import Axios from 'axios';
import '../../../../../scss/setup.scss';
import ZqTable from '../../../../../utils/Table/table-component';
import Loader from '../../../../../utils/loader/loaders';
import branchForm from './add-branch.json';
import { withRouter } from 'react-router-dom';
import PaginationUI from '../../../../../utils/pagination/pagination';
import ZenTabs from '../../../../input/tabs';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import RestoreOutlinedIcon from '@material-ui/icons/RestoreOutlined';
import NoteOutlinedIcon from '@material-ui/icons/NoteOutlined';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import moment from 'moment';
import ZqHistory from '../../../../../gigaLayout/change-history';
import ContainerNavbar from '../../../../../gigaLayout/container-navbar';
import zq_api from '../../../../../utils/api-service';
import { Alert, Timeline, Drawer } from 'rsuite';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import HistoryIcon from '@material-ui/icons/History';

class Branches extends React.Component {
    constructor(props) {
        super(props);
        this.zq_api = new zq_api();
        this.state = {
            printTime: '',
            branchData: [],
            TableView: true,
            branchDetails: [],
            showIcons: false,
            paginationView: false,
            useremail: localStorage.getItem('email'),
            userID: localStorage.getItem('userID'),
            phone: localStorage.getItem('phone'),
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            orgName: localStorage.getItem('orgName'),
            username: localStorage.getItem('username'),
            noProg: 'Fetching Details..',
            monthName: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            isLoader: false,
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            branchFormData: [],
            tabview: true,
            history: false,
            showHistory: false,
            historyData: [],
            Headquarters: false,
            containerNav: {
                isBack: false,
                name: 'Branches',
                isName: true,
                total: 0,
                isTotalCount: false,
                isSearch: true,
                isSort: true,
                isPrint: true,
                isDownload: false,
                isShare: false,
                isNew: true,
                newName: "New",
                isSubmit: false
            },
            idosBranchId: '',
            entityInstanceId: '',
            parentID: [],
            entityData: [],
            parentValue: '',
            globalSearch: false,
            toggleForm: false,
            GSTINData: '',
        }
        this.showHistory = this.showHistory.bind(this);
    }
    componentDidMount() {
        this.getTime();
        this.getBranches();
        this.getEntity();
    }
    componentWillMount() {
        this.setState({ branchFormData: branchForm }, () => {
            if (this.props.location.data != undefined) {
                this.setState({ globalSearch: true }, () => {
                    this.onPreviewBranches(this.props.location.data)
                })
            }
        });

    }
    getTime = () => {

        setInterval(() => {
            this.setState({
                printTime: moment(new Date()).format('DD/MM/YYYY (hh:mm:ss A)').toLocaleString()
            })
        }, 1000)
    }
    showHistory = () => {
        this.setState({ history: true, showHistory: true })
    }
    getBranches = () => {
        this.setState({ isLoader: true })
        let apiDetails = {
            url: `${this.state.env['zqBaseUri']}/master/get/branches?org=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}&pagination=true`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('auth_token')
            }
        }
        this.zq_api.get(apiDetails).then(res => {
            if (res.failed == undefined) {
                console.log(res)
                if (res.data.length !== 0) {
                    var api_data = res.data;
                    // let currentPage = api_data.page
                    // let nextPage = api_data.next_page
                    // let limit = api_data.perPage
                    // let total = api_data.total
                    // let totalPages = api_data.total_pages
                    var branchData = []
                    // this.setState({ totalPages: totalPages, totalRecord: total, limit })
                    console.log(api_data, 'api_data')
                    api_data.map(item => {
                        branchData.push({
                            // "ID": item.BranchId,
                            "Name": item['branchDetails'].branchName == undefined ? item['contactDetails'].firstName + " " + item['contactDetails'].lastName : item['branchDetails'].branchName,
                            "GSTIN": item['branchDetails'].GSTIN,
                            "Phone Number": item['contactDetails'].phoneNumber1,
                            "Email": item['contactDetails'].email,
                            "Version": "V" + item['version'],
                            "Modified Date": item['updatedAt'] ? moment(item['updatedAt']).format('DD/MM/YYYY') : "-",
                            "Status": item.status === 'active' ? 'Active' : null,
                            "Item": JSON.stringify(item)
                        })
                    })
                    this.setState({ branchDetails: branchData })
                    this.setState({ isLoader: false })
                }
                else {
                    this.setState({ branchDetails: [], noProg: 'No Data' })
                    this.setState({ isLoader: false })
                }
            }
            else {

                this.setState({ branchDetails: [], noProg: 'No Data' })
                this.setState({ isLoader: false })
            }
        })
    }
    getEntity = (item) => {
        Axios.get(`${this.state.env['zqBaseUri']}/master/entities/${this.state.orgId}`)
            .then((response) => {
                console.log("Entity Response", response)
                if (response.status == 200) {
                    let entityData = response.data;
                    let parentID = []
                    entityData.filter(item => { if (item.level == 1) return item }).forEach(item => {
                        let parentObject = {}
                        parentObject.label = item.name;
                        parentObject.value = item._id;
                        parentID.push(parentObject)
                    })
                    let formData = this.state.branchFormData;
                    formData['GSTIN Based Details'].map((item) => {
                        if (item.name === "undergroup") {
                            item['options'] = parentID
                        }
                    })
                    this.setState({ parentID: parentID, entityData: entityData });
                }
                if (response.status == 'failed') {
                    Alert.info("Cannot generate entity ID")
                }
            }).catch(err => {
                console.log("Entity Error", err)
            })
    }
    getChangeHistory = (entityInstanceId) => {
        Axios.get(`${this.state.env['zqBaseUri']}/zq/changehistory?orgId=${this.state.orgId}&refId=${entityInstanceId}`)
            .then((response) => {
                let api_data = response.data
                let historyData = []
                api_data.sort((data1, data2) => { return Number(data2.updatedAt) - Number(data1.updatedAt) })
                api_data.map(item => {
                    let date = item['updatedAt']
                    let descriptionData = item.description.map((desc, i) => {
                        return <p key={i}><div style={{ display: "flex", paddingBottom: "7px" }}><span className="span-hist" style={{ width: "5%" }}>-</span>{desc}</div></p>;
                    })
                    historyData.push({
                        "description": descriptionData,
                        "updatedAt": item['updatedAt'] ? moment(date).format('DD MMMM, YYYY (hh:mm A)') : "-",
                        "version": item.version,
                        "userDetails": item.userDetails,
                        "btn": false
                    })
                })
                this.setState({ historyData: historyData.reverse() })
            })
            .catch(err => {
                console.log(err)
            })
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            this.getBranches()
        })
    }
    onPreviewBranches = (item) => {
        let branchFormData = this.state.branchFormData
        let details = this.state.globalSearch ? item : JSON.parse(item.Item)
        let objKeys = Object.keys(details)
        let changePreview = details.isHeadquarters
        this.setState({ branchName: item.Name })
        let entityInstanceId = details['_id']
        this.setState({ entityInstanceId: entityInstanceId, idosBranchId: details['idos_id'] })
        this.setState({ tabview: false, preview: true })
        Object.keys(details).filter(item => { if (item !== "parentId") return item }).map(mainKey => {
            Object.keys(details[mainKey]).map(key => {
                Object.keys(branchFormData).forEach(dataKey => {
                    branchFormData[dataKey].map(item => {
                        let itemName = item.name != undefined ? item.name.toLowerCase().replace(/ /g, "") : ""
                        let keyName = key.toLowerCase().replace(/ /g, "")
                        if (keyName == itemName) {
                            item['defaultValue'] = details[mainKey][key]
                            // item['value'] = details[key]
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'headquarters') {
                            let value = details['isHeadquarters']
                            item['defaultValue'] = value
                            this.setState({ Headquarters: value });
                            console.log("HQ", value, item)
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'undergroup') {
                            let value = details['parentId']
                            item['defaultValue'] = value
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'gstin') {
                            item['defaultValue'] = details['branchDetails']['GSTIN']
                            item['readOnly'] = true
                            item['required'] = false
                        }
                        if (itemName == 'branchname') {
                            item['readOnly'] = true
                            item['required'] = false
                        }
                        if (itemName == 'branchemail') {
                            item['defaultValue'] = details['branchDetails']['email']
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'bankifsc') {
                            item['defaultValue'] = details['financialDetails']['bankIFSC']
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'branchphonenumber1') {
                            item['defaultValue'] = details['branchDetails']['phoneNumber1']
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'branchphonenumber2') {
                            item['defaultValue'] = details['branchDetails']['phoneNumber2']
                            item['readOnly'] = false
                            item['required'] = true
                        }
                        if (itemName == 'address1') {
                            item['defaultValue'] = details['branchDetails']['address1']
                            item['readOnly'] = changePreview
                            item['required'] = false
                        }
                        if (itemName == 'address2') {
                            item['defaultValue'] = details['branchDetails']['address2']
                            item['readOnly'] = changePreview
                            item['required'] = false
                        }
                        if (itemName == 'address3') {
                            item['defaultValue'] = details['branchDetails']['address3']
                            item['readOnly'] = changePreview
                            item['required'] = false
                        }
                        if (itemName == 'city/town') {
                            item['defaultValue'] = details['branchDetails']['city']
                            item['readOnly'] = changePreview
                            item['required'] = false
                        }
                        if (itemName == 'pincode') {
                            item['defaultValue'] = details['branchDetails']['PINCode']
                            item['readOnly'] = changePreview
                            item['required'] = false
                        }
                        if (itemName == 'aadhaar') {
                            item['defaultValue'] = details['contactDetails']['aadhaar']
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'phonenumber1') {
                            item['defaultValue'] = details['contactDetails']['phoneNumber1']
                            item['readOnly'] = false
                        }
                        if (itemName == 'phonenumber2') {
                            item['defaultValue'] = details['contactDetails']['phoneNumber2']
                            item['readOnly'] = false
                            item['required'] = true
                        }
                        if (itemName == 'bankaccountno') {
                            let val = Number(details['financialDetails'].bankAccountNumber)
                            item['defaultValue'] = val
                            item['readOnly'] = false
                            item['required'] = false
                        }
                        if (itemName == 'email') {
                            item['defaultValue'] = details['contactDetails']['email']
                        }
                        if (itemName == 'pan') {
                            item['defaultValue'] = details['contactDetails']['PAN']
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
    onAddBranches = () => {
        this.setState({ branchFormData: branchForm }, () => {
            // console.log(this.state.branchFormData)
            this.setState({ tabview: false, preview: false, Headquarters: true })
        })
    }
    resetform = () => {
        let branchFormData = this.state.branchFormData
        Object.keys(branchFormData).forEach(tab => {
            branchFormData[tab].forEach(task => {
                delete task['defaultValue']
                task['required'] = task['requiredBoolean']
                task['validation'] = false
                task['readOnly'] = false
                task['error'] = false
            })
        })
        this.setState({ branchFormData })
    }
    formBtnHandle = (item) => {
        return item === "clear" ? this.cleartabData() : this.canceltabData();
    };
    canceltabData = () => {
        this.resetform()
        this.setState({ tabview: true })

    }
    handleTabChange = (tabName, formDatas) => {
        // console.log(tabName)
        // console.log(formDatas)
    }
    onFormSubmit = (data, item) => {
        this.setState({ isLoader: true })
        // console.log(data, item);
        const { channel, useremail } = this.state;
        let GSTINData = data['GSTIN Based Details']
        let contactData = data['Contact Details']
        let financeData = data['Financial Details']
        let defaultValue1 = {}
        GSTINData.map(item => {
            if (item['name'] == "headquarters") {
                defaultValue1['headquarters'] = item['defaultValue']
            }
            if (item['name'] == "undergroup") {
                defaultValue1['undergroup'] = item['defaultValue']
            }
            if (item['name'] == "branchname") {
                defaultValue1['BranchName'] = item['defaultValue']
            }
            if (item['name'] == "branchemail") {
                defaultValue1['branchemail'] = item['defaultValue']
            }
            if (item['name'] == "branchPhoneNumber1") {
                defaultValue1['branchPhoneNumber1'] = item['defaultValue']
            }
            if (item['name'] == "branchPhoneNumber2") {
                defaultValue1['branchPhoneNumber2'] = item['defaultValue']
            }
            // if (item['name'] == "branchid") {
            //     defaultValue1['BranchId'] = item['defaultValue']
            // }
            if (item['name'] == "gstin") {
                defaultValue1['GSTIN'] = item['defaultValue']
            }
            if (item['name'] == "address1") {
                defaultValue1['Address1'] = item['defaultValue']
            }
            if (item['name'] == "address2") {
                defaultValue1['Address2'] = item['defaultValue']
            } if (item['name'] == "address3") {
                defaultValue1['Address3'] = item['defaultValue']
            }
            if (item['name'] == "city/town") {
                defaultValue1['City/Town'] = item['defaultValue']
            }
            if (item['name'] == "pincode") {
                defaultValue1['PINCode'] = item['defaultValue']
            }
        })
        contactData.map(item => {
            if (item['name'] == "firstname") {
                defaultValue1['FirstName'] = item['defaultValue']
            }
            if (item['name'] == "lastname") {
                defaultValue1['LastName'] = item['defaultValue']
            }
            if (item['name'] == "email") {
                defaultValue1['EmailAddress'] = item['defaultValue']
            }
            if (item['name'] == "phonenumber1") {
                defaultValue1['Phonenumber1'] = item['defaultValue']
            }
            if (item['name'] == "phonenumber2") {
                defaultValue1['Phonenumber2'] = item['defaultValue']
            }
            if (item['name'] == "aadhaar") {
                defaultValue1['Aadhar'] = item['defaultValue']
            }
        })
        financeData.map(item => {
            if (item['name'] == "pan") {
                defaultValue1['PAN'] = item['defaultValue']
            }
            if (item['name'] == "bankname") {
                defaultValue1['BankName'] = item['defaultValue']
            }
            if (item['name'] == "bankaccountname") {
                defaultValue1['BankAccountName'] = item['defaultValue']
            }
            if (item['name'] == "bankaccountno") {
                defaultValue1['BankAccountNo.'] = item['defaultValue']
            }
            if (item['name'] == "bankifsc") {
                defaultValue1['BankIFSC'] = item['defaultValue']
            }
        })
        if (this.state.preview !== true) {
            let payload = {
                "GSTIN": defaultValue1['GSTIN'].toUpperCase(),
                "email": defaultValue1['branchemail'],
                "isHeadquarters": this.state.Headquarters,
                "financialDetails": {
                    "bankAccountName": defaultValue1['BankAccountName'],
                    "bankAccountNumber": defaultValue1['BankAccountNo.'],
                    "bankIFSC": defaultValue1['BankIFSC'].toUpperCase(),
                    "bankName": defaultValue1['BankName']
                },
                "promoterDetails": {
                    "aadhaar": defaultValue1['Aadhar'],
                    "email": defaultValue1['EmailAddress'],
                    "firstName": defaultValue1['FirstName'],
                    "lastName": defaultValue1['LastName'],
                    "PAN": defaultValue1['PAN'].toUpperCase(),
                    "phoneNumber1": defaultValue1['Phonenumber1'],
                    "phoneNumber2": defaultValue1['Phonenumber2'] ? defaultValue1['Phonenumber2'] : null
                },
                "addressDetails": {
                    "address1": defaultValue1['Address1'],
                    "address2": defaultValue1['Address2'] ? defaultValue1['Address2'] : "-",
                    "address3": defaultValue1['Address3'] ? defaultValue1['Address3'] : "-",
                    "cityTown": defaultValue1['City/Town'],
                    "PINCode": defaultValue1['PINCode']
                },
                "phoneNumber1": defaultValue1['branchPhoneNumber1'],
                "phoneNumber2": defaultValue1['branchPhoneNumber2'] ? defaultValue1['branchPhoneNumber2'] : null,
                "orgId": this.state.orgId,
                "userId": this.state.userID,
                "parentId": this.state.parentValue
            }
            // fetch(`${this.state.env['zqBaseUri']}/master/add/branch`, {
            //     method: 'POST',
            //     body: JSON.stringify(payload),
            //     headers: {
            //         "Authorization": this.state.authToken,
            //         'Content-Type': 'application/json'
            //     }
            // }).then(res => {
            //     res.json()
            //         .then(response => {
            //             if (response.status === "success") {
            //                 setTimeout(() => {
            //                     Alert.success(response.message)
            //                     this.getBranches();
            //                     this.resetform();
            //                     this.setState({ tabview: true })
            //                 }, 1000);
            //                 this.resetform()
            //             }
            //             if (response.failed === true) {
            //                 this.setState({ loader: false })
            //                 Alert.error("Failed to submit")
            //             }
            //             if (response.status === "failure") {
            //                 setTimeout(() => {
            //                     Alert.error(response.message)
            //                     this.setState({ tabview: true })
            //                     this.setState({ loader: false })
            //                     this.resetform()
            //                     this.getBranches();
            //                 }, 1000);
            //             }
            //         })
            //         .catch(err => {
            //             this.resetform()

            //             this.setState({ isLoader: false })
            //             Alert.error('Error occured while Adding branch')
            //         })
            // })

            let apiDetails = {
                url: `${this.state.env['zqBaseUri']}/master/add/branch`,
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": this.state.authToken
                },
                payload: JSON.stringify(payload)
            }
            this.zq_api.post(apiDetails).then(response => {
                if (response.failed == undefined) {
                    console.log("res", response)
                    this.getBranches();
                    setTimeout(() => {
                        Alert.success("Branch Added Successfully")
                        this.resetform();
                        this.setState({ tabview: true })
                    }, 1000);
                    this.resetform()
                }
            })
                .catch(err => {
                    this.resetform()
                    this.setState({ isLoader: false })
                    Alert.error('Error occured while Adding Branch')
                    this.getBranches();
                })
        }
        else {
            let payload = {
                "GSTIN": defaultValue1['GSTIN'].toUpperCase(),
                "email": defaultValue1['branchemail'],
                "isHeadquarters": defaultValue1['headquarters'],
                "financialDetails": {
                    "bankAccountName": defaultValue1['BankAccountName'],
                    "bankAccountNumber": defaultValue1['BankAccountNo.'],
                    "bankIFSC": defaultValue1['BankIFSC'].toUpperCase(),
                    "bankName": defaultValue1['BankName']
                },
                "promoterDetails": {
                    "aadhaar": defaultValue1['Aadhar'],
                    "email": defaultValue1['EmailAddress'],
                    "firstName": defaultValue1['FirstName'],
                    "lastName": defaultValue1['LastName'],
                    "PAN": defaultValue1['PAN'].toUpperCase(),
                    "phoneNumber1": defaultValue1['Phonenumber1'],
                    "phoneNumber2": defaultValue1['Phonenumber2'] ? defaultValue1['Phonenumber2'] : null
                },
                "addressDetails": {
                    "address1": defaultValue1['Address1'],
                    "address2": defaultValue1['Address2'] ? defaultValue1['Address2'] : "-",
                    "address3": defaultValue1['Address3'] ? defaultValue1['Address3'] : "-",
                    "cityTown": defaultValue1['City/Town'],
                    "PINCode": defaultValue1['PINCode']
                },
                "phoneNumber1": defaultValue1['branchPhoneNumber1'],
                "phoneNumber2": defaultValue1['branchPhoneNumber2'] ? defaultValue1['branchPhoneNumber2'] : null,
                "orgId": this.state.orgId,
                "_id": this.state.entityInstanceId,
                "userId": this.state.userID,
                "parentId": this.state.parentValue
            }

            // fetch(`${this.state.env['zqBaseUri']}/master/update/branch`, {
            //     method: 'PUT', body: JSON.stringify(payload),
            //     headers: {
            //         "Authorization": this.state.authToken,
            //         'Content-Type': 'application/json'
            //     }
            // }).then(response => {
            //     this.getBranches();
            //     setTimeout(() => {
            //         this.resetform()
            //         this.setState({ tabview: true });
            //         this.setState({ isLoader: false })
            //     }, 2000);


            // })
            //     .catch(err => {
            //         this.setState({ tabview: true, noProg: 'Fetching Details..' });
            //         this.resetform()
            //         this.setState({ isLoader: false })
            //         Alert.error('Error occured while updating branch')
            //     })


            let updateBranch_apiDetails = {
                url: `${this.state.env['zqBaseUri']}/master/update/branch`,
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": this.state.authToken,
                },
                payload: payload
            }
            this.zq_api.put(updateBranch_apiDetails).then(response => {
                console.log("response", response)
                if (response.status === "success") {
                    this.getBranches();
                    setTimeout(() => {
                        Alert.success("Branch Updated Successfully")
                        this.resetform()
                        this.setState({ tabview: true });
                        this.setState({ isLoader: false })
                    }, 2000);
                }
                if (response.failed === true) {
                    this.getBranches();
                    setTimeout(() => {
                        Alert.info("No Change in Data")
                        this.resetform()
                        this.setState({ tabview: true });
                        this.setState({ isLoader: false })
                    }, 2000);
                }
            })
                .catch(err => {
                    this.setState({ tabview: true, noProg: 'Fetching Details..' });
                    this.resetform()
                    this.setState({ isLoader: false })
                    Alert.error('Error occured while updating branch')
                })
        }
    }
    onCloseForm = () => {
        this.setState({ showHistory: false })
    }

    onInputChanges = (value, item, e, dataS) => {
        if (dataS != undefined) {
            if (dataS.name == "undergroup") {
                var itemValue = value
                this.setState({ parentValue: itemValue });
            }
        }
        if (item.type == 'switch') {
            var branchFormData = this.state.branchFormData
            if (value == false) {
                branchFormData['GSTIN Based Details']['8']['readOnly'] = false
                branchFormData['GSTIN Based Details']['9']['readOnly'] = false
                branchFormData['GSTIN Based Details']['10']['readOnly'] = false
                branchFormData['GSTIN Based Details']['11']['readOnly'] = false
                branchFormData['GSTIN Based Details']['12']['readOnly'] = false
                branchFormData['GSTIN Based Details']['13']['readOnly'] = false
            } else {
                branchFormData['GSTIN Based Details']['8']['readOnly'] = true
                branchFormData['GSTIN Based Details']['9']['readOnly'] = true
                branchFormData['GSTIN Based Details']['10']['readOnly'] = true
                branchFormData['GSTIN Based Details']['11']['readOnly'] = true
                branchFormData['GSTIN Based Details']['12']['readOnly'] = true
                branchFormData['GSTIN Based Details']['13']['readOnly'] = true
            }
            this.setState({ Headquarters: value }, () => {
                this.setState({ branchFormData: {} }, () => {
                    this.setState({ branchFormData: branchFormData })
                });
            });
        }
        if (item.name === 'gstin') {
            let gstValue = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            item['defaultValue'] = value
            if (gstValue.test(value)) {
                this.kycdetails(value)
            }
            else {
                item['focus'] = true
                let issueDetailData = [];
                let formData = this.state.branchFormData;
                this.setState({ branchFormData: [], toggleForm: false }, () => {
                    formData['GSTIN Based Details'].map((data) => {
                        if (data.name === 'branchname') { data['defaultValue'] = '' }
                        else if (data.name === 'address1') { data['defaultValue'] = '' }
                        else if (data.name === 'address2') { data['defaultValue'] = '' }
                        else if (data.name === 'address3') { data['defaultValue'] = '' }
                        else if (data.name === 'city/town') { data['defaultValue'] = '' }
                        else if (data.name === 'pincode') { data['defaultValue'] = '' }
                        // else if (data.name === 'gstin') { data['focus'] = true }
                        else { }

                    });
                    issueDetailData = formData;
                    // console.log(issueDetailData, "issueDetailData");
                    this.setState({
                        branchFormData: issueDetailData,
                        toggleForm: true
                    })
                })
            }

        }
    }
    kycdetails = (value) => {
        // if (this.checksum(value) === true) {

        fetch(`${this.state.env['gstinApi']}/gst/kyc?gstin=${value}`)
            .then(response => response.json())
            .then(success => {
                // console.log(success.status); console.log(success.data);
                // .catch(err => { console.log(err); this.setState({ isLoader: false }); Alert.error('Error loading data') })

                let KYCdata = success.data.data;

                let issueDetailData = [];
                let formData = this.state.branchFormData;
                this.setState({ branchFormData: [], toggleForm: false }, () => {
                    formData['GSTIN Based Details'].map((data) => {
                        if (data.name === 'branchname') { data['defaultValue'] = `${KYCdata.lgnm}` }
                        else if (data.name === 'address1') { data['defaultValue'] = `${KYCdata.pradr.addr.flno === '' ? '' : KYCdata.pradr.addr.flno} ${KYCdata.pradr.addr.st === '' ? '' : KYCdata.pradr.addr.st}` }
                        else if (data.name === 'address2') { data['defaultValue'] = `${KYCdata.pradr.addr.bno === '' ? '' : KYCdata.pradr.addr.bno} ${KYCdata.pradr.addr.bnm === '' ? '' : KYCdata.pradr.addr.bnm}` }
                        else if (data.name === 'address3') { data['defaultValue'] = `${KYCdata.pradr.addr.dst === '' ? KYCdata.pradr.addr.loc : KYCdata.pradr.addr.dst}` }
                        else if (data.name === 'city/town') { data['defaultValue'] = `${KYCdata.pradr.addr.city === '' ? KYCdata.pradr.addr.stcd : KYCdata.pradr.addr.city}` }
                        else if (data.name === 'pincode') { data['defaultValue'] = `${KYCdata.pradr.addr.pncd === '' ? '' : KYCdata.pradr.addr.pncd}` }
                        else { }

                    });
                    issueDetailData = formData;
                    console.log(issueDetailData, "issueDetailData");
                    this.setState({
                        branchFormData: issueDetailData,
                        toggleForm: true
                    })
                })
            })
            .catch(err => { console.log(err); this.setState({ isLoader: false }); Alert.error('Error loading data') })

    }
    checksum = (g) => {
        if (g === '' || g === undefined) { Alert.info("Enter GSTIN Number!") }
        else {
            let p; let regTest = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/.test(g);
            if (regTest) {
                let a = 65, b = 55, c = 36;
                return Array['from'](g).reduce((i, j, k, g) => {
                    p = (p = (j.charCodeAt(0) < a ? parseInt(j) : j.charCodeAt(0) - b) * (k % 2 + 1)) > c ? 1 + (p - c) : p;
                    return k < 14 ? i + p : j == ((c = (c - (i % c))) < 10 ? c : String.fromCharCode(c + b));
                }, 0);
            }
            else { }
            return regTest
        }
    }
    onBlur = (value, item, event, dataS) => {
        // console.log(value, item, event, dataS)
    }

    render() {
        return (<React.Fragment>
            {this.state.isLoader ? <Loader /> : null}
            <div className="setup-wrap">
                {this.state.tabview ?
                    <React.Fragment>
                        <div className="invoice-page-wrapper new-table-wrap">
                            <div className="headermenu-title">
                                <p className="overall-top-header-title">Setup</p>
                            </div>
                            {this.state.containerNav == undefined ? null : <React.Fragment> <ContainerNavbar containerNav={this.state.containerNav} onAddNew={this.onAddBranches} /><div className="print-time">{this.state.printTime}</div></React.Fragment>}
                            <div className="table-wrapper" style={{ marginTop: "10px" }}>
                                {this.state.branchDetails.length == 0 || this.state.isLoader ? <p className="noprog-txt">{this.state.noProg}</p> : <React.Fragment>
                                    <div className="remove-last-child-table" >
                                        <ZqTable data={this.state.branchDetails} rowClick={(item) => { this.onPreviewBranches(item) }} />
                                    </div> </React.Fragment>}
                                {this.state.branchDetails.length !== 0 && <PaginationUI onPaginationApi={this.onPaginationChange} totalPages={this.state.totalPages} limit={this.state.limit} total={this.state.totalRecord} />}
                            </div>

                        </div>
                    </React.Fragment> :
                    <div className="tab-form-wrapper tab-table">
                        <div className="preview-btns">
                            <div className="preview-header-wrap">
                                < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.handleBack} />
                                <h6 className="preview-Id-content">{this.state.preview ? this.state.branchName : "New Branch"}  </h6>
                                {this.state.preview ? <React.Fragment> <div className="active-status-wrapper" style={{ marginLeft: '10px' }}> <p className="active-status-content">Active</p></div></React.Fragment> : null}
                            </div>


                        </div>
                        <div className="notes-history-wrapper">
                            {this.state.preview ? <div className="history-icon-box" title="View History" onClick={this.showHistory}> <HistoryIcon className="coa-change-history-icon" /><p>History</p></div> : null}
                        </div>
                        {this.state.toggleForm ?
                            <ZenTabs tabData={this.state.branchFormData} tabEdit={this.state.preview} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} className="preview-wrap" form={this.state.branchFormData} onInputChanges={this.onInputChanges} onBlur={this.onBlur} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                            : <ZenTabs tabData={this.state.branchFormData} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} className="preview-wrap" form={this.state.branchFormData} onInputChanges={this.onInputChanges} onBlur={this.onBlur} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={1} clear={true} />}
                    </div>
                }
            </div>
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
        </React.Fragment>)
    }
}
export default withRouter(Branches);