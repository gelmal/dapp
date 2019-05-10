const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let utils = require("../../api/utils.js");
let act = require("../../api/api_action.js");
let api_main = require("../../api/api_main.js");
let api_token = require("../../api/api_token.js");
let api_fund = require("../../api/api_fund.js");
let api_deploy = require("../../api/api_deploy.js");
let api_roadmap = require("../../api/api_roadmap.js");
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
        let params = fs.readFileSync(args_dir + '/scn8.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        console.log("MCA = [" + mainaddr + "]");
        console.log('* Param01 (owner address):.........' + args.owner);
        console.log('* Param02 (owner passwd):..........' + args.passwd);
        let mainobj = await api_main.getObject(mainaddr);
        let tokenaddr = mainobj.token_addr();
        const tokenobj = await api_token.getObject(tokenaddr);

        // //token disable        
        if (await act.tryActions(api_token.disableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
            throw new Error("Failed! token disable");
        } // 투표 무게 정산 중, 거래가 일어나는 것을 막기위해 비 활성화

        ///get token information
        let BalanceList = tokenobj.holder(); // 체인에 관련된 정보 수집
        let total_addr_count = BalanceList[0]; // 체인 총 갯수(토큰 보유 지갑수)
        let total_supply = Number(tokenobj.supply()).toLocaleString('ullwide', {useGrouping:false}); // 총 공급량
        let total_agree = 0; // 찬성한 지갑들이 보유하고 있는 토큰수

        let now_road_count = mainobj.getRoadmapContractNum(); // 현재 로드맵 컨트렉트 갯수 수집
        let roadaddr = mainobj.roadmap_addrs(now_road_count - 1); // 현재 운용중인 로드맵 컨트랙트 주소 수집
        const roadobj = await api_roadmap.getObject(roadaddr); // 로드맵 컨트렉트 객체 수집
        let now_posit = roadobj.head(); // 현재 운용중인 로드맵, 첫 투표자 주수(체인 내부) 수집
        let voter_count = roadobj.voter_count();
        let i;
        for (i = 0; i < voter_count; i++) { //투표자 무게 측정
            let vote_info = roadobj.getVoteInfo(now_posit); // 투표자 정보 수집
            let token_balance = await Number(tokenobj.balanceOf(now_posit)); // 투표자 보유 토큰량 수집
            console.log("[" + now_posit + "] have (" + token_balance + ")");
            if (vote_info[2]) { //찬성인지 조회
                total_agree += token_balance; // 찬성이면 더하기
            }
            if (await act.tryActions(api_roadmap.setAmount, showProgress, false, 6, false, args.owner, args.passwd, roadaddr, now_posit, token_balance) == false) {
                throw new Error("Failed! set token weight"); //측정한 토큰갯수 set (무게 측정)
            }
            now_posit = vote_info[4];
        }
        await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);

        //settle
        if (await act.tryActions(api_roadmap.settlePoll, showProgress, false, 7, true, args.owner, args.passwd, roadaddr, total_addr_count, total_supply, total_agree) == false) {
            throw new Error("Failed! settle roadmap poll");
        }

        let fundaddr = mainobj.fund_addr();
        const fundobj = await api_fund.getObject(fundaddr);

        let result_poll = roadobj.result_poll();
        if (result_poll) {

            console.log("개표 결과 성공적!!!!");
            let now_road_count = mainobj.getRoadmapContractNum();
            let road_data = mainobj.roadmap_param(now_road_count);
            if (road_data[2] != 0) { // 다음 로드맵 존재, 로드맵에 할당된 값이 0이 아니다
                //roadmap deploy
                if (await act.tryActions(api_deploy.deployCrpPollRoadmap, showProgressDeploy, true, 6, true, args.owner, args.passwd, road_data[0], road_data[1], mainaddr) == false) {
                    throw new Error("Failed deploy CrpPollRoadmap contract");
                } // 로드맵 디플로이

                if (await act.tryActions(api_main.addRoadmapPollAddress, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, ca) == false) {
                    throw new Error("Failed add road contract in main contract");
                }

            } else { // 다음 로드맵이 없는 경우, 메인 상태변수 변경 및 종료
                if (await act.tryActions(api_main.changeStage, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, 5) == false) {
                    throw new Error("Failed! (change main stage)");
                } // main stage 변경
            }

            let pre_road_data = mainobj.roadmap_param(now_road_count - 1);
            if (await act.tryActions(api_fund.withdraw, showProgress, false, 7, true, args.owner, args.passwd, fundaddr, args.owner, pre_road_data[2], 0) == false) {
                throw new Error("Failed withdraw crp to owner from fund");
            }

            if (await act.tryActions(api_token.enableToken, showProgress, false, 4, true, args.owner, args.passwd, tokenaddr) == false) {
                throw new Error("Failed! (token enable stage)");
            } // token enable

        } else { //환불
            console.log("개표 부결 전원 환불!!!!");

            if (await act.tryActions(api_main.changeStage, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, 4) == false) {
                throw new Error("Failed! (change main stage)");
            } // main stage 변경

            let fund_list = fundobj.fund_list(); // 펀드 컨트렉트 잔고 구조체 수집
            let remain_fund = Number(fund_list[1]).toLocaleString('fullwide', {useGrouping:false}); // 현재 인출 가능한 모든 잔고(소프트 + hard)
            let holder_info = tokenobj.holder(); // 토큰지분 수집
            let holder = holder_info[1]; // 홀더 주소
            let i;
            for (i = 0; i < total_addr_count; ++i) {
                let token_balance = Number(tokenobj.balanceOf(holder)).toLocaleString('fullwide', {useGrouping:false}); //보유량 계산                
                //단위 변환(이더)
                token_balance = utils.getEther(token_balance);
                let tmp_remain_fund = utils.getEther(remain_fund);
                let tmp_total_supply = utils.getEther(total_supply);
                let refund = utils.isDivisible(token_balance, tmp_remain_fund, tmp_total_supply);
                refund = utils.getWei(refund);
                console.log("after : " + refund);
                if (await act.tryActions(api_fund.withdraw, showProgress, false, 7, false, args.owner, args.passwd, fundaddr, holder, refund, 2) == false) {
                    throw new Error("Failed withdraw crp to owner from fund");
                }
                holder = await tokenobj.nextOf(holder);
            }
            await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);
        }
    } catch (err) {
        console.log(err);
    }
}
RunProc();
