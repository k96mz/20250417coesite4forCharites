var express = require('express')
var router = express.Router()

const config = require('config')
const fs = require('fs')
const cors = require('cors')
const MBTiles = require('@mapbox/mbtiles')
const TimeFormat = require('hh-mm-ss')

// config constants
const defaultZ = config.get('defaultZ')
const mbtilesDir = config.get('mbtilesDir')

// global variables
let mbtilesPool = {}
let tz = config.get('tz')
let sTileName = config.get('sTileName')
let busy = false

//var app = express()
//app.use(cors())


//Get tile functions
const getMBTiles = async (t, z, x, y) => {
  let mbtilesPath = ''
  let mbtilesPath2 = ''
  let mbtilesPath3 = ''
  if (!tz[t]) tz[t] = defaultZ
  let tz2 = tz[t] - 1
  let tz3 = tz[t] - 2
  if (z < tz[t]) {
    if (sTileName[t]) {
      let stname = sTileName[t]
      mbtilesPath = `${mbtilesDir}/${t}/${stname}.mbtiles`
      mbtilesPath2 = `${mbtilesDir}/${t}/${stname}.mbtiles`
      mbtilesPath3 = `${mbtilesDir}/${t}/${stname}.mbtiles`
      } else {
      mbtilesPath = `${mbtilesDir}/${t}/0-0-0.mbtiles`
      mbtilesPath2 = `${mbtilesDir}/${t}/0-0-0.mbtiles`
      mbtilesPath3 = `${mbtilesDir}/${t}/0-0-0.mbtiles`
      }
  } else {
    mbtilesPath =
      `${mbtilesDir}/${t}/${tz[t]}-${x >> (z - tz[t])}-${y >> (z - tz[t])}.mbtiles`
    mbtilesPath2 =
      `${mbtilesDir}/${t}/${tz2}-${x >> (z - tz2)}-${y >> (z - tz2)}.mbtiles`     
    mbtilesPath3 =
      `${mbtilesDir}/${t}/${tz3}-${x >> (z - tz3)}-${y >> (z - tz3)}.mbtiles`        
  }
  return new Promise((resolve, reject) => {
    if (mbtilesPool[mbtilesPath]) {
      resolve(mbtilesPool[mbtilesPath].mbtiles)
    } else if (mbtilesPool[mbtilesPath2]) {
      resolve(mbtilesPool[mbtilesPath2].mbtiles)
    } else if (mbtilesPool[mbtilesPath3]) {    
      resolve(mbtilesPool[mbtilesPath3].mbtiles)
    } else {
      if (fs.existsSync(mbtilesPath)) {
        new MBTiles(`${mbtilesPath}?mode=ro`, (err, mbtiles) => {
          if (err) {
            reject(new Error(`${mbtilesPath} could not open.`))
          } else {
            mbtilesPool[mbtilesPath] = {
              mbtiles: mbtiles, openTime: new Date()
            }
            resolve(mbtilesPool[mbtilesPath].mbtiles)
          }
        })
      } else if (fs.existsSync(mbtilesPath2)) {
        new MBTiles(`${mbtilesPath2}?mode=ro`, (err, mbtiles) => {
          if (err) {
            reject(new Error(`${mbtilesPath2} could not open.`))
          } else {
            mbtilesPool[mbtilesPath2] = {
              mbtiles: mbtiles, openTime: new Date()
            }
            resolve(mbtilesPool[mbtilesPath2].mbtiles)
          }
        }) 
      } else if (fs.existsSync(mbtilesPath3)) {
        new MBTiles(`${mbtilesPath3}?mode=ro`, (err, mbtiles) => {
          if (err) {
            reject(new Error(`${mbtilesPath3} could not open.`))
          } else {
            mbtilesPool[mbtilesPath3] = {
              mbtiles: mbtiles, openTime: new Date()
            }
            resolve(mbtilesPool[mbtilesPath3].mbtiles)
          }
        }) 
//edit until here
      } else {
        reject(new Error(`${mbtilesPath} was not found.`))
      }
    }
  })
}


const getTile = async (mbtiles, z, x, y) => {
  return new Promise((resolve, reject) => {
    mbtiles.getTile(z, x, y, (err, tile, headers) => {
      if (err) {
        reject()
      } else {
        resolve({tile: tile, headers: headers})
      }
    })
  })
}




/* GET Tile. */
//router.get('/', 
// async function(req, res, next) {
router.get(`/zxy/:t/:z/:x/:y.pbf`, 
 async function(req, res) {
  busy = true
  const t = req.params.t
  const z = parseInt(req.params.z)
  const x = parseInt(req.params.x)
  const y = parseInt(req.params.y)


//if (!req.session.userId) {
var whiteList=[
  "https://ubukawa.github.io/cors-cookie",
  "https://abc"
]
if (!req.session.userId && !(req.headers.referer && whiteList.some(value => req.headers.referer.includes(value))) ) {
  // Redirect unauthenticated requests to home page
   // res.redirect('/')
    res.status(401).send(`Please log in to get: /zxy/${t}/${z}/${x}/${y}.pbf`)
   // busy = false
    } else {
//  let params = {
//    active: { home: true }

  getMBTiles(t, z, x, y).then(mbtiles => {
    getTile(mbtiles, z, x, y).then(r => {
      if (r.tile) {
        res.set('content-type', 'application/vnd.mapbox-vector-tile')
        res.set('content-encoding', 'gzip')
        res.set('last-modified', r.headers['Last-Modified'])
        res.set('etag', r.headers['ETag'])
        res.send(r.tile)
        busy = false
      } else {
        res.status(404).send(`tile not found: /zxy/${t}/${z}/${x}/${y}.pbf`)
        busy = false
      }
    }).catch(e => {
      res.status(404).send(`tile not found (getTile error): /zxy/${t}/${z}/${x}/${y}.pbf`)
      busy = false
    })
  }).catch(e => {
    res.status(404).send(`mbtiles not found for /zxy/${t}/${z}/${x}/${y}.pbf`)
  })

 };



  }
);



module.exports = router;
