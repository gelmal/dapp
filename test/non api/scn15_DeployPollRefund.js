const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let init_params = fs.readFileSync(args_dir + '/scn15_DeployPollRefund.json', 'utf8');
let input = JSON.parse(init_params);
const provider = input.provider;
const owner = input.owner;
const passwd = input.passwd;
const start = input.start;
const end = input.end;
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
let With;

let main_contract;
let refund_contract;

let main_address;
let refund_address;

let gas;
let receipt;

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
 * refundpoll contract를 생성 및 등록 하는 로직
 *  
 * 1. unlock Account 수행
 * 2. 입력받은 인자를 main contract에 저장
 * 3. refundpoll contract deploy
 * 4. 생성된 refundpoll contract 주소 main contract에 저장
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let deployPollRefund = async () => {
    try {
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account

        main_address = await web3.eth.getMainContractAddress(owner);
        if (main_address == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + owner + '] does not exist.!');
        }
        main_contract = Main.at(main_address); // main contract 주소 추출

        console.log(main_address);

        // refundpoll deploy
        abi_path = path.resolve(__dirname, 'abi', 'CrpPollRefund.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpPollRefund.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        Refund= web3.eth.contract(JSON.parse(abi));
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        let data_with_params = Refund.new.getData(start, end, main_address, {
            data: data
        });
        gas = web3.eth.estimateGas({
            data: data_with_params
        });
        refund_contract = await Refund.new(start, end, main_address, {
            from: owner,
            data: data,
            gas: gas,
            mca: main_address
        });
        console.log('CrpPollRefund Contract Deploy TX Hash=[' + refund_contract.transactionHash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(refund_contract.transactionHash); // receipt 확인
            if (receipt) {
                refund_address = receipt.contractAddress;
                console.log("Tx included! CA=[" + refund_address + "]");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('regist CrpPollRefund contract .....');
        gas = main_contract.addRefundPollAddress.estimateGas(refund_address, {
            from: owner
        });
        let regist_refund = await main_contract.addRefundPollAddress(refund_address, {
            from: owner,
            gas: gas
        });
        console.log('TX Hash=[' + regist_refund + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(regist_refund); // receipt 확인
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
 * 프로젝트 오너가 추가 입금을 위해 투표 컨트렉트를 생성하는 기능
 * 
 * 1. deployPollRefunddraw() 실행
 * 
 * @author sykang
 */
let RunProc = async () => {
    try {
        console.clear();
        /* 파라메터 체크 */
        console.log('* param1 (provider):........' + input.provider);
        console.log('* param2 (web3 path):.......' + input.web3);
        console.log('* param3 (owner account):...' + input.owner);
        console.log('* param4 (owner password):..' + input.passwd);
        console.log('* param4 (poll start time):.' + input.start);
        console.log('* param4 (poll end time):...' + input.end);
        await deployPollRefund();        
    } catch (err) {}
}
RunProc();