// JS
import React from 'react'
import { Card, Segment, Tab, Popup } from 'semantic-ui-react'
import extractor from 'css-color-extractor'
import parse from 'parse-color'
import DeltaE from 'delta-e'
// import brace from 'brace'
import AceEditor, { diff as DiffEditor } from 'react-ace'
// import DiffEditor from '../../../node_modules/react-ace/src/diff'
import rgb2lab from '../libs/rgb2lab'
import removeDuplicates from '../libs/removeDuplicatesFromArrayByKey'

// CSS
import "semantic-ui-css/semantic.css";
import './styles.css'
import styles from './styles.module.css'

import 'brace/mode/css'
import 'brace/theme/monokai'

// Raw data
import exampleData from 'raw!../master.source'

// extract color declarations from a full stylesheet
const extractedColours = extractor.fromCss(exampleData);

// console.log(extractedColours)

// expand the input colours into their other-format equivalents
const expanded = extractedColours
  // replace with the full details
  .map(declaration => {
    const r = new RegExp(declaration.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '[\s|;|!|\)]', 'g')
    const matches = exampleData.match(r);
    // console.log('regex?', r)
    // console.log('exampleData', exampleData.match(r).length)
    return {
      ...parse(declaration), // use all of the values from 'parse-color'
      lab: rgb2lab(parse(declaration).rgb), // lab values are needed for Delta-E analysis
      raw: declaration, // so we know how it's been referenced in the source code,
      useCount: matches ? matches.length : 0
    }
  })
  // remove any invalid values that couldn't be parsed into hex values
  .filter(({ hex }) => !!hex)

const expandedRefs = expanded.map(colorInfo => {
  // console.log(expanded.filter(({ hex }) => hex === colorInfo.hex))
  return {
    ...colorInfo,
    useCount: expanded.filter(({ hex }) => hex === colorInfo.hex).map(({ useCount }) => useCount).reduce((prev, curr) => prev + curr),
    raw: expanded.filter(({ hex }) => hex === colorInfo.hex).map(({ raw }) => raw)
  }
}).sort((a, b) => {
  return b.useCount - a.useCount
})

let newData = exampleData;

expandedRefs.map(colours => {
  newData = newData.replace(colours.raw, `rgba(${colours.rgba})`)
})

// const expandedWithUseCount

const deduplicated = removeDuplicates(expandedRefs, 'hex');
// const deduplicated = expanded.filter((obj, pos, arr) => {
//   const rtn = arr.map(mapObj => mapObj.hex).indexOf(obj.hex) === pos;
//   if (rtn) {
//     obj.raw = obj.raw.concat(arr[pos].raw)
//     console.log(obj.raw)
//   }
//   return rtn;
// });

const groupedPalette = deduplicated.map((color) => {
  return {
    ...color,
    distance: deduplicated.filter(curr => color !== curr).map((curr) => {
      const color1 = { L: color.lab[0], A: color.lab[1], B: color.lab[2] }
      const color2 = { L: curr.lab[0], A: curr.lab[1], B: curr.lab[2] }
      return {
        hex: curr.hex,
        distance: DeltaE.getDeltaE00(color1, color2)
      };
    }).sort((a, b) => {
      return a.distance - b.distance
    })
  }
})

const groups = groupedPalette.map(({ hex, distance }) => {
  return [
    ...distance.filter(({ distance }) => {
      return distance < 1
    }).map(({ hex: dhex }) => {
      return deduplicated.find(({ hex }) => dhex === hex)
    })
  ]
    .concat(deduplicated.find(({ hex: fhex }) => fhex === hex))
    .sort(({ hex: a }, { hex: b }) => {
      return parseInt(a.replace('#', ''), 16) - parseInt(b.replace('#', ''), 16);
    })
}).filter(ar => ar.length > 1)

const deduplicatedgroups = removeDuplicates(groups.map((group) => {
  return {
    id: group.map(({ hex }) => hex).join('-'),
    value: group
  }
}), 'id').sort(({ value: a }, { value: b }) => {
  const ahue = a[0]['hsv'][0]
  const bhue = b[0]['hsv'][0]
  if (ahue !== bhue) {
    return bhue - ahue;
  }
  return b.length - a.length
})

// function onChange(newValue) {
//   console.log('change', newValue);
// }

const panes = [
  {
    menuItem: 'Colour Palette', render: () => <Tab.Pane>
      <h2>Colour Palette</h2>
      <p>A preview of all of the colours, arranged by a number of declarations in the stylesheet.</p>
      <div className={styles.palettecontainer}>
        {
          groupedPalette.map((colour) => {
            return (
              <div key={colour.hex} className={`ui ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
            )
          })
        }
      </div>
    </Tab.Pane>
  },
  {
    menuItem: 'Similar colours', render: () => <Tab.Pane>
      <h2>Similar colours</h2>
      <p>The following colour groups have been tested with the <a href="http://zschuessler.github.io/DeltaE/">Delta-E 2000 algorithm</a> and are determined to be <a href="http://zschuessler.github.io/DeltaE/learn">perceptually indistinct,</a> making them good candidates for reducing to a single colour.</p>
      <div>
        {
          deduplicatedgroups.map(({ id, value: group }) => {
            return (
              <Segment key={id} vertical>
                <div className={styles.palettecontainer}>
                  {group.map((colour) => {
                    return (
                      <Popup
                        trigger={<div key={colour.hex} className={`ui ${styles.palette} ${colour.hsl[2] > 50 ? styles.palette_dark : styles.palette_light}`} style={{ backgroundColor: colour.hex }}>
                          {colour.hex.toUpperCase()}
                        </div>}
                        content={`Used ${colour.useCount} time${colour.useCount > 1 ? 's' : ''}`}
                        position='top center'
                        inverted
                      />
                    )
                  })}
                </div>
              </Segment>
            )
          })
        }
      </div>
    </Tab.Pane>
  },
  {
    menuItem: 'Extracted Colours', render: () => <Tab.Pane>
      <h2>Extracted Colours</h2>
      <p>Using <a href="https://github.com/rsanchez/css-color-extractor">css-color-extractor</a> to extract color declarations from CSS source and <a href="https://github.com/substack/parse-color">parse-color</a> to translate declarations into alternative formats.</p>
      <Card.Group className={styles.palettecontainer} itemsPerRow={3}>
        {
          deduplicated.map((colour) => {
            const withDistanceInfo = groupedPalette.find(({ hex }) => hex === colour.hex)
            return (
              <Card key={colour.hex}>
                <Card.Content>
                  <div className={`ui mini right floated ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
                  <Card.Header><a name={colour.hex.replace('#', '')}></a>{colour.hex}</Card.Header>
                  <Card.Meta>Declared {colour.useCount} time{colour.useCount > 1 ? 's' : ''} in CSS</Card.Meta>
                </Card.Content>
                <Card.Content extra>
                  <Card.Description>
                    <table className="ui celled table">
                      <thead>
                        <tr>
                          <th colSpan="2">Existing color declarations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          colour.raw.map(value => {
                            return (
                              <tr key={value}>
                                <td>
                                  <code>{value}</code>
                                </td>
                                <td>
                                  {
                                    expanded.filter(({ raw }) => raw === value).map(({ raw, useCount }) => {
                                      return <span key={raw}>Used {useCount} time{useCount > 1 ? 's' : ''}</span>
                                    })
                                  }
                                </td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </table>
                    <table className="ui celled table">
                      <thead>
                        <tr>
                          <th colSpan="2">Nearest Matching color</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className={`ui mini left floated ${styles.palette}`} style={{ backgroundColor: withDistanceInfo.distance[0].hex }}></div>
                          </td>
                          <td>
                            <span><a href={withDistanceInfo.distance[0].hex}>{withDistanceInfo.distance[0].hex}</a></span><br />
                            <span>{(100 - withDistanceInfo.distance[0].distance).toFixed(2)}% similarity</span><br />
                            <span>Used {deduplicated.find((otherColour) => otherColour.hex === withDistanceInfo.distance[0].hex).useCount} time{deduplicated.find((otherColour) => otherColour.hex === withDistanceInfo.distance[0].hex).useCount > 1 ? 's' : ''}</span><br />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="ui celled table">
                      <thead>
                        <tr>
                          <th colSpan="2">Parsed color values</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>hex</strong></td><td>{String(colour.hex)}</td></tr>
                        <tr><td><strong>rgb</strong></td><td>{String(colour.rgb)}</td></tr>
                        <tr><td><strong>rgba</strong></td><td>{String(colour.rgba)}</td></tr>
                        <tr><td><strong>hsl</strong></td><td>{String(colour.hsl)}</td></tr>
                        <tr><td><strong>hsla</strong></td><td>{String(colour.hsla)}</td></tr>
                        <tr><td><strong>hsv</strong></td><td>{String(colour.hsv)}</td></tr>
                        <tr><td><strong>hsva</strong></td><td>{String(colour.hsva)}</td></tr>
                        <tr><td><strong>cmyk</strong></td><td>{String(colour.cmyk)}</td></tr>
                        <tr><td><strong>cmyka</strong></td><td>{String(colour.cmyka)}</td></tr>
                        <tr className={!colour.keyword ? 'disabled' : ''}><td><strong>keyword</strong></td><td className={!colour.keyword ? styles.disabled : ''}>{!!colour.keyword ? String(colour.keyword) : 'no match'}</td></tr>
                      </tbody>
                    </table>
                  </Card.Description>
                </Card.Content>
              </Card>
            )
          })
        }
      </Card.Group>
    </Tab.Pane>
  },
  {
    menuItem: 'Source data', render: () => <Tab.Pane>
      <h2 id="source-data">Source data</h2>
      <DiffEditor
        mode="css"
        theme="monokai"
        width="900px"
        splits={2}
        value={[String(exampleData), String(newData)]}
      />
    </Tab.Pane>
  },
]

const IndexPage = () => (
  <div>
    <p>Inspired by <a href="https://github.com/internetarchive/openlibrary/issues/968">this issue,</a> this is an attempt to help normalise the CSS colour declarations of the Open Library website.</p>
    <h1>Summary</h1>
    <p>The <a href="#source-data">master CSS file</a> from OpenLibrary has been embedded into this page and processed.</p>
    <Card fluid>
      <Card.Content>
        <Card.Header>Extracted data</Card.Header>
      </Card.Content>
      <Card.Content extra>
        <Card.Description>
          <table>
            <tbody>
              <tr>
                <td>Total Color Declarations:</td>
                <td>{extractedColours.length}</td>
              </tr>
              <tr>
                <td>Unique Colors:</td>
                <td>{deduplicated.length}</td>
              </tr>
              <tr>
                <td>CSS Spec Keyword Colors:</td>
                <td>{deduplicated.filter(({ keyword }) => !!keyword).length}</td>
              </tr>
            </tbody>
          </table>
        </Card.Description>
      </Card.Content>
    </Card>
    <Tab panes={panes} />
  </div >
)

export default IndexPage