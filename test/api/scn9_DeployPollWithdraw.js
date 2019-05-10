const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let utils =  require("../../api/utils.js");
let act = require("../../api/api_action.js");
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
        let params = fs.readFileSync(args_dir + '/scn9.json');
        let args = JSON.parse(params);

        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        console.log("MCA = [" + mainaddr + "]");
        console.log('* Param01 (owner address):.........' + args.owner);
        console.log('* Param02 (owner passwd):..........' + args.passwd);
        console.log('* Param02 (start time):............' + args.starttime);
        console.log('* Param02 (end time):..............' + args.endtime);
        console.log('* Param02 (transfer amount):.......' + args.amount);
        let amount = utils.getWei(args.amount);
        if(await act.tryActions(api_deploy.deployCrpPollWithdraw, showProgressDeploy, true, 6, true, args.owner, args.passwd, args.starttime, args.endtime, amount) == false){
            throw new Error("Failed! CrpPollWithdraw contract deploy");
        }
        if(await act.tryActions(api_main.addWithdrawPollAddress, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, ca) == false){
            throw new Error("Failed! do regist CrpPollWithdraw contract ");
        } 
    } catch (err) {
        console.log(err);
    }
}
RunProc();