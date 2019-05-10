const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let act = require("../../api/api_action.js");
let utils =  require("../../api/utils.js");
let api_main = require("../../api/api_main.js");
let api_deploy = require("../../api/api_deploy.js");
let ca;

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
 * 진행상황 출력 함수이다.
 * 
 * @param _result 성공 / 실패
 * @param _count 시도 횟수
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
function showProgressDeploy(_result, _count, _ca) {
    if (_result == true) {
        console.log("[" + _count + "]th trying...Success! CA = [" + _ca + "]");
        ca = _ca;
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
        let params = fs.readFileSync(args_dir + '/scn12.json');
        let args = JSON.parse(params);

        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        console.log("MCA = [" + mainaddr + "]");
        console.log('* Param01 (owner address):....' + args.owner);
        console.log('* Param02 (owner passwd):.....' + args.passwd);
        console.log('* Param03 (poll start):.......' + args.pollstart);
        console.log('* Param04 (poll end):.........' + args.pollend);
        console.log('* Param05 (start time):.......' + args.salestart);
        console.log('* Param06 (end time):.........' + args.saleend);
        console.log('* Param06 (mid time):.........' + args.salemid);
        console.log('* Param07 (min amount):.......' + args.min);
        console.log('* Param08 (max amount):.......' + args.max);
        console.log('* Param09 (hardcap amount):...' + args.hardcap);
        console.log('* Param10 (rate amount):......' + args.rate);
        let min = utils.getWei(args.min);
        let max = utils.getWei(args.max);
        let hardcap = utils.getWei(args.hardcap);
        if(await act.tryActions(api_deploy.deployCrpPollAdSale, showProgressDeploy, true, 12, true, args.owner, args.passwd, args.pollstart, args.pollend, args.salestart, args.saleend, args.salemid, min, max, hardcap, args.rate) == false){
            throw new Error("Failed! CrpPollSaleAd contract deploy");
        }
        if(await act.tryActions(api_main.addPollCrowdSaleAddress, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, ca) == false){
            throw new Error("Failed! do regist CrpPollSaleAd contract ");
        } 
    } catch (err) {
        console.log(err);
    }
}
RunProc();