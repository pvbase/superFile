import React, { Component } from "react";
import { DatePicker } from "rsuite";
// import * as dateFns from "date-fns";
import "../../scss/newcss.scss";
export default class InputDate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      labelFloat: false,
      preventOverflow: true,
      inputData: {},
    };
  }
  componentWillMount = () => {
    console.log("dateprops", this.props);
    this.setState({ inputData: this.props.inputData });
    // this.setState({ labelFloat: true });
  };
  onSelect = (value, item, e, dataS) => {
    console.log(value);
    this.props.onInputChanges(value, item, e, dataS);
    // this.setState({ labelFloat: true });
  };
  onClean = (event) => {
    // this.setState({ labelFloat: false });
  };
  render() {
    // const today = new Date();
    // const yesterday = new Date(today);
    // yesterday.setDate(yesterday.getDate() - 1);
    // today.toDateString();
    // yesterday.toDateString();
    // const todayDate = new Date(today);
    // todayDate.setDate(todayDate.getDate());
    // today.toDateString();
    // todayDate.toDateString();

    return (
      <React.Fragment>
        <div className={this.state.inputData.class + " material-select-ui"}>
          <p className="input-label">{this.state.inputData.label}</p>
          <DatePicker
            className="select-input-wrap date-wrap"
            onSelect={(value, item, event) =>
              this.onSelect(value, item, event, this.state.inputData)
            }
            onClean={this.onClean}
            format="DD/MM/YYYY"
            oneTap
            block={this.state.preventOverflow}
            // disabledDate={
            //   this.state.inputData.dateRange === "before"
            //     ? (date) => dateFns.isBefore(date, yesterday)
            //     : this.state.inputData.dateRange === "after"
            //       ? (date) => dateFns.isAfter(date, todayDate)
            //       : null
            // }
            defaultValue={this.state.inputData.defaultValue === undefined ? "" : this.state.inputData.defaultValue}
            disabled={this.state.inputData.readOnly}
            placement={
              this.state.inputData.placement === undefined
                ? "bottom"
                : this.state.inputData.placement
            }
          // placeholder={this.state.inputData.placeholder ===undefined?'':this.state.inputData.placeholder}
          />
          {/* <label
            className={
              this.state.labelFloat
                ? "material-select-label material-select-label-float"
                : "material-select-label"
            }
          >
            {this.state.inputData.label}
          </label> */}
        </div>
      </React.Fragment>
    );
  }
}
