import React, { useState, useEffect } from "react";
import { Tooltip, CircularProgress, useTheme, Typography } from "@material-ui/core";
import Checkbox from "@material-ui/core/Checkbox";
import '../../scss/kentable.scss';
var checkedTrId = 0

const KenTable = (props) => {
    const [isLoader, setIsLoader] = useState(false)
    const [rowDatas, setRowDatas] = useState([])
    const [commondata, setCommondata] = useState([])
    const [rowIndex, setRowIndex] = useState([])
    const [rowSpan, setRowSpan] = useState(false)
    const [selectAll, setSelectAll] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])
    useEffect(() => {
        console.log('***PROPS TABLE***', props)
        createTr()
    }, [])
    const onCheckbox = (e, trIndex, type) => {
        console.log(trIndex)
        console.log(rowDatas)
        console.log(commondata)
        console.log(rowIndex)
        var selectedItem = selectedItems
        var rowData = rowDatas
        var checked = null
        var selectedTR = Array.from(document.getElementsByTagName('tr'))
        console.log('selectedTR', selectedTR)
        var allSelectId = null
        if (type == 'multiple') {
            selectedItem = []
            rowData.map(allTr => {
                allSelectId = allTr.ID == undefined ? allSelectId : allTr.ID
                if (allTr.checked != undefined) {
                    checked = selectAll
                    if (selectAll) {
                        allTr.checked = !selectAll
                        selectedItem = []
                    } else {
                        allTr.checked = !selectAll
                        selectedItem.push({
                            ID: allSelectId,
                            ...allTr
                        })
                    }
                } else {
                    if (checked) {
                        selectedItem = []
                    } else {
                        selectedItem.push({
                            ID: allSelectId,
                            ...allTr
                        })
                    }
                }
            })
        } else {
            selectedTR.map((trTag, trTagIndex) => {
                if (trTagIndex > 0) {
                    console.log('Tag', trTag.className)
                    if (trIndex == trTag.className) {
                        if (rowData[trTagIndex - 1].checked != undefined) {
                            checked = rowData[trTagIndex - 1].checked
                            if (rowData[trTagIndex - 1].checked) {
                                rowData[trTagIndex - 1].checked = !rowData[trTagIndex - 1].checked
                                selectedItem.map((si, siIndex) => {
                                    if (trIndex == si.ID) {
                                        selectedItem.splice(siIndex, 1)
                                    }
                                })
                            } else {
                                rowData[trTagIndex - 1].checked = !rowData[trTagIndex - 1].checked
                                selectedItem.push({
                                    ID: trIndex,
                                    ...rowData[trTagIndex - 1]
                                })
                            }
                        } else {
                            if (checked) {
                                selectedItem.map((si, siIndex) => {
                                    if (trIndex == si.ID) {
                                        selectedItem.splice(siIndex, 1)
                                    }
                                })
                            } else {
                                selectedItem.push({
                                    ID: trIndex,
                                    ...rowData[trTagIndex - 1]
                                })
                            }
                        }
                    }
                }
            })
        }
        var checkAll = true
        rowData.map(allTr => {
            if (allTr.checked != undefined) {
                if (!allTr.checked) {
                    checkAll = false
                } else {
                    checkAll = checkAll
                }
            }
        })
        setRowDatas([])
        setSelectedItems(selectedItem)
        setTimeout(() => {
            setRowDatas(rowData)
            setSelectAll(checkAll)
            props.onCheckbox(selectedItem)
        });
    }
    const onRowClick = (trItems, i, headingItem) => {
    }
    const createTr = () => {
        var rowData = []
        var rowIndex = []
        var commondata = []
        for (let i = 0; i < props.tableData.length; i++) {
            const tableItems = props.tableData[i];
            console.log('tableItems', tableItems)
            var rowSpan = false
            var commonItems = {}
            Object.keys(props.tableData[0]).map((headingItem, headingIndex) => {
                if (headingItem == 'items') {
                    rowSpan = true
                    tableItems['items'].map((item, ii) => {
                        console.log('items', item)
                        if (ii == 0) {
                            rowData.push({
                                checked: false,
                                ...commonItems,
                                ...item
                            })
                            rowIndex.push(tableItems['items'].length)
                            commondata.push(commonItems)
                        } else {
                            rowData.push({
                                ...item
                            })
                            rowIndex.push(tableItems['items'].length)
                            commondata.push([])
                        }
                    })
                } else {
                    rowSpan = rowSpan
                    commonItems[headingItem] = tableItems[headingItem]
                }
            })
            console.log('check', rowSpan, rowIndex)
            console.log('rowData', rowData)
        }
        setRowDatas(rowData)
        setRowIndex(rowIndex)
        setCommondata(commondata)
        setRowSpan(rowSpan)
    }
    const formatCurrency = (amount) => {
        return (new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount))
    }
    return (
        <div>
            {isLoader ? <div style={{ position: "relative", marginTop: 20 }}>
                <div style={{ position: 'absolute', zIndex: 110, top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.8)' }}>
                    <CircularProgress size={24} />
                </div>
            </div> : null}
            {props.tableData.length > 0 ? (
                <table className="zq-table-wrap kenTable" id="table-to-xls">
                    <thead className="zq-table-heading">
                        <tr>
                            {
                                props.checkBox ? <th >
                                    <Checkbox
                                        checked={selectAll}
                                        name="checkedF"
                                        onChange={(e) => onCheckbox(e, null, 'multiple')}
                                        // indeterminate={!props.checked}
                                        color="primary"
                                    />
                                </th> : null
                            }
                            {
                                Object.keys(props.tableData[0]).map(headingItem => {
                                    return headingItem == 'items' ? <>
                                        {/* <p>table heading{JSON.stringify(Object.keys(props.tableData[0][headingItem][0]))}</p> */}
                                        {Object.keys(props.tableData[0][headingItem][0]).map(hd => {
                                            return <th
                                                key={hd}
                                                className={hd == "action" ? "action-cell" : ""}
                                                id={'cell' + hd}
                                            >
                                                <span>{hd}</span>
                                            </th>
                                        })}
                                    </> : <>
                                            <th
                                                key={headingItem}
                                                className={headingItem == "action" ? "action-cell" : ""}
                                                id={'cell' + headingItem}
                                            >
                                                <span>{headingItem}</span>
                                            </th>
                                        </>
                                })
                            }
                        </tr>
                    </thead>
                    <tbody className="zq-table-body">
                        {rowSpan ? rowDatas.map((trItems, trIndex) => {
                            checkedTrId = trItems['ID'] == undefined ? checkedTrId : trItems['ID']
                            return <tr key={trIndex} className={checkedTrId}>
                                {Object.keys(rowDatas[trIndex]).map((headingItem, headingIndex) => {
                                    return (props.checkBox && headingItem == "checked") ?
                                        <td key={trIndex} rowSpan={rowIndex[trIndex]}>
                                            <Checkbox
                                                checked={trItems[headingItem]}
                                                name="checkedF"
                                                onChange={(e) => onCheckbox(e, trItems['ID'], 'single')}
                                                // indeterminate={!props.checked}
                                                color="primary"
                                            />
                                        </td> : trItems[headingItem] != undefined ? <td
                                            key={trIndex + headingItem}
                                            onClick={() => onRowClick(trItems, trIndex, headingItem)}
                                            className={`${headingItem}-${trItems[headingItem]} ${headingItem == 'Total' ? 'total-column' : ''}`}
                                            rowSpan={commondata[trIndex][headingItem] != undefined ? rowIndex[trIndex] : null}
                                        >
                                            <span>{String(headingItem).toLowerCase().includes("amount") ? formatCurrency(trItems[headingItem]) : trItems[headingItem]}</span>
                                        </td> : null
                                })}
                            </tr>
                        }) : null}
                    </tbody>
                </table>
            ) : null}
        </div>
    )
}
export default KenTable;