const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let act = require("../../api/api_action.js");
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let api_salead= require("../../api/api_salead.js");
let api_main = require("../../api/api_main.js");
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
 * 진행상황 출력 함수이다.
 * 
 * @param _result 성공 / 실패
 * @param _curidx 현재 Tx 인덱스
 * @param _totalidx 총 Tx 인덱스
 * @param _count 시도 횟수
 * @author jhhong
 */
function showBatchDeploy(_result, _curidx, _totalidx, _count) {
    if (_result == true) {
        console.log("[" + (_curidx + 1) + " / " + _totalidx + "] Tx...[" + _count + "]th trying...Success!");
    } else {
        console.log("[" + (_curidx + 1) + " / " + _totalidx + "] Tx...[" + _count + "]th trying...Failed!");
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
        let params = fs.readFileSync(args_dir + '/scn16.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        const mainobj = await api_main.getObject(mainaddr);
        const tokenaddr = await mainobj.token_addr();        
        const adsaleaddr = args.adsale;
        const adsaleobj = await api_salead.getObject(adsaleaddr);   
        
        console.log('* Param00 (Adsale address):........' + adsaleaddr);
        console.log('...................................');
        console.log('* Param01 (Owner address):.........' + args.owner);
        console.log('* Param02 (Owner passwd):..........' + args.passwd);
        if(await act.tryActions(api_salead.saleHalt, showProgress, false, 4, true, args.owner, args.passwd, adsaleaddr) == false) {
            throw new Error("Failed! (buyer01)");
        }
             
        let buyer_count = adsaleobj.chain_count();
        let now_posit = adsaleobj.chain_head();

        let i;
        for(i=0; i<buyer_count; i++){
            let buyer_info = adsaleobj.sales(now_posit);
            if(await act.tryActions(api_token.mature, showBatchDeploy, false, 5, false, args.owner, args.passwd, tokenaddr, now_posit) == false) {
                throw new Error("Failed! ( "+ now_posit +" )");
            }
            now_posit = buyer_info[5];
        }
        await act.batchDeploy(showBatchDeploy, args.owner, args.passwd); // tx 한번에 처리

                        
    } catch(err) {
        console.log(err);
    }
}
RunProc();