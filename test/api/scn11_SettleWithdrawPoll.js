const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let act = require("../../api/api_action.js");
let api_main = require("../../api/api_main.js");
let api_token = require("../../api/api_token.js");
let api_fund = require("../../api/api_fund.js");
let api_withdraw = require("../../api/api_withdraw.js");

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
        let params = fs.readFileSync(args_dir + '/scn11.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        console.log("MCA = [" + mainaddr + "]");
        console.log('* Param01 (owner address):.........' + args.owner);
        console.log('* Param02 (owner passwd):..........' + args.passwd);
        let mainobj = await api_main.getObject(mainaddr);
        let tokenaddr = mainobj.token_addr();
        const tokenobj = await api_token.getObject(tokenaddr);

        /// token disable        
        if (await act.tryActions(api_token.disableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
            throw new Error("Failed! token disable");
        }

        /// get token information
        let BalanceList = tokenobj.holder(); // 토큰 체인에 대한 정보 수집
        let total_addr_count = BalanceList[0]; // 총 체인 길이
        let total_supply = tokenobj.supply(); // 총 공급량
        let total_agree = 0; // 찬성한 계좌들의 토큰 보유량의 합

        let now_withdraw_count = mainobj.getWithdrawContractNum(); // 현재 컨트렉트 생성된 갯수
        let withdrawaddr = mainobj.withdraw_addrs(now_withdraw_count - 1); // 현재 운용중인 컨트렉트 주소        
        console.log("now CrpPollWithdraw contract address : " + withdrawaddr);
        const withdrawobj = await api_withdraw.getObject(withdrawaddr);        
        let now_posit = withdrawobj.head();
        let voter_count = withdrawobj.voter_count();
        let i;
        for (i = 0; i < voter_count; i++) { // 투표자 무게 측정
            let vote_info = withdrawobj.getVoteInfo(now_posit); // 투표자 정보 수집
            let token_balance = await Number(tokenobj.balanceOf(now_posit)); // 투표자 토큰 보유량 수집
            console.log("["+now_posit+"] have (" + token_balance + ")");    
            if (vote_info[2]) { // 찬성 이면 표를 더해준다.
                total_agree += token_balance;
            }
            if (await act.tryActions(api_withdraw.setAmount, showProgress, false, 6, false, args.owner, args.passwd, withdrawaddr, now_posit, token_balance) == false) {
                throw new Error("Failed! set token weight");
            } // 무게 업데이트
            now_posit = vote_info[4];
        }
        await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);       

        ///settle
        if (await act.tryActions(api_withdraw.settlePoll, showProgress, false, 7, true, args.owner, args.passwd, withdrawaddr, total_addr_count, total_supply, total_agree) == false) {
            throw new Error("Failed! settle withdraw poll");
        }

        let fundaddr = mainobj.fund_addr();
        let result_poll = withdrawobj.result_poll();
        if (result_poll) { // 추가인출에 대한 투표가 성공적이므로 withdraw TYPE을 1로 인자를 주어 hard_fund 인출로 설정
            console.log("개표 결과 성공적!!!!");
            let withdraw_crp = withdrawobj.withdraw_crp();
            if (await act.tryActions(api_fund.withdraw, showProgress, false, 7, true, args.owner, args.passwd, fundaddr, args.owner, withdraw_crp, 1) == false) {
                throw new Error("Failed withdraw crp to owner from fund");
            }
        }

        if(await act.tryActions(api_token.enableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
            throw new Error("Failed! (token enable stage)");
        } // 토큰 활성화

    } catch (err) {
        console.log(err);
    }
}
RunProc();