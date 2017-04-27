'use strict';
var React = require('react');
var PropTypes = require('prop-types');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var _ = require('lodash');
var WidthProvider = require('react-grid-layout').WidthProvider;
var ReactGridLayout = require('react-grid-layout');
// ReactGridLayout = WidthProvider(ReactGridLayout);
import {getLayoutItem} from '../../lib/utils'

let IDGEN = 0;

let PLAYGROUND_COLS = 2;
let BUCKETS_SPANNING_PLAYGROUND = 2;
let UNIT_LENGTH_PLAYGROUND = PLAYGROUND_COLS / BUCKETS_SPANNING_PLAYGROUND;

let BUCKET_COLS = 2;
let TILES_SPANNING_BUCKET = 2;
let UNIT_LENGTH_BUCKET = BUCKET_COLS / TILES_SPANNING_BUCKET;

var Playground = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    onLayoutChange: PropTypes.func.isRequired
  },

  // Helper for generating column width
  calcColWidth(margin, containerPadding, containerWidth, cols): number {
    return (containerWidth - (margin[0] * (cols - 1)) - (containerPadding[0] * 2)) / cols;
  },

  calcInfiniteSpheresOfInfluence({l, containerPadding, bucketWidth, margin, isLeftmost, isRightmost, isTopmost, rowHeight}) {
    let left = containerPadding[0] + l.x * (bucketWidth + margin[0]) - margin[0]/2;
    let right = left + bucketWidth + margin[0];
    let top = containerPadding[1] + l.y * (rowHeight + margin[1]) - margin[0]/2;
    let bottom = top + rowHeight + margin[1];

    if (isLeftmost) left = -Infinity;
    if (isRightmost) right = Infinity;
    if (isTopmost) top = -Infinity;

    return {left, right, top, bottom};
  },

  bucketToPlayground(bucketName, draggedTileProps) {
    const {margin, width, cols, rowHeight} = this.props.containerProps;
    let {containerPadding} = this.props.containerProps;
    containerPadding = containerPadding || margin;

    console.log('draggedTileProps',
      draggedTileProps.newPositionInBucketCoords.left,
      draggedTileProps.newPositionInPlaygroundCoords.left
    );

    let tile = {
      left: draggedTileProps.newPositionInPlaygroundCoords.left,
      top: draggedTileProps.newPositionInPlaygroundCoords.top,
      w: draggedTileProps.dimensions.w,
      h: draggedTileProps.dimensions.h
    };

    const bucketWidth = this.calcColWidth(margin, containerPadding, width, cols);
    let buckets = this.state.buckets.map(bucket => {
      const l = getLayoutItem(this.state.buckets, bucket.i);
      const isLeftmost = l.x === 0;
      const isRightmost = l.x === cols - l.w;
      const isTopmost = l.y === 0;
      // FIXME: there isn't a concept of bottommost in RGL - you can always add to the bottom and cause the container to expand

      // define each bucket's sphere of influence from where it can catch flying tiles
      // this.calcLimitedSpheresOfInfluence({l, containerPadding, bucketWidth, margin, isLeftmost, isRightmost, isTopmost, rowHeight});
      const spheresOfInfluence = this.calcInfiniteSpheresOfInfluence({l, containerPadding, bucketWidth, margin, isLeftmost, isRightmost, isTopmost, rowHeight});

      return {
        ...l,
        ...spheresOfInfluence
      }
    });

    let catchBucket = buckets.find(b => (
      tile.left >= b.left && tile.left < b.right &&
      tile.top >= b.top && tile.top < b.bottom
    ));

    if (catchBucket) {
      // found a bucket to catch the tile being dragged
      console.log('catchBucket', catchBucket.i);
    } else {
      console.error('no catchBucket');
    }

    buckets = [...this.state.buckets];
    let tileIdx, fromBucket;
    for (let i = 0; i < buckets.length; i++) {
      tileIdx = buckets[i].tiles.findIndex(t => t.i === draggedTileProps.i);
      if (tileIdx !== -1) {
        fromBucket = buckets[i];
        break;
      }
    }
    if (fromBucket.i === catchBucket.i) return; //FIXME
    let toBucket = buckets.find(b => b.i === catchBucket.i);

    [tile] = fromBucket.tiles.splice(tileIdx, 1);
    toBucket.tiles.push(tile);

    this.setState({buckets});
  },

  /*containerToPlayground({draggedTileLayoutItem, toBucketKey}) {
    this.setState((prevState) => {
        let buckets = [...prevState.buckets];
        let tileIdx;
        let fromBucket = buckets.find(b => {
            tileIdx = b.tiles.findIndex(t => t.i === draggedTileLayoutItem.i)
        });
        if (fromBucket.i === toBucketKey) return prevState;
        let toBucket = buckets.find(b => b.i === toBucketKey);

        const [tile] = fromBucket.splice(tileIdx, 1);
        toBucket.tiles.push(tile);
        return {...prevState, buckets};
    });
  },*/

  getDefaultProps() {
    let PLAYGROUND_COLS = 2;
    let BUCKETS_SPANNING_PLAYGROUND = 2;
    let UNIT_LENGTH_PLAYGROUND = PLAYGROUND_COLS / BUCKETS_SPANNING_PLAYGROUND;

    let BUCKET_COLS = 2;
    let TILES_SPANNING_BUCKET = 2;
    let UNIT_LENGTH_BUCKET = BUCKET_COLS / TILES_SPANNING_BUCKET;

    return {
      onLayoutChange: function() {},
      containerProps: {
        rowHeight: 300,
        width: 500,
        cols: PLAYGROUND_COLS,
        margin: [10, 10],
        containerPadding: [10, 10],
      },
      bucketProps: {
        className: "layout",
        cols: BUCKET_COLS,
        // the following props are copied from RGL's defaults
        containerPadding: [13, 13],
        margin: [7, 7],
        // width, // not setting width, it's optional, and has special treatment explained in RGL comments
        // ok well width can't be undefined so for now i'm hardcoding it
        // but the playground needs to sniff it from each bucket, and in the absence of an explicitly set width,
        // width is derived from the container width (how much space is left for the bucket in the playground)
        // width: 200,
        rowHeight: 150,
        maxRows: Infinity
      },
    };
  },

  getInitialState() {
    // var layout = this.generateLayout();
    return {
      messageFromGrandChildren: null,
      // layout: layout,
      buckets: [
        {
          i: 'Goals',
          x: 0,
          y: 0,
          w: UNIT_LENGTH_PLAYGROUND,
          h: UNIT_LENGTH_PLAYGROUND,
          tiles: this.generateUniqueTiles()
        },
        {
          i: 'Pools',
          x: UNIT_LENGTH_PLAYGROUND,
          y: 0,
          w: UNIT_LENGTH_PLAYGROUND,
          h: UNIT_LENGTH_PLAYGROUND,
          tiles: this.generateUniqueTiles()
        }
      ],
      IDGEN
    };
  },

  generateUniqueTiles() {
    return [
      {
        i: String(IDGEN++),
        x: 0,
        y: 0,
        w: UNIT_LENGTH_BUCKET,
        h: UNIT_LENGTH_BUCKET
      },
      {
        i: String(IDGEN++),
        x: UNIT_LENGTH_BUCKET,
        y: 0,
        w: UNIT_LENGTH_BUCKET,
        h: UNIT_LENGTH_BUCKET
      }
    ]
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


    return (
      <div>
        {/*{this.state.messageFromGrandChildren && 'Message from Grandchildren: ' + JSON.stringify(this.state.messageFromGrandChildren)}*/}
          <ReactGridLayout layout={this.state.buckets}
            {...this.props.containerProps}
          >
            {this.state.buckets.map(b =>
                <ReactGridLayout key={b.i} bucketToPlayground={this.bucketToPlayground.bind(this, b.i)}
                  {...this.props.bucketProps} layout={b.tiles} onLayoutChange={this.onLayoutChange}
                >
                  {b.tiles.map(t =>
                    <div key={t.i}><span className="text">{b.i[0] + t.i}</span></div>
                  )}
                </ReactGridLayout>
            )}
          </ReactGridLayout>
      </div>
    );
  }
});

module.exports = Playground;

if (require.main === module) {
  require('../test-hook.jsx')(module.exports);
}
