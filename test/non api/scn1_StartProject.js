const fs = require('fs'); // file-system
const path = require('path'); // path-package
let args_dir = path.resolve(__dirname, 'args');
let params = fs.readFileSync(args_dir + '/deploy_CrpMain.json');
let param_token = fs.readFileSync(args_dir + '/scn1_ParamToken.json', 'utf8');
let param_sale = fs.readFileSync(args_dir + '/scn1_ParamSale.json', 'utf8');
let param_road = fs.readFileSync(args_dir + '/scn1_ParamRoadmap.json', 'utf8');
let param_staff = fs.readFileSync(args_dir + '/scn1_ParamStaff.json', 'utf8');
/* 파라메터 추출 */
let args = JSON.parse(params);
let args_token = JSON.parse(param_token);
let args_sale = JSON.parse(param_sale);
let args_roadmap = JSON.parse(param_road);
let args_staffs = JSON.parse(param_staff);
const provider = args.provider;
const owner = args.owner;
const passwd = args.password;
let web3_path = (args.web3 == 'null') ? ('web3') : (args.web3);
/* web3 provider 설정 */
const Web3 = require(web3_path); // web3 api
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider)); // set provider
/* deploy에 필요한 요소들 추출 (abi, data, gas) */
let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi'); // abi가 저장된 file path
let data_path = path.resolve(__dirname, 'data', 'CrpMain.data'); // data를 저장할 file path
let abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
let Main = web3.eth.contract(JSON.parse(abi)); // get contract
let data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출
let ca_main = '0x0000000000000000000000000000000000000000'; // main contract 주소를 담을 변수
let data_with_params;
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
/**
 * Main Contract deploy를 수행하는 함수이다. 아래의 절차에 따라 진행된다.
 * 1. unlock Account 수행
 * 2. Main.new 수행
 * 3. getTransactionReceipt를 통해, 발행된 tx가 블록에 실렸는지 확인
 * 4. lock Account 수행
 * 
 * @author jhhong
 */
let MainDeploy = async () => {
    try {
        console.log('deploy CrpMain contract .....');
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        let receipt; // receipt object를 받을 변수
        data_with_params = Main.new.getData(args_token.title, {
            data: data
        });
        gas = web3.eth.estimateGas({
            data: data_with_params
        }); // gas값 계산
        //console.log(Main);
        console.log("gas" + gas);
        let contract = await Main.new(args_token.title, {
            from: owner,
            data: data,
            gas: gas
        }); // Main Deploy를 위한 tx 생성
        console.log('Main Contract Create TX Hash=[' + contract.transactionHash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(contract.transactionHash); // receipt 확인
            if (receipt) {
                console.log("Included in the Block=[" + web3.eth.blockNumber + "] CA=[" + receipt.contractAddress + "]!");
                ca_main = receipt.contractAddress;
                break;
            }
            console.log("Wait for including Tx Block=[" + web3.eth.blockNumber + "]...");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log("CrpWhiteList contract deploy");
        abi_path = path.resolve(__dirname, 'abi', 'CrpWhiteList.abi'); // abi가 저장된 file path
        data_path = path.resolve(__dirname, 'data', 'CrpWhiteList.data'); // data를 저장할 file path
        abi = fs.readFileSync(abi_path, 'utf-8'); // abi 추출
        let White = web3.eth.contract(JSON.parse(abi)); // get contract
        data = fs.readFileSync(data_path, 'utf-8'); // bytecode 추출

        let crp_admin = web3.eth.getAdminAddress();

        console.log("crp admin : "+ crp_admin)

        data_with_params = Main.new.getData(crp_admin, {
            data: data
        });
        gas = await web3.eth.estimateGas({
            data: data_with_params
        }); // gas값 계산
        let white_contract = await White.new({
            from: owner,
            data: data,
            gas: gas,
            mca: ca_main
        });
        let white_addr;
        console.log('White List Contract Create TX Hash=[' + white_contract.transactionHash + ']');
        do {
            receipt = await web3.eth.getTransactionReceipt(white_contract.transactionHash); // receipt 확인
            if (receipt) {
                console.log("Included in the Block=[" + web3.eth.blockNumber + "] CA=[" + receipt.contractAddress + "]!");
                white_addr = receipt.contractAddress;
                break;
            }
            console.log("Wait for including Tx Block=[" + web3.eth.blockNumber + "]...");
            await milisleep(4000); // 4초 대기
        } while (!receipt);

        console.log("regist white list contract address to main contract");
        gas = await contract.setWhiteListAddress.estimateGas(white_addr, {
            from: owner
        });
        let regist_White = await contract.setWhiteListAddress(white_addr, {
            from: owner,
            gas: gas
        });
        do {
            receipt = await web3.eth.getTransactionReceipt(regist_White); // receipt 확인
            if (receipt) {
                console.log("Tx=[" + regist_White + "] Included in the Block=[" + receipt.blockNumber + "]!");
                break;
            }
            console.log("Wait for including Tx Block=[" + web3.eth.blockNumber + "]...");
            await milisleep(4000); // 4초 대기
        } while (!receipt)
        await web3.personal.lockAccount(owner); // Lock Account
    } catch (err) {
        console.log(err);
    }
}
/**
 * 운용에 필요한 parameter 설정을 수행하는 함수이다. 
 * Token, 1차 CrowdSale, Roadmap-Poll Contract 생성에 필요한 parameter 설정을 여기서 수행한다.
 * Staff-Poll을 위한 Staff 정보 설정도 여기에서 이루어진다.
 * 각 Tx는 독립적인 동작을 수행하므로, 처리 순서를 고려하지 않아도 된다.
 * 
 * 1. unlock Account 수행
 * 2. main contract 불러오기
 * 3. setTokenParams()을 위한 tx 생성
 * 4. setMainSaleParams()을 위한 tx 생성
 * 5. addRoadmapPollParams()을 위한 tx 생성 (루프)
 * 6. setStaffInfo()을 위한 tx 생성 (루프)
 * 7. 모든 tx들이 블록에 포함될 때까지 각 tx들의 receipt를 확인
 * 8. lock Account 수행
 * 
 * @author sykang
 */
let SetParams = async () => {
    try {
        await web3.personal.unlockAccount(owner, passwd); // Unlock Account
        ca_main = await web3.eth.getMainContractAddress(owner);
        if (ca_main == '0x0000000000000000000000000000000000000000') {
            throw new Error('The main contact is null!');
        }
        let contract = await Main.at(ca_main); // main contract 불러오기
        let tx_array = new Array(); // tx들을 담기위한 동적배열 생성
        console.log('Set token contract params .....');
        gas = await contract.setTokenParams.estimateGas(args_token.name, args_token.symbol, {
            from: owner
        });
        tx_array[0] = await contract.setTokenParams(args_token.name, args_token.symbol, {
            from: owner,
            gas: gas
        }); // setTokenParams()을 위한 tx 생성
        console.log('Set Token Params TX Hash=[' + tx_array[0] + ']');

        console.log('set main sale contract params .....');
        gas = await contract.setMainSaleParams.estimateGas(args_sale.salestart, args_sale.saleend, args_sale.softcap,
            args_sale.hardcap, args_sale.foundation, args_sale.maxcoin,
            args_sale.mincoin, args_sale.rate, args_sale.withdraw, {
                from: owner
            });
        tx_array[1] = await contract.setMainSaleParams(args_sale.salestart, args_sale.saleend, args_sale.softcap,
            args_sale.hardcap, args_sale.foundation, args_sale.maxcoin,
            args_sale.mincoin, args_sale.rate, args_sale.withdraw, {
                from: owner,
                gas: gas
            }); // setMainSaleParams()을 위한 tx 생성
        console.log('Set Crowdsale Params TX Hash=[' + tx_array[1] + ']');

        console.log('set roadmap contract params .....');
        let i; // for-loop count
        let total_txnum = 2; // tx 총량
        for (i = 0; i < Object.keys(args_roadmap).length; ++i) {
            gas = await contract.addRoadmapPollParams.estimateGas(args_roadmap[i].start,
                args_roadmap[i].end, args_roadmap[i].amount, {
                    from: owner
                });
            tx_array[i + total_txnum] = await contract.addRoadmapPollParams(args_roadmap[i].start,
                args_roadmap[i].end, args_roadmap[i].amount, {
                    from: owner,
                    gas: gas
                }); // addRoadmapPollParams()을 위한 tx 생성
            console.log('Add Roadmap-Poll Params TX Hash=[' + tx_array[i + total_txnum] + ']');
        }
        total_txnum += i;
        console.log('set staff info .....');
        for (i = 0; i < Object.keys(args_staffs).length; ++i) {
            gas = await contract.setStaffInfo.estimateGas(args_staffs[i].address,
                args_staffs[i].amount, {
                    from: owner
                });
            tx_array[i + total_txnum] = await contract.setStaffInfo(args_staffs[i].address,
                args_staffs[i].amount, {
                    from: owner,
                    gas: gas
                }); // setStaffInfo()을 위한 tx 생성
            console.log('Set Staff Info TX Hash=[' + tx_array[i + total_txnum] + ']');
        }
        total_txnum += i;
        let receipt_array; // 위에서 생성한 각 tx들의 receipt를 저장하기 위한 동적배열 생성
        for (i = 0; i < total_txnum; ++i) {
            do {
                receipt_array = await web3.eth.getTransactionReceipt(tx_array[i]); // receipt 확인
                if (receipt_array) {
                    console.log("Tx=[" + tx_array[i] + "] Included in the Block=[" + receipt_array.blockNumber + "]!");
                    break;
                }
                console.log("Wait for including Tx Block=[" + web3.eth.blockNumber + "]...");
                await milisleep(4000); // 4초 대기
            } while (!receipt_array)
        }
        console.log("All Tx is included in the blocks!");
        await web3.personal.lockAccount(owner); // Lock Account
    } catch (err) {
        console.log(err);
    }
}
/**
 * 프로시져 수행 메인 함수이다.
 * 
 * 1. clear screen
 * 2. MainDeploy 수행
 * 3. SetParams 수행
 * 
 * @author jhhong
 */
let RunProc = async () => {
    try {
        console.clear();
        /* 파라메터 체크 */
        console.log('* param1 (provider):...........' + args.provider);
        console.log('* param2 (web3 path):..........' + args.web3);
        console.log('* param3 (owner account):......' + args.owner);
        console.log('* param4 (owner password):.....' + args.password);
        await MainDeploy();
        await SetParams();
    } catch (err) {}
}
RunProc();