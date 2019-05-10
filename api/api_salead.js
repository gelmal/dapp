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
    return contract.salead.at(_ca);
}

/**
 * CrpSaleAd contract에서 Crp를 수취하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salead / sendCrpToCrowd )
 * 3. tx 생성( salead / sendCrpToCrowd )
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
let sendCrpToAdCrowd = async (_wait, _sender, _passwd, _receiver, _amount) => {
    try {
        let count =0;
        let sale_ad = contract.salead.at(_receiver);
        console.log("CrpSaleAd CRP recevie 수행 중...");
        await provider.web3.personal.unlockAccount(_sender, _passwd);
        let gas = await sale_ad.buyToken.estimateGas({from: _sender, to: _receiver, value: _amount});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await sale_ad.buyToken({from: _sender, to: _receiver, value: _amount,  gas: gas, txType: "Normal"});
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
 * CrpSaleAd contract에서 세일을 정산하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( salead / sendCrpToCrowd )
 * 3. tx 생성( salead / sendCrpToCrowd )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 프로젝트 오너 계좌
 * @param _passwd 프로젝트 오너 비밀번호
 * @param _ca 정산을 진행할 컨트렉트 주소
 * @author sykang
 */
let saleHalt = async (_wait, _owner, _passwd, _ca) => {
    try {
        let count =0;
        let sale_ad = contract.salead.at(_ca);
        console.log("CrpSaleAd CRP saleHalt 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd);
        let gas = await sale_ad.saleHalt.estimateGas({from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await sale_ad.saleHalt({from: _owner, gas: gas, txTpye: "Normal"});
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
        }        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행

        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/* exports 선언*/
module.exports.getObject = getObject;
module.exports.sendCrpToAdCrowd = sendCrpToAdCrowd;
module.exports.saleHalt = saleHalt;