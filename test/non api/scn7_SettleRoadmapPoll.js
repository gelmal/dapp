const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let input_params = fs.readFileSync(args_dir + '/scn7_SettleRoadmapPoll.json', 'utf8');
let input = JSON.parse(input_params);
const provider = input.provider;
const owner = input.owner;
const passwd = input.passwd;
let web3_path = (input.web3 == 'null') ? ('web3') : (input.web3);
/* web3 provider 설정 */
const Web3 = require(web3_path); // web3 api
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider)); // set provider
/* deploy에 필요한 요소들 추출 (abi, data, gas) */

let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi'); // abi가 저장된 file path
let data_path = path.resolve(__dirname, 'data', 'CrpMain.data'); // data를 저장할 file path
let abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
let data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
let gas;
let receipt;

// 데이터 모음
let main = web3.eth.contract(JSON.parse(abi)); // get contract
let token;
let road;
let fund;

// contract 모음
let main_contract;
let token_contract;
let road_contract;
let fund_contract;

// address 모음
let main_address;
let token_address;
let road_address;
let fund_address;

// settle 인자
let token_total_address_count;
let token_total_supply;
let token_total_agree_address;

let result_poll;
let now_road_posit;


let road_data;



/**
 * 지정된 시간(ms)만큼 대기한다.  
 *
 * @param _ms 지정한 시간 (ms)
 * @return promise object
 * @author jhhong
 */
function milisleep(_ms) {
    return new Promise(resolve => setTimeout(resolve, _ms));
}

/**
 * 정산의 데이터로 사용되는 각 contract들의 데이터를 수집
 * 1. unlock Account 수행
 * 2. CrpMain 추출
 * 3. token address 추출 후, 토큰 비활성화
 * 4. 토큰 보유자 숫자 및 총 발행량 수집
 * 5. roadmap contract 추출 및 추출된 데이터를 기반으로 weight 저장
 * 6. weight 기반으로 roadmap poll 정산
 * 7. fund contract 추출
 * 8. 성공 시 main에 저장된
 * 4. lock Account 수행
 * 
 * @author sykang
 */

let GetTokenInfo = async () => {
    try {
        console.log('proceeding get token infomation ......');
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account 
        main_address = await web3.eth.getMainContractAddress(owner);
        if (main_address == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + owner + '] does not exist.!');
        }
        main_contract = main.at(main_address);

        token_address = await main_contract.token_addr({
            from: owner
        });
        abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpToken.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        token = web3.eth.contract(JSON.parse(abi));
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
        token_contract = token.at(token_address);

        // token disable
        gas = await token_contract.setTokenDisable.estimateGas({
            from: owner
        });

        let availe_tx = await token_contract.setTokenDisable({
            from: owner,
            gas: gas
        });

        console.log('token disable TX Hash=[' + availe_tx + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(availe_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        // get token infomation
        token_total_address_count = await token_contract.balance_count({
            from: owner
        });
        token_total_supply = await token_contract.supply({
            from: owner
        });

        // at roadmap Contract
        abi_path = path.resolve(__dirname, 'abi', 'CrpPollRoad.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpPollRoad.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        road = web3.eth.contract(JSON.parse(abi)); // get contract
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        now_road_posit = await main_contract.now_road_posit({
            from: owner
        })

        road_address = await main_contract.roadmap_addrs(now_road_posit, {
            from: owner
        });
        road_contract = road.at(road_address);

        // calculate vote weight
        let now_posit = await road_contract.head({
            from: owner
        });
        let i;
        const calcul_tx = [];
        console.log('set roadmap voter weight .....')
        token_total_agree_address = 0;
        console.log("r : " + road_address);
        console.log("n : " + now_posit);
        for (i = 0; i < token_total_address_count; ++i) {
            let vote_info = await road_contract.getVoteInfo(now_posit, {
                from: owner
            });

            let token_balance = await token_contract.balanceOf(now_posit, {
                from: owner
            });
            if (vote_info[2]) {
                token_total_agree_address += token_balance;
            }

            gas = await road_contract.setAmount.estimateGas(now_posit, token_balance, {
                from: owner
            });

            calcul_tx[i] = await road_contract.setAmount(now_posit, token_balance, {
                from: owner,
                gas: gas
            });
            now_posit = vote_info[4];
            console.log('regist roadmap weight by address : [' + i + '] ~ TX Hash=[' + calcul_tx[i] + ']');
        }

        for (i = 0; i < calcul_tx.length; ++i) {
            do {
                receipt = await web3.eth.getTransactionReceipt(calcul_tx[i]); // receipt 확인
                if (receipt) {
                    console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!receipt);
        }
        //settle tx
        console.log('settle roadmap poll .....');
        gas = await road_contract.settlePoll.estimateGas(token_total_address_count, token_total_supply, Number(token_total_agree_address), {
            from: owner
        });
        let settle_tx = await road_contract.settlePoll(token_total_address_count, token_total_supply, Number(token_total_agree_address), {
            from: owner,
            gas: gas
        });
        console.log("settle_tx : " + settle_tx);
        do {
            receipt = await web3.eth.getTransactionReceipt(settle_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        //fund contract at
        abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpFund.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        fund = web3.eth.contract(JSON.parse(abi));

        fund_address = await main_contract.fund_addr({
            from: owner
        });
        fund_contract = fund.at(fund_address);
        await web3.personal.lockAccount(owner); // lock Account
    } catch (err) {
        console.log(err);
    }
}

/**
 * 다음 로드맵이 존재 시 로드맵 생성 또는 마감
 * 1. unlock Account 수행
 * 2. main에 저장된 roadmap의 단계를 나타내는 변수 추출 및 업데이트
 * 3. 다음 단계의 로드맵 param 추출
 * 4. 로드맵 param이 존재시 다음 로드맵 생성, 없을 시 main state complete
 * 5. roadmap contract 추출 및 추출된 데이터를 기반으로 weight 저장
 * 6. weight 기반으로 roadmap poll 정산
 * 7. fund contract 추출
 * 8.  lock Account 수행
 * 
 * @author sykang
 */
let DeployNextRoadmap = async () => {
    console.log('update now_road_posit ..... ');
    await web3.personal.unlockAccount(owner, passwd); // Unlock Account
    gas = main_contract.plusNowRoadPosit.estimateGas({
        from: owner
    });
    let update_road_posit = main_contract.plusNowRoadPosit({
        from: owner,
        gas: gas
    });
    do {
        receipt = await web3.eth.getTransactionReceipt(update_road_posit); // receipt 확인
        if (receipt) {
            console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
            break;
        }
        console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
        await milisleep(4000); // 4초 대기
    } while (!receipt);
    console.log('TX Hash=[' + update_road_posit + ']');

    now_road_posit = main_contract.now_road_posit({
        from: owner
    });

    console.log('deploy next roadmap contract .....');
    road_data;
    road_data = await main_contract.roadmap_param(now_road_posit, {
        from: owner
    });
    if (road_data[2] != 0) { //다음 로드맵이 있을 경우
        let data_with_params = road.new.getData(road_data[0], road_data[1], main_address, {
            data: data
        })
        gas = web3.eth.estimateGas({
            data: data_with_params
        });
        let road_contract = await road.new(road_data[0], road_data[1], main_address, {
            from: owner,
            data: data,
            gas: gas,
            mca: main_address
        })
        console.log('TX Hash=[' + road_contract.transactionHash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(road_contract.transactionHash); // receipt 확인
            if (receipt) {
                console.log("Tx included! CA=[" + receipt.contractAddress + "]");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('regist roadmap contract .....');
        let regist_road = await main_contract.addRoadMapPollAddress(receipt.contractAddress, {
            from: owner,
        });
        console.log('TX Hash=[' + regist_road + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(regist_road); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);
    } else { // 다음 로드맵 없을 경우
        console.log('chage main contract stage to COMPLETED .....');
        gas = await main_contract.changeStage.estimateGas(5, {
            from: owner
        });
        let stage_tx = await main_contract.changeStage(5, {
            from: owner,
            gas: gas
        }); // compliete로 main state 변경
        do {
            receipt = await web3.eth.getTransactionReceipt(stage_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);
    }
    await web3.personal.lockAccount(owner); // lock Account
}

/**
 * 로드맵 성공 시, 해당 금액을 오너에게 전송하는 함수
 * 1. unlock Account 수행
 * 2. main contract에서 전송 할 금액 데이터 수집
 * 3. fund contract의 withdraw 함수 가스 측정 및 tx 생성
 * 4. getTransactionReceipt을 사용하여 tx가 블록에 포함되었는지 확인
 * 5. 토큰 enable
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let WinTransferCrp = async () => {
    await web3.personal.unlockAccount(owner, passwd); // Unlock Account

    console.log('transfer CRP to owner');

    // 금액 수집
    gas = await fund_contract.withdraw.estimateGas(owner, road_data[2], 0, {
        from: owner
    });
    // 전송
    let transfer_tx = await fund_contract.withdraw(owner, road_data[2], 0, {
        from: owner,
        gas: gas
    });
    console.log('transfer CRP, TX Hash=[' + transfer_tx + ']');
    do {
        let receipt = await web3.eth.getTransactionReceipt(transfer_tx); // receipt 확인
        if (receipt) {
            console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
            break;
        }
        console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
        await milisleep(4000); // 4초 대기
    } while (!receipt);

    //토큰 enable
    gas = await token_contract.setTokenEnable.estimateGas({
        from: owner
    });

    let availe_tx = await token_contract.setTokenEnable({
        from: owner,
        gas: gas
    });
    console.log('token enable TX Hash=[' + availe_tx + ']');
    do {
        let receipt = await web3.eth.getTransactionReceipt(availe_tx); // receipt 확인
        if (receipt) {
            console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
            break;
        }
        console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
        await milisleep(4000); // 4초 대기
    } while (!receipt);
    await web3.personal.lockAccount(owner); // Unlock Account    
}

/**
 * 로드맵 실패 시, fund contract에 남은 금액을 holder에게 환불
 * 1. unlock Account 수행
 * 2. main contract의 state를 fail로 변경
 * 3. main contract의 토큰보유자에 대한 정보 수집
 * 4. 토큰 보유자에 대한 환불 tx 생성
 * 5. getTransactionReceipt을 사용하여 tx가 블록에 포함되었는지 확인
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let Refund = async () => {
    try {
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        console.log('chage main contract stage to FAILED .....');
        gas = await main_contract.changeStage.estimateGas(4, {
            from: owner
        }); // state 변경
        let stage_tx = await main_contract.changeStage(4, {
            from: owner,
            gas: gas
        });
        do {
            receipt = await web3.eth.getTransactionReceipt(stage_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('refund CRP to holder..... ');
        let remain_crp = await fund_contract.current_fund({
            from: owner
        }); // 펀드에 남은 금액 수집
        let now_posit = await token_contract.balance_head({
            from: owner
        }); // 잔고 체인의 첫번쨰 계좌 정보 수집
        const refund_tx = [];
        let i; // holder에 대한 환불 tx 생성
        for (i = 0; i < token_total_address_count; ++i) {
            console.log('test3 : ' + now_posit);
            let tmp_valance = await token_contract.balanceOf(now_posit, {
                from: owner
            });
            let refund_crp = (tmp_valance * remain_crp) / token_total_supply;
            gas = await fund_contract.withdraw.estimateGas(now_posit, refund_crp, 2, {
                from: owner
            });
            refund_tx[i] = await fund_contract.withdraw(now_posit, refund_crp, 2, {
                from: owner,
                gas: gas
            });
            now_posit = await token_contract.balances[now_posit].next({
                from: owner
            });
            console.log('test4 : ' + now_posit);
            console.log('refund CRP by address : [' + i + '] ~ TX Hash=[' + tx + ']');
        }
        for (i = 0; i < refund_tx.length; ++i) { // 블록 포함 대기
            do {
                let receipt = await web3.eth.getTransactionReceipt(refund_tx[i]); // receipt 확인
                if (receipt) {
                    console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!receipt);
        }
        await web3.personal.lockAccount(owner); // Unlock Account
    } catch (err) {
        console.log(err);
    }
}

/**
 * 프로시져 수행 메인 함수이다.
 * 
 * 1. clear screen
 * 2. SettleRoadmapPoll
 * 
 * @author jhhong
 */
let RunProc = async () => {
    try {
        console.clear();
        /* 파라메터 체크 */
        console.log('* param1 (provider):.......' + input.provider);
        console.log('* param2 (web3 path):......' + input.web3);
        console.log('* param3 (owner account):..' + input.owner);
        console.log('* param4 (owner password):.' + input.passwd);
        await GetTokenInfo();
        result_poll = await road_contract.result_poll({
            from: owner
        });
        if (result_poll) {
            await DeployNextRoadmap();
            await WinTransferCrp();
        } else {
            await Refund();
        }
    } catch (err) {}
}
RunProc();