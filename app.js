var express = require('express');
var app = express();
const fs = require("fs");
const http = require("http");
const https = require("https");
const file = fs.createWriteStream("data.txt");
const APIkey = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf";

app.listen(3000, function () {
  console.log('Word count app listening on port 3000!');
  getDetail();

});

function getDetail() {

  console.log("Loading...")
  http.get("http://norvig.com/big.txt", response => {
    var stream = response.pipe(file);

    stream.on("finish", function (data) {
      fs.readFile("data.txt", 'utf8', function (err, data) {

        if (err) throw err;

        console.log("Processing...")
        splitByWords(data)
          .then(wordsArray => createWordMap(wordsArray))
          .then(wordsMap => sortByCount(wordsMap))
          .then(finalWordsArray => {
            let promisesList = [];
            finalWordsArray.forEach(eachwordmap => {
              promisesList.push(getEachWordDetails(eachwordmap));

            })

            Promise.all(promisesList).then(response => {
              console.log(JSON.stringify(response));
            })
          }, error => {
          })
      }, error => {
        console.log("==Error in reading file=====");
        console.log(error)
      });
    });
  });
}

function getEachWordDetails(eachwordmap) {

  return new Promise((resolve, reject) => {
    let URL = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=" + APIkey + "&lang=en-ru&text=" + eachwordmap.word;

    https.get(URL, response => {
      response.on('data', function (data) {

        let dataResp = JSON.parse(data);

        eachwordmap['output'] = [];

        dataResp.def.forEach(each_data => {
          let obj = {
            Synonyms: [],
            Pos: ""
          }
          if (each_data.pos) {
            obj.pos = each_data.pos;
          }

          each_data.tr.forEach(eachtr => {
            if (eachtr.syn) {
              obj.Synonyms.push(eachtr.syn);
            }
          })
          eachwordmap.output.push(obj);
        })
        resolve(eachwordmap)
      });
    })
  })

}

function splitByWords(text) {
  return new Promise((resolve, reject) => {
    var wordsArray = text.split(/\s+/);
    resolve(wordsArray)
  });
}


function createWordMap(wordsArray) {

  return new Promise((resolve, reject) => {
    var wordsMap = {};
    wordsArray.forEach(function (key) {
      if (wordsMap.hasOwnProperty(key)) {
        wordsMap[key]++;
      } else {
        wordsMap[key] = 1;
      }
    });
    resolve(wordsMap);
  })
}

function sortByCount(wordsMap) {

  return new Promise((resolve, reject) => {
    // sort by count in descending order
    var finalWordsArray = [];
    finalWordsArray = Object.keys(wordsMap).map(function (key) {
      return {
        word: key,
        total: wordsMap[key]
      };
    });

    finalWordsArray.sort(function (a, b) {
      return b.total - a.total;
    });

    resolve(finalWordsArray.slice(0, 10));
  });

}

