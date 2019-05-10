const fs = require('fs'); // For 시나리오 params
const path = require('path'); // For 시나리오 params
let provider = require("../../api/provider.js"); // For Get Main Contract Address
let act = require("../../api/api_action.js");
let api_main = require("../../api/api_main.js");
let api_salemain = require("../../api/api_salemain.js");
let api_token = require("../../api/api_token.js");
let api_fund = require("../../api/api_fund.js");
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
        let params = fs.readFileSync(args_dir + '/scn6.json');
        let args = JSON.parse(params);
        /* 파라메터 체크 */
        const mainaddr = await provider.web3.eth.getMainContractAddress(args.owner);
        console.log("MCA = [" + mainaddr + "]");
        let mainobj = await api_main.getObject(mainaddr);
        const salemainaddr = mainobj.crowd_addrs(0);
        console.log('* Param00 (sale main address):.....' + salemainaddr);
        console.log('* Param01 (owner address):.........' + args.owner);
        console.log('* Param02 (owner passwd):..........' + args.passwd);
        if (await act.tryActions(api_salemain.haltMainSale, showProgress, false, 4, true, args.owner, args.passwd, salemainaddr) == false) {
            throw new Error("Failed! (halt Main CrowdSale)");
        }
        let mainsaleobj = await api_salemain.getObject(salemainaddr);
        let count = mainsaleobj.chain_count();
        let now_posit = mainsaleobj.chain_head();
        let result_sale = mainsaleobj.total_staff_CRP().toNumber();
        if (result_sale != 0) { // softcap 넘음
            if (await act.tryActions(api_main.changeStage, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, 3) == false) {
                throw new Error("Failed! (change main stage)");
            } // main stage 변경

            let tokenaddr = mainobj.token_addr(); // 토큰 컨트렉트 주소 수집
            let i;
            ///issue           
            for (i = 0; i < count; ++i) {
                let buyer_info = mainsaleobj.sales(now_posit);
                if (await act.tryActions(api_token.issue, showProgress, false, 8, false, args.owner, args.passwd, tokenaddr, now_posit, buyer_info[3], 0, 1) == false) {
                    throw new Error("Failed! (" + now_posit + ")'s issue");
                }
                now_posit = buyer_info[5];
            }
            await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);
            ///settle
            let staff_list = mainobj.staff_list(); // 스태프 리스트 배열 수집
            now_posit = staff_list[0];
            for (i = 0; i < staff_list[2]; ++i) {
                let staff_info = mainobj.getStaffInfo(now_posit);
                let staff_amount = result_sale * staff_info[3] / 100; // 추가발행분(스태프) 지분 율 계산
                if (await act.tryActions(api_token.setGuarantee, showProgress, false, 6, false, args.owner, args.passwd, tokenaddr, now_posit, staff_amount) == false) {
                    throw new Error("Failed! (" + now_posit + "'s guarantee");
                }
                now_posit = staff_info[1];
            }
            await act.batchDeploy(showBatchDeploy, args.owner, args.passwd);
            ///fund contract withdraw index
            if (await act.tryActions(api_salemain.transferFund, showProgress, false, 4, true, args.owner, args.passwd, salemainaddr) == false) {
                throw new Error("Failed! ()");
            } // fund contract로 crp 전송
            let fundaddr = mainobj.fund_addr();
            let availe_hard = await mainsaleobj.availe_hard();
            if (await act.tryActions(api_fund.setAvaileHard, showProgress, false, 5, true, args.owner, args.passwd, fundaddr, availe_hard) == false) {
                throw new Error("Failed! ()");
            }
            let sale_info = await mainsaleobj.sale_info();
            console.log(sale_info[8]);
            if (await act.tryActions(api_fund.withdraw, showProgress, false, 7, true, args.owner, args.passwd, fundaddr, args.owner, sale_info[8], 0) == false) {
                throw new Error("failed 22");
            }

            ///roadmap deploy
            let road_data = await mainobj.roadmap_param(0);
            if (await act.tryActions(api_deploy.deployCrpPollRoadmap, showProgressDeploy, true, 6, true, args.owner, args.passwd, road_data[0], road_data[1], mainaddr) == false) {
                throw new Error("Failed deploy CrpPollRoadmap contract");
            }
            console.log(ca);
            if (await act.tryActions(api_main.addRoadmapPollAddress, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, ca) == false) {
                throw new Error("eeree");
            }

        } else {
            /// 못넘음, refund 
            if (await act.tryActions(api_main.changeStage, showProgress, false, 5, true, args.owner, args.passwd, mainaddr, 4) == false) {
                throw new Error("failed change main stage");
            } // change main stage, 실패로 변경
            let i;
            for (i = 0; i < count; ++i) { //환불
                if (await act.tryActions(api_salemain.refund, showProgress, false, 5, false, args.owner, args.passwd, salemainaddr, now_posit) == false) {
                    throw new Error("Failed refund(" + now_posit + ")");
                }
                let buyer_info = mainsaleobj.sales(now_posit);
                now_posit = buyer_info[5];
            }
        }
    } catch (err) {
        console.log(err);
    }
}
RunProc();