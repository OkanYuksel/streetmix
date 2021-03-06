import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { t } from '../app/locale'
import { getSegmentInfo } from '../segments/info'
import { VARIANT_ICONS } from '../segments/variant_icons'
import { getVariantArray } from '../segments/variant_utils'
import { changeSegmentVariantLegacy } from '../segments/view'
import { infoBubble } from './info_bubble'
import { setBuildingVariant, changeSegmentVariant } from '../store/actions/street'

// Duped from InfoBubble
const INFO_BUBBLE_TYPE_SEGMENT = 1
const INFO_BUBBLE_TYPE_LEFT_BUILDING = 2
const INFO_BUBBLE_TYPE_RIGHT_BUILDING = 3

class Variants extends React.Component {
  static propTypes = {
    type: PropTypes.number,
    position: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf(['left', 'right'])
    ]),
    variant: PropTypes.string,
    segmentType: PropTypes.string,
    setBuildingVariant: PropTypes.func.isRequired,
    changeSegmentVariant: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      variantSets: this.getVariantSets(props) // should be an array or undefined
    }
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      variantSets: this.getVariantSets(nextProps)
    })
  }

  getVariantSets = (props) => {
    let variantSets = []

    switch (props.type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        const segmentInfo = getSegmentInfo(props.segmentType)
        if (segmentInfo) {
          variantSets = segmentInfo.variants
        }
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        variantSets = Object.keys(VARIANT_ICONS['building'])
        break
      default:
        break
    }

    // Return the array, removing any empty entries
    return variantSets.filter((x) => x !== (undefined || null || ''))
  }

  isVariantCurrentlySelected = (set, selection) => {
    let bool

    switch (this.props.type) {
      case INFO_BUBBLE_TYPE_SEGMENT: {
        const obj = getVariantArray(this.props.segmentType, this.props.variant)
        bool = (selection === obj[set])
        break
      }
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        bool = (selection === this.props.variant)
        break
      default:
        bool = false
        break
    }

    return bool
  }

  getButtonOnClickHandler = (set, selection) => {
    let handler

    switch (this.props.type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        handler = (event) => {
          this.props.changeSegmentVariant(this.props.position, set, selection)
          changeSegmentVariantLegacy(this.props.position, set, selection)
        }
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
        handler = (event) => {
          this.props.setBuildingVariant('left', selection)

          // TODO: remove legacy notification
          infoBubble.onBuildingVariantButtonClick('left')
        }
        break
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        handler = (event) => {
          this.props.setBuildingVariant('right', selection)

          // TODO: remove legacy notification
          infoBubble.onBuildingVariantButtonClick('right')
        }
        break
      default:
        handler = () => {}
        break
    }

    return handler
  }

  renderButton = (set, selection) => {
    const icon = VARIANT_ICONS[set][selection]

    if (!icon) return null

    const title = t(`variant-icons.${set}|${selection}`, icon.title, { ns: 'segment-info' })

    return (
      <button
        key={set + '.' + selection}
        title={title}
        disabled={this.isVariantCurrentlySelected(set, selection)}
        onClick={this.getButtonOnClickHandler(set, selection)}
      >
        <svg
          xmlns="http://www.w3.org/1999/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className="icon"
          style={icon.color ? { fill: icon.color } : null}
        >
          {/* `xlinkHref` is preferred over `href` for compatibility with Safari */}
          <use xlinkHref={`#icon-${icon.id}`} />
        </svg>
      </button>
    )
  }

  renderVariantsSelection = () => {
    const variantEls = []

    switch (this.props.type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        let first = true

        // Each segment has some allowed variant sets (e.g. "direction")
        for (let variant in this.state.variantSets) {
          const set = this.state.variantSets[variant]

          // New row for each variant set
          if (!first) {
            const el = <hr key={set} />
            variantEls.push(el)
          } else {
            first = false
          }

          // Each variant set has some selection choices.
          // VARIANT_ICONS is an object containing a list of what
          // each of the selections are and data for building an icon.
          // Different segments may refer to the same variant set
          // ("direction" is a good example of this)
          for (let selection in VARIANT_ICONS[set]) {
            const el = this.renderButton(set, selection)

            variantEls.push(el)
          }
        }
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        this.state.variantSets.map((building) => {
          const el = this.renderButton('building', building)
          variantEls.push(el)
        })
        break
      default:
        break
    }

    return variantEls
  }

  render () {
    // Do not render this component if there are no variants to select
    if (!this.state.variantSets || this.state.variantSets.length === 0) return null

    return (
      <div className="variants">
        {this.renderVariantsSelection()}
      </div>
    )
  }
}

function mapStateToProps (state, ownProps) {
  let variant
  let segmentType

  // Get the appropriate variant information
  if (ownProps.position === 'left') {
    variant = state.street.leftBuildingVariant
  } else if (ownProps.position === 'right') {
    variant = state.street.rightBuildingVariant
  } else if (Number.isInteger(ownProps.position) && state.street.segments[ownProps.position]) {
    const segment = state.street.segments[ownProps.position]
    variant = segment.variantString
    segmentType = segment.type
  }

  return {
    variant,
    segmentType
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setBuildingVariant: (position, variant) => { dispatch(setBuildingVariant(position, variant)) },
    changeSegmentVariant: (position, set, selection) => { dispatch(changeSegmentVariant(position, set, selection)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Variants)
