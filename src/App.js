import React, { Component } from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import './App.css';

import {
    XAxis,
    YAxis,
    XYPlot,
    HorizontalGridLines,
    VerticalBarSeries,
    makeVisFlexible

} from 'react-vis';

export const SKETCH_WS_URL =  window.location.hostname + ":8080";

class Indicator extends Component {
    render () {
        return (
            <div className="Header-indicator">
                <div>{this.props.name}</div>
                <div>{this.props.value}</div>
            </div>
        )
    }
}

class Logo extends Component {
    render () {
        return (
            <div className="Header-logo">
                {this.props.name}
            </div>
        )
    }
}

class Header extends Component {
    constructor() {
        super();
        this.state = {
            epochs: 0,
            processedEvents: 0,
            rotationInterval: 500,
            detectedHeavyHitters: 0,
            detectedHeavyChangers: 0
        };
    };

    componentWillMount() {
        setInterval( () => {
            fetch('http://'+SKETCH_WS_URL+'/status')
                .then((response) => {
                    return response.json()
                })
                .then((json_response) => {
                    this.setState({
                        epochs: json_response.SketchManager.currentEpoch,
                        processedEvents: json_response.SketchManager.processedEvents,
                        rotationInterval: json_response.DetectionParameters.sketchRotationInterval,
                        detectedHeavyHitters: json_response.HeavyKeyDetector.detectedHeavyHitters,
                        detectedHeavyChangers: json_response.HeavyKeyDetector.detectedHeavyChangers
                    });
                })
        }, this.state.rotationInterval);
    };

    render() {
        return(
            <div className="App-header">
                <Logo name={'Heavy Key Detect'}/>
                <Indicator name={'Época'} value={this.state.epochs}/>
                <Indicator name={'Eventos'} value={this.state.processedEvents}/>
                <Indicator name={'Hitters'} value={this.state.detectedHeavyHitters}/>
                <Indicator name={'Changers'} value={this.state.detectedHeavyChangers}/>
            </div>
        );
    }
}

class Histogram extends Component {
    constructor(props) {
        super(props);
        this.state = {data: props.data,
            heavykey: props.heavykey};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({data: nextProps.data});
    }

    render(){
        const FlexibleXYPlot = makeVisFlexible(XYPlot);
        return (
            <div className="histogram">
                <FlexibleXYPlot
                    xType="ordinal"
                    xDistance={50} >
                    <HorizontalGridLines />
                    <XAxis />
                    <YAxis />
                    <VerticalBarSeries
                        data={this.state.data}
                        onValueClick={
                            (datapoint, event) => {
                                let epoch = datapoint.x;
                                let data = this.state.data;
                                fetch('http://' + SKETCH_WS_URL + '/heavykeys/' + this.state.heavykey + '?epoch=' + epoch)
                                    .then((response) => {
                                        return response.json()
                                    })
                                    .then((json_response) => {
                                        // update table
                                        this.props.table_callback(epoch, json_response)
                                    });
                                this.setState({data: data})
                            }
                        }/>
                </FlexibleXYPlot>
            </div>


        );
    }
}

class HeavyKeyTable extends Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    getRowClasses = (row, rowIndex) => {
        if (row.id.split('_')[1] === 'title')
            return 'epoch-title';
        return 'event'
    };

    render() {
        const columns = [{
            dataField: 'id',
            text: 'ID',
            hidden: true
        },{
            dataField: 'epoch',
            text: 'Epoch',
            hidden: true
        }, {
            dataField: 'event',
            text: this.props.name
        }];

        return (
            <div className="hk-table">
                <BootstrapTable keyField='id'
                                data={ this.props.data }
                                columns={ columns }
                                rowClasses = {this.getRowClasses}/>
            </div>
        )
    }
}

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            min_epoch: 0,
            hh_data: [],
            hc_data: [],
            config: {
                histLength: 30
            },
            hh_datapoints: {},
            hc_datapoints: {}
        };
    };

    addEpochHH = (epoch, events) => {
        let datapoints = this.state.hh_datapoints;

        if (epoch in datapoints)
            delete datapoints[epoch];
        else
            datapoints[epoch] = events;
        this.setState({hh_datapoints: datapoints});
    };

    addEpochHC = (epoch, events) => {
        let datapoints = this.state.hc_datapoints;

        if (epoch in datapoints)
            delete datapoints[epoch];
        else
            datapoints[epoch] = events;
        this.setState({hc_datapoints: datapoints});
    };

    getTableData = (table_data) => {
        const data = [];
        for (let epoch in table_data) {
            data.push({'id':epoch+'_title',
                'epoch': epoch, 'event': "Epoca "+epoch+" ("+table_data[epoch].length+")"});
            console.log(table_data[epoch]);
            for(let evt in table_data[epoch]) {
                let event = table_data[epoch][evt];
                data.push({'id': epoch+'_'+event, 'epoch': epoch, 'event': event})
            }
        }
        return data;
    };

    removeOldDatapoints = () => {
        let hh_datapoints = this.state.hh_datapoints;
        for (let datapoint in hh_datapoints) {
            if (datapoint <= this.state.min_epoch)
                delete hh_datapoints[datapoint];
        }
        let hc_datapoints = this.state.hc_datapoints;
        for (let datapoint in hc_datapoints) {
            if (datapoint <= this.state.min_epoch)
                delete hc_datapoints[datapoint];
        }
        this.setState({hh_datapoints: hh_datapoints,
            hc_datapoints: hc_datapoints})
    };

    componentWillMount() {
        const histLength = this.state.config.histLength;
        setInterval(() => {
            let hh_hist_data = [];
            let hc_hist_data = [];

            fetch('http://'+SKETCH_WS_URL+'/heavykeys?count='+histLength)
                .then((response) => {
                    return response.json()
                })
                .then((json_response) => {

                    let heavy_keys = json_response.HeavyKeys;
                    let epochs_int = Object.keys(heavy_keys).map(Number)
                    let min_epoch = Math.min(...epochs_int);

                        let epochs = Object.keys(heavy_keys);
                    for (let i = 0; i < Math.min(histLength, epochs.length); i++) {
                        hh_hist_data.push({x: epochs[i], y: heavy_keys[epochs[i]].heavyHittersCounter});
                        hc_hist_data.push({x: epochs[i], y: heavy_keys[epochs[i]].heavyChangersCounter})
                    }
                    this.setState({
                        hh_data: hh_hist_data,
                        hc_data: hc_hist_data,
                        min_epoch: min_epoch
                    });
                });
            this.removeOldDatapoints();

        }, 2000);


    };

    render() {
        return(
            <div className="App-dashboard">
                <div className="dashboard-row">
                    <HeavyKeyTable
                        name='Heavy Hitters'
                        data={this.getTableData(this.state.hh_datapoints)}
                    />
                    <Histogram
                        data={this.state.hh_data}
                        heavykey="heavyhitters"
                        table_callback={this.addEpochHH}
                    />

                </div>
                <div className="dashboard-row">
                    <HeavyKeyTable
                        name='Heavy Changers'
                        data={this.getTableData(this.state.hc_datapoints)}
                    />
                    <Histogram
                        data={this.state.hc_data}
                        heavykey="heavychangers"
                        table_callback={this.addEpochHC}
                    />
                </div>
        </div>

        )
    }
}

class App extends Component {
    render() {
        return (
            <div className="App">
                    <Header/>
                    <Dashboard/>
            </div>
        );
    }
}

export default App;
