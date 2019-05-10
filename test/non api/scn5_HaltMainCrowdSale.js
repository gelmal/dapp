const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let init_params = fs.readFileSync(args_dir + '/scn5_HaltMainCrowdSale.json', 'utf8');
let input = JSON.parse(init_params);
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
let Main = web3.eth.contract(JSON.parse(abi)); // get contract

let main_contract;
let sale_contract;
let token_contract;

let sale_address;

let result_sale;
let count;
let gas;
let now_posit;

const tx_list = [];

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
 * corwd sale을 종료 하는 기능이다.
 * 1. unlock Account 수행
 * 2. Main contract추출 및 등록된 sale address 추출
 * 3. saleHalt 실행 및 블록 확인
 * 4. total_staff_crp로 성공여부 확인
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let HaltCrwodSale = async () => {
    try {
        console.log("halt crowd sale .....");
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        main_address = await web3.eth.getMainContractAddress(owner);
        if (main_address == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + owner + '] does not exist.!');
        }

        main_contract = Main.at(main_address);
        let receipt; // receipt object를 받을 변수
        let halt_tx;
        abi_path = path.resolve(__dirname, 'abi', 'CrpSaleMain.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpSaleMain.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        let sale = web3.eth.contract(JSON.parse(abi)); // get contract

        sale_address = await main_contract.crowd_addrs(0, {
            from: owner
        });
        console.log(sale_address);
        sale_contract = sale.at(sale_address);

        gas = await sale_contract.saleHalt.estimateGas({
            from: owner
        });
        // let block = await web3.eth.getBlock("latest");
        // gas = block.gasLimit;
        halt_tx = await sale_contract.saleHalt({
            from: owner,
            gas: gas
        });
        console.log('TX Hash=[' + halt_tx + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(halt_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        count = await sale_contract.chain_count({
            from: owner
        }); // 토큰참여자 숫자를 불러온다

        now_posit = await sale_contract.chain_head({
            from: owner
        }).toString(); // 첫 토큰 참여자의 주소를 불러온다

        result_sale = await sale_contract.total_staff_CRP({
            from: owner
        }).toNumber(); // 크라우드 세일의 결과
        // 성공이면 스탭들이 받는 토큰숫자가 찍힌다.

        await web3.personal.lockAccount(owner); // lock Account

    } catch (err) {
        console.log(err);
    }
}

/**
 * crowd sale 성공 후 토큰 발행 및 배분을 하는 과정
 * 1. unlock Account 수행
 * 2. Main contract추출 및 등록된 sale address 추출
 * 3. saleHalt 실행 및 블록 확인
 * 4. total_staff_crp로 성공여부 확인
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let createToken = async () => {
    try {
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        console.log('chage main contract stage to PROCEEDING .....');
        gas = await main_contract.changeStage.estimateGas(3, {
            from: owner
        });
        let stage_tx = await main_contract.changeStage(3, {
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

        abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpToken.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        let token = web3.eth.contract(JSON.parse(abi));

        let token_address = await main_contract.token_addr({
            from: owner
        });
        token_contract = token.at(token_address);
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        let tmp_tx;

        //issue
        console.log('create Token .....');
        let i;
        for (i = 0; i < count; ++i) {
            let balance = await sale_contract.balanceOf(now_posit);
            gas = await token_contract.issue.estimateGas(now_posit, balance, {
                from: owner
            });
            tmp_tx = await token_contract.issue(now_posit, balance, {
                from: owner,
                gas: gas
            });
            tx_list.push(tmp_tx);
            console.log('issue[' + i + '] : [' + tmp_tx + ']');

            now_posit = await sale_contract.getNextAddr(now_posit, {
                from: owner
            });
        }
        //settle
        let staff_info = await main_contract.staff_list({
            from: owner
        });
        count = staff_info[2];
        now_posit = staff_info[0];
        for (i = 0; i < count; ++i) {
            let tmp_info = await main_contract.getStaffInfo(now_posit, {
                from: owner
            });

            let total_amount = result_sale * tmp_info[3] / 100;
            gas = await token_contract.settle.estimateGas(now_posit, total_amount, {
                from: owner
            });
            tmp_tx = await token_contract.settle(now_posit, total_amount, {
                from: owner,
                gas: gas
            });
            tx_list.push(tmp_tx);
            console.log('settle=[' + i + "] : [" + tx_list[i] + ']');            
            now_posit = tmp_info[1];
        }

        //fund contract
        abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpFund.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        let fund = web3.eth.contract(JSON.parse(abi));

        let fund_address = await main_contract.fund_addr({
            from: owner
        });
        fund_contract = fund.at(fund_address);

        //fund contract deposit
        // let block = await web3.eth.getBlock("latest");
        // gas = block.gasLimit;

        gas = await sale_contract.TransferFund.estimateGas({
            from: owner
        });

        tmp_tx = await sale_contract.TransferFund({
            from: owner,
            gas: gas
        });
        console.log('transfer to fund, tx = [' + tmp_tx + ']');

        do {
            receipt = await web3.eth.getTransactionReceipt(tmp_tx);
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt)

        //fund contract set availe_hard
        let availe_hard = await sale_contract.availe_hard();

        availe_hard = availe_hard.toString();
        gas = await fund_contract.setAvaileHard.estimateGas(availe_hard, {
            from: owner
        });

        let set_availe = await fund_contract.setAvaileHard(availe_hard, {
            from: owner,
            gas: gas
        });
        do {
            receipt = await web3.eth.getTransactionReceipt(set_availe);
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt)
        
        console.log('set amount of hardCap, tx = [' + set_availe + ']');

        //fund contract withdraw 
        let input = await sale_contract.init_amount({
            from: owner
        });

        // check
        //block = await web3.eth.getBlock("latest");
        //gas = block.gasLimit;

        gas = await fund_contract.withdraw.estimateGas(owner, input, 0, {
            from: owner
        });
        tmp_tx = await fund_contract.withdraw(owner, input, 0, {
            from: owner,
            gas: gas
        });
        tx_list.push(tmp_tx);
        console.log('withdraw init_amount to owner, tx = [' + tmp_tx + ']');

        for (i = 0; i < tx_list.length; ++i) {
            do {
                receipt = await web3.eth.getTransactionReceipt(tx_list[i]);
                if (receipt) {
                    console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!receipt)
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * crowd sale 실패 후 크라우드 세일 금액 환불
 *  
 * 1. unlock Account 수행
 * 2. Main contract추출 및 등록된 sale address 추출
 * 3. saleHalt 실행 및 블록 확인
 * 4. total_staff_crp로 성공여부 확인
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let refundCRP = async () => {
    try {
        console.log('chage main contract stage to FAILED.....');
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        gas = await main_contract.changeStage.estimateGas(4, {
            from: owner
        });
        let stage_tx = await main_contract.changeStage(4, {
            from: owner,
            gas: gas
        }); // 프로젝트 fail로 처리
        do {
            receipt = await web3.eth.getTransactionReceipt(stage_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('refund to holder .....');
        let i;
        for (i = 0; i < count; ++i) {
            // gas = await sale_contract.refund.estimateGas(now_posit, {
            //     from: owner
            // })
            // let block = await web3.eth.getBlock("latest");
            // gas = block.gasLimit;
            gas = await sale_contract.refund.estimateGas(now_posit, {
                from: owner
            });
            tx_list[i] = await sale_contract.refund(now_posit, { // 환불 실행
                from: owner,
                gas: gas
            });
            console.log('TX Hash=[' + i + "] : [" + tx_list[i] + ']');

            now_posit = await sale_contract.getNextAddr(now_posit, {
                from: owner
            }); // 환불 할 다음 노드 
        }

        const refund_receipt = [];
        for (i = 0; i < count; ++i) {
            do {
                refund_receipt[i] = await web3.eth.getTransactionReceipt(tx_list[i]);
                if (refund_receipt[i]) {
                    console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!refund_receipt[i])
        }
        await web3.personal.lockAccount(owner); // lock Account
    } catch (err) {
        console.log(err);
    }
}

/**
 * crowd sale 성공 후 CrpPollRoad contract 생성
 *  
 * 1. unlock Account 수행
 * 2. main contract에서 첫번째 로드맵 param 추출
 * 3. 추출한 param으로 roadmap contract 생성
 * 4. 1차 roadmap contract, main contract에 등록
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let deployRoadmap = async () => {
    try {
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        let road_data;

        road_data = await main_contract.roadmap_param(0, {
            from: owner
        }); // param 추출

        abi_path = path.resolve(__dirname, 'abi', 'CrpPollRoad.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpPollRoad.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        let Road = web3.eth.contract(JSON.parse(abi));
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
        let data_with_params = Road.new.getData(road_data[0], road_data[1], main_address, {
            data: data
        })
        gas = web3.eth.estimateGas({
            data: data_with_params
        });
        let road_contract = await Road.new(road_data[0], road_data[1], main_address, {
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
        gas = await main_contract.addRoadMapPollAddress.estimateGas(receipt.contractAddress, {
            from: owner
        });
        let regist_road = await main_contract.addRoadMapPollAddress(receipt.contractAddress, {
            from: owner,
            gas: gas
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

        await web3.personal.lockAccount(owner); // Lock Account

    } catch (err) {
        console.log(err);
    }
}

/**
 * 크라우드세일 마감 이후 수행 시나리오에 맞게 각 과정을 수행하는 함수이다. 
 * 
 * 1. HaltCrwodSale 수행
 * 2. 실패 시 환불 refundCRP() 실행
 * 3. 성공 시 토큰 발행 및 로드맵 1차 생성
 * 
 * @author sykang
 */
let RunProc = async () => {
    try {
        console.clear();
        /* 파라메터 체크 */
        console.log('* param1 (provider):.......' + input.provider);
        console.log('* param2 (web3 path):......' + input.web3);
        console.log('* param3 (owner account):..' + input.owner);
        console.log('* param4 (owner password):.' + input.passwd);
        await HaltCrwodSale();
        if (result_sale != 0) {
            console.log('crowd sale result is success ......');
            await createToken();
            await deployRoadmap();
        } else {
            console.log('crowd sale result is failed ......');
            await refundCRP();
        }
    } catch (err) {}
}
RunProc();