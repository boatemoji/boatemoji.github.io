var boosts = [];
var boostCount = 1;
var calculations = [];
var calcCount = 1;
const value = id => document.getElementById(id).value;

//New entry in boosts
function newBoost() {
    if(!+value("bValue1")) return 0;

    let b = {};
    b.name = value("bName") || "Boost " + boostCount;
    b.value1 = +value("bValue1");
    //-1 always; 0 n/a; 1 crit; 2 weak
    b.cond1 = +value("bCondition1");
    b.cond2 = +value("bCondition2");
    if(!b.cond2) b.value2 = 0;
    else b.value2 = +value("bValue2");
    b.id = boostCount++;

    boosts.push(b);
    return makeBoostElem(b);
}

function elemHelper(tag, text) {
    let x = document.createElement(tag);
    x.innerText = text;
    return x;
}

//generates tr from a boost
function makeBoostElem(b) {
    let tr = document.createElement("tr");
    tr.id = "b" + b.id;
    
    let name = elemHelper("th", b.name);
    
    //always, on crit, on weak
    let percents = [elemHelper("td", "0%"), elemHelper("td", "0%"), elemHelper("td", "0%")];
    percents.forEach(td => td.classList.add("b0"));

    //index of td of corresponding condition; -1 = always = 1st elem in list
    let e1 = b.cond1 == -1 ? 0 : b.cond1;
    e1 = percents[e1];
    e1.classList.remove("b0");
    e1.innerText = b.value1 + "%";

    if(b.cond2) {
        let e2 = percents[b.cond2];
        e2.classList.remove("b0");
        e2.innerText = b.value2 + "%";
    }

    /*
    let b1 = document.createElement("td");
    b1.innerText = b.value1 + "%";
    b1.classList.add("b" + b.cond1);
    
    let b2 = document.createElement("td");
    b2.innerText = b.value2 + "%";
    b2.classList.add("b" + b.cond2);
    */

    let button = elemHelper("button", "Remove");
    button.setAttribute("type", "button");
    button.addEventListener("click", removeTR(boosts));
    let btr = document.createElement("td");
    btr.append(button);
    
    tr.append(name, ...percents, btr);
    return tr;
}

/*
//removes boost from list w/ id, deletes tr
function removeBSelf(e) {
    let tr = e.target.parentElement.parentElement;
    let id = +tr.id.slice(1);
    
    for(let i = 0; i < boosts.length; i++) {
        if(boosts[i].id == id) {
            boosts.splice(i, 1);
            break;
        }
    }

    tr.remove();
    update();
}
*/

//hof for removeBSelf so it can also be used for calc table
function removeTR(array) {
    return e => {
        let tr = e.target.parentElement.parentElement;
        console.log(tr);
        let id = +tr.id.slice(1);

        for(let i = 0; i < array.length; i++) {
            if(array[i].id == id) {
                array.splice(i, 1);
                break;
            }
        }

        tr.remove();
        update();
    }
}

//add tr to boost table
function addBoost() {
    const b = newBoost();
    if(!b) return;
    update();
    document.getElementById("bTable").append(b);
}

//calculates total boost%
function getBoosts() {
    if(!boosts.length) return 1;
    
    let boost = 0;
    const crit = document.getElementById("sCrit").checked;
    const weak = value("sResist") == "1.5";
    
    for(const b of boosts) {
        //if condition = crit & critting; cond = weakpont & weakpoint; always
        if((b.cond1 == 1 && crit) || (b.cond1 == 2 && weak) || (b.cond1 == -1))
            boost += b.value1;
        if((b.cond2 == 1 && crit) || (b.cond2 == 2 && weak))
            boost += b.value2;
    }
    
    return 1 + boost / 100; //percentage modifier
}

//get buff swing modifier: tarukaja/rakunda = +20%, rakuka/tarunda = -20%
const buffs = () => 1 + 0.2 * +value("sTaru") - 0.2 * +value("sRaku");

//crit is 1.5x
const crit = () => 1 + 0.5 * document.getElementById("sCrit").checked;

//charge/conc is 2.25x
const charge = () => 1 + 1.25 * document.getElementById("sCharge").checked;

//see dx2wiki formula page
function calculate() {
    if(check()) return 0;
    const atk = +value("sAtk");
    const stat = Math.max(atk - value("sDef") * 0.5, 0) * buffs();
    const final = Math.max(atk * 0.25, stat);
    const damage = final * +value("sBP") * crit() * +value("sResist") * getBoosts() * charge() * 0.4 / 100;
    return [~~(damage * 0.95), ~~(damage * 1.05)];
}

//check if any of base power, atk stat, or def stat aren't filled in
const check = () => !value("sBP") || !value("sAtk") || !value("sDef");

//update result text
function update() {
    const x = calculate() || [0, 0];
    console.log(x);
    document.getElementById("dLow").innerText = x[0];
    document.getElementById("dHigh").innerText = x[1];
}

//return obj to make calculation table tr
function getCalc() {
    if(check()) return;
    //[id, dmg, bp, boost%, atk, taru, def, raku, res, crit, charge]
    let c = [];
    let d = calculate();
    let buff = ["-unda", "None", "-kaja"];
    let resSel = document.getElementById("sResist");
    //wtf is this should i be abstractioning
    return [calcCount++, d[0] + " - " + d[1], value("sBP"), ~~((getBoosts() - 1) * 100) + "%", 
    value("sAtk"), buff[+value("sTaru") + 1], value("sDef"), buff[+value("sRaku") + 1], 
    resSel.options[resSel.selectedIndex].text, 
    document.getElementById("sCrit").checked ? "Yes" : "No",
    document.getElementById("sCharge").checked ? "Yes" : "No"];
}

//make tr from calc obj and add to table
function addCalc(obj) {
    let tr = document.createElement("tr");
    tr.id = "c" + obj[0];
    obj.slice(1).forEach(x => tr.append(elemHelper("td", x)));

    let button = elemHelper("button", "Remove");
    button.setAttribute("type", "button");
    button.addEventListener("click", removeTR(calculations));
    let btr = document.createElement("td");
    btr.append(button);
    tr.append(btr);

    document.getElementById("calcTable").append(tr);
}

function saveCalc() {
    if(check()) return;
    let c = getCalc();
    calculations.push(c);
    addCalc(c);
}

//calc mixed scaling function stat
function mixedScaling() {
    const s1 = +value("mAtk1") * +value("mPercent1") / 100;
    const s2 = +value("mAtk2") * +value("mPercent2") / 100;
    return s1 + s2;
} 

function updateMScale() {
    document.getElementById("mScaled").innerText = mixedScaling();
}