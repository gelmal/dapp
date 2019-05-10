const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let act = require("../../api/api_action.js");
let api_main = require("../../api/api_main.js");
let api_token = require("../../api/api_token.js");
let api_deploy = require("../../api/api_deploy.js");
let api_fund = require("../../api/api_fund.js");
let api_pollsale = require("../../api/api_pollsale.js");

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
        let params = fs.readFileSync(args_dir + '/scn14.json');
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
        let BalanceList = tokenobj.holder(); // 토큰 리스트 수집
        let total_addr_count = BalanceList[0]; // 토큰 리스트 길이
        let total_supply = tokenobj.supply(); // 토큰 총 공급량
        let total_agree = 0; // 찬성한 계좌의 토큰 수 

        let now_pollsale_count = mainobj.getPollSaleContractNum(); // 현재 추가 크라우드세일 투표 컨트렉트 갯수
        let pollsaleaddr = mainobj.crowd_poll_addrs(now_pollsale_count - 1); // 현재 운용중인 컨트렉트 주소        
        console.log("now CrpPollAdSale contract address : " + pollsaleaddr);

        const pollsaleobj = await api_pollsale.getObject(pollsaleaddr);
        let now_posit = pollsaleobj.head();
        let voter_count = pollsaleobj.voter_count();
        let i;
        for (i = 0; i < voter_count; i++) { //투표자 무게 측정
            let vote_info = pollsaleobj.getVoteInfo(now_posit); // 투표자 정보 수집
            let token_balance = await Number(tokenobj.balanceOf(now_posit)); // 투표자 보유 토큰량 수집
            if (vote_info[2]) { // 찬성 일 경우 더하기
                total_agree += token_balance;
            }
            if (await act.tryActions(api_pollsale.setAmount, showProgress, false, 6, false, args.owner, args.passwd, pollsaleaddr, now_posit, token_balance) == false) {
                throw new Error("Failed! set token weight");                
            } // 무게 측정 및 set
            now_posit = vote_info[4];
        }
        await act.batchDeploy(showBatchDeploy, args.owner, args.passwd); // tx 한번에 처리
        
        /// settle
        if (await act.tryActions(api_pollsale.settlePoll, showProgress, false, 7, true, args.owner, args.passwd, pollsaleaddr, total_addr_count, total_supply, total_agree) == false) {
            throw new Error("Failed! settle poll ad sale poll");
        }        

        let result_poll = pollsaleobj.result_poll();
        if (result_poll) {
            console.log("개표 결과 성공적!!!!");
            let fundaddr = mainobj.fund_addr();
            /// 추가크라우드 세일 디플로이를 위한 정보 수집
            let now_pollsale_count = mainobj.getPollSaleContractNum(); // 현재 크라우드 세일 투표 생성 번호
            let now_pollsale_address = mainobj.crowd_poll_addrs(now_pollsale_count -1); //  컨트렉트 번호 수집
            const pollsaleobj = await api_pollsale.getObject(now_pollsale_address); // 컨트렉트 객체 수집
            let sale_info =  pollsaleobj.sale_info(); // 투표 컨트렉트에 등록했던 세일 정보 수집
            if (await act.tryActions(api_deploy.deployCrpSaleAd, showProgressDeploy, true, 12, true, args.owner, args.passwd, sale_info[0], sale_info[1], sale_info[2], sale_info[3], sale_info[4], sale_info[5], sale_info[6], tokenaddr, fundaddr) == false) {
                throw new Error("Failed deploy CrpAdSale from fund");
            } // 추가 크라우드세일 컨트렉트 디플로이
            if(await act.tryActions(api_main.addCrowdSaleAddress, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, ca) == false){
                throw new Error("Failed! do regist CrpPollSaleAd contract");
            } // 메인에 생성한 디플로이 주소 추가
            if(await act.tryActions(api_token.addAdmin, showProgress, false, 5, true, args.owner, args.passwd, tokenaddr, ca ) == false){
                throw new Error("Failed! add admin contract");
            } // 생성된 추가크라우드세일 컨트렉트에게 토큰을 판매할수 있는 권한 부여
            if(await act.tryActions(api_fund.addAdmin, showProgress, false, 5, true, args.owner, args.passwd, fundaddr, ca ) == false){
                throw new Error("Failed! add admin contract");
            } // 생성된 추가크라우드세일 컨트렉트에게 펀드 컨트렉트에 접근할수 있는 권한 부여 
        }

        if(await act.tryActions(api_token.enableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
            throw new Error("Failed! (token enable stage)");
        }// 토큰 활성화
    } catch (err) {
        console.log(err);
    }
}
RunProc();