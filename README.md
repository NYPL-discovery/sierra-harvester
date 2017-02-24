# sierra-harvester
Harvest bib/items from Sierra API

---

These scripts will harvest bibs and items from the Sierra API in batches of 50. You need to configure the API creds in the script and then run it in batches, at the start of each script has:

```
// where do we want to start, and how many do we want to do?
var start = 100000
var total = 100000
var modifier = 10000000

// this config will for example start at: 10100000 and go to 10200000
```

The output will be auto created directories in the `data/bibs` and `data/items` it stores each 50 batch as compressed as SnappyJS compressed BSON file.

`bibs.js` - the harvester for bibs

`items.js` - for items

`read-bibs.js` - will read the data/bibs directory and compile it into larger new line delimited json file.

`read-items.js` - for items

`decode-test.js` - example of how to decode/parse the snappy bson.

The same batch can be re-run over and over, the script will look into the data directory to see if it already did that file. This is good for when the API starts timing out or you need to stop and start again later.
