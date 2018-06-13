import React from 'react'
import { Card } from 'semantic-ui-react'

import "semantic-ui-css/semantic.css";

import styles from './styles.module.css'
import exampleData from 'raw!../master.source'


var extractor = require('css-color-extractor');

var options = {
  // withoutGrey: false, // set to true to remove rules that only have grey colors
  // withoutMonochrome: false, // set to true to remove rules that only have grey, black, or white colors
  colorFormat: null // transform colors to one of the following formats: hexString, rgbString, percentString, hslString, hwbString, or keyword
};

// extract from a full stylesheet
const extractedColours = extractor.fromCss(exampleData);

const IndexPage = () => (
  <div>
    <h2>Extracted Colours <small>({extractedColours.length} total)</small></h2>
    <Card.Group className={styles.palettecontainer}>
      {
        extractedColours.map((colour) => {
          return (
            <Card key={colour}>
              <Card.Content>
                <Card.Header>{colour}</Card.Header>
                <div className={`ui mini right floated ${styles.palette}`} style={{ backgroundColor: colour }}></div>
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
