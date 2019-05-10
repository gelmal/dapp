let conf = require("./settings.js");
let contract = require("./contract.js");
let provider = require("./provider.js");
let utils = require("./utils.js");

/**
 * CrpPollRoadmap 컨트랙트 오브젝트를 반환하는 함수이다.
 * 
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let getObject = async function(_ca) {
    return contract.road.at(_ca);
}

/**
 * CrpPollRoadmap contract에서 투표하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 (roadmap/ polling )
 * 3. tx 생성( roadmap / polling )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _voter voter 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _vote 투표
 * @author sykang
 */
let polling = async function(_wait, _voter, _passwd, _ca, _vote){
    try{
        let count = 0;
        let road = contract.road.at(_ca);
        console.log("CrpPollRoadmap 컨트랙트 polling 수행 중...");
        await provider.web3.personal.unlockAccount(_voter, _passwd); // 1. unlock Account 수행
        let gas = await road.polling.estimateGas(_vote, {from: _voter});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await road.polling(_vote, {from: _voter,  gas: gas, txType: "Normal"});
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
        await provider.web3.personal.lockAccount(_voter); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

 /**
 * CrpPollRoadmap contract에서 투표를 취소 하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( roadmap / cancelPoll )
 * 3. tx 생성( roadmap / cancelPoll )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _voter voter 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @author sykang
 */
let cancelPoll = async function(_wait, _voter, _passwd, _ca){
    try{
        let count = 0;
        let road = contract.road.at(_ca);
        console.log("CrpPollRoadmap 컨트랙트 cancelPoll 수행 중...");
        await provider.web3.personal.unlockAccount(_voter, _passwd); // 1. unlock Account 수행
        let gas = await road.cancelPoll.estimateGas({from: _voter});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await road.cancelPoll({from: _voter,  gas: gas, txType: "Normal"});
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
        await provider.web3.personal.lockAccount(_voter); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollRoadmap contract에서 투표 무게를 계산하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( roadmap / setAmount )
 * 3. tx 생성( roadmap / setAmount )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 프로젝트 오너 계좌
 * @param _passwd owner 암호
 * @param _ca 컨트렉트 주소
 * @param _voter voter 계정
 * @param _amount voter의 
 * @author sykang
 */
let setAmount = async function(_wait, _owner, _passwd, _ca, _voter, _amount ){
    try{
        let count = 0;
        let road = contract.road.at(_ca);
        console.log("CrpPollRoadmap 컨트랙트 setAmount 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await road.setAmount.estimateGas(_voter, _amount, {from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await road.setAmount(_voter, _amount, {from: _owner,  gas: gas, txType: "Normal"});
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
 * CrpPollRoadmap contract에서 투표를 정산하는 함수이다. 아래의 절차에 따라 진행된다.
 * 
 * 1. unlock Account 진행
 * 2. gas값 계산 ( roadmap / settlePoll )
 * 3. tx 생성( roadmap / settlePoll )
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 프로젝트 오너 계좌
 * @param _passwd owner 암호
 * @param _ca 컨트렉트 주소
 * @param _addr_count 토큰을 보유한 총 계좌 갯수
 * @param _total_token 토큰의 총 suuply(발행량)
 * @param _total_agree 찬성을 한 토큰의 수
 * @author sykang
 */
let settlePoll = async function(_wait, _owner, _passwd, _ca, _addr_count, _total_token, _total_agree){
    try{
        let count = 0;
        let road = contract.road.at(_ca);
        console.log("CrpPollRoadmap 컨트랙트 settle 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await road.settlePoll.estimateGas(_addr_count, _total_token, _total_agree, {from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await road.settlePoll(_addr_count, _total_token, _total_agree, {from: _owner,  gas: gas, txType: "Normal"});
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
module.exports.polling = polling;
module.exports.cancelPoll = cancelPoll;
module.exports.setAmount = setAmount;
module.exports.settlePoll = settlePoll;


