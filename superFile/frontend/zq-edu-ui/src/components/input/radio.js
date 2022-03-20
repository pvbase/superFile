import React, { Component } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormLabel from "@material-ui/core/FormLabel";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";

export default class InputRadio extends Component {
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
  handleChange = (value, item, event, dataS) => {
    this.props.onInputChanges(value, item, event, dataS);
    dataS["validation"] = true;
    dataS['defaultValue'] = item
    this.setState({ labelFloat: true });
  };
  onClean = (event) => {
    this.setState({ labelFloat: false });
  };
  render() {
    return (
      <React.Fragment>
        <div className={this.state.inputData.class + " "}>
          <FormControl
            component="fieldset"
            // error={error}
          >
            <FormLabel className="formlabel" component="legend">
              {this.state.inputData.label}
            </FormLabel>
            <RadioGroup
              row
              aria-label="position"
              name="position"
              defaultValue={
                this.state.inputData.defaultValue === undefined
                  ? ""
                  : this.state.inputData.defaultValue
              }
              onChange={(value, item, event) =>
                this.handleChange(value, item, event, this.state.inputData)
              }
              onClean={this.onClean}
            >
              {this.state.inputData.options.map((item) => {
                return (
                  <FormControlLabel
                    className="radio-text"
                    value={item.value}
                    control={<Radio color="primary" />}
                    label={item.label}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        </div>
      </React.Fragment>
    );
  }
}
