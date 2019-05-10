let contract = require("../api/imports/contract.js");
let provider = require("../api/imports/provider.js");
let act = require("../api/api_action.js");
let api_fund = require("../api/api_fund.js");

/**
 * Usage 출력 함수이다.
 * 
 * @author sykang
 */
function Usage() {
    console.log("Usage --> ");
    console.log("    node test/TestFundWithdraw.js [argv1] [argv2] [argv3] [argv4] [argv5] [argv6]");
    console.log("....argv1: Owner 계정 (Index)");
    console.log("....argv2: Owner 암호");
    console.log("....argv3: Crpfund 컨트랙트 주소");
    console.log("....argv4: 수신자 주소");
    console.log("....argv5: 전송 할 CRP 양");
    console.log("....argv6: 전송 타입");
}

/**
 * 진행상황 출력 함수이다.
 * 
 * @param _result 성공 / 실패
 * @param _count 시도 횟수
 * @author jhhong
 */
function showProgress(_result, _count) {
    if (_result == true) {
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
 * 3. tryActions --> Halt crowd sale of CrpSaleMain contract
 * 
 * @author sykang
 */
let RunProc = async () => {
    try {
        console.clear();
        if (process.argv.length != 5) {
            Usage();
            throw new Error("Invalid Argument!");
        }
        /* 파라메터 체크 */
        console.log('* Param01 (Owner Account Index):..........' + process.argv[2]);
        console.log('* Param02 (Owner Account Password):.......' + process.argv[3]);
        console.log('* Param03 (CrpFund Address):..............' + process.argv[4])
        console.log('* Param04 (Receiver Address):.............' + process.argv[5]);
        console.log('* Param05 (Amount of CRP):................' + process.argv[6]);
        console.log('* Param06 (Transfer type):................' + process.argv[7]);

        const owner = provider.web3.eth.accounts[process.argv[2]];
        const passwd = process.argv[3];
        const fund = process.argv[4];
        const receiver = porcess.argv[5];
        const amount = process.args[6];
        const type = process.args[7];
        // softcap 기준으로 성공 실패 가르기        
        if (await act.tryActions(api_fund.withdraw, showProgress, 7, true, owner, passwd, fund, receiver, amount, type) == false) {
            throw new Error("Failed! (HaltMaincrowd)");
        }
    } catch (err) {
        console.log(err);
    }
}
RunProc();