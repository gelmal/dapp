const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let input_params = fs.readFileSync(args_dir + '/scn13_SettlePollAdSale.json', 'utf8');
let input = JSON.parse(input_params);
const provider = input.provider;
const owner = input.owner;
const passwd = input.passwd;
let web3_path = (input.web3 == 'null') ? ('web3') : (input.web3);
/* web3 provider 설정 */
const Web3 = require(web3_path); // web3 api
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider)); // set provider
/* deploy에 필요한 요소들 추출 (abi, data, gas) */

let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi'); // abi가 저장된 file path
let data_path = path.resolve(__dirname, 'data', 'CrpMain.data'); // data를 저장할 file path
let abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
let gas;
let receipt;

// 데이터 모음
let main = web3.eth.contract(JSON.parse(abi)); // get contract
let token;
let Ad;
let Sale;

// contract 모음
let main_contract;
let token_contract;
let add_poll_contract;
let add_sale_contract;


// address 모음
let main_address;
let token_address;
let add_poll_address;
let add_sale_address;
let fund_address;

// settle 인자
let token_total_address_count;
let token_total_supply;
let token_total_agree_address;

let result_poll;
let now_crowd_posit;



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
 * 정산의 데이터로 사용되는 각 contract들의 데이터를 수집
 * 1. unlock Account 수행
 * 2. CrpMain 추출
 * 3. token address 추출 후, 토큰 비활성화
 * 4. 토큰 보유자 숫자 및 총 발행량 수집
 * 5. withdraw contract 추출 및 추출된 데이터를 기반으로 weight 저장
 * 6. weight 기반으로 withdraw poll 정산
 * 7. fund contract 추출
 * 8. 성공 시 main에 저장된
 * 4. lock Account 수행
 * 
 * @author sykang
 */

let GetTokenInfo = async () => {
    try {
        console.log('proceeding get token infomation ......');
        await milisleep(1000);
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account 
        main_address = await web3.eth.getMainContractAddress(owner);
        if (main_address == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact created by [' + owner + '] does not exist.!');
        }
        main_contract = main.at(main_address);

        token_address = await main_contract.token_addr({
            from: owner
        });
        abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpToken.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        token = web3.eth.contract(JSON.parse(abi));
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
        token_contract = token.at(token_address);

        // token disable
        gas = await token_contract.setTokenDisable.estimateGas({
            from: owner
        });

        let availe_tx = await token_contract.setTokenDisable({
            from: owner,
            gas: gas
        });

        console.log('token disable TX Hash=[' + availe_tx + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(availe_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);
        // get token infomation
        token_total_address_count = await token_contract.balance_count({
            from: owner
        });

        token_total_supply = await token_contract.totalSupply({
            from: owner
        });

        // at Ad crowd sale  Contract
        abi_path = path.resolve(__dirname, 'abi', 'CrpPollAdSale.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpPollAdSale.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출    
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        Ad = web3.eth.contract(JSON.parse(abi)); // get contract

        now_crowd_posit = await main_contract.now_crowd_posit({
            from: owner
        });
        //test
        add_poll_address = await main_contract.crowd_poll_addrs(now_crowd_posit, {
            from: owner
        });

        add_poll_contract = Ad.at(add_poll_address);

        // calculate vote weight
        let now_posit = await add_poll_contract.head();

        let i;
        const calcul_tx = [];
        console.log('set add crowdsale voter weight .....');

        token_total_agree_address = 0;
        for (i = 0; i < token_total_address_count; ++i) {
            let vote_info = await add_poll_contract.getVoteInfo(now_posit, {
                from: owner
            });
            let token_balance = await token_contract.balanceOf(now_posit, {
                from: owner
            });

            if (vote_info[2]) {
                token_total_agree_address += token_balance;
            }
            gas = await add_poll_contract.setAmount.estimateGas(now_posit, token_balance, {
                from: owner
            });
            calcul_tx[i] = await add_poll_contract.setAmount(now_posit, token_balance, {
                from: owner,
                gas: gas
            });
            now_posit = vote_info[4];
            console.log('regist addcrowdsale weight by address : [' + i + '] ~ TX Hash=[' + calcul_tx[i] + ']');
        }

        for (i = 0; i < calcul_tx.length; ++i) {
            do {
                receipt = await web3.eth.getTransactionReceipt(calcul_tx[i]); // receipt 확인
                if (receipt) {
                    console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                    break;
                }
                console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
                await milisleep(4000); // 4초 대기
            } while (!receipt);
        }
        //settle tx
        console.log('settle addcrowdsale poll .....');
        gas = await add_poll_contract.settlePoll.estimateGas(token_total_address_count, token_total_supply, Number(token_total_agree_address), {
            from: owner
        });
        let settle_tx = await add_poll_contract.settlePoll(token_total_address_count, token_total_supply, Number(token_total_agree_address), {
            from: owner,
            gas: gas
        });
        console.log("settle_tx : " + settle_tx);
        do {
            receipt = await web3.eth.getTransactionReceipt(settle_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);
        console.log("test1");
        //fund contract at
        abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpFund.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        fund = web3.eth.contract(JSON.parse(abi));
        console.log("test2");
        fund_address = await main_contract.fund_addr({
            from: owner
        });
        console.log("test3");
        //fund_contract = fund.at(fund_address);
        await web3.personal.lockAccount(owner); // lock Account
    } catch (err) {
        console.log(err);
    }
}

/**
 * 로드맵 성공 시, 해당 금액을 오너에게 전송하는 함수
 * 1. unlock Account 수행
 * 2. main contract에서 전송 할 금액 데이터 수집
 * 3. fund contract의 withdraw 함수 가스 측정 및 tx 생성
 * 4. getTransactionReceipt을 사용하여 tx가 블록에 포함되었는지 확인
 * 5. 토큰 enable
 * 5. lock Account 수행
 * 
 * @author sykang
 */
let DeployAdCrowdSale = async () => {
    try {
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account    
        console.log("test00");
        abi_path = path.resolve(__dirname, 'abi', 'CrpSaleAd.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpSaleAd.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        Sale = web3.eth.contract(JSON.parse(abi)); // get contract   
        let crowd_param;
        crowd_param = await add_poll_contract.sale_info();
        let i;
        for (i = 0; i < crowd_param.length; i++) {
            console.log(crowd_param[i]);
        }
        let data_with_param;
        console.log(data_with_param);
        data_with_param = Sale.new.getData(crowd_param[0].toNumber(), crowd_param[1].toNumber(), crowd_param[2].toNumber(), crowd_param[3].toNumber(),
            crowd_param[4].toNumber(), crowd_param[5].toNumber(), main_address, token_address, fund_address, {
                data: data
            });

        // 
        

        gas = 1230000;

        add_sale_contract = await Sale.new(crowd_param[0].toNumber(), crowd_param[1].toNumber(), crowd_param[2].toNumber(), crowd_param[3].toNumber(), crowd_param[4].toNumber(), crowd_param[5].toNumber(), main_address, token_address, fund_address, {
            from: owner,
            data: data,
            gas: gas,
            mca: main_address
        });
        console.log('Ad Crwod Create TX Hash=[' + add_sale_contract.transactionHash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(add_sale_contract.transactionHash); // receipt 확인
            if (receipt) {
                console.log("Included in the Block=[" + web3.eth.blockNumber + "] CA=[" + receipt.contractAddress + "]!");
                add_sale_address = receipt.contractAddress;
                break;
            }
            console.log("Wait for including Tx Block=[" + web3.eth.blockNumber + "]...");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('regist AdCrowdSale contract .....');
        gas = await main_contract.addCrowdSaleAddress.estimateGas(add_sale_address, {
            from: owner
        });
        let regist_Ad = await main_contract.addCrowdSaleAddress(add_sale_address, {
            from: owner,
            gas: gas
        });
        console.log('TX Hash=[' + regist_Ad + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(regist_Ad); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log('plus now crowd posit .....');
        gas = await main_contract.plusNowCrwodPosit.estimateGas({
            from: owner
        });

        let plus_tx = await main_contract.plusNowCrwodPosit({
            from: owner,
            gas: gas
        });
        console.log('TX Hash=[' + plus_tx + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(plus_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);


        //토큰 enable
        gas = await token_contract.setTokenEnable.estimateGas({
            from: owner
        });

        let availe_tx = await token_contract.setTokenEnable({
            from: owner,
            gas: gas
        });
        console.log('token enable TX Hash=[' + availe_tx + ']');
        do {
            let receipt = await web3.eth.getTransactionReceipt(availe_tx); // receipt 확인
            if (receipt) {
                console.log("Included in the Block = [" + receipt.blockNumber + "] HASH = [" + receipt.blockHash + "]!");
                break;
            }
            console.log("Wait for including Tx... Block=[" + web3.eth.blockNumber + "]");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        await web3.personal.lockAccount(owner); // Unlock Account    
    } catch {
        console.log(err);
    }
}

/**
 * 프로시져 수행 메인 함수이다.
 * 
 * 1. clear screen
 * 2. Settle withdraw poll 
 * 
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
        await GetTokenInfo();
        result_poll = await add_poll_contract.result_poll({
            from: owner
        });
        console.log(result_poll);
        if (result_poll == true) {
            await DeployAdCrowdSale();
        }
    } catch (err) {}
}
RunProc();