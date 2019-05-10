let conf = require("./settings.js");
let contract = require("./contract.js");
let provider = require("./provider.js");
let utils = require("./utils.js");

/**
 * CrpFund 컨트랙트 오브젝트를 반환하는 함수이다.
 * 
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let getObject = async function(_ca) {
    return contract.fund.at(_ca);
}

/**
 * fund contract에서 withdraw(송금)하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 진행
 * 2. gas값 계산 (fund / withdraw )
 * 3. tx 생성(fund / withdraw)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _to 수신자 주소
 * @param _amount 하드 펀드의 양
 * @param type 송금 종류
 * @author sykang
 */
let withdraw = async function(_wait, _owner, _passwd, _ca, _to, _amount, _type){
    try{
        let count = 0;
        let fund = contract.fund.at(_ca);
        console.log("CrpFund 컨트랙트 withdraw 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await fund.withdraw.estimateGas(_to, _amount, _type, {from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await fund.withdraw(_to, _amount, _type, {from: _owner, gas: gas, txType: "Normal"});
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
        console.log("[reciver : " + _to + "] = [" + _amount + "]");
        let tmp = fund.fund_list();
        console.log()
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

 /**
 * fund contract에서 hard fund를 설정하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 진행
 * 2. gas값 계산 (fund / setAvailHard )
 * 3. tx 생성(fund / setAvailHard)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _amount 하드 펀드의 양
 * @author sykang
 */
let setAvaileHard = async function(_wait, _owner, _passwd, _ca, _amount){
    try{
        let count = 0;
        let fund = contract.fund.at(_ca);
        console.log("CrpFund 컨트랙트 setAvailHard 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await fund.setAvaileHard.estimateGas(_amount, {from: _owner});
        
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await fund.setAvaileHard(_amount, {from: _owner, gas: gas, txType: "Normal"});
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
    } catch(err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpFund의 Administrator 추가를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (fund.addAdmin)
 * 3. tx 생성 (fund.addAdmin)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addadmin 관리자 권한 부여 할 계정
 * @author sykang
 */
let addAdmin = async function(_wait, _owner, _passwd, _ca, _addadmin) {
    try {
        let count = 0;
        let fund = contract.fund.at(_ca);
        console.log("Crpfund 컨트랙트 addAdmin 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await fund.addAdmin.estimateGas(_addadmin, {from: _owner}); // 2. gas값 계산 (fund.addAdmin)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await fund.addAdmin(_addadmin, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (fund.addAdmin)
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
    } catch (err) {
        console.log(err);
        return ("0");
    }
}
/**
 * Crpfund의 Administrator 삭제를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (fund.deleteAdmin)
 * 3. tx 생성 (fund.deleteAdmin)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _deladmin 관리자 권한 박탈 할 계정
 * @author sykang
 */
let deleteAdmin = async function(_wait, _owner, _passwd, _ca, _deladmin) {
    try {
        let count = 0;
        let fund = contract.fund.at(_ca);
        console.log("Crpfund 컨트랙트 deleteAdmin 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await fund.deleteAdmin.estimateGas(_deladmin, {from: _owner}); // 2. gas값 계산 (fund.deleteAdmin)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await fund.deleteAdmin(_deladmin, {from: _owner,gas: gas, txType: "Normal"}); // 3. tx 생성 (fund.deleteAdmin)
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
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/* exports 선언 */
module.exports.getObject = getObject;
module.exports.setAvaileHard = setAvaileHard;
module.exports.withdraw = withdraw;
module.exports.addAdmin = addAdmin;
module.exports.deleteAdmin = deleteAdmin;

