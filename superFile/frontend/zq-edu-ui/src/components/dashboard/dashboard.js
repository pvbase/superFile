import React, { Component } from 'react';
import "../../scss/dashboard.scss";
import { Line } from '@reactchartjs/react-chart.js'
import * as ChartAnnotation from 'chartjs-plugin-annotation';


class ZqDashboard extends Component {

    state = {
        linedata: {
            labels: ['2', '3', '5', '7', '9', '11'],
            datasets: [
                {
                    label: 'Fees Collected',
                    data: [1, 3, 5, 6, 8, 9],
                    fill: false,
                    backgroundColor: 'blue',
                    borderColor: 'blue',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Pending Amount',
                    data: [7, 5, 4, 3, 2, 1],
                    fill: false,
                    backgroundColor: 'orange',
                    borderColor: 'orange',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Demand Note Amount',
                    data: [9, 9, 9, 9, 9, 9],
                    fill: false,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                }
            ],
        },

        options: {
            scales: {
                xAxes: [
                    {
                        display: false,
                    },
                ],
                yAxes: [
                    {
                        display: false,
                        ticks: {
                            suggestedMin: 1,
                            suggestedMax: 10
                        }
                    }
                ],
            },
            legend: {
                display: false,
            },

            maintainAspectRatio: false,
            // annotation: {
            //     drawTime: "afterDraw",
            //     events: ['click', 'mouseenter', 'mouseleave'],
            //     annotations: [{
            //         id: "horizontalLine",
            //         type: 'line',
            //         mode: 'horizontal',
            //         scaleID: 'y-axis-0',
            //         value: 9,
            //         borderColor: 'green',
            //         borderWidth: 1,
            //         label: {
            //             enabled: false,
            //             content: "Rs.230.13 Cr Demand Amount",
            //             position: "center",
            //             yPadding: 15,
            //             fill: false,
            //             backgroundColor: 'green',
            //             borderColor: 'green',
            //         },
            //         onMouseenter: function (e) {
            //             e.preventDefault();
            //             var element = this;
            //             element.options.label.enabled = true;
            //             element.chartInstance.update();
            //         },
            //         onMouseleave: function (e) {
            //             e.preventDefault();
            //             var element = this;
            //             element.options.label.enabled = false;
            //             element.chartInstance.update();
            //         },

            //     }],
            // },
        },
        linedata2: {
            labels: ['1', '3', '5', '7', '9'],
            datasets: [
                {
                    label: 'Fees Collected',
                    data: [0, 3, 4, 5, 8],
                    fill: false,
                    backgroundColor: 'blue',
                    borderColor: 'blue',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Pending Amount',
                    data: [6, 5, 3, 2, 0],
                    fill: false,
                    backgroundColor: 'orange',
                    borderColor: 'orange',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Demand Note Amount',
                    data: [8, 8, 8, 8, 8, 8],
                    fill: false,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                }
            ],
        },

        options_two: {
            scales: {
                xAxes: [
                    {
                        display: false,
                    },
                ],
                yAxes: [
                    {
                        display: false,
                        ticks: {
                            suggestedMin: 1,
                            suggestedMax: 10
                        }
                    }
                ],
            },
            legend: {
                display: false,
            },
            maintainAspectRatio: false,
            // annotation: {
            //     annotations: [{
            //         type: 'line',
            //         mode: 'horizontal',
            //         scaleID: 'y-axis-0',
            //         value: 8,
            //         borderColor: 'green',
            //         borderWidth: 1,
            //         label: {
            //             enabled: false,
            //             content: 'Test label'
            //         }
            //     }]
            // }
        },
        linedata3: {
            labels: ['2', '3', '5', '7', '9', '13'],
            datasets: [
                {
                    label: 'Fees Collected',
                    data: [1, 3, 5, 6, 8, 13],
                    fill: false,
                    backgroundColor: 'blue',
                    borderColor: 'blue',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Pending Amount',
                    data: [11, 7, 5, 3, 2, 1],
                    fill: false,
                    backgroundColor: 'orange',
                    borderColor: 'orange',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Demand Note Amount',
                    data: [18, 18, 18, 18, 18, 18],
                    fill: false,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                }
            ],
        },

        options_three: {
            scales: {
                xAxes: [
                    {
                        display: false,
                    },
                ],
                yAxes: [
                    {
                        display: false,
                        ticks: {
                            suggestedMin: 1,
                            suggestedMax: 20
                        }
                    }
                ],
            },
            legend: {
                display: false,
            },
            maintainAspectRatio: false,
            // annotation: {
            //     annotations: [{
            //         type: 'line',
            //         mode: 'horizontal',
            //         scaleID: 'y-axis-0',
            //         value: 18,
            //         borderColor: 'green',
            //         borderWidth: 1,
            //         label: {
            //             enabled: false,
            //             content: '230.13 Cr Demand Amount'
            //         }
            //     }]
            // }
        },

        linedata4: {
            labels: ['1', '2', '3', '5', '6'],
            datasets: [
                {
                    label: 'Fees Collected',
                    data: [2, 3, 4, 6, 8],
                    fill: false,
                    backgroundColor: 'blue',
                    borderColor: 'blue',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Pending Amount',
                    data: [6, 4, 3, 2, 0],
                    fill: false,
                    backgroundColor: 'orange',
                    borderColor: 'orange',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                },
                {
                    label: 'Demand Note Amount',
                    data: [8, 8, 8, 8, 8, 8],
                    fill: false,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    lineTension: 0.1,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: "miter",
                    borderWidth: 1,
                    pointRadius: 1,
                }
            ],
        },

        options_four: {
            scales: {
                xAxes: [
                    {
                        display: false,
                    },
                ],
                yAxes: [
                    {
                        display: false,
                        ticks: {
                            suggestedMin: 1,
                            suggestedMax: 10
                        }
                    },
                ],
            },
            legend: {
                display: false,
            },
            maintainAspectRatio: false,
            // annotation: {
            //     annotations: [{
            //         type: 'line',
            //         mode: 'horizontal',
            //         scaleID: 'y-axis-0',
            //         value: 8,
            //         borderColor: 'green',
            //         borderWidth: 1,
            //         label: {
            //             enabled: false,
            //             content: 'Test label'
            //         }
            //     }]
            // }
        },


    }



    render() {
        return (
            <React.Fragment>
                <div className="dashboardHeader">
                    <div className="dashboardName">Dashboard</div>
                    <div className="dashButtons">
                        <div className="dashBtns1">YTD</div>
                        <div className="dashBtns1">MTD</div>
                        <div className="dashBtns1">WTD</div>
                        <div className="dashBtns2">TD</div>
                    </div>
                </div>
                <div className="dashboardWrapper">
                    <div className="dashboardContainer">
                        <div className="box" >
                            <div className="dashboardTotalAmount">Total Demand Amount</div>
                            <div className="dashboardAmountPrice">
                                <div className="dash-inr">Rs.</div>
                                <div className="dashprice">230.13</div>
                                <div className="dash-inr">Cr</div>
                            </div>
                        </div>
                        <div className="box">
                            <div className="dashboardTotalAmount">Total Fees Collected</div>
                            <div className="dashboardAmountPrice">
                                <div className="dash-inr">Rs.</div>
                                <div className="dashprice">130.03</div>
                                <div className="dash-inr">Cr</div>
                            </div>
                        </div>
                        <div className="box">
                            <div className="dashboardTotalAmount">Total Pending Amount</div>
                            <div className="dashboardAmountPrice">
                                <div className="dash-inr">Rs.</div>
                                <div className="dashprice">100.10</div>
                                <div className="dash-inr">Cr</div>
                            </div>
                        </div>
                    </div>
                    <div className="dashboardChartContainer">
                        <p className="feeText">Fees Collection Trend</p>
                        <div className="chartContainer">
                            <div className="chartBox">
                                <Line data={this.state.linedata} options={this.state.options} />
                            </div>
                            <div className="chartBox">
                                <Line data={this.state.linedata2} options={this.state.options_two} />
                            </div>
                            <div className="chartBox">
                                <Line data={this.state.linedata3} options={this.state.options_three} />
                            </div>
                            <div className="chartBox">
                                <Line data={this.state.linedata4} options={this.state.options_four} />
                            </div>
                        </div>
                    </div>
                </div >
            </React.Fragment >
        );
    }
}

export default ZqDashboard;