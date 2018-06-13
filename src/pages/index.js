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
const expanded = extractedColours.map(parse)
console.log(expanded)

const IndexPage = () => (
  <div>
    <h1>Summary</h1>
    <Card>
      <Card.Content>
        <Card.Header>Extracted data</Card.Header>
        <Card.Description>
          <table><tbody>
            <tr><td>Total Color Declarations:</td><td>{extractedColours.length}</td></tr>
          </tbody>
          </table>
        </Card.Description>
      </Card.Content>
    </Card>
    <h2>Extracted Colours</h2>
    <Card.Group className={styles.palettecontainer}>
      {
        expanded.map((colour) => {
          return (
            <Card key={colour.hex}>
              <Card.Content>
                <div className={`ui mini right floated ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
                <Card.Header>{colour.hex}</Card.Header>
                <Card.Meta>{colour.keyword}</Card.Meta>
                <Card.Description>
                  <table><tbody>
                    <tr><td>rgb</td><td>{String(colour.rgb)}</td></tr>
                    <tr><td>hsl</td><td>{String(colour.hsl)}</td></tr>
                    <tr><td>hsv</td><td>{String(colour.hsv)}</td></tr>
                    <tr><td>cmyk</td><td>{String(colour.cmyk)}</td></tr>
                    <tr><td>keyword</td><td>{String(colour.keyword)}</td></tr>
                    <tr><td>hex</td><td>{String(colour.hex)}</td></tr>
                    <tr><td>rgba</td><td>{String(colour.rgba)}</td></tr>
                    <tr><td>hsla</td><td>{String(colour.hsla)}</td></tr>
                    <tr><td>hsva</td><td>{String(colour.hsva)}</td></tr>
                    <tr><td>cmyka</td><td>{String(colour.cmyka)}</td></tr>
                  </tbody>
                  </table>
                </Card.Description>
              </Card.Content>
            </Card>
          )
        })
      }
    </Card.Group>
    <h2>Source data</h2>
    <pre><code>{exampleData}</code></pre>
  </div >
)

export default IndexPage
