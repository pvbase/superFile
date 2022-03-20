import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import "../../scss/common-table.scss";
import StartSVG from '../../assets/icons/action-start-icon.svg';
import CloseSVG from '../../assets/icons/action-close-icon.svg';
import CancelSVG from '../../assets/icons/action-cancel-icon.svg';
import RemoveSVG from '../../assets/icons/action-remove-icon.svg';
import DownloadSVG from '../../assets/icons/table-download-icon.svg';
import ShareSVG from '../../assets/icons/table-share-icon.svg';
import PrintSVG from '../../assets/icons/table-print-icon.svg';
import EditIcon from '@material-ui/icons/Edit';
import DoneIcon from '@material-ui/icons/Done';
import CloseIcon from '@material-ui/icons/Close';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';


import PrintIcon from '@material-ui/icons/Print';
import ShareIcon from '@material-ui/icons/Share';
import GetAppIcon from '@material-ui/icons/GetApp';
class ZqTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableData: [],
      checked: false,
      selectedItem: [],
      isSort: false,
      showDate: false,
      dateOfTableData: {}
    };
  }
  componentWillMount = () => {
    console.log(this.props.showDate)
    if (this.props.showDate != undefined) {
      this.setState({ showDate: this.props.showDate })
    }
  }
  componentDidMount = () => {
    console.log(this.props);
    let data = this.props.data;
    let tableData = [];
    let tableHd = Object.keys(data[0]);
    let showDate = this.props.showDate
    let dateOfTableData = {}
    data.map((item, index) => {
      let trItem = {};
      trItem["checked"] = false;
      trItem["rowId"] = index;

      tableHd.map((hd) => {
        if (hd == "action") {
          trItem["action"] = {
            action: false,
            options: item[hd],
          };
        } else {
          trItem[hd] = item[hd];
        }
      });
      if (showDate != undefined) {
        dateOfTableData[item.Date] = dateOfTableData[item.Date] == undefined ? [] : dateOfTableData[item.Date]
        dateOfTableData[item.Date].push(trItem)
      }
      tableData.push(trItem);
    });
    console.log('dateOfTableData', dateOfTableData)
    this.setState({ tableData: tableData, dateOfTableData: dateOfTableData, showDate: showDate == undefined ? false : true });
  };
  onCheckbox = () => {
    this.setState({ checked: !this.state.checked }, () => {
      let tableData = this.state.tableData;
      tableData.map((item) => {
        item.checked = this.state.checked;
      });
      this.setState({ tableData: tableData });
    });
  };
  onRowCheckBox = (e, row, index) => {
    console.log(e);
    // e.preventDefault();
    let tableData = this.state.tableData;
    tableData[index].checked = !row.checked;
    let selectedItem = [];
    this.setState({ tableData: tableData, selectedItem: selectedItem }, () => {
      tableData.map((item) => {
        if (item.checked) {
          selectedItem.push(item);
        }
      });
      this.setState({ selectedItem: selectedItem }, () => {
        if (this.state.tableData.length == this.state.selectedItem.length) {
          this.setState({ checked: true });
        } else {
          this.setState({ checked: false });
        }
      });
    });
  };

  onRowClick = (item, index, hd) => {
    this.props.rowClick(item, index, hd);
  };
  handleActionOpenClick = (item, index, hd) => {
    console.log("test");
    let tableData = this.state.tableData;
    tableData[index].action.action = !item.action.action;
    this.setState({ tableData: tableData }, () => {
      console.log(this.state.tableData);
    });
  };

  onCheckbox = (e, item, index) => {
    console.log("allcheckbox", e.target)
    this.setState({ checked: !this.state.checked }, () => {
      let tableData = this.state.tableData;
      tableData.map((item) => {
        item.checked = this.state.checked;
      });
      this.setState({ tableData: tableData });
    });
  };
  onRowCheckBox = (e, row, index) => {
    this.props.onRowCheckBox(e, row, index);
    console.log(e);
    // e.preventDefault();
    let tableData = this.state.tableData;
    tableData[index].checked = !row.checked;
    let selectedItem = [];
    this.setState({ tableData: tableData, selectedItem: selectedItem }, () => {
      tableData.map((item) => {
        if (item.checked) {
          selectedItem.push(item);
        }
      });
      this.setState({ selectedItem: selectedItem }, () => {
        if (this.state.tableData.length == this.state.selectedItem.length) {
          this.setState({ checked: true });
        } else {
          this.setState({ checked: false });
        }
      });
    });
  };

  onRowClick = (item, index, hd) => {
    this.props.rowClick(item, index, hd);
  };
  handleActionOpenClick = (item, index, hd) => {
    console.log("test");
    let tableData = this.state.tableData;
    tableData[index].action.action = !item.action.action;
    this.setState({ tableData: tableData }, () => {
      console.log(this.state.tableData);
    });
  };

  handleActionClick = (item, index, hd, name) => {
    this.props.handleActionClick(item, index, hd, name);
  };
  onSortTable = (hd) => {
    // console.log(hd)
    // console.log(this.state.tableData)
    let tableData = this.state.tableData
    let sortCell = document.getElementById(`cell${hd}`)
    console.log(sortCell.classList)
    Object.keys(this.state.tableData[0]).map((table_hd) => {
      if (hd != table_hd && table_hd != "action") {
        let sortAllCell = document.getElementById(`cell${table_hd}`)
        if (sortAllCell != null) {
          sortAllCell.classList.value = ""
        }
      }
    })
    if (String(sortCell.classList.value).includes('sort')) {
      if (String(hd).toLowerCase().includes('amount')) {
        tableData = tableData.sort(function (a, b) {
          if (Number(String(b[hd]).toLowerCase().replace(/\,/g, "").replace('₹', '')) < Number(String(a[hd]).toLowerCase().replace(/\,/g, "").replace('₹', ''))) { return -1; }
          if (Number(String(b[hd]).toLowerCase().replace(/\,/g, "").replace('₹', '')) > Number(String(a[hd]).toLowerCase().replace(/\,/g, "").replace('₹', ''))) { return 1; }
          return 0;
        })
      } else if (String(hd).toLowerCase() == 'date') {
        tableData = tableData.sort(function (a, b) {
          if (JSON.parse(a['Item'])['date'] != undefined) {
            if (new Date(String(JSON.parse(b['Item'])['date'])) < new Date(String(JSON.parse(a['Item'])['date']))) { return -1; }
            if (new Date(String(JSON.parse(b['Item'])['date'])) > new Date(String(JSON.parse(a['Item'])['date']))) { return 1; }
            return 0;
          }
        })
      } else {
        tableData = tableData.sort(function (a, b) {
          if (String(b[hd]).toLowerCase() < String(a[hd]).toLowerCase()) { return -1; }
          if (String(b[hd]).toLowerCase() > String(a[hd]).toLowerCase()) { return 1; }
          return 0;
        })
      }
      this.setState({ tableData: tableData }, () => {
        sortCell.classList.value = `${String(sortCell.classList.value).replace(' sort', '')} reverse`
      })

    } else {
      if (String(hd).toLowerCase().includes('amount')) {
        console.log('amount')
        tableData = tableData.sort(function (a, b) {
          if (Number(String(a[hd]).toLowerCase().replace(/\,/g, "").replace('₹', '')) < Number(String(b[hd]).toLowerCase().replace(/\,/g, "").replace('₹', ''))) { return -1; }
          if (Number(String(a[hd]).toLowerCase().replace(/\,/g, "").replace('₹', '')) > Number(String(b[hd]).toLowerCase().replace(/\,/g, "").replace('₹', ''))) { return 1; }
          return 0;
        })
      } else if (String(hd).toLowerCase() == 'date') {
        tableData = tableData.sort(function (a, b) {
          if (JSON.parse(a['Item'])['date'] != undefined) {
            if (new Date(String(JSON.parse(a['Item'])['date'])) < new Date(String(JSON.parse(b['Item'])['date']))) { return -1; }
            if (new Date(String(JSON.parse(a['Item'])['date'])) > new Date(String(JSON.parse(b['Item'])['date']))) { return 1; }
            return 0;
          }
        })
      } else {
        tableData = tableData.sort(function (a, b) {
          if (String(a[hd]).toLowerCase() < String(b[hd]).toLowerCase()) { return -1; }
          if (String(a[hd]).toLowerCase() > String(b[hd]).toLowerCase()) { return 1; }
          return 0;
        })
      }
      this.setState({ tableData: tableData }, () => {
        sortCell.classList.value = `${String(sortCell.classList.value).replace(' reverse', '')} sort`
      })
    }
  }
  render() {
    return (
      <React.Fragment>
        {this.state.tableData.length > 0 ? (
          <table className="zq-table-wrap" id="table-to-xls">
            <thead className="zq-table-heading">
              <tr>
                {Object.keys(this.state.tableData[0]).map((hd) => {
                  return hd == "checked" ? (
                    <th key={hd}>
                      <Checkbox
                        checked={this.state.checked}
                        name="checkedF"
                        onChange={(e) => this.onCheckbox(e, hd)}
                        indeterminate={!this.state.checked}
                        color="primary"
                      />
                    </th>
                  ) : (
                      <th
                        key={hd}
                        style={{
                          display:
                            hd == "rowId" || hd == "Item" ? "none" : "table-cell",
                        }}
                        className={hd == "action" ? "action-cell" : ""}
                        id={'cell' + hd}
                        onClick={() => this.onSortTable(hd)}
                      >
                        {hd == "action" ? "" : <React.Fragment>
                          <span>{hd}</span><span className="sort-icon"><ArrowDropUpIcon className="a-up" /><ArrowDropDownIcon className="a-down" /></span>
                        </React.Fragment>}
                      </th>
                    );
                })}
              </tr>
            </thead>
            {this.state.showDate ? <tbody className="zq-table-body">
              {Object.keys(this.state.dateOfTableData).map((date, dateIndex) => {
                return <React.Fragment>
                  <tr key={dateIndex} className="table-date-hd"><td colSpan={Object.keys(this.state.tableData[0]).length}>{date}</td></tr>
                  {this.state.dateOfTableData[date].map((item, index) => {
                    return (
                      <tr key={index}>
                        {Object.keys(this.state.tableData[0]).map((hd) => {
                          return hd == "checked" ? (
                            <td key={index + hd}>
                              <Checkbox
                                name={index}
                                checked={
                                  item.checked != undefined ? item.checked : false
                                }
                                onChange={(e) => this.onRowCheckBox(e, item, index)}
                                id={index}
                                color="primary"
                              />
                            </td>
                          ) : (
                              <td
                                key={index + hd}
                                style={{
                                  display:
                                    hd == "rowId" || hd == "Item" || hd == "action"
                                      ? "none"
                                      : "table-cell"
                                }}
                                onClick={() => this.onRowClick(item, index, hd)}
                                className={hd == "action" ? "action-cell" : `${hd}-${item[hd]}`}
                              >
                                {hd != "action" ? (
                                  <span style={{
                                    color:
                                      hd == "ID"
                                        ? "#0052cc"
                                        : "#42526e"
                                  }}>{item[hd]}</span>
                                ) :
                                  <div style={{ position: "relative" }}>
                                    <IconButton
                                      aria-label="more"
                                      aria-controls="long-menu"
                                      aria-haspopup="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        this.handleActionOpenClick(item, index, hd);
                                      }}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                    {item.action != undefined ? (
                                      <React.Fragment>
                                        {item.action.action ? (
                                          <ul className="action-item-wrap">
                                            {item.action.options.map((option) => (
                                              <li
                                                key={option.name}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  this.handleActionClick(
                                                    item,
                                                    index,
                                                    hd,
                                                    option.name
                                                  );
                                                }}
                                              >
                                                {option.icon != undefined ? option.icon == 'edit' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <EditIcon />
                                                </span> : null : null}
                                                {option.icon != undefined ? option.icon == 'accept' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <DoneIcon />
                                                </span> : null : null}
                                                {option.icon != undefined ? option.icon == 'reject' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <CloseIcon />
                                                </span> : null : null}
                                                {option.icon != undefined ? option.icon == 'Print' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <PrintIcon />
                                                </span> : null : null}
                                                {option.icon != undefined ? option.icon == 'Download' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <GetAppIcon />
                                                </span> : null : null}
                                                {option.icon != undefined ? option.icon == 'Share' ? <span className="action-icon-wrap" style={{ height: '33px' }}>
                                                  <ShareIcon />
                                                </span> : null : null}
                                                {option.name}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : null}
                                      </React.Fragment>
                                    ) : null}
                                  </div>
                                }
                              </td>
                            );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              })}

            </tbody>
              : <tbody className="zq-table-body">
                {this.state.tableData.map((item, index) => {
                  return (
                    <tr key={index}>
                      {Object.keys(this.state.tableData[0]).map((hd) => {
                        return hd == "checked" ? (
                          <td key={index + hd}>
                            <Checkbox
                              name={index}
                              checked={
                                item.checked != undefined ? item.checked : false
                              }
                              onChange={(e) => this.onRowCheckBox(e, item, index)}
                              id={index}
                              color="primary"
                            />
                          </td>
                        ) : (
                            <td
                              key={index + hd}
                              style={{
                                display:
                                  hd == "rowId" || hd == "Item" || hd == "action"
                                    ? "none"
                                    : "table-cell",
                                // textAlign: hd.toLowerCase().includes('amount')
                                //   ? 'right' : 'left'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                this.onRowClick(item, index, hd)
                              }}
                              className={hd == "action" ? "action-cell" : `${hd}-${item[hd]}`}
                            >
                              {hd != "action" ? (
                                <span className={hd == "ID" ? "tableID" : hd == "CTC" ? "tableCTC":hd == "Total Earnings" ? "tableCTC":hd == "Total Deductions" ? "tableCTC" : (hd.toLowerCase().includes('amount') ? "tableAmount" : "")}>{item[hd]}</span>
                              ) :
                                <div style={{ position: "relative" }}>
                                  <IconButton
                                    aria-label="more"
                                    aria-controls="long-menu"
                                    aria-haspopup="true"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.handleActionOpenClick(item, index, hd);
                                    }}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                  {item.action != undefined ? (
                                    <React.Fragment>
                                      {item.action.action ? (
                                        <ul className="action-item-wrap">
                                          {item.action.options.map((option) => (
                                            <li
                                              key={option.name}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                this.handleActionClick(
                                                  item,
                                                  index,
                                                  hd,
                                                  option.name
                                                );
                                              }}
                                            >
                                              {option.icon != undefined ? option.icon == 'edit' ? <span className="action-icon-wrap">
                                                <EditIcon />
                                              </span> : null : null}
                                              {option.icon != undefined ? option.icon == 'accept' ? <span className="action-icon-wrap">
                                                <DoneIcon />
                                              </span> : null : null}
                                              {option.icon != undefined ? option.icon == 'reject' ? <span className="action-icon-wrap">
                                                {/* <CloseIcon /> */}
                                                <img src={CancelSVG} alt={"Cancel"} className="action-icon-image"></img>
                                              </span> : null : null}
                                              {option.icon != undefined ? option.icon == 'Print' ? <span className="action-icon-wrap">
                                                {/* <PrintIcon /> */}
                                                <img src={PrintSVG} alt={"Print"} className="action-icon-image"></img>
                                              </span> : null : null}
                                              {option.icon != undefined ? option.icon == 'Download' ? <span className="action-icon-wrap">
                                                {/* <GetAppIcon /> */}
                                                <img src={DownloadSVG} alt={"Download"} className="action-icon-image"></img>
                                              </span> : null : null}
                                              {option.icon != undefined ? option.icon == 'Share' ? <span className="action-icon-wrap">
                                                {/* <ShareIcon /> */}
                                                <img src={ShareSVG} alt={"Download"} className="action-icon-image"></img>
                                              </span> : null : null}
                                              {option.name}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : null}
                                    </React.Fragment>
                                  ) : null}
                                </div>
                              }
                            </td>
                          );

                        // <td key={index + hd} style={{ "display": (hd == 'rowId' || hd == 'Item' || hd == 'action') ? 'none' : 'table-cell' }} onClick={() => this.onRowClick(item, index, hd)} className={hd == 'action' ? 'action-cell' : ''}>
                        //     {hd != 'action' ? item[hd] : <div style={{"position":"relative"}}>
                        //         <IconButton
                        //             aria-label="more"
                        //             aria-controls="long-menu"
                        //             aria-haspopup="true"
                        //             onClick={(e) => {
                        //                 e.stopPropagation()
                        //                 this.handleActionOpenClick(item, index, hd)
                        //             }}
                        //         >
                        //             <MoreVertIcon />
                        //         </IconButton>
                        //         {item.action != undefined ?
                        //             <React.Fragment>{item.action.action ? <ul className="action-item-wrap">
                        //                 {item.action.options.map((option) => (
                        //                     <li key={option.name} onClick={(e) => {
                        //                         e.stopPropagation()
                        //                         this.handleActionClick(item, index, hd, option.name)
                        //                     }}>
                        //                         {option.name}
                        //                     </li>
                        //                 ))}
                        //             </ul> : null} </React.Fragment> : null}
                        //     </div>}
                        // </td>
                      })}
                    </tr>
                  );
                })}
              </tbody>}
          </table>
        ) : null
        }
      </React.Fragment>
    );
  }
}

export default withRouter(ZqTable);
