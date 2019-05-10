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
    return contract.token.at(_ca);
}

/**
 * CrpToken enbale을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.enableToken)
 * 3. tx 생성 (token.enableToken)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */

let enableToken = async function(_wait, _owner, _passwd, _ca) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 enableToken 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.enableToken.estimateGas({from: _owner}); // 2. gas값 계산 (token.enableToken)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.enableToken({from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (token.enableToken)
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
 * CrpToken disbale을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.disableToken)
 * 3. tx 생성 (token.disableToken)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let disableToken = async function(_wait, _owner, _passwd, _ca) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 disableToken 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.disableToken.estimateGas({from: _owner}); // 2. gas값 계산 (token.disableToken)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.disableToken({from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (token.disableToken)
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
 * CrpToken transfer를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.transfer)
 * 3. tx 생성 (token.transfer)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 전송할 계정
 * @param _passwd 전송할 계정 암호
 * @param _ca 컨트랙트 주소
 * @param _to 전송 받을 계정
 * @param _amount 전송할 금액
 * @author jhhong
 */
let transfer = async function(_wait, _owner, _passwd, _ca, _to, _amount) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 transfer 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.transfer.estimateGas(_to, _amount, {from: _owner}); // 2. gas값 계산 (token.transfer)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.transfer(_to, _amount, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.transfer)
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
 * CrpToken Approve를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.approve)
 * 3. tx 생성 (token.approve)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 대리전송 권한 부여할 계정
 * @param _passwd 대리전송 권한 부여할 계정 암호
 * @param _ca 컨트랙트 주소
 * @param _to 대리전송 권한 받을 계정
 * @param _amount 대리전송 권한 부여할 금액
 * @author jhhong
 */
let approve = async function(_wait, _owner, _passwd, _ca, _to, _amount) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 approve 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.approve.estimateGas(_to, _amount, {from: _owner}); // 2. gas값 계산 (token.approve)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.approve(_to, _amount, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.approve)
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
 * Owner 계정의 CrpToken을 지정한 amount만큼 소각하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.burn)
 * 3. tx 생성 (token.burn)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _amount 소각할 금액
 * @author jhhong
 */
let burn = async function(_wait, _owner, _passwd, _ca, _amount) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 burn 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.burn.estimateGas(_amount, {from: _owner}); // 2. gas값 계산 (token.burn)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.burn(_amount, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.burn)
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
 * CrpToken의 Administrator 추가를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.addAdmin)
 * 3. tx 생성 (token.addAdmin)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addadmin 관리자 권한 부여할 계정
 * @author jhhong
 */
let addAdmin = async function(_wait, _owner, _passwd, _ca, _addadmin) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 addAdmin 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.addAdmin.estimateGas(_addadmin, {from: _owner}); // 2. gas값 계산 (token.addAdmin)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.addAdmin(_addadmin, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.addAdmin)
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
 * CrpToken의 Administrator 삭제를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.deleteAdmin)
 * 3. tx 생성 (token.deleteAdmin)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _deladmin 관리자 권한 박탈할 계정
 * @author jhhong
 */
let deleteAdmin = async function(_wait, _owner, _passwd, _ca, _deladmin) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 deleteAdmin 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.deleteAdmin.estimateGas(_deladmin, {from: _owner}); // 2. gas값 계산 (token.deleteAdmin)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.deleteAdmin(_deladmin, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (token.deleteAdmin)
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
 * CrpToken의 Address 잠금을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.lockAddr)
 * 3. tx 생성 (token.lockAddr)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _lockaddr 잠글 계정
 * @author jhhong
 */
let lockAddr = async function(_wait, _owner, _passwd, _ca, _lockaddr) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 lockAddr 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.lockAddr.estimateGas(_lockaddr, {from: _owner}); // 2. gas값 계산 (token.lockAddr)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.lockAddr(_lockaddr, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (token.lockAddr)
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
 * CrpToken의 Address 잠금해제를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.unlockAddr)
 * 3. tx 생성 (token.unlockAddr)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _unlockaddr 잠금 해제할 계정
 * @author jhhong
 */
let unlockAddr = async function(_wait, _owner, _passwd, _ca, _unlockaddr) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 unlockAddr 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.unlockAddr.estimateGas(_unlockaddr, {from: _owner}); // 2. gas값 계산 (token.unlockAddr)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.unlockAddr(_unlockaddr, {from: _owner, gas: gas, txType: "Normal"}); // 3. tx 생성 (token.unlockAddr)
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
 * 토큰을 발행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.issue)
 * 3. tx 생성 (token.issue)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addr 발행한 토큰을 입금할 대상 Account
 * @param _amount 토큰 발행량
 * @param _premium 프리미엄 발행 (기존 토큰 보유자에게만 발행) 사용 여부 (0: 사용안함, else: 사용함)
 * @param _mature 성숙한 토큰인지 여부 (0: 성숙한 토큰이 아님 (추가크라우드세일을 통한 구매), else: 성숙한 토큰)
 * @author jhhong
 */
let issue = async function(_wait, _owner, _passwd, _ca, _addr, _amount, _premium, _mature) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 issue 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.issue.estimateGas(_addr, _amount, _premium, _mature, {from: _owner}); // 2. gas값 계산 (token.issue)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.issue(_addr, _amount, _premium, _mature, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.issue)
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
 * "추가 발행 토큰(게런티)"을 스텝에게 지분만큼 설정하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.setGurantee)
 * 3. tx 생성 (token.setGurantee)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addr 게런티를 받을 스텝 Account
 * @param _amount 게런티 양
 * @author jhhong
 */
let setGuarantee = async function(_wait, _owner, _passwd, _ca, _addr, _amount) {
    try {
        
        let count = 0;
        let token = contract.token.at(_ca);
        let value = _amount; // 1. value 추출 --> amount값을 wei 단위로 계산
        console.log("CrpToken 컨트랙트 setGurantee 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let gas = await token.setGuarantee.estimateGas(_addr, value, {from: _owner}); // 3. gas값 계산 (token.setGurantee)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.setGuarantee(_addr, value, {from: _owner,  gas: gas, txType: "Normal"}); // 4. tx 생성 (token.setGurantee)
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
 * 게런티의 잠금을 해제하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.settleGuarantee)
 * 3. tx 생성 (token.settleGuarantee)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _addr 게런티를 받은 스텝 Account
 * @author jhhong
 */
let settleGuarantee = async function(_wait, _owner, _passwd, _ca, _addr) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 settleGuarantee 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.settleGuarantee.estimateGas(_addr, {from: _owner}); // 2. gas값 계산 (token.settleGuarantee)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.settleGuarantee(_addr, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.settleGuarantee)
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
 * 특정 계좌가 보유한 CrpToken의 일정 지분을 잠그는 기능을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.pend)
 * 3. tx 생성 (token.pend)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @param _to pend 처리할 계정
 * @param _ratio active 비율
 * @param _locktime pend 마감시각 (epoch time)
 * @author jhhong
 */
let pend = async function(_wait, _owner, _passwd, _ca, _to, _ratio, _locktime) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 pend 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.pend.estimateGas(_to, _ratio, _locktime, {from: _owner}); // 2. gas값 계산 (token.pend)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.pend(_to, _ratio, _locktime, {from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.pend)
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
 * Pending된 토큰을 다시 활성화시키는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.activate)
 * 3. tx 생성 (token.activate)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner owner 계정
 * @param _passwd owner 암호
 * @param _ca 컨트랙트 주소
 * @author jhhong
 */
let activate = async function(_wait, _owner, _passwd, _ca) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 activate 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = await token.activate.estimateGas({from: _owner}); // 2. gas값 계산 (token.activate)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.activate({from: _owner,  gas: gas, txType: "Normal"}); // 3. tx 생성 (token.activate)
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
 * 특정 계좌가 보유한 CrpToken의 일정 지분을 환수하는 기능을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. value 추출 --> _active 값을 wei 단위로 계산
 * 2. value 추출 --> _pend 값을 wei 단위로 계산
 * 3. unlock Account 수행
 * 4. gas값 계산 (token.returnPurge)
 * 5. tx 생성 (token.returnPurge)
 * 6. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 7. lock Account 수행
 *
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _crpadmin crp 관리자 계정
 * @param _passwd crp 관리자 암호
 * @param _ca 컨트랙트 주소
 * @param _to 환수 처리할 계정
 * @param _active active 환수 금액
 * @param _pend pend 환수 금액
 * @param _guarantee 게런티 환수 금액
 * @author jhhong
 */
let returnPurge = async function(_wait, _crpadmin, _passwd, _ca, _to, _active, _pend, _guarantee) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 returnPurge 수행 중...");
        await provider.web3.personal.unlockAccount(_crpadmin, _passwd); // 3. unlock Account 수행
        let gas = await token.returnPurge.estimateGas(_to, _active, _pend, _guarantee, {from: _crpadmin}); // 4. gas값 계산 (token.returnPurge)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.returnPurge(_to, _active, _pend, _guarantee, {from: _crpadmin,  gas: gas, txType: "Normal"}); // 5. tx 생성 (token.returnPurge)
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
        await provider.web3.personal.lockAccount(_crpadmin); // 6. lock Account 수행
        return (_wait && count < conf.check_count)? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * 특정 계좌가 보유한 CrpToken의 immature 밸런스를 activate로 전환 기능을 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. gas값 계산 (token.returnPurge)
 * 3. tx 생성 (token.returnPurge)
 * 4. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 *
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner 프로젝트 관리자 계정
 * @param _passwd 프로젝트 관리자 암호
 * @param _ca 컨트랙트 주소
 * @param _to 전환할 계정 주소
 * @author sykang
 */
let mature = async function(_wait, _owner, _passwd, _ca, _to) {
    try {
        let count = 0;
        let token = contract.token.at(_ca);
        console.log("CrpToken 컨트랙트 mature 수행 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 3. unlock Account 수행
        let gas = await token.mature.estimateGas(_to, {from: _owner}); // 4. gas값 계산 (token.returnPurge)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = await token.mature(_to, {from: _owner,  gas: gas, txType: "Normal"}); // 5. tx 생성 (token.returnPurge)
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
module.exports.enableToken = enableToken;
module.exports.disableToken = disableToken;
module.exports.transfer = transfer;
module.exports.approve = approve;
module.exports.burn = burn;
module.exports.addAdmin = addAdmin;
module.exports.deleteAdmin = deleteAdmin;
module.exports.lockAddr = lockAddr;
module.exports.unlockAddr = unlockAddr;
module.exports.issue = issue;
module.exports.setGuarantee = setGuarantee;
module.exports.settleGuarantee = settleGuarantee;
module.exports.pend = pend;
module.exports.activate = activate;
module.exports.returnPurge = returnPurge;
module.exports.mature = mature;