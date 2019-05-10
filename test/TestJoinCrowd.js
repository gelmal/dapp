let provider = require("../api/provider.js");
let act = require("../api/api_action.js");
let api_salemain = require("../api/api_salemain.js");
let utils = require("../api/utils.js");

/**
 * Usage 출력 함수이다.
 * 
 * @author sykang
 */
function Usage() {
    console.log("Usage --> ");
    console.log("    node test/TestJoinCrowd.js [argv1] [argv2] [argv3]");
    console.log("....argv1: 송금 할 계정 (Index) .....");
    console.log("....argv2: 송금 할 계정 암호 ........");
    console.log("....argv3: 송금 받을 컨트렉트 주소 ..");
    console.log("....argv4: 송금 할 CRP 양 ...........");
}

/**
 * 진행상황 출력 함수이다.
 * 
 * @param _result 성공 / 실패
 * @param _count 시도 횟수
 * @author jhhong
 */
function showProgress(_result, _count) {
    if(_result == true) {
        console.log("[" + _count + "]th trying...Success!");
    } else {
        console.log("[" + _count + "]th trying...Failed!");
    }
}

/**
 * 프로시져 수행 메인 함수이다. 
 * 
 * 1. clear screen
 * 2. check arguments
 * 3. tryActions --> transfer CRP to CrpSaleMain contract
 * 
 * @author  sykang
 */
let RunProc = async () => {
    try {
        console.clear();
        if(process.argv.length != 6) {
            Usage();
            throw new Error("Invalid Argument!");
        }
        /* 파라메터 체크 */
        console.log('* Param01 (Sender Account Index):............' + process.argv[2]);
        console.log('* Param02 (Sender Account Password):.........' + process.argv[3]);
        console.log('* Param03 (Reciever Account):.................' + process.argv[4]);
        console.log('* Param04 (send amount of CRP):..............' + process.argv[5]);          
        const sender = provider.web3.eth.accounts[process.argv[2]];
        const passwd = process.argv[3];
        const reciever = process.argv[4];
        const amount = utils.getWei(process.argv[5]);
        if(await act.tryActions(api_salemain.sendCrpToMainCrwod, showProgress, fasle ,5, true, sender, passwd, reciever, amount) == false) {
            throw new Error("Failed! (authorize)");
        }
    } catch(err) {
        console.log(err);
    }
}
RunProc();