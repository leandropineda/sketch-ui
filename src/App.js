import React, { Component } from 'react';
import './App.css';
import ShowcaseButton from 'react-showcase';

import {
    XYPlot,
    XAxis,
    YAxis,
    VerticalGridLines,
    HorizontalGridLines,
    VerticalBarSeries,
    VerticalBarSeriesCanvas,
    FlexibleXYPlot,
    FlexibleWidthXYPlot,
    FlexibleHeightXYPlot

} from 'react-vis';


export const SKETCH_WS_URL = "localhost:8080";

class Indicator extends Component {
    render () {
        return (
            <div className="Header-indicator">
                {this.props.name}: {this.props.value}
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
            <div>
                <header className="App-header">
                    <h1 className="App-title">
                        <Indicator name={'Época'} value={this.state.epochs}/>
                        <Indicator name={'Eventos'} value={this.state.processedEvents}/>
                        <Indicator name={'Hitters'} value={this.state.detectedHeavyHitters}/>
                        <Indicator name={'Changers'} value={this.state.detectedHeavyChangers}/>
                    </h1>
                </header>
            </div>
        );
    }
}

class Histogram extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hh_data: [],
            hc_data: [],
            config: {
                histLength: 50
            }
        };

        const histLength = this.state.config.histLength;

        fetch('http://'+SKETCH_WS_URL+'/heavykeys?count='+histLength)
            .then((response) => {
                return response.json()
            })
            .then((json_response) => {
                let heavy_keys = json_response.HeavyKeys;

                let epochs = Object.keys(heavy_keys);
                let hh_hist_data = [];
                let hc_hist_data = [];
                for (let i = 0; i < Math.min(histLength, epochs.length); i++) {
                    hh_hist_data.push({x: epochs[i], y: heavy_keys[epochs[i]].heavyHittersCounter});
                    hc_hist_data.push({x: epochs[i], y: heavy_keys[epochs[i]].heavyChangersCounter})
                }

                this.setState({
                    hh_data: hh_hist_data,
                    hc_data: hc_hist_data
                });
            });
    };
    addHHEvent(props) {
        let hist_data = this.state.hh_data;
        hist_data.shift();
        hist_data.push(props);
        this.setState({hh_data: hist_data})
    }
    addHCEvent(props) {
        let hist_data = this.state.hc_data;
        hist_data.shift();
        hist_data.push(props);
        this.setState({hc_data: hist_data})
    }
    componentWillMount() {
        setInterval(() => {
            fetch('http://'+SKETCH_WS_URL+'/heavykeys?count=1')
                .then((response) => {
                    return response.json()
                })
                .then((json_response) => {
                    let heavy_keys = json_response.HeavyKeys;
                    let epoch = Object.keys(heavy_keys);
                    this.addHHEvent({x: epoch, y: heavy_keys[epoch].heavyHittersCounter});
                    this.addHCEvent({x: epoch, y: heavy_keys[epoch].heavyChangersCounter});

                })
        }, 2000);
    };
    render(){
        const {useCanvas} = this.state;
        const content = useCanvas ? 'TOGGLE TO SVG' : 'TOGGLE TO CANVAS';
        const BarSeries = useCanvas ? VerticalBarSeriesCanvas : VerticalBarSeries;

        return (
            <div>
                <FlexibleWidthXYPlot
                    xType="ordinal"
                    height={300}
                    xDistance={50} >
                    <HorizontalGridLines />
                    <XAxis />
                    <YAxis />
                    <BarSeries
                        className="vertical-bar-series-example"
                        data={this.state.hh_data}
                        onValueMouseOver={(datapoint, event)=>{
                            console.log(datapoint)
                        }}/>
                </FlexibleWidthXYPlot>
                <FlexibleWidthXYPlot
                    xType="ordinal"
                    height={300}
                    xDistance={50} >
                    <HorizontalGridLines />
                    <XAxis />
                    <YAxis />
                    <BarSeries
                        className="vertical-bar-series-example"
                        data={this.state.hc_data}/>
                </FlexibleWidthXYPlot>

            </div>
        );
    }

}

class App extends Component {
    render() {
        return (
            <div className="App">
                <Header/>
                <Histogram/>
            </div>
        );
    }
}

export default App;
