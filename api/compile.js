const fs = require('fs'); // File System
const path = require('path'); // Path
const solc = require('solc'); // SOLC (^0.4.24)

/**
 * CrpAdminStaffDb 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpAdminStaffDb() {
    console.log("Compile CrpAdminStaffDb Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {           
        'CrpAdminStaffDb.sol': fs.readFileSync(src_dir + '/CrpAdminStaffDb.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpAdminStaffDb.sol:CrpAdminStaffDb'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpAdminStaffDb.sol:CrpAdminStaffDb'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpAdminStaffDb.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpAdminStaffDb.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpAdminTokenDb 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpAdminTokenDb() {
    console.log("Compile CrpAdminTokenDb Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {           
        'CrpAdminTokenDb.sol': fs.readFileSync(src_dir + '/CrpAdminTokenDb.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpAdminTokenDb.sol:CrpAdminTokenDb'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpAdminTokenDb.sol:CrpAdminTokenDb'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpAdminTokenDb.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpAdminTokenDb.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpFund 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpFund() {
    console.log("Compile CrpFund Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpFund.sol': fs.readFileSync(src_dir + '/CrpFund.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpFund.sol:CrpFund'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpFund.sol:CrpFund'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpFund.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpFund.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpMain 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpMain() {
    console.log("Compile CrpMain Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpAdminStaffDb.sol': fs.readFileSync(src_dir + '/CrpAdminStaffDb.sol', 'utf-8'),
        'CrpAdminTokenDb.sol': fs.readFileSync(src_dir + '/CrpAdminTokenDb.sol', 'utf-8'),
        'CrpFund.sol': fs.readFileSync(src_dir + '/CrpFund.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'CrpMain.sol': fs.readFileSync(src_dir + '/CrpMain.sol', 'utf-8'),
        'CrpPollAdSale.sol': fs.readFileSync(src_dir + '/CrpPollAdSale.sol', 'utf-8'),
        'CrpPollRefund.sol': fs.readFileSync(src_dir + '/CrpPollRefund.sol', 'utf-8'),
        'CrpPollRoadmap.sol': fs.readFileSync(src_dir + '/CrpPollRoadmap.sol', 'utf-8'),
        'CrpPollWithdraw.sol': fs.readFileSync(src_dir + '/CrpPollWithdraw.sol', 'utf-8'),
        'CrpSaleAd.sol': fs.readFileSync(src_dir + '/CrpSaleAd.sol', 'utf-8'),
        'CrpSaleMain.sol': fs.readFileSync(src_dir + '/CrpSaleMain.sol', 'utf-8'),
        'CrpToken.sol': fs.readFileSync(src_dir + '/CrpToken.sol', 'utf-8'),
        'CrpWhiteList.sol': fs.readFileSync(src_dir + '/CrpWhiteList.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8'),
        'ST20.sol': fs.readFileSync(src_dir + '/ST20.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpMain.sol:CrpMain'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpMain.sol:CrpMain'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpMain.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpMain.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpPollAdSale 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author sykang
 */
function compileCrpPollAdSale() {
    console.log("Compile CrpPollAdSale Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpPollAdSale.sol': fs.readFileSync(src_dir + '/CrpPollAdSale.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpPollAdSale.sol:CrpPollAdSale'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpPollAdSale.sol:CrpPollAdSale'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpPollAdSale.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpPollAdSale.data'); // data를 저장할 file path

    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;    
}

/**
 * CrpPollRefund 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpPollRefund() {
    console.log("Compile CrpPollRefund Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpPollRefund.sol': fs.readFileSync(src_dir + '/CrpPollRefund.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({
        sources: input_src
    }, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpPollRefund.sol:CrpPollRefund'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpPollRefund.sol:CrpPollRefund'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpPollRefund.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpPollRefund.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpPollRoadmap 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpPollRoadmap() {
    console.log("Compile CrpPollRoadmap Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpPollRoadmap.sol': fs.readFileSync(src_dir + '/CrpPollRoadmap.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({
        sources: input_src
    }, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpPollRoadmap.sol:CrpPollRoadmap'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpPollRoadmap.sol:CrpPollRoadmap'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpPollRoadmap.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpPollRoadmap.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpPollWithdraw 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpPollWithdraw() {
    console.log("Compile CrpPollWithdraw Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpPollWithdraw.sol': fs.readFileSync(src_dir + '/CrpPollWithdraw.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({
        sources: input_src
    }, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpPollWithdraw.sol:CrpPollWithdraw'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpPollWithdraw.sol:CrpPollWithdraw'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpPollWithdraw.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpPollWithdraw.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpSaleAd 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author sykang
 */
function compileCrpSaleAd() {
    console.log("Compile CrpSaleAd Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpAdminTokenDb.sol': fs.readFileSync(src_dir + '/CrpAdminTokenDb.sol', 'utf-8'),
        'CrpFund.sol': fs.readFileSync(src_dir + '/CrpFund.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'CrpSaleAd.sol': fs.readFileSync(src_dir + '/CrpSaleAd.sol', 'utf-8'),
        'CrpToken.sol': fs.readFileSync(src_dir + '/CrpToken.sol', 'utf-8'),     
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8'),
        'ST20.sol': fs.readFileSync(src_dir + '/ST20.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpSaleAd.sol:CrpSaleAd'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpSaleAd.sol:CrpSaleAd'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpSaleAd.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpSaleAd.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpSaleMain 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpSaleMain() {
    console.log("Compile CrpSaleMain Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpFund.sol': fs.readFileSync(src_dir + '/CrpFund.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'CrpSaleMain.sol': fs.readFileSync(src_dir + '/CrpSaleMain.sol', 'utf-8'),
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpSaleMain.sol:CrpSaleMain'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpSaleMain.sol:CrpSaleMain'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpSaleMain.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpSaleMain.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpToken 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 파일로 저장한다.
 *
 * @return compilation status (true / false)
 * @author jhhong
 */
function compileCrpToken() {
    console.log("Compile CrpToken Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpAdminTokenDb.sol': fs.readFileSync(src_dir + '/CrpAdminTokenDb.sol', 'utf-8'),
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'CrpToken.sol': fs.readFileSync(src_dir + '/CrpToken.sol', 'utf-8'),     
        'SafeMath.sol': fs.readFileSync(src_dir + '/SafeMath.sol', 'utf-8'),
        'ST20.sol': fs.readFileSync(src_dir + '/ST20.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpToken.sol:CrpToken'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpToken.sol:CrpToken'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpToken.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpToken.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * CrpWhiteList 컨트랙트를 컴파일한다.
 * 컴파일 결과로 나온 abi와 bytecode를 file로 저장한다.
 *
 * @return compilation status (true / false)
 * @author sykang
 */
function compileCrpWhiteList() {
    console.log("Compile CrpWhiteList Contract...");
    let result = false;
    let src_dir = path.resolve(__dirname, '..', 'contracts'); // solidity file이 위치한 directory path
    let input_src = {
        'CrpInfc.sol': fs.readFileSync(src_dir + '/CrpInfc.sol', 'utf-8'),
        'CrpWhiteList.sol': fs.readFileSync(src_dir + '/CrpWhiteList.sol', 'utf-8')
    };
    let compiled_contract = solc.compile({sources: input_src}, 1); // solc를 이용한 source file 컴파일 (두번째 인자로 1을 넣으면 optimizer enable)
    let abi = compiled_contract.contracts['CrpWhiteList.sol:CrpWhiteList'].interface; // abi 추출
    let data = '0x' + compiled_contract.contracts['CrpWhiteList.sol:CrpWhiteList'].bytecode; // bytecode 추출
    let abi_path = path.resolve(__dirname, 'abi', 'CrpWhiteList.abi'); // abi를 저장할 file path
    let data_path = path.resolve(__dirname, 'data', 'CrpWhiteList.data'); // data를 저장할 file path
    try {
        fs.writeFileSync(abi_path, abi, 'utf-8');
        console.log("abi write: ............success!");
        fs.writeFileSync(data_path, data, 'utf-8');
        console.log("data write: ...........success!");
        result = true;
    } catch (err) {
        console.log(err);
    }
    return result;
}

/**
 * 화면을 클리어한다.
 * 
 * @author jhhong
 */
function ClearScreen() {
    console.clear();
    console.log(".");
    console.log(".");
    console.log(".");
} 

/**
 * 프로시져 수행 메인 함수이다. 알파벳 순서로 컴파일한다.
 * 
 * @author jhhong
 */
let RunProc = async () => {
    try {
        ClearScreen();
        await compileCrpAdminStaffDb();
        await compileCrpAdminTokenDb();
        await compileCrpFund();
        await compileCrpMain();
        await compileCrpPollAdSale();
        await compileCrpPollRefund();
        await compileCrpPollRoadmap();
        await compileCrpPollWithdraw();
        await compileCrpSaleAd();
        await compileCrpSaleMain();
        await compileCrpToken();
        await compileCrpWhiteList();
    } catch (err) {}
}
RunProc();
