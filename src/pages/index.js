import React from 'react'

import exampleData from 'raw!../master.source'

const IndexPage = () => (
  <div>
    <h2>Source data</h2>
    <pre><code>{exampleData}</code></pre>
  </div >
)

export default IndexPage
