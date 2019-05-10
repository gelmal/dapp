const fs = require('fs');
const path = require('path');
let args_dir = path.resolve(__dirname, 'args');
let init_params = fs.readFileSync(args_dir + '/scn14_JoinAdCrowdSale.json', 'utf8');
let input = JSON.parse(init_params);
const provider = input.provider;
const sender = input.sender;
const passwd = input.passwd;
const receiver = input.receiver;
let web3_path = (input.web3 == 'null') ? ('web3') : (input.web3);
/* web3 provider 설정 */
const Web3 = require(web3_path); // web3 api
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider)); // set provider
const amount = web3.toWei(input.amount, 'ether');

let abi_path = path.resolve(__dirname, 'abi', 'CrpSaleAd.abi'); // abi가 저장된 file path
let abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
let Sale = web3.eth.contract(JSON.parse(abi)); // get contract

let crowdsale_contract = Sale.at(receiver);
let gas;

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
/** crowd sale contract로 CRP를 전송하는 기능
 * @author sykang
 */

let sendCrp = async () => {
    try {
        await milisleep(1000);
        await web3.personal.unlockAccount(sender, passwd); // Unlock Account

        let receipt;
        gas = await crowdsale_contract.buyToken.estimateGas({ //가스 측정
            from: sender,
            to: receiver,
            value: amount
        });
        let tx_hash = await crowdsale_contract.buyToken({ //전송
            from: sender,
            to: receiver,
            value: amount,
            gas: gas
        });
        console.log('TX Hash=[' + tx_hash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(tx_hash); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" +  receipt.blockNumber + "] HASH = [" +receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        await web3.personal.lockAccount(sender); // Lock Account
    } catch (err) {
        console.log(err);
    }
}
/**
 * 프로시져 수행 메인 함수이다.
 * 
 * 1. clear screen
 * 2. sendCrp();
 * 
 * @author jhhong
 */
let RunProc = async () => {
    try {
        console.clear();
        /* 파라메터 체크 */
        console.log('* param1 (provider):.......' + input.provider);
        console.log('* param2 (web3 path):......' + input.web3);
        console.log('* param3 (sender account):..' + input.sender);
        console.log('* param4 (sender password):.' + input.passwd);
        console.log('* param5 (receiver account):' + input.receiver);
        console.log('* param5 (amount):..........' + input.amount);
        await sendCrp();
    } catch(err) {}
}
RunProc();