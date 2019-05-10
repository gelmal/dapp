let provider = require("../api/provider.js"); // eth.accounts 얻어오기 위함
let act = require("../api/api_action.js");
let api_main = require("../api/api_main.js");

/**
 * Usage 출력 함수이다.
 * 
 * @author sykang
 */
function Usage() {
    console.log("Usage --> ");
    console.log("    node TestMainChangeStage.js [argv1] [argv2] [argv3] [argv4]");
    console.log("....argv1: Owner 계정 (Index)");
    console.log("....argv2: Owner 암호");
    console.log("....argv3: 메인 컨트랙트 주소");
    console.log("....argv4: 스테이지 값");
}

/**
 * 진행상황 출력 함수이다.
 * 
 * @param _result 성공 / 실패
 * @param _count 시도 횟수
 * @author jhhong
 */
function showProgress(_result, _count) {
    if(_result == true) {
        console.log("[" + _count + "]th trying...Success!");
    } else {
        console.log("[" + _count + "]th trying...Failed!");
    }
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
 * 프로시져 수행 메인 함수이다. 
 * 
 * @author sykang
 */
let RunProc = async () => {
    try {
        ClearScreen();
        if(process.argv.length != 6) {
            Usage();
            throw new Error("Invalid Argument!");
        }
        /* 파라메터 체크 */
        console.log('* Param01 (Owner Account Index):....' + process.argv[2]);
        console.log('* Param02 (Owner Password):.........' + process.argv[3]);
        console.log('* Param03 (CrpMain Address):........' + process.argv[4]);
        console.log('* Param04 (stage Value):.............' + process.argv[5]);
        const owner = provider.web3.eth.accounts[process.argv[2]]; // Voter account 주소
        const passwd = process.argv[3]; // Voter 비번
        const mainaddr = process.argv[4]; // 메인 컨트랙트 주소
        const value = process.argv[5]; // 투표 값
        console.log('Voter Account: [' + owner + ']');
        if(await act.tryActions(api_main.changeStage, showProgress, false, 5, true, owner, passwd, mainaddr, value) == false) {
            throw new Error("Failed! (changeStage)");
        }
        let mainobj = await api_main.getObject(mainaddr);
        let stage = mainobj.stage();
        console.log("### 메인 스테이지 ==> ", stage);        
    } catch(err) {
        console.log(err);
    }
}
RunProc();