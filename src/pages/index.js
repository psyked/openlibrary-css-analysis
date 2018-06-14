// JS
import React from 'react'
import { Card, Segment } from 'semantic-ui-react'
import extractor from 'css-color-extractor'
import parse from 'parse-color'
import DeltaE from 'delta-e'

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
      lab: rgb2lab(parse(declaration).rgb),
      raw: declaration
    }
  }) // replace with the full details
  .filter(({ hex }) => !!hex) // remove any that haven't parsed correctly

function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}

function rgb2lab(rgb) {
  if (!rgb) return;
  var r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255,
    x, y, z

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}


const deduplicated = removeDuplicates(expanded, 'hex');

const groupedPalette = deduplicated.map((color) => {
  return {
    ...color,
    distance: deduplicated.filter(curr => color !== curr).map((curr) => {
      const color1 = { L: color.lab[0], A: color.lab[1], B: color.lab[2] }
      const color2 = { L: curr.lab[0], A: curr.lab[1], B: curr.lab[2] }
      // console.log(color1, color2)
      return {
        hex: curr.hex,
        distance: DeltaE.getDeltaE00(color1, color2)
      };
    }).sort((a, b) => {
      return a.distance - b.distance
    })
  }
})

// console.log(groupedPalette)

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

// console.log(groups)

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

// console.log(deduplicatedgroups)


// const ranges = [
//   [0, 0, 'greyscale'],
//   [346, 45, 'red'],
//   [46, 105],
//   [106, 165],
//   [166, 225],
//   [226, 285],
//   [286, 345]
// ]

// const sortedPalette = deduplicated.filter(({ hsl }) => hsl[0] > 0 && hsl[0] <= 60).sort((a, b) => {
//   return a.hsl[2] - b.hsl[2];
//   // return (a.hsl[1] + a.hsl[2]) - (b.hsl[1] + b.hsl[2]);
// })

// const groupedPalette = ranges.map(range => {
//   return deduplicated.filter(({ hsl: [hue, sat, lightness] }) => {
//     const [min, max] = range
//     if (min === 0 && max === 0 && sat === 0) {
//       return true;
//     }
//     if (min > max) {
//       return hue >= min || hue <= max;
//     } else {
//       return hue >= min && hue <= max;
//     }
//   }).sort((a, b) => {
//     return a.hsl[2] - b.hsl[2];
//   })
// })

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
    {/* <div className={styles.palettecontainer}>
      {
        sortedPalette.map((colour) => {
          return (
            <div key={colour.hex} className={`ui ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
          )
        })
      }
    </div> */}
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
      {/* <div className={styles.palettecontainer}>
        {deduplicatedgroups.map((colour) => {
          return (
            <div key={colour.hex} className={`ui ${styles.palette}`} style={{ backgroundColor: colour.hex }}></div>
          )
        })}
      </div> */}
      {
        deduplicatedgroups.map(({ id, value: group }) => {
          return (
            <Segment vertical>
              <div className={styles.palettecontainer}>
                {/* {id} */}
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
                      {/* <tr><td><strong>lab</strong></td><td>{String(colour.lab)}</td></tr> */}
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
