const bson = require('bson')
const BSON = new bson.BSONPure.BSON()
const fs = require('fs')
const SnappyJS = require('snappyjs')

fs.readFile('./data/10100000-10200000/10100000-10100049.bson.snappy', (err, data) => {
  if (err) console.log(err)
  var uncompressed = SnappyJS.uncompress(data)
  data = BSON.deserialize(uncompressed)
  console.log(JSON.stringify(data))
})


fs.readFile('./data/items/10000000-11000000/10000550-10000599.bson.snappy', (err, data) => {
  if (err) console.log(err)
  var uncompressed = SnappyJS.uncompress(data)
  data = BSON.deserialize(uncompressed)
  console.log(JSON.stringify(data))
})

