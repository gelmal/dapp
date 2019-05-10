const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let act = require("../../api/api_action.js");
let api_refund = require("../../api/api_refund.js");
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
 * 화면을 클리어한다.
 * 
 * @author jhhong
 */
function ClearScreen() {
    console.clear();
    console.log(".");
    console.log(".");
    console.log(".");
}

/**
 * 프로시져 수행 메인 함수이다. 
 * 
 * @author sykang
 */
let RunProc = async () => {
    try {
        ClearScreen();
        let args_dir = path.resolve(__dirname, 'args');
        let params = fs.readFileSync(args_dir + '/scn18.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        let i;
        console.log('* Param00 CrpPollRefund : ' + args[0].ca);
        for (i = 1; i<Object.keys(args).length; ++i){
            console.log('* Param01 (holder address):..........' + args[i].holder);
            console.log('* Param02 (passwd passwd):..........' + args[i].passwd);
            console.log('* Param03 (vote):...................' + args[i].vote);            
            if(await act.tryActions(api_refund.polling, showProgress, false, 5, true, args[i].holder, args[i].passwd, args[0].ca, args[i].vote) == false) {
                throw new Error("Failed! " + args[i]);
            }            
        }       
    } catch (err) {
        console.log(err);
    }
}
RunProc();