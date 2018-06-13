// JS
import React from 'react'
import { Card } from 'semantic-ui-react'
import extractor from 'css-color-extractor'
import parse from 'parse-color'

// CSS
import "semantic-ui-css/semantic.css";
import styles from './styles.module.css'

// Raw data
import exampleData from 'raw!../master.source'


var options = {
  // withoutGrey: false, // set to true to remove rules that only have grey colors
  // withoutMonochrome: false, // set to true to remove rules that only have grey, black, or white colors
  colorFormat: null // transform colors to one of the following formats: hexString, rgbString, percentString, hslString, hwbString, or keyword
};

// extract from a full stylesheet
const extractedColours = extractor.fromCss(exampleData);

// expand the input colours into their other syntax equivalents
const expanded = extractedColours
  .map(declaration => {
    return {
      ...parse(declaration),
      raw: declaration
    }
  }) // replace with the full details
  .filter(({ hex }) => !!hex) // remove any that haven't parsed correctly

function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}

const deduplicated = removeDuplicates(expanded, 'hex');

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
                {/* <td></td> */}
              </tr>
              <tr>
                <td>Unique Colors:</td>
                <td>{deduplicated.length}</td>
                {/* <td></td> */}
              </tr>
              <tr>
                <td>CSS Spec Keyword Colors:</td>
                <td>{deduplicated.filter(({ keyword }) => !!keyword).length}</td>
                {/* <td>{
                  deduplicated.filter(({ keyword }) => !!keyword).map(({ hex, keyword }) => {
                    return <span><a href={`${hex}`}>{keyword}</a>, </span>
                  })
                }</td> */}
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
        expanded.map((colour) => {
          return (
            <div className={`ui ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
          )
        })
      }
    </div>
    <h2>Extracted Colours</h2>
    <p>Using <a href="https://github.com/rsanchez/css-color-extractor">css-color-extractor</a> to extract color declarations from CSS source and <a href="https://github.com/substack/parse-color">parse-color</a> to translate declarations into alternative formats.</p>
    <Card.Group className={styles.palettecontainer} itemsPerRow={3}>
      {
        expanded.map((colour) => {
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
