let conf = require("./settings.js");
let contract = require("./contract.js");
let provider = require("./provider.js");
let utils = require("./utils.js");

/**
 * 토큰 컨트랙트 오브젝트를 반환하는 함수이다.
 * 
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let getObject = async function(_ca) {
    return contract.salemain.at(_ca);
}

/**
 * CrpSaleMain contract에서 Crp를 수취하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salemain / sendCrpToCrowd )
 * 3. tx 생성( salemain / sendCrpToCrowd )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _sender 송신 계좌(송신인)
 * @param _passwd 송신 계좌 비밀번호
 * @param _receiver 수신 받을 크라우드세일 컨트렉트 주소
 * @param _amount 송금할 crp의 양
 * @author sykang
 */
let sendCrpToMainCrowd = async (_wait, _sender, _passwd, _receiver, _amount) => {
    try {
        let count =0;
        let salemain = contract.salemain.at(_receiver);
        console.log("CrpSaleMain CRP recevie 수행 중...");
        await provider.web3.personal.unlockAccount(_sender, _passwd);        
        let gas = await salemain.buyToken.estimateGas({from: _sender, to: _receiver, value: _amount});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await salemain.buyToken({from: _sender, to: _receiver, value: _amount,  gas: gas, txType: "Normal"});
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 5. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }        await provider.web3.personal.lockAccount(_sender); // 6. lock Account 수행

        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpSaleMain contract에서 세일을 종료하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salemain / haltMainSale )
 * 3. tx 생성( salemain / haltMainSale )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _receiver 수신 받을 크라우드세일 컨트렉트 주소
 * @param _ca 컨트렉트 주소
 * @author sykang
 */
let haltMainSale = async (_wait, _owner, _passwd, _ca) =>{
    try{
        let count = 0;
        let salemain = contract.salemain.at(_ca);
        console.log("CrpSaleMain haltMainSale 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd);
        let gas = await salemain.saleHalt.estimateGas({from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await salemain.saleHalt({from: _owner,  gas: gas, txType: "Normal"});
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 5. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err){
        console.log(err);
    }
}

/**
 * CrpSaleMain contract에서 fund contract로 모금액을 전송하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salemain / transferFund )
 * 3. tx 생성( salemain / transferFund )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _receiver 수신 받을 크라우드세일 컨트렉트 주소
 * @param _ca 컨트렉트 주소
 * @author sykang
 */
let transferFund = async (_wait, _owner, _passwd, _ca) => {
    try{
        let count = 0;
        let salemain = contract.salemain.at(_ca);        
        console.log("CrpSaleMain transferFund 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd);
        let gas = await salemain.TransferFund.estimateGas({from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await salemain.TransferFund({from: _owner,  gas: gas, txType: "Normal"});
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 5. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch(err){
        console.log(err);
    }
}

/**
 * CrpSaleMain contract에서 모금액을 환불 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salemain / refund )
 * 3. tx 생성( salemain / refund )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트렉트 주소
 * @param _refunder 환불 받은 계좌
 * @author sykang
 *///주석
let refund = async (_wait, _owner, _passwd, _ca, _rufunder) => {
    try{
        let count =0;
        let salemain = contract.salemain.at(_ca);
        let gas = await salemain.refund.estimateGas(_rufunder, {from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await salemain.refund(_rufunder, {from: owner,  gas: gas, txType: "Normal"});
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 5. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err){
        console.log(err);
    }
}
/* exports 선언*/
module.exports.getObject = getObject;
module.exports.sendCrpToMainCrowd = sendCrpToMainCrowd;
module.exports.haltMainSale = haltMainSale;
module.exports.transferFund = transferFund;
module.exports.refund = refund;
