import React, { Component } from 'react';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
class PaginationUI extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 1,
            postPerPage: 5,
            totalPages: 0
        }
    }
    handleClick = (e, index) => {
        e.preventDefault();
        this.setState({ currentPage: index, }, () => {

            // console.log(this.state.currentPage)
            this.props.onPaginationApi(this.state.currentPage, this.state.postPerPage)
        })
    }
    PaginationChange = (e) => {
        this.setState({ postPerPage: Number(e.target.value) }, () => {
            this.props.onPaginationApi(this.state.currentPage, this.state.postPerPage)
        })
    }
    componentDidMount = () => {
        this.setState({ totalPages: this.props.totalPages })
    }
    render() {
        // console.log("props", this.props)
        const { currentPage } = this.state;
        return (<React.Fragment>
            <div className="pagination-container">
                {/* <div className="page-total-record">
                   <p>{this.props.total} record{Number(this.props.total) > 1 ? 's' : ''}</p> 
                </div> */}
                <div className="pagination-wrap"style ={{width:"25%"}} >
                    <div className="pagination-select">
                        <FormControl variant="outlined" className="pagination-input">
                            <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={this.props.limit}
                                onChange={this.PaginationChange}
                                inputProps={{ 'aria-label': 'Without label' }}>
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                {/* <MenuItem value={15}>15</MenuItem> */}
                            </Select>
                        </FormControl>
                    </div>
                    <div style={{ paddingTop: "5px" }}><p className="grid-per-page">Rows per page &nbsp;</p></div></div>
                <div className="pagination-wrapper pagination-right">
                    <div className="pagination-wrapper-content">
                        <div className="page-select-range">
                            <span><ChevronLeftIcon className={currentPage <= 1 ? "pagination-icon light " : "pagination-icon"} onClick={e => (currentPage <= 1) ? null : this.handleClick(e, currentPage - 1)} /></span>
                            <p className="pageofText"><input type="number" disabled={true} className="choose-page" value={currentPage} /> of {this.props.totalPages}</p><span><ChevronRightIcon className={currentPage == this.props.totalPages ? "pagination-icon light " : "pagination-icon  "} onClick={e => (currentPage == this.props.totalPages) ? null : this.handleClick(e, currentPage + 1)} /></span>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>);
    }
}
export default PaginationUI;