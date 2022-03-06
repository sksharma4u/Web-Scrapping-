//npm init
//npm minimist
//npm axios
//npm jsdom
//npm json
//npm install excel4node (for pitting our data in excel file)
//npm install pdf-lib (for converting exel to pdf format)
// node project1.js --url=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results  --playerurl=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/england-vs-new-zealand-final-1144530/full-scorecard --datafolder=finalmatch --dest=worldcup.html --excel=worldcup.csv



let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let fs = require("fs");
let path = require("path");
let pdf = require("pdf-lib");
let excel = require("excel4node");
//const { drawText } = require("pdf-lib");
//const { forEachMatchingSheetRuleOfElement } = require("jsdom/lib/jsdom/living/helpers/style-rules");
//const { match } = require("assert");
//const { Workbook } = require("excel4node");

let args = minimist(process.argv);

//let dopromise = axios.get(args.url);

axios.all([
    axios.get(args.url),
    axios.get(args.playerurl)
]).then(function(response) {
    let html = response.data;
    console.log(html);
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let match = document.querySelectorAll("div.match-score-block")
    let totalmatches = [];

    for (let i = 0; i < match.length; i++) {
        let match1 = {};

        let pname = match[i].querySelectorAll("p.name");
        match1.t1 = pname[0].textContent,
            match1.t2 = pname[1].textContent


        let scorespan = match[i].querySelectorAll("div.score-detail > span.score");
        if (scorespan.length == 2) {
            match1.t1s = scorespan[0].textContent,
                match1.t2s = scorespan[1].textContent;
        } else if (scorespan.length == 1) {
            match1.t1s = scorespan[0].textContent;
        } else {
            match1.t1s = " ",
                match1.t2s = " ";
        }
        let result = match[i].querySelectorAll("div.status-text>span");
        match1.resultdiv = result[0].textContent;

        totalmatches.push(match1);
    }
    //console.log(totalmatches);
    let teams = [];
    for (let i = 0; i < totalmatches.length; i++) {
        movetonewarray(teams, totalmatches[i]);
    }
    //console.log(teams);
    for (let i = 0; i < totalmatches.length; i++) {
        Putallentries(teams, totalmatches[i]);
    }

    let teamjson = JSON.stringify(teams);
    fs.writeFileSync("Allmatches.json", teamjson, "utf-8");
    //console.log(teamjson);
    Createexcelfile(teams);
    createfolder(teams);



}).catch(function(err) {
    console.log(err);
})

function createfolder(teams) {
    fs.mkdirSync(args.datafolder);
    for (let i = 0; i < teams.length; i++) {
        let teamfd = path.join(args.datafolder, teams[i].name);
        fs.mkdirSync(teamfd);

        for (let j = 0; j < teams[i].totalmatches.length; j++) {
            let matchfilename = path.join(teamfd, teams[i].totalmatches[j].vs + ".pdf");
            createscoreCard(teams[i].name, teams[i].totalmatches[j], matchfilename);
        }
    }
}

function createscoreCard(teamName, match, matchfilename) {

    let t1 = teamName;
    let t2 = match.vs;
    let t1s = match.selfScore;
    let t2s = match.oppScore;
    let result = match.result;

    let bytes = fs.readFileSync("template.pdf");
    let promtoload = pdf.PDFDocument.load(bytes);
    promtoload.then(function(pdfdoc) {
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x: 320,
            y: 635,
            size: 20
        });
        page.drawText(t2, {
            x: 320,
            y: 580,
            size: 20
        });
        page.drawText(t1s, {
            x: 320,
            y: 525,
            size: 20

        });

        page.drawText(t2s, {
            x: 320,
            y: 470,
            size: 20
        });

        page.drawText(result, {

            x: 320,
            y: 425,
            size: 20
        });

        let changebytext = pdfdoc.save();
        changebytext.then(function(updatebyte) {
            fs.writeFileSync(matchfilename, updatebyte);
        }).catch(function(err) {
            console.log(err);
        })
    }).catch(function(err) {
        console.log(err);
    })
}

function Createexcelfile(teams) {

    let wb = new excel.Workbook();

    for (let i = 0; i < teams.length; i++) {
        let sheet = wb.addWorksheet(teams[i].name);
        sheet.cell(1, 1).string("VS");
        sheet.cell(1, 3).string("Self Score");
        sheet.cell(1, 5).string("Opponent Score");
        sheet.cell(1, 8).string("Result");

        for (let j = 0; j < teams[i].totalmatches.length; j++) {
            sheet.cell(2 + j, 1).string(teams[i].totalmatches[j].vs);
            sheet.cell(2 + j, 3).string(teams[i].totalmatches[j].selfScore);
            sheet.cell(2 + j, 5).string(teams[i].totalmatches[j].oppScore);
            sheet.cell(2 + j, 8).string(teams[i].totalmatches[j].result);

        }

    }

    wb.write(args.excel);
}

function movetonewarray(teams, match1) {
    let t1indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match1.t1) {
            t1indx = i;
            break;
        }
    }

    if (t1indx == -1) {
        teams.push({
            name: match1.t1,
            totalmatches: []
        })

    }


    let t2indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match1.t2) {
            t2indx = i;
            break;
        }
    }

    if (t2indx == -1) {
        teams.push({
            name: match1.t2,
            totalmatches: []
        })

    }

}

function Putallentries(teams, match1) {
    let t1indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match1.t1) {
            t1indx = i;
            break;
        }
    }

    let team1 = teams[t1indx];
    team1.totalmatches.push({
        vs: match1.t2,
        selfScore: match1.t1s,
        oppScore: match1.t2s,
        result: match1.resultdiv
    })
    let t2indx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match1.t2) {
            t2indx = i;
            break;
        }
    }
    let team2 = teams[t2indx];
    team2.totalmatches.push({
        vs: match1.t1,
        selfScore: match1.t2s,
        oppScore: match1.t1s,
        result: match1.resultdiv
    })

}