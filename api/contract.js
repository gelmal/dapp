const fs = require('fs'); // File System
const path = require('path'); // Path
let provider = require("./provider.js");

/**
 * CrpMain Abi를 추출한다.
 *
 * @return CrpMain Contract Abi
 * @author jhhong
 */
function getCrpMainAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        
        console.log(err);
        return null;
    }
}

/**
 * CrpMain Bytecode (HEXA) 추출한다.
 *
 * @return CrpMain Contract Bytecode
 * @author jhhong
 */
function getCrpMainHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpMain.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpToken Abi를 추출한다.
 *
 * @return CrpToken Contract Abi
 * @author jhhong
 */
function getCrpTokenAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpToken Bytecode (HEXA) 추출한다.
 *
 * @return CrpToken Contract Bytecode
 * @author jhhong
 */
function getCrpTokenHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpToken.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpFund Abi를 추출한다.
 *
 * @return CrpFund Contract Abi
 * @author jhhong
 */
function getCrpFundAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpFund Bytecode (HEXA) 추출한다.
 *
 * @return CrpFund Contract Bytecode
 * @author jhhong
 */
function getCrpFundHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpFund.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpSaleMain Abi를 추출한다.
 *
 * @return CrpSaleMain Contract Abi
 * @author jhhong
 */
function getCrpSaleMainAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpSaleMain.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpSaleMain Bytecode (HEXA) 추출한다.
 *
 * @return CrpSaleMain Contract Bytecode
 * @author jhhong
 */
function getCrpSaleMainHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpSaleMain.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollRoadmap Abi를 추출한다.
 *
 * @return CrpPollRoadmap Contract Abi
 * @author sykang
 */
function getCrpPollRoadmapAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpPollRoadmap.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollRoadmap Bytecode (HEXA) 추출한다.
 *
 * @return CrpPollRoadmap Contract Bytecode
 * @author sykang
 */
function getCrpPollRoadmapHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpPollRoadmap.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollWithdraw Abi를 추출한다.
 *
 * @return CrpPollWithdraw Contract Abi
 * @author sykang
 */
function getCrpPollWithdrawAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpPollWithdraw.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollWithdraw Bytecode (HEXA) 추출한다.
 *
 * @return CrpPollWithdraw Contract Bytecode
 * @author sykang
 */
function getCrpPollWithdrawHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpPollWithdraw.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}
/**
 * CrpPollAdSale Abi를 추출한다.
 *
 * @return CrpPollAdSale Contract Abi
 * @author sykang
 */
function getCrpPollAdSaleAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpPollAdSale.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollpollsale Bytecode (HEXA) 추출한다.
 *
 * @return CrpPollpollsale Contract Bytecode
 * @author sykang
 */
function getCrpPollAdSaleHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpPollAdSale.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpSaleAd Abi를 추출한다.
 *
 * @return CrpSaleAd Contract Abi
 * @author sykang
 */
function getCrpSaleAdAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpSaleAd.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpSaleAd Bytecode (HEXA) 추출한다.
 *
 * @return CrpSaleAd Contract Bytecode
 * @author sykang
 */
function getCrpSaleAdHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpSaleAd.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollRefund Abi를 추출한다.
 *
 * @return CrpPollRefund Contract Abi
 * @author sykang
 */
function getCrpPollRefundAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpPollRefund.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpPollRefund Bytecode (HEXA) 추출한다.
 *
 * @return CrpPollRefund Contract Bytecode
 * @author sykang
 */
function getCrpPollRefundHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpPollRefund.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpAdminStaffDb Abi를 추출한다.
 *
 * @return CrpAdminStaffDb Contract Abi
 * @author jhhong
 */
function getCrpAdminStaffDbAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpAdminStaffDb.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpAdminStaffDb Bytecode (HEXA) 추출한다.
 *
 * @return CrpAdminStaffDb Contract Bytecode
 * @author jhhong
 */
function getCrpAdminStaffDbHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpAdminStaffDb.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpAdminTokenDb Abi를 추출한다.
 *
 * @return CrpAdminTokenDb Contract Abi
 * @author jhhong
 */
function getCrpAdminTokenDbAbi() {
    try {
        let abi_path = path.resolve(__dirname, 'abi', 'CrpAdminTokenDb.abi');
        return fs.readFileSync(abi_path, 'utf-8');
    } catch(err) {
        console.log(err);
        return null;
    }
}

/**
 * CrpAdminTokenDb Bytecode (HEXA) 추출한다.
 *
 * @return CrpAdminTokenDb Contract Bytecode
 * @author jhhong
 */
function getCrpAdminTokenDbHexa() {
    try {
        let data_path = path.resolve(__dirname, 'data', 'CrpAdminTokenDb.data');
        let data = fs.readFileSync(data_path, 'utf-8');
        return data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

/* 전역 변수 선언 */
let main_abi;
let main_data;
let main;
let token_abi;
let token_data;
let token;
let fund_abi;
let fund_data;
let fund;
let salemain_abi;
let salemain_data;
let salemain;
let road_abi;
let road_data;
let road;
let withdraw_abi;
let withdraw_data;
let withdraw;
let pollsale_abi;
let pollsale_data;
let pollsale;
let salead_abi;
let salead_data;
let salead;
let refund_abi;
let refund_data;
let refund;
let staffdb_abi;
let staffdb_data;
let staffdb;
let tokendb_abi;
let tokendb_data;
let tokendb;

/**
 * 각 컨트랙트의 ABI와 BYTECODE를 추출한다.
 *
 * @author jhhong
 */
async function RunProc() {
    main_abi = getCrpMainAbi();
    main_data = getCrpMainHexa();
    main = provider.web3.eth.contract(JSON.parse(main_abi));
    token_abi = getCrpTokenAbi();
    token_data = getCrpTokenHexa();
    token = provider.web3.eth.contract(JSON.parse(token_abi));
    fund_abi = getCrpFundAbi();
    fund_data = getCrpFundHexa();
    fund = provider.web3.eth.contract(JSON.parse(fund_abi));
    salemain_abi = getCrpSaleMainAbi();
    salemain_data = getCrpSaleMainHexa();
    salemain = provider.web3.eth.contract(JSON.parse(salemain_abi));
    road_abi = getCrpPollRoadmapAbi();
    road_data = getCrpPollRoadmapHexa();
    road = provider.web3.eth.contract(JSON.parse(road_abi));
    withdraw_abi = getCrpPollWithdrawAbi();
    withdraw_data = getCrpPollWithdrawHexa();
    withdraw= provider.web3.eth.contract(JSON.parse(withdraw_abi));
    pollsale_abi = getCrpPollAdSaleAbi();
    pollsale_data = getCrpPollAdSaleHexa();
    pollsale= provider.web3.eth.contract(JSON.parse(pollsale_abi));
    salead_abi = getCrpSaleAdAbi();
    salead_data = getCrpSaleAdHexa();
    salead = provider.web3.eth.contract(JSON.parse(salead_abi));
    refund_abi = getCrpPollRefundAbi();
    refund_data = getCrpPollRefundHexa();
    refund = provider.web3.eth.contract(JSON.parse(refund_abi));
    staffdb_abi = getCrpAdminStaffDbAbi();
    staffdb_data = getCrpAdminStaffDbHexa();
    staffdb = provider.web3.eth.contract(JSON.parse(staffdb_abi));
    tokendb_abi = getCrpAdminTokenDbAbi();
    tokendb_data = getCrpAdminTokenDbHexa();
    tokendb = provider.web3.eth.contract(JSON.parse(tokendb_abi));
}
RunProc();

/* exports 선언 */
exports.main_abi = main_abi;
exports.main_data = main_data;
exports.main = main;
exports.token_abi = token_abi;
exports.token_data = token_data;
exports.token = token;
exports.fund_abi = fund_abi;
exports.fund_data = fund_data;
exports.fund = fund;
exports.salemain_abi = salemain_abi;
exports.salemain_data = salemain_data;
exports.salemain = salemain;
exports.road_abi = road_abi;
exports.road_data = road_data;
exports.road = road;
exports.withdraw_abi = withdraw_abi;
exports.withdraw_data = withdraw_data;
exports.withdraw = withdraw;
exports.pollsale_abi = pollsale_abi
exports.pollsale_data = pollsale_data;
exports.pollsale = pollsale;
exports.salead_abi = salead_abi;
exports.salead_data = salead_data;
exports.salead = salead;
exports.refund_abi = refund_abi;
exports.refund_data = refund_data;
exports.refund = refund;
exports.staffdb_abi = staffdb_abi;
exports.staffdb_data = staffdb_data;
exports.staffdb = staffdb;
exports.tokendb_abi = tokendb_abi;
exports.tokendb_data = tokendb_data;
exports.tokendb = tokendb;