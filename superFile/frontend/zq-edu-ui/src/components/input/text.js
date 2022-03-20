import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";

export default class InputTextArea extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputData: {},
      labelFloat: false,
    };
  }

  componentWillMount = () => {
    console.log("props", this.props);
    this.setState({ inputData: this.props.inputData }, () => {
      if (this.state.inputData.defaultValue === undefined) {
        this.setState({ labelFloat: false });
      } else {
        this.setState({ labelFloat: true });
      }
    });
  };

  inputChanges = (value, item, event, dataS) => {
    this.props.onInputChanges(value, item, event, dataS);
    dataS["validation"] = true;
    this.setState({ labelFloat: true });
  };
  render() {
    return (
      <React.Fragment>
        <div className={this.state.inputData.class + " "}>
          <TextField
            rows={this.state.inputData.row}
            multiline
            variant="filled"
            id={this.state.inputData.name}
            label={this.state.inputData.label}
            defaultValue={
              this.state.inputData.defaultValue === undefined
                ? ""
                : this.state.inputData.defaultValue
            }
            required={this.state.inputData.required}
            onChange={(e) => this.inputChanges(e,this.state.inputData)}
          ></TextField>
        </div>
      </React.Fragment>
    );
  }
}
