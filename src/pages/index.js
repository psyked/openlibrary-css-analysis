// JS
import React from 'react'
import { Card, Segment } from 'semantic-ui-react'
import extractor from 'css-color-extractor'
import parse from 'parse-color'
import DeltaE from 'delta-e'
import rgb2lab from '../libs/rgb2lab'
import removeDuplicates from '../libs/removeDuplicatesFromArrayByKey'

// CSS
import "semantic-ui-css/semantic.css";
import styles from './styles.module.css'

// Raw data
import exampleData from 'raw!../master.source'

// extract color declarations from a full stylesheet
const extractedColours = extractor.fromCss(exampleData);

// expand the input colours into their other-format equivalents
const expanded = extractedColours
  // replace with the full details
  .map(declaration => {
    return {
      ...parse(declaration), // use all of the values from 'parse-color'
      lab: rgb2lab(parse(declaration).rgb), // lab values are needed for Delta-E analysis
      raw: [declaration] // so we know how it's been referenced in the source code
    }
  })
  // remove any invalid values that couldn't be parsed into hex values
  .filter(({ hex }) => !!hex)

const deduplicated = removeDuplicates(expanded, 'hex');

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
              <tr>
                <td>Web Safe Colors:</td>
                <td>coming soon</td>
              </tr>
            </tbody>
          </table>
        </Card.Description>
      </Card.Content>
    </Card>
    <h2>Colour Palette</h2>
    <p>A preview of all of the colours, arranged by order of appearance in the stylesheet.</p>
    <div className={styles.palettecontainer}>
      {
        groupedPalette.map((colour) => {
          return (
            <div key={colour.hex} className={`ui ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
          )
        })
      }
    </div>
    <h2>Similar colours</h2>
    <p>The following colour groups have been tested with the <a href="http://zschuessler.github.io/DeltaE/">Delta-E 2000 algorithm</a> and are determined to be <a href="http://zschuessler.github.io/DeltaE/learn">perceptually indistinct,</a> making them good candidates for reducing to a single colour.</p>
    <div>
      {
        deduplicatedgroups.map(({ id, value: group }) => {
          return (
            <Segment vertical>
              <div className={styles.palettecontainer}>
                {group.map((colour) => {
                  return (
                    <div key={colour.hex} className={`ui ${styles.palette} ${colour.hsl[2] > 50 ? styles.palette_dark : styles.palette_light}`} style={{ backgroundColor: colour.hex }}>
                      {colour.hex.toUpperCase()}
                    </div>
                  )
                })}
              </div>
            </Segment>
          )
        })
      }
    </div>
    <h2>Extracted Colours</h2>
    <p>Using <a href="https://github.com/rsanchez/css-color-extractor">css-color-extractor</a> to extract color declarations from CSS source and <a href="https://github.com/substack/parse-color">parse-color</a> to translate declarations into alternative formats.</p>
    <Card.Group className={styles.palettecontainer} itemsPerRow={3}>
      {
        deduplicated.map((colour) => {
          return (
            <Card key={colour.hex}>
              <Card.Content>
                <div className={`ui mini right floated ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
                <Card.Header><a name={colour.hex.replace('#', '')}></a>{colour.hex}</Card.Header>
                <Card.Meta>{colour.keyword}</Card.Meta>
              </Card.Content>
              <Card.Content extra>
                <Card.Description>
                  <table className="ui celled table">
                    <thead>
                      <tr>
                        <th>Existing color declarations</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>{String(colour.raw)}</code></td>
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
    <h2 id="source-data">Source data</h2>
    <pre><code>{exampleData}</code></pre>
  </div >
)

export default IndexPage
