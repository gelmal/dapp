const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let utils = require("../../api/utils.js");
let act = require("../../api/api_action.js");
let api_main = require("../../api/api_main.js");
let api_token = require("../../api/api_token.js");
let api_fund = require("../../api/api_fund.js");
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
        let params = fs.readFileSync(args_dir + '/scn19.json');
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
        let BalanceList = await tokenobj.holder(); // 토큰 체인 리스트 수집
        let total_addr_count = BalanceList[0]; // 토큰을 보유한 총 계좌 수
        let total_supply = Number(tokenobj.supply()).toLocaleString('fullwide', {useGrouping:false}); // 토큰 공급량
        let total_agree = 0; // 찬성한 계좌들의 총 토큰 보유량

        let now_refund_count = await mainobj.getRefundContractNum(); // 현재 환불 투표 컨트렉트 숫자
        let refundaddr = await mainobj.refund_addrs(now_refund_count - 1); // 현재 운용중인 환불 투표 컨트렉트 주소 수집
        console.log("now CrpPollRefund contract address : " + refundaddr);
        const refundobj = await api_refund.getObject(refundaddr); // 리펀드 투표 컨트렉트 객체 수집
        let now_posit = await refundobj.head(); // 가장 먼저 환불 투표한 투표자 지갑 주소
        let voter_count = refundobj.voter_count();
        let i;
        for (i = 0; i < voter_count; i++) { //투표자 무게 측정 로직
            let vote_info = refundobj.getVoteInfo(now_posit); // 투표자 정보 수집
            let token_balance = await Number(tokenobj.balanceOf(now_posit)); // 투표자의 토큰 보유량 수집
            if (vote_info[2]) { // 찬성
                total_agree += token_balance; // 찬성이면 더하기
            }            
            if (await act.tryActions(api_refund.setAmount, showProgress, false, 6, false, args.owner, args.passwd, refundaddr, now_posit, token_balance) == false) {
                throw new Error("Failed! set token weight");
            } // 무게 할당
            now_posit = vote_info[4];
        }
        await act.batchDeploy(showBatchDeploy, args.owner, args.passwd); //tx 한번에 처리

        //settle
        if (await act.tryActions(api_refund.settlePoll, showProgress, false, 7, true, args.owner, args.passwd, refundaddr, total_addr_count, total_supply, total_agree) == false) {
            throw new Error("Failed! settle poll ad sale poll");
        }        

        let result_poll = await refundobj.result_poll();
        if (result_poll) { // 환불
            console.log("개표, 가결 전원 환불!!!!");                    
            
            if (await act.tryActions(api_main.changeStage, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, 4) == false) {
                throw new Error("Failed! (change main stage)");
            } // main stage 변경
            let fundaddr = mainobj.fund_addr();
            const fundobj = await api_fund.getObject(fundaddr);  
            let fund_list = fundobj.fund_list();
            let remain_fund = Number(fund_list[1]).toLocaleString('fullwide', {useGrouping:false});
            let holder_info = tokenobj.holder();
            let holder = holder_info[1];
            for(i =0; i < total_addr_count; ++i){
                let token_balance = Number(tokenobj.balanceOf(holder)).toLocaleString('fullwide', {useGrouping:false});
                token_balance = utils.getEther(token_balance);
                let tmp_remain_fund = utils.getEther(remain_fund);
                let tmp_total_supply = utils.getEther(total_supply);
                let refund = utils.isDivisible(token_balance, tmp_remain_fund, tmp_total_supply);
                refund = utils.getWei(refund);                     
                if(await act.tryActions(api_fund.withdraw, showProgress, false, 7, false, args.owner, args.passwd, fundaddr, holder, refund, 2) == false) {
                    throw new Error("Failed withdraw crp to owner from fund");
                }
                holder = await tokenobj.nextOf(holder);
            }
            await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);            
        }else { //진행
            console.log("개표, 부결");   
            if(await act.tryActions(api_token.enableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
                throw new Error("Failed! (token enable stage)");
            }
        }        
    } catch (err) {
        console.log(err);
    }
}
RunProc();
