let conf = require("./settings.js");
let contract = require("./contract.js");
let provider = require("./provider.js");
let utils = require("./utils.js");

/**
 * Account에 할당된 mca를 클리어하는 "tx"를 생성하는 함수이다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정 (clearMainContractAddress)
 * 3. Tx 발행 (clearMainContractAddress)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @author jhhong
 */
let clearMca = async function (_wait, _owner, _passwd) {
    try {
        let count = 0;
        console.log("MCA Clear Tx 생성 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let gas = provider.web3.eth.estimateGas({
            from: _owner
        }); // 2. Gas 측정 (clearMainContractAddress)
        console.log("측정된 가스값 ==> [" + gas + "]");
        let tx = provider.web3.personal.clearMainContractAddress(_owner, _passwd); // 3. Tx 발행 (clearMainContractAddress)
        console.log('TX Hash=[' + tx + ']');
        if (!_wait) {
            return tx;
        }
        let receipt;
        do {
            receipt = await provider.web3.eth.getTransactionReceipt(tx); // 4. 발행된 tx가 블록에 실렸는지 확인
            if (receipt) {
                console.log("블록 탑재 성공!");
                console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                break;
            }
            console.log("TX[\"" + tx + "\"] 가 블록에 탑재때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
            await utils.milisleep(conf.check_intval);
        } while (++count < conf.check_count);
        await provider.web3.personal.lockAccount(_owner); // 5. lock Account 수행
        return (count < conf.check_count) ? ("0") : (tx);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpMain 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.main.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _title CrpMain Param: 프로젝트 타이틀 (string)
 * @param _staffdbca CrpMain Param: Staff-DB 컨트랙트 주소
 * @author jhhong
 */
let deployCrpMain = async function (_wait, _owner, _passwd, _title, _staffdbca) {
    try {
        
        let count = 0;
        console.log("CrpMain 컨트랙트 Deploy Tx 생성 중...");
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 1. unlock Account 수행
        let data_with_params = contract.main.crpNew.getData(_title, _staffdbca, {
            data: contract.main_data
        }); // parameter까지 고려된 hexa-code                
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        }); // 2. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.main.crpNew(_title, _staffdbca, {
            from: _owner,
            data: contract.main_data,
            gas: gas,
            txType: "MainCC"
        }); // 3. Tx 발행 (contract.main.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpToken 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 CrpMain Deploy가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. mca가 존재하는지 확인
 * 2. unlock Account 수행
 * 3. Gas 측정 (contract.token.new)
 * 4. Tx 발행 (contract.token.new)
 * 5. 발행된 tx가 블록에 실렸는지 확인
 * 6. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _name CrpToken Param: 토큰 이름 (string)
 * @param _symbol CrpToken Param: 토큰 심볼 (string)
 * @param _type CrpToken Param: 토큰 타입 (1, 0)
 * @param _tokendbca CrpToken Param: Token-DB 컨트랙트 주소
 * @author jhhong
 */
let deployCrpToken = async function (_wait, _owner, _passwd, _name, _symbol, _type, _tokendbca) {
    try {

        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner); // 1. mca가 존재하는지 확인
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpToken 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.token.crpNew.getData(_name, _symbol, _type, main_addr, _tokendbca, {
            data: contract.token_data
        }); // parameter까지 고려된 hexa-code
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        }); // 3. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.token.crpNew(_name, _symbol, _type, main_addr, _tokendbca, {
            from: _owner,
            data: contract.token_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        }); // 4. Tx 발행 (contract.token.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpFund 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 CrpMain Deploy가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. mca가 존재하는지 확인
 * 2. unlock Account 수행
 * 3. Gas 측정 (contract.fund.new)
 * 4. Tx 발행 (contract.fund.new)
 * 5. 발행된 tx가 블록에 실렸는지 확인
 * 6. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @author jhhong
 */
let deployCrpFund = async function (_wait, _owner, _passwd) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner); // 1. mca가 존재하는지 확인
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpFund 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.fund.crpNew.getData(main_addr, {
            data: contract.fund_data
        }); // parameter까지 고려된 hexa-code

        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        }); // 3. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.fund.crpNew(main_addr, {
            from: _owner,
            data: contract.fund_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        }); // 4. Tx 발행 (contract.fund.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpSaleMain 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 CrpMain Deploy가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. mca가 존재하는지 확인
 * 2. unlock Account 수행
 * 3. Gas 측정 (contract.salemain.new)
 * 4. Tx 발행 (contract.salemain.new)
 * 5. 발행된 tx가 블록에 실렸는지 확인
 * 6. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _starttime 크라우드세일 시작 시각
 * @param _endtime 크라우드세일 종료 시각
 * @param _softcap 최소 판매 목표량 (Softcap)
 * @param _hardcap 최대 판매 목표량 (Hardcap)
 * @param _foundrate 추가 발행 토큰 비율
 * @param _max CRP COIN 수취 최대 금액
 * @param _min CRP COIN 수취 최소 금액
 * @param _ratio 교환 비율 (CRP COIN : TOKEN)
 * @param _withdraw 최초 인출금액 (Softcap 이상 판매 시 Owner에게 지급)
 * @param _fundaddr 펀드 컨트랙트 주소
 * @author jhhong
 */
let deployCrpSaleMain = async function (_wait, _owner, _passwd, _starttime, _endtime, _softcap,
    _hardcap, _foundrate, _max, _min, _ratio, _withdraw, _fundaddr) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner); // 1. mca가 존재하는지 확인
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpSaleMain 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.salemain.crpNew.getData(_starttime, _endtime, _softcap, _hardcap, _foundrate, _max, _min,
            _ratio, _withdraw, main_addr, _fundaddr, {
                data: contract.salemain_data
            }); // parameter까지 고려된 hexa-code
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        }); // 3. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.salemain.crpNew(_starttime, _endtime, _softcap, _hardcap, _foundrate, _max, _min,
            _ratio, _withdraw, main_addr, _fundaddr, {
                from: _owner,
                data: contract.salemain_data,
                gas: gas,
                mca: main_addr,
                txType: "SubCC"
            }); // 4. Tx 발행 (contract.salemain.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollRoadmap 컨트렉트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.road.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _start_time 투표 시작 시간
 * @param _end_time 투표 종료 시간 
 * @author sykang
 */

let deployCrpPollRoadmap = async function (_wait, _owner, _passwd, _start_time, _end_time) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner);
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpPollROadmap 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행                                                                                  
        let data_with_params = contract.road.crpNew.getData(_start_time, _end_time, main_addr, {
            data: contract.road_data
        });
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        });
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.road.crpNew(_start_time, _end_time, main_addr, {
            from: _owner,
            data: contract.road_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        });
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollWithdraw 컨트렉트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.withdraw.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _start_time 투표 시작 시간
 * @param _end_time 투표 종료 시간 
 * @param _withdraw_amount 전송 할 crp 양
 * @author sykang
 */
let deployCrpPollWithdraw = async function (_wait, _owner, _passwd, _start_time, _end_time, _withdraw_amount) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner);
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpPollWithdraw 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);;
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.withdraw.crpNew.getData(_start_time, _end_time, _withdraw_amount, main_addr, {
            data: contract.withdraw_data
        });
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        });
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.withdraw.crpNew(_start_time, _end_time, _withdraw_amount, main_addr, {
            from: _owner,
            data: contract.withdraw_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        });
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpPollAdsale
 *  컨트렉트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.pollsale.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _start_time 투표 시작 시간
 * @param _end_time 투표 종료 시간
 * @param _min 최소 입금 량
 * @param _max 최대 입금 량
 * @param _hardcap 최대 판매량
 * @param _rate 토큰 교환 비율
 * @author sykang
 */
let deployCrpPollAdSale = async function (_wait, _owner, _passwd, _poll_start, _poll_end, _sale_start, _sale_end, _sale_mid, _min, _max, _hardcap, _rate) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner);
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpPollAdSale 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);;        
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.pollsale.crpNew.getData(_poll_start, _poll_end, _sale_start, _sale_end, _sale_mid, _min, _max, _hardcap, _rate, main_addr, {
            data: contract.pollsale_data
        });
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        });
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.pollsale.crpNew(_poll_start, _poll_end, _sale_start, _sale_end, _sale_mid, _min, _max, _hardcap, _rate, main_addr, {
            from: _owner,
            data: contract.pollsale_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        });
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpSaleAd
 * 컨트렉트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.salead.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _start_time 투표 시작 시간
 * @param _end_time 투표 종료 시간
 * @param _min 최소 입금 량
 * @param _max 최대 입금 량
 * @param _hardcap 최대 판매량
 * @param _rate 토큰 교환 비율
 * @param _token 토큰 컨트렉트 주소
 * @param _fund 펀트 컨트렉트 주소
 * @author sykang
 * 
 */ 
let deployCrpSaleAd = async function (_wait, _owner, _passwd, _start_time, _end_time, _mid_time, _min, _max, _hardcap, _rate, _token, _fund) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner);
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpPollAdSale 컨트랙트 Deploy Tx 생성 중...");       
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.salead.crpNew.getData(_start_time, _end_time, _mid_time, _min, _max, _hardcap, _rate, main_addr, _token, _fund, {
            data: contract.salead_data
        });        
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        });
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.salead.crpNew(_start_time, _end_time, _mid_time, _min, _max, _hardcap, _rate, main_addr, _token, _fund, {
            from: _owner,
            data: contract.salead_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        });
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpRefund
 * 컨트렉트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * 반드시 Owner Account에 대해 Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정
 * 3. Tx 발행 (contract.refund.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _owner Owner Account
 * @param _passwd Owner Account 암호
 * @param _start_time 투표 시작 시간
 * @param _end_time 투표 종료 시간
 * @author sykang
 * 
 */
let deployCrpPollRefund = async function (_wait, _owner, _passwd, _start_time, _end_time) {
    try {
        let count = 0;
        let main_addr = await provider.web3.eth.getMainContractAddress(_owner);
        if (main_addr == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + _owner + '] does not exist.!');
        }
        console.log("CrpPollRefund 컨트랙트 Deploy Tx 생성 중...");
        console.log("Mca : " + main_addr);
        await provider.web3.personal.unlockAccount(_owner, _passwd); // 2. unlock Account 수행
        let data_with_params = contract.refund.crpNew.getData(_start_time, _end_time, main_addr, {
            data: contract.refund_data
        });
        let gas = provider.web3.eth.estimateGas({
            from: _owner,
            data: data_with_params
        });
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.refund.crpNew(_start_time, _end_time, main_addr, {
            from: _owner,
            data: contract.refund_data,
            gas: gas,
            mca: main_addr,
            txType: "SubCC"
        });        
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 5. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    console.log("....[" + _owner + "]의 MCA = [" + provider.web3.eth.getMainContractAddress(_owner) + "]");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_owner); // 6. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpAdminStaffDb 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * CrpAdmin만이 deploy할 수 있으며, Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정 (contract.staffdb.new)
 * 3. Tx 발행 (contract.staffdb.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _crpadmin CrpAdmin Account
 * @param _passwd CrpAdmin Account 암호
 * @author jhhong
 */
let deployCrpAdminStaffDb = async function (_wait, _crpadmin, _passwd) {
    try {
        let count = 0;
        console.log("CrpAdminStaffDb 컨트랙트 Deploy Tx 생성 중...");
        await provider.web3.personal.unlockAccount(_crpadmin, _passwd); // 1. unlock Account 수행
        let data_with_params = contract.staffdb.crpNew.getData({
            data: contract.staffdb_data
        }); // parameter까지 고려된 hexa-code

        let gas = provider.web3.eth.estimateGas({
            from: _crpadmin,
            data: data_with_params
        }); // 2. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.staffdb.crpNew({
            from: _crpadmin,
            data: contract.staffdb_data,
            gas: gas,
            txType: "MainCC"
        }); // 3. Tx 발행 (contract.staffdb.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 4. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_crpadmin); // 5. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/**
 * CrpAdminTokenDb 컨트랙트를 deploy하기 위한 "tx"를 생성하는 함수이다.
 * CrpAdmin만이 deploy할 수 있으며, Authorize가 선행되어야 한다.
 * 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Gas 측정 (contract.tokendb.new)
 * 3. Tx 발행 (contract.tokendb.new)
 * 4. 발행된 tx가 블록에 실렸는지 확인
 * 5. lock Account 수행
 * 
 * @param _wait 블럭에 실릴 때까지 기다릴지 여부
 * @param _crpadmin CrpAdmin Account
 * @param _passwd CrpAdmin Account 암호
 * @author jhhong
 */
let deployCrpAdminTokenDb = async function (_wait, _crpadmin, _passwd) {
    try {
        let count = 0;
        console.log("CrpAdminTokenDb 컨트랙트 Deploy Tx 생성 중...");
        await provider.web3.personal.unlockAccount(_crpadmin, _passwd); // 1. unlock Account 수행
        let data_with_params = contract.tokendb.crpNew.getData({
            data: contract.tokendb_data
        }); // parameter까지 고려된 hexa-code

        let gas = provider.web3.eth.estimateGas({
            from: _crpadmin,
            data: data_with_params
        }); // 2. Gas 측정
        console.log("측정된 가스값 ==> [" + gas + "]");
        let instance = await contract.tokendb.crpNew({
            from: _crpadmin,
            data: contract.tokendb_data,
            gas: gas,
            txType: "MainCC"
        }); // 3. Tx 발행 (contract.tokendb.new)
        console.log('TX Hash=[' + instance.transactionHash + ']');
        let receipt;
        if (_wait) {
            do {
                receipt = await provider.web3.eth.getTransactionReceipt(instance.transactionHash); // 4. 발행된 tx가 블록에 실렸는지 확인
                if (receipt) {
                    console.log("블록 탑재 성공!");
                    console.log("....TX가 포함된 블록넘버 = [" + receipt.blockNumber + "] 블록해시 = [" + receipt.blockHash + "]!");
                    console.log("....컨트랙트 주소 = [" + receipt.contractAddress + "]!");
                    break;
                }
                console.log("TX[\"" + instance.transactionHash + "\"] 가 블록에 실릴때까지 대기중... 블록넘버 = [" + provider.web3.eth.blockNumber + "]");
                await utils.milisleep(conf.check_intval);
            } while (++count < conf.check_count);
        }
        await provider.web3.personal.lockAccount(_crpadmin); // 5. lock Account 수행
        return (_wait && count < conf.check_count) ? (receipt.contractAddress) : (instance.transactionHash);
    } catch (err) {
        console.log(err);
        return ("0");
    }
}

/* exports 선언 */
module.exports.clearMca = clearMca;
module.exports.deployCrpMain = deployCrpMain;
module.exports.deployCrpToken = deployCrpToken;
module.exports.deployCrpFund = deployCrpFund;
module.exports.deployCrpSaleMain = deployCrpSaleMain;
module.exports.deployCrpPollRoadmap = deployCrpPollRoadmap;
module.exports.deployCrpPollWithdraw = deployCrpPollWithdraw;
module.exports.deployCrpPollAdSale = deployCrpPollAdSale;
module.exports.deployCrpSaleAd = deployCrpSaleAd;
module.exports.deployCrpPollRefund = deployCrpPollRefund;
module.exports.deployCrpAdminStaffDb = deployCrpAdminStaffDb;
module.exports.deployCrpAdminTokenDb = deployCrpAdminTokenDb;
