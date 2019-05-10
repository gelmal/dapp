const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let input_params = fs.readFileSync(args_dir + '/scn3_HaltPollStaff.json', 'utf8');
let input = JSON.parse(input_params);
const provider = input.provider;
const owner = input.owner;
const passwd = input.passwd;
let web3_path = (input.web3 == 'null') ? ('web3') : (input.web3);
/* web3 provider 설정 */
const Web3 = require(web3_path);
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider)); // set provider
/* deploy에 필요한 요소들 추출 (abi, data, gas) */

let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi'); // abi가 저장된 file path
let data_path = path.resolve(__dirname, 'data', 'CrpMain.data'); // data를 저장할 file path
let abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
let data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
let Main = web3.eth.contract(JSON.parse(abi)); // get contract

let main_contract;
let main_address;
let gas;
let result_bool;

const contracts = [];
const contracts_addr = [];

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
 * main contact의 스탭 투표를 정산하는 함수이다.
 * 1. unlock Account 수행
 * 2. 계좌에 종속된 main contract를 불러온다
 * 3. main의 haltPollStaff 함수를 실행한다.(투표 정산 기능)
 * 4. 투표 결과를 main의 state를 나타내는 stage 변수를 추출한다.
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let HaltStaffPoll = async () => {
    try {
        console.log('proceeding HaltPollStaff .....');
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        main_address = await web3.eth.getMainContractAddress(owner);
        if (main_address == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + owner + '] does not exist.!');
        }
        main_contract = Main.at(main_address); // main contract 주소 추출

        gas = await main_contract.haltPollStaff.estimateGas({ // haltPollStaff 가스 측정
            from: owner
        });
        let tx = await main_contract.haltPollStaff({ // haltPollStaff 수행
            from: owner,
            gas: gas
        });
        console.log('TX Hash=[' + tx + ']');

        let receipt; // receipt object를 받을 변수 
        do {
            receipt = await web3.eth.getTransactionReceipt(tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        result_bool = await main_contract.stage({ //메인의 스테이트 값을 불러와 성공여부 판단
            from: owner
        }).toNumber();

        await web3.personal.lockAccount(owner); // Lock Account
    } catch (err) {
        console.log(err);
    }
}
/** 
 * HaltStaffPoll의 결과가 성공일 경우 실행되는 함수이다.
 * 프로젝트 진행에 필요한 sub contract들을 생성한다.
 * 1. unlock Account 수행
 * 2. 계좌에 종속된 main contract를 불러온다
 * 3. main의 haltPollStaff 함수를 실행한다.(투표 정산 기능)
 * 4. 투표 결과를 main의 state를 나타내는 stage 변수를 추출한다.
 * 5. lock Account 수행
 * 
 * @author sykang
 */

let DeployContracts = async () => {
    try {
        //deploy token        
        console.log('proceeding DeployContracts .....');
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpToken.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출        
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출     

        let data_with_params;
        let dep_tx;

        let token = web3.eth.contract(JSON.parse(abi));
        let token_info;


        token_info = await main_contract.token_param({ //토큰 파람 얻기
            from: owner
        });

        data_with_params = token.new.getData(token_info[0], token_info[1], main_address, {
            data: data
        }); // param 기반 데이터 추출

        gas = web3.eth.estimateGas({ //가츠 측정
            data: data_with_params
        });

        console.log('deploy token contract .....'); // 토큰 contract 측정
        dep_tx = await token.new(token_info[0], token_info[1], main_address, {
            from: owner,
            data: data,
            gas: gas,
            mca: main_address
        })
        contracts.push(dep_tx);
        console.log('Deploy Token TX Hash=[' + contracts[0].transactionHash + ']');

        //deploy fund
        abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpFund.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
        let Fund = web3.eth.contract(JSON.parse(abi)); // get contract       

        data_with_params = Fund.new.getData(main_address, {
            data: data
        });
        gas = web3.eth.estimateGas({
            data: data_with_params
        });
        console.log('deploy Fund contract .....');
        dep_tx = await Fund.new(main_address, {
            data: data,
            from: owner,
            gas: gas,
            mca: main_address
        });
        contracts.push(dep_tx) // Fund Deploy를 위한 tx 생성
        console.log('Deploy Fund TX Hash=[' + contracts[1].transactionHash + ']');

        let i;
        let receipt;
        for (i = 0; i < contracts.length; ++i) {
            do {
                receipt = await web3.eth.getTransactionReceipt(contracts[i].transactionHash); // receipt 확인
                if (receipt) {
                    contracts_addr.push(receipt.contractAddress);
                    console.log("Included in the Block=[" + web3.eth.blockNumber + "] CA=[" + receipt.contractAddress + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기

            } while (!receipt);
        }

        //deploy sale
        abi_path = path.resolve(__dirname, 'abi', 'CrpSaleMain.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpSaleMain.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출        
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        let sale = web3.eth.contract(JSON.parse(abi)); // get contract
        let sale_info; // get sale param info by CrpMain contract

        sale_info = await main_contract.sale_param({ // get param
            from: owner
        });

        data_with_params = sale.new.getData(sale_info[0].toNumber(), sale_info[1].toNumber(), sale_info[2].toNumber(), sale_info[3].toNumber(),
            sale_info[4].toNumber(), sale_info[5].toNumber(), sale_info[6].toNumber(), sale_info[7].toNumber(), sale_info[8].toNumber(), main_address, contracts_addr[1], {
                data: data
            });

        gas = web3.eth.estimateGas({
            data: data_with_params
        }); // gas값 계산

        console.log('deploy crowd sale contract .....');
        dep_tx = await sale.new(sale_info[0].toNumber(), sale_info[1].toNumber(), sale_info[2].toNumber(), sale_info[3].toNumber(),
            sale_info[4].toNumber(), sale_info[5].toNumber(), sale_info[6].toNumber(), sale_info[7].toNumber(), sale_info[8].toNumber(), main_address, contracts_addr[1], {
                from: owner,
                data: data,
                gas: gas,
                mca: main_address
            }); // Sale Deploy를 위한 tx 생성
            contracts.push(dep_tx);
        console.log('Deploy sale TX Hash=[' + contracts[2].transactionHash + ']');

        do {
            receipt = await web3.eth.getTransactionReceipt(contracts[2].transactionHash); // receipt 확인
            if (receipt) {
                contracts_addr.push(receipt.contractAddress);
                console.log("Included in the Block=[" + web3.eth.blockNumber + "] CA=[" + receipt.contractAddress + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        await web3.personal.lockAccount(owner); // lock Account

    } catch (err) {

        console.log(err);
    }
}

/** 
 * sub contract이 성공적으로 생성 되었을떄 실행된다.
 * 생성된 sub contract들의 주소를 main에 등록한다.
 * 1. unlock Account 수행
 * 2. token, fund, sale contact의 주소를 main에 등록하는 tx 발행
 * 3. tx 3개의 등록을 기다린다.
 * 4. main의 state를 READY에서 SAILING으로 전환한다.
 * 5. lock Account 수행
 * 
 * @author sykang
 */

let RegistContracts = async () => {
    try {
        const regist_contract = [];

        console.log("regist contracts in CrpMain contract .....");
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account

        //regsit token address in CrpMain.sol        
        console.log(contracts_addr[0]);
        gas = await main_contract.setTokenAddress.estimateGas(contracts_addr[0], {
            from: owner
        });

        new_tx = await main_contract.setTokenAddress(contracts_addr[0], {
            from: owner,
            gas: gas
        });
        regist_contract.push(new_tx);
        console.log('Regist Token CA = [' + contracts_addr[0] + ']');

        //regsit fund address in CrpMain.sol
        gas = await main_contract.setFundAddress.estimateGas(contracts_addr[1], {
            from: owner
        });
        new_tx = await main_contract.setFundAddress(contracts_addr[1], {
            from: owner,
            gas: gas
        });
        regist_contract.push(new_tx);
        console.log('Regist Fund CA = [' + contracts_addr[1] + ']');

        //regsit sale address in CrpMain.sol
        gas = await main_contract.addCrowdSaleAddress.estimateGas(contracts_addr[2], {
            from: owner
        });
        new_tx = await main_contract.addCrowdSaleAddress(contracts_addr[2], {
            from: owner,
            gas: gas
        });
        regist_contract.push(new_tx);
        console.log('Regist sale CA = [' + contracts_addr[2] + ']');

        // check that tx in block
        let i;
        let receipt;
        for (i = 0; i < regist_contract.length; i++) {
            do {
                receipt = await web3.eth.getTransactionReceipt(regist_contract[i]); // receipt 확인
                if (receipt) {
                    console.log("Tx=[" + regist_contract[i] + "] Included in the Block=[" + receipt.blockNumber + "]!")
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!receipt);
        }
        console.log('----- chage main contract stage to SAILING');
        gas = await main_contract.changeStage.estimateGas(2, {
            from: owner
        });
        let stage_tx = await main_contract.changeStage(2, {
            from: owner,
            gas: gas
        });
        console.log('change Stage TX Hash=[' + stage_tx + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(stage_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);
        await web3.personal.lockAccount(owner); // Unlock Account
    } catch (err) {
        console.log(err);
    }

}
/**
 * 스탭 투표 마감 이후 수행 시나리오에 맞게 각 과정을 수행하는 함수이다. 
 * 
 * 1. HaltStaffPoll 수행
 * 2. result_boll에 따라서 결과 실행
 * 3. 성공 - sub contract 생성 및 등록
 * 4. 실패 - 프로젝트 마감
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
        await HaltStaffPoll();
        if (result_bool == 1) {
            console.log('* staff poll result is success');
            await DeployContracts();
            await RegistContracts();
        } else {
            console.log('* staff poll result is failed');
        }
    } catch (err) {}
}
RunProc();