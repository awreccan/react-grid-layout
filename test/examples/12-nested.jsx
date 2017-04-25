'use strict';
var React = require('react');
var PropTypes = require('prop-types');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var _ = require('lodash');
var WidthProvider = require('react-grid-layout').WidthProvider;
var ReactGridLayout = require('react-grid-layout');
ReactGridLayout = WidthProvider(ReactGridLayout);

var NestedLayout = React.createClass({
    mixins: [PureRenderMixin],

    propTypes: {
        onLayoutChange: PropTypes.func.isRequired
    },

    reportToPlayground(message) {
        this.setState({
            messageFromGrandChildren: message
        });
    },

    getDefaultProps() {
        return {
            className: "layout",
            items: 2,
            rowHeight: 50,
            onLayoutChange: function() {},
            cols: 2
        };
    },

    getInitialState() {
        var layout = this.generateLayout();
        return {
            messageFromGrandChildren: null,
            layout: layout
        };
    },

    generateDOM(title) {
        return _.map(_.range(this.props.items), function(i) {
            return (<div key={i}><span className="text">{title[0] + i}</span></div>);
        });
    },

    generateLayout() {
        let CARDS_PER_BUCKET = 10;
        let COLS_PER_TILE = 1;
        let COLS = 2;
        let THIS_KINDA_DECIDES_THE_DIST_OF_TILES_BW_COLS = 3;

        let map = _.map(new Array(CARDS_PER_BUCKET), function(item, i) {
            var y = /*_.result(p, 'y') || */Math.ceil(Math.random() * 4) + 1;
            return {
                x: Math.ceil((i * COLS_PER_TILE) % COLS),
                y: Math.floor(i / THIS_KINDA_DECIDES_THE_DIST_OF_TILES_BW_COLS) * y,
                w: COLS_PER_TILE,
                h: y,
                i: i.toString()
            };
        });
        return map;
    },

    onLayoutChange: function(layout) {
        this.props.onLayoutChange(layout);
    },

    render() {
        let LENGTH = 4;
        let layout = [
            {
                i: 'Goals',
                x: 0,
                y: 0,
                w: LENGTH,
                h: LENGTH
            }, {
                i: 'Pools',
                x: LENGTH,
                y: 0,
                w: LENGTH,
                h: LENGTH
            }, /*{
             i: 'Investments',
             x: 2,
             y: 0,
             w: 1,
             h: 1,
             isResizable: false,
             autoSize: true,
             }, {
             i: 'Bills',
             x: 3,
             y: 0,
             w: 1,
             h: 1,
             isResizable: false,
             autoSize: true,
             }*/
        ];

        return (
            <div>
                {this.state.messageFromGrandChildren && 'Message from Grandchildren: ' + JSON.stringify(this.state.messageFromGrandChildren)}
                <ReactGridLayout layout={layout}>
                    <div key={'Goals'}>
                        <ReactGridLayout reportToPlayground={this.reportToPlayground} isGrandChild={true} layout={this.state.layout}
                                         onLayoutChange={this.onLayoutChange}
                            {...this.props}>
                            {this.generateDOM('Goals')}
                        </ReactGridLayout>
                    </div>
                    <div key={'Pools'}>
                        <ReactGridLayout layout={this.state.layout} onLayoutChange={this.onLayoutChange}
                            {...this.props}>
                            {this.generateDOM('Pools')}
                        </ReactGridLayout>
                    </div>
                </ReactGridLayout>
            </div>
        );
    }
});

module.exports = NestedLayout;

if (require.main === module) {
    require('../test-hook.jsx')(module.exports);
}
