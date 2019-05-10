const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let act = require("../../api/api_action.js");
let utils =  require("../../api/utils.js");
let api_salead= require("../../api/api_salead.js");
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
        let params = fs.readFileSync(args_dir + '/scn15.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        
        console.log('* Param00 (Adsale address):..........' + args.sale);
        console.log('.....................................');
        console.log('* Param01 (buyer01 address):.........' + args.buyer01);
        console.log('* Param02 (buyer01 passwd):..........' + args.passwd01);
        console.log('* Param03 (buyer01 send amount):.....' + args.amount01);
        if(await act.tryActions(api_salead.sendCrpToAdCrowd, showProgress, false, 5, true, args.buyer01, args.passwd01, args.sale, utils.getWei(args.amount01)) == false) {
            throw new Error("Failed! (buyer01)");
        }        
        console.log('* Param11 (buyer02 address):.........' + args.buyer02);
        console.log('* Param12 (buyer02 passwd):..........' + args.passwd02);
        console.log('* Param13 (buyer02 send amount):.....' + args.amount02);
        if(await act.tryActions(api_salead.sendCrpToAdCrowd, showProgress, false, 5, true, args.buyer02, args.passwd02, args.sale, utils.getWei(args.amount02)) == false) {
            throw new Error("Failed! (buyer02)");
        } 
        console.log('* Param21 (buyer03 address):.........' + args.buyer03);
        console.log('* Param22 (buyer03 passwd):..........' + args.passwd03);
        console.log('* Param23 (buyer03 send amount):.....' + args.amount03);
        if(await act.tryActions(api_salead.sendCrpToAdCrowd, showProgress, false, 5, true, args.buyer03, args.passwd03, args.sale, utils.getWei(args.amount03)) == false) {
            throw new Error("Failed! (buyer03)");
        }          
    } catch(err) {
        console.log(err);
    }
}
RunProc();