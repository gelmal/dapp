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
    return contract.main.at(_ca);
}

/**
 * CrpToken을 생성하기 위한 파라메터를 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.setTokenParams)
 * 3. tx 생성 (main.setTokenParams)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _name 토큰 이름
 * @param _symbol 토큰 심볼
 * @param _sto ST20 사용 여부 (1: 사용, 0: 사용하지 않음 (ERC20))
 * @author jhhong
 */
let setTokenParams = async function(_wait, _owner, _passwd, _ca, _name, _symbol, _sto) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 setTokenParams 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.setTokenParams.estimateGas(_name, _symbol, _sto, {from: _owner}); // 2. gas값 계산 (main.setTokenParams)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.setTokenParams(_name, _symbol, _sto, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (main.setTokenParams)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 1차 크라우드세일을 생성하기 위한 파라메터를 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.setMainSaleParams)
 * 3. tx 생성 (main.setMainSaleParams)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _start 세일 시작 시각
 * @param _end 세일 종료 시각
 * @param _softcap 소프트캡
 * @param _hardcap 하드캡
 * @param _found_rate 추가 발행 비율
 * @param _crp_max 최대 수취금액
 * @param _crp_min 최소 수취금액
 * @param _default_ratio 교환 비율
 * @param _init_amount 크라우드세일 성공 시, 초기 인출금액
 * @author jhhong
 */
let setMainSaleParams = async function(_wait, _owner, _passwd, _ca,
    _start, _end, _softcap, _hardcap, _found_rate, _crp_max, _crp_min, _default_ratio, _init_amount) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 setMainSaleParams 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.setMainSaleParams.estimateGas(_start, _end, _softcap, _hardcap, _found_rate,
            _crp_max, _crp_min, _default_ratio, _init_amount, {from: _owner}); // 2. gas값 계산 (main.setMainSaleParams)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.setMainSaleParams(_start, _end, _softcap, _hardcap, _found_rate,
            _crp_max, _crp_min, _default_ratio, _init_amount, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (main.setMainSaleParams)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드맵 투표 컨트랙트를 생성하기 위한 파라메터를 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addRoadmapPollParams)
 * 3. tx 생성 (main.addRoadmapPollParams)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _start 세일 시작 시각
 * @param _end 세일 종료 시각
 * @param _amount 인출 금액
 * @author jhhong
 */
let addRoadmapPollParams = async function(_wait, _owner, _passwd, _ca, _start, _end, _amount) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addRoadmapPollParams 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addRoadmapPollParams.estimateGas(_start, _end, _amount, {from: _owner}); // 2. gas값 계산 (main.addRoadmapPollParams)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addRoadmapPollParams(_start, _end, _amount, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addRoadmapPollParams)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드맵 투표 컨트랙트를 생성하기 위한 파라메터를 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.setStaffInfo)
 * 3. tx 생성 (main.setStaffInfo)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addr 세일 시작 시각
 * @param _amount 세일 종료 시각
 * @author jhhong
 */
let setStaffInfo = async function(_wait, _owner, _passwd, _ca, _addr, _amount) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 setStaffInfo 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.setStaffInfo.estimateGas(_addr, _amount, {from: _owner}); // 2. gas값 계산 (main.setStaffInfo)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.setStaffInfo(_addr, _amount, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.setStaffInfo)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드맵 투표를 수행하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.runPollStaff)
 * 3. tx 생성 (main.runPollStaff)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _voter 투표할 계정
 * @param _passwd _voter의 암호
 * @param _ca 컨트랙트 주소
 * @param _val 투표 내용 (1: 찬성 / 0: 반대)
 * @author jhhong
 */
let runPollStaff = async function(_wait, _voter, _passwd, _ca, _val) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 runPollStaff 수행 중...");
        await provider.web3.personal.unlockAccount(_voter, _passwd); // 1. unlock Account 수행
        let gas = await main.runPollStaff.estimateGas(_val, {from: _voter}); // 2. gas값 계산 (main.runPollStaff)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.runPollStaff(_val, {from: _voter,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.runPollStaff)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" +receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_voter); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드맵 투표 취소를 수행하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.cancelPollStaff)
 * 3. tx 생성 (main.cancelPollStaff)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _voter 투표할 계정
 * @param _passwd _voter의 암호
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let cancelPollStaff = async function(_wait, _voter, _passwd, _ca) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 cancelPollStaff 수행 중...");
        await provider.web3.personal.unlockAccount(_voter, _passwd); // 1. unlock Account 수행
        let gas = await main.cancelPollStaff.estimateGas({from: _voter}); // 2. gas값 계산 (main.cancelPollStaff)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.cancelPollStaff({from: _voter,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.cancelPollStaff)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_voter); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드맵 투표를 정산 하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.haltPollStaff)
 * 3. tx 생성 (main.haltPollStaff)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let haltPollStaff = async function(_wait, _owner, _passwd, _ca) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 haltPollStaff 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.haltPollStaff.estimateGas({from: _owner}); // 2. gas값 계산 (main.haltPollStaff)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.haltPollStaff({from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.haltPollStaff)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 토큰 컨트랙트 주소를 메인 컨트랙트에 등록하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.setTokenAddress)
 * 3. tx 생성 (main.setTokenAdddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _tokenaddr 토큰 컨트랙트 주소
 * @author jhhong
 */
let setTokenAddress = async function(_wait, _owner, _passwd, _ca, _tokenaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 setTokenAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.setTokenAddress.estimateGas(_tokenaddr, {from: _owner}); // 2. gas값 계산 (main.setTokenAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.setTokenAddress(_tokenaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.setTokenAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 펀드 컨트랙트 주소를 메인 컨트랙트에 등록하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.setFundAddress)
 * 3. tx 생성 (main.setFundAddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _fundaddr 펀드 컨트랙트 주소
 * @author jhhong
 */
let setFundAddress = async function(_wait, _owner, _passwd, _ca, _fundaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 setFundAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.setFundAddress.estimateGas(_fundaddr, {from: _owner}); // 2. gas값 계산 (main.setFundAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.setFundAddress(_fundaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.setFundAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 1차 크라우드세일 컨트랙트 주소를 메인 컨트랙트에 등록하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addCrowdSaleAddress)
 * 3. tx 생성 (main.addCrowdSaleAddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _saleaddr 크라우드세일 컨트랙트 주소
 * @author jhhong
 */
let addCrowdSaleAddress = async function(_wait, _owner, _passwd, _ca, _saleaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addCrowdSaleAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addCrowdSaleAddress.estimateGas(_saleaddr, {from: _owner}); // 2. gas값 계산 (main.addCrowdSaleAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addCrowdSaleAddress(_saleaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addCrowdSaleAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 로드 맵 투표 컨트랙트 주소를 메인 컨트랙트에 등록하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addRoadM)
 * 3. tx 생성 (main.haltPollStaff)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _roadaddr 크라우드세일 컨트랙트 주소
 * @author sykang
 */
let addRoadmapPollAddress = async function(_wait, _owner, _passwd, _ca, _roadaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addRoadmapPollAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addRoadmapPollAddress.estimateGas(_roadaddr, {from: _owner}); // 2. gas값 계산 (main.addCrowdSaleAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addRoadmapPollAddress(_roadaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addCrowdSaleAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * main contract의 상태변수인 stage의 상태를 변경하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.changeStage)
 * 3. tx 생성 (main.cjangeStage)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _stage 변경하고자 하는 스테이지 번호
 * @author sykang
 */
let changeStage = async function(_wait, _owner, _passwd, _ca, _stage) {
    try{
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 change stage 수행 중... ");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.changeStage.estimateGas(_stage, {from: _owner});
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.changeStage(_stage, {from: _owner,  gas: gas, txType: "Normal"});
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch(err) {
        console.log(err);
        return("0");
    }
}

/**
 * CrpPollWithdraw contract address를 메인에 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addWithdrawPollAddress)
 * 3. tx 생성 (main.addWithdrawPollAddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _withdrawaddr 추가송금투표 컨트렉트 주소
 * @author sykang
 */
let addWithdrawPollAddress = async function(_wait, _owner, _passwd, _ca, _withdrawaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addCrowdSaleAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addWithdrawPollAddress.estimateGas(_withdrawaddr, {from: _owner}); // 2. gas값 계산 (main.addCrowdSaleAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addWithdrawPollAddress(_withdrawaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addCrowdSaleAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollAdSale(추가크라우드세일 투표) contract address를 메인에 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addPollCrowdSaleAddress)
 * 3. tx 생성 (main.addPollCrowdSaleAddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _pollsaleaddr 추가크라우드세일 컨트렉트 주소
 * @author sykang
 */
let addPollCrowdSaleAddress = async function(_wait, _owner, _passwd, _ca, _pollsaleaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addPollCrowdSaleAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addPollCrowdSaleAddress.estimateGas(_pollsaleaddr, {from: _owner}); // 2. gas값 계산 (main.addCrowdSaleAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addPollCrowdSaleAddress(_pollsaleaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addCrowdSaleAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollRefund(투자금 환불 투표) contract address를 메인에 저장하는 함수이다.
 * 
 * 1. unlock Account 수행
 * 2. gas값 계산 (main.addRefundPOllAddress)
 * 3. tx 생성 (main.addRefundPollAddress)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner 계정
 * @param _passwd Owner의 암호
 * @param _ca 컨트랙트 주소
 * @param _pollrefundaddr 투자금 환불 투표 컨트렉트 주소
 * @author sykang
 */
let addRefundPollAddress = async function(_wait, _owner, _passwd, _ca, _pollrefundaddr) {
    try {
        let count = 0;
        let main = contract.main.at(_ca);
        console.log("CrpMain 컨트랙트 addRefundPollAddress 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await main.addRefundPollAddress.estimateGas(_pollrefundaddr, {from: _owner}); // 2. gas값 계산 (main.addCrowdSaleAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await main.addRefundPollAddress(_pollrefundaddr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (main.addCrowdSaleAddress)
        console.log('TX Hash=[' + tx + ']');
        if(_wait) {
            let receipt;
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
                if(receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" +  receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("TX[\"" + tx + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while(++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/* exports 선언 */
module.exports.getObject = getObject;
module.exports.setTokenParams = setTokenParams;
module.exports.setMainSaleParams = setMainSaleParams;
module.exports.addRoadmapPollParams = addRoadmapPollParams;
module.exports.setStaffInfo = setStaffInfo;
module.exports.runPollStaff = runPollStaff;
module.exports.cancelPollStaff = cancelPollStaff;
module.exports.haltPollStaff = haltPollStaff;
module.exports.setTokenAddress = setTokenAddress;
module.exports.setFundAddress = setFundAddress;
module.exports.addCrowdSaleAddress = addCrowdSaleAddress;
module.exports.addRoadmapPollAddress = addRoadmapPollAddress;
module.exports.changeStage = changeStage;
module.exports.addWithdrawPollAddress = addWithdrawPollAddress;
module.exports.addPollCrowdSaleAddress = addPollCrowdSaleAddress;
module.exports.addRefundPollAddress = addRefundPollAddress;
