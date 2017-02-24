var recursive = require('recursive-readdir')
const _ = require('highland')
const fs = require('fs')
const bson = require('bson')
const BSON = new bson.BSONPure.BSON()
const SnappyJS = require('snappyjs')

var readFile = _.wrapCallback(fs.readFile)
var bibIds = {}

var dupeCheck = new Map()
var all = fs.createWriteStream('items.ndjson')

var counter = 0
recursive('./data/items', (err, files) => {
    if (err) console.log(err)
  // Files is an array of filename


  var decode = (data, cb) => {
    try{
      var uncompressed = SnappyJS.uncompress(data)
      try{
        data = BSON.deserialize(uncompressed)
        try{
          data.data.entries.forEach((bib) =>{
            bibIds[bib.id] = 1
          })
        }catch (e){
          console.log("Error reading data")
          console.log(data)
          console.log(e)
        }
      }catch (e){
        console.log("Error BSON deserialize data")
        console.log(uncompressed)
        console.log(e)
      }
    }catch (e){
      console.log("Error SnappyJS uncompressing data")
      console.log(data)
      console.log(e)
    }



    cb(null,data)
  }


  var data = _(files) // Creates a stream from an array of filenames
    .map((file) =>{
      if (file.search('.bson.snappy')>-1){
        if (++counter % 1000 === 0) console.log(file, Object.keys(bibIds).length)
        return file
      }else{
        return ''
      }
    })
    .compact()
      .map(readFile)
      .parallel(20)
      .map(_.curry(decode))
      .nfcall([])
      .parallel(10)
      .map((datas) =>{
        if (!datas){
          console.log('No datas')
          return ''
        }
        if (!datas.data){
          console.log('No datas.data')
          return ''
        }
        if (!datas.data.entries){
          console.log('No datas.data.entries')
          return ''
        }
        return datas.data.entries
      })
      .compact()
      .flatten()
      .map((data) =>{

        if (dupeCheck.get(parseInt(data.id))){
          return ''
        }

        dupeCheck.set(parseInt(data.id),true)

        return JSON.stringify(data) + '\n'
      })
      .pipe(all)

      // .done(() =>{
      //   console.log(Object.keys(bibIds).length)
      // })

})