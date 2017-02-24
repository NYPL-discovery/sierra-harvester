const _ = require('highland')
const wrapper = require('sierra-wrapper')
const mkdirp = require('mkdirp')
const fs = require('fs')
const bson = require('bson')
const BSON = new bson.BSONPure.BSON()
const SnappyJS = require('snappyjs')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
// wrapper.credsKey = ''
// wrapper.credsSecret = ''
// wrapper.credsBase = ''

var authTimer = null

var auth = (cb) => {
  wrapper.auth((errorAuth, results) => {
    console.log(results)
    if (errorAuth) {
      console.log({
        statusCode: '500',
        body: JSON.stringify({ error: 'Error with Sierra auth' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    if (cb) cb()
  })
}
var start = 0
var total = 1000000
var modifier = 10000000

var pageAry = []
var dataDir = `./data/items/${start + modifier}-${start + total + modifier}`
// make the directory
mkdirp(dataDir)

for (var i = start; i <= total + start; i = i + 50) {
  pageAry.push([i, i + 49])
}

// console.log(pageAry)
var downlaodFromSierra = (data, cb) => {

  wrapper.requestRangeItem(data[0], data[1], (errorItemReq, itemResults) => {
    if (!itemResults) itemResults = {}
    itemResults.start = data[0]
    itemResults.stop = data[1]

    // remove it from the array
    for (var x in pageAry) {
      if (pageAry[x][0] + modifier === data[0] && pageAry[x][1] + modifier === data[1]) {
        pageAry.splice(x, 1)
      }
    }

    if (errorItemReq) {
      console.log(errorItemReq)
      console.log('error on ', data, 'adding all into the queue')
      // how many are we requesting

      var pageSize = data[1] - data[0]

      if (pageSize <= 1) {
        // if this happens it is the second attempt to do this, so write it out to the error file in this batch
        fs.appendFile(`${dataDir}/errors.txt`, data[0] + modifier + '\n', function (err) {
          if (err) console.log(err)
        })
      }

      for (var x = 0; x < pageSize; x++) {
        pageAry.push([data[0] + x - modifier, data[0] + x - modifier])
      }

      console.log(pageSize)
      console.log('----')
      //console.log(pageAry)
      cb(null, itemResults)
    // pageAry.push(data[0])
    } else {
      if (!itemResults.data){
        var pageSize = data[1] - data[0]

        if (pageSize <= 1) {
          // if this happens it is the second attempt to do this, so write it out to the error file in this batch
          fs.appendFile(`${dataDir}/errors.txt`, data[0] + modifier + '\n', function (err) {
            if (err) console.log(err)
          })
        }
        for (var x = 0; x < pageSize; x++) {
          pageAry.push([data[0] + x - modifier, data[0] + x - modifier])
        }
        console.log('---- Error no itemResults.data')
        //console.log(pageAry)
        cb(null, itemResults)
        return false
      }
      console.log("Downloaded",data[0],data[1])

      var bufferData = BSON.serialize(itemResults, false, true, false)
      var compressed = SnappyJS.compress(bufferData)

      fs.writeFile(`${dataDir}/${data[0]}-${data[1]}.bson.snappy`, compressed, function (err) {
        if (err) {
          console.log(err)
        }
        cb(null, itemResults)
      })
    }
  })
}

auth(() => {
  var run = () => {
    _(pageAry)
      .map((start) => {
        var s = start[0] + modifier
        var e = start[1] + modifier

        //see if we already have that
        if (fs.existsSync(`${dataDir}/${s}-${e}.bson.snappy`)) {
          console.log(`Already have ${dataDir}/${s}-${e}.bson.snappy | ${pageAry.length}`)
          // remove it from the array
          for (var x in pageAry) {
                if (pageAry[x][0] + modifier === s && pageAry[x][1] + modifier === e) {
                        pageAry.splice(x, 1)
                        break
                }
          }
          return ""
        }else{
          return [s, e]
        }
      })
      .compact()
      .map(_.curry(downlaodFromSierra))
      .nfcall([])
      .parallel(10)
      .done(() => {
        if (pageAry.length === 0) {
          clearTimeout(authTimer)
          console.log('done!')
        } else {
          run()
        }
      })
  }
  run()
})

authTimer = setInterval(() => {
  auth()
}, 1000 * 1800)

