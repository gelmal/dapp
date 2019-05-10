pragma solidity ^ 0.4 .24;

import "./SafeMath.sol";
import "./CrpAdminStaffDb.sol";
import "./CrpFund.sol";
import "./CrpInfc.sol";
import "./CrpPollAdSale.sol";
import "./CrpPollRefund.sol";
import "./CrpPollRoadmap.sol";
import "./CrpPollWithdraw.sol";
import "./CrpSaleMain.sol";
import "./CrpSaleAd.sol";
import "./CrpToken.sol";
import "./CrpWhiteList.sol";

/// @title the CrpMain contract (version 0.1)
/// @author sykang
contract CrpMain is CrpInfc {
    using SafeMath for uint256;

    // enum : mainStage의 상태 표현
    enum MAINSTAGE {
        INIT, // 생성 단계
        READY, // Staff-Poll 성공 단계
        SAILING, // 1차 크라우드세일 시작 단계
        PROCEEDING, // 프로젝트 제작 착수 단계
        FAILED, // 실패 단계
        COMPLETED // 프로젝트 제작 완료 단계
    }

    //struct : 토큰 정보
    struct TokenInfo {
        string name; //토큰 이름
        string symbol; //토큰 심볼
        uint256 sto; // ST20 사용 여부
    }

    //struct : 크라우드세일 정보
    struct CrowdSaleInfo {
        uint256 start; // 시작시각
        uint256 end; // 종료시각
        uint256 softcap; // 최소금액
        uint256 hardcap; // 최대금액
        uint256 found_rate; // 추가 발행 비율
        uint256 crp_max; // 지갑당 최대 투자 금액
        uint256 crp_min; // 지갑당 최소 투자금액
        uint256 default_ratio; // 토큰교환 비율
        uint256 init_amount; // 초기 인출액
    }

    //struct : 로드맵별 정보 관리
    struct RoadmapInfo {
        uint256 start; //로드맵 투표 시작 시간
        uint256 end; // 로드맵 투표 종료 시간
        uint256 amount; // 전송할 Crp양
    }

    //struct : 추가 인출 정보 관리
    struct AdWithdrawInfo {
        uint256 start; //추가 인출 투표 시작 시간
        uint256 end; // 추가 인출 투표 종료 시간
        uint256 amount; // 추가 인출 금액
    }

    //struct : 스탭 정보 관리
    struct StaffInfo {
        address prev; // 전 스탭 주소
        address next; // 후 스탭 주소
        uint256 time; // 투표 시간
        uint256 amount; // 보유량
        bool agree; // 투표 결과 (찬성/반대)
    }

    //struct : 스탭 리스트 정보 관리
    struct StaffList {
        address head; // 스태프 체인 머리
        address tail; // 스태프 체인 꼬리
        uint256 num; // 스탭 총 인원
        uint256 result; // 투표 개표용 0이되면 가결, !0이면 부결
        uint256 start; //투표 시작시간
        uint256 end; // 투표 종료시간
        uint256 total_amount; // 지분율의 합, 100이 충족되어야 함
        mapping(address => StaffInfo) map; // 스탭정보 관리 맵핑
    }

    //public variables
    address public token_addr; // 토큰 컨트렉트 주소
    address public fund_addr; // 펀드 컨트렉트 주소
    address public white_addr; // 화이트 리스트 컨트렉트 주소
    address[] public crowd_addrs; // 크라우드세일 컨트렉트 주소 (배열)
    address[] public crowd_poll_addrs; //크라우드세일 투표 컨트렉트 주소(배열)
    address[] public roadmap_addrs; // 로드맵-poll 컨트렉트 주소 (배열)
    address[] public withdraw_addrs; // 추가인출 투표 컨트렉트 주소(배열)
    address[] public refund_addrs; // 리펀드 투표 컨트렉트 주소(배열)

    string public title; // 프로젝트 이름 (parameters of constructor)
    address public owner; // 프로듀서(생성자) 주소
    MAINSTAGE public stage; // main 컨트렉트 현재 상태
    StaffList public staff_list; // Staff 리스트 구조체 객체
    TokenInfo public token_param; // 토큰 컨트렉트 생성을 위한 데이터 구조체 객체
    CrowdSaleInfo public sale_param; // 1차 크라우드세일 컨트렉트 생성을 위한 데이터 구조체 객체
    RoadmapInfo[] public roadmap_param; // 로드맵-poll 컨트렉트 생성을 위한 데이터 구조체 객체 배열
    AdWithdrawInfo[] public withdraw_param; // 추가 인출 컨트렉트 생성을 위한 데이터  구조체 객체 배열

    CrpAdminStaffDb public staffdb; // user별 보유 토큰 컨트랙트 관리를 위한 컨트랙트 오브젝트

    // private variables
    string constant contract_type = "MAIN"; //컨트렉트 타입을 나타내는 변수

    //event
    event ChangeStage(MAINSTAGE _stage); // enum 변경시 이벤트 발생

    // modifier
    modifier isProjectOwner(address _address) { // 토큰 owner인지 검사
        require(_address == owner);
        _;
    }
    modifier isStaff(address _addr) { // 스탭인지 검사
        require(staff_list.map[_addr].amount != 0 || _addr == owner);
        _;
    }
    modifier isStateInit() { // init 상태인지 검사
        require(stage == MAINSTAGE.INIT);
        _;
    }
    modifier isStateReady() { // ready 상태인지 검사
        require(stage == MAINSTAGE.READY);
        _;
    }

    /// @author sykang
    /// @notice CrpMain 컨트랙트 생성자
    /// @param _title 프로젝트 이름
    /// @param _staffdbca staffdb 컨트랙트 주소
    constructor(string _title, address _staffdbca)
    public {
        title = _title;
        owner = msg.sender;
        stage = MAINSTAGE.INIT;
        staff_list.start = now;
        staff_list.end = now + 600; // for test (10분)
        staffdb = CrpAdminStaffDb(_staffdbca);
    }

    /// @author sykang
    /// @notice interface, return contract type
    /// @return const variable of contract_type    
    function getContractType()
    public view
    returns(string) {
        return contract_type;
    }

    // staff
    /// @author sykang
    /// @notice set Staff information
    /// @param _addr staff address
    /// @param _amount amount of additon staff token
    function setStaffInfo(address _addr, uint256 _amount)
    isProjectOwner(msg.sender)
    isStateInit()
    external {
        if (staff_list.head == address(0)) {
            staff_list.head = staff_list.tail = _addr;
            staff_list.num = staff_list.num.add(1);
            staff_list.result = staff_list.result.add(1);
            staff_list.total_amount = _amount;
            staffdb.addList(_addr, address(this));
        } else {
            if (staff_list.map[_addr].amount == 0) {
                staff_list.map[staff_list.tail].next = _addr;
                staff_list.map[_addr].prev = staff_list.tail;
                staff_list.tail = _addr;
                staff_list.num = staff_list.num.add(1);
                staff_list.result = staff_list.result.add(1);
                staff_list.total_amount = staff_list.total_amount.add(_amount);
                staffdb.addList(_addr, address(this));
            }
        }
        staff_list.map[_addr].amount = _amount;
    }

    /// @author sykang
    /// @notice get staff information
    /// @param _addr staff address
    /// @return haved amount of token, & poll ballot
    function getStaffInfo(address _addr)
    public view
    returns(address, address, uint256, uint256, bool) {
        return (staff_list.map[_addr].prev, staff_list.map[_addr].next, staff_list.map[_addr].time, staff_list.map[_addr].amount, staff_list.map[_addr].agree);
    }

    /// @author sykang
    /// @notice poll staff of regist staffInfo
    /// @param _vote vote
    function runPollStaff(uint256 _vote)
    isStaff(msg.sender)
    isStateInit()
    external {
        //require(now > staff_list.start && now < staff_list.end); 
        require(staff_list.map[msg.sender].time == 0);
        staff_list.map[msg.sender].time = now;
        if (_vote == 0) {
            staff_list.map[msg.sender].agree = false;
        } else if (_vote == 1) {
            staff_list.map[msg.sender].agree = true;
        }
        if (_vote == 1) {
            staff_list.result = staff_list.result.sub(1);
        }
    }

    /// @author sykang
    /// @notice cancel poll
    function cancelPollStaff()
    isStaff(msg.sender)
    isStateInit()
    external {
        //require(now > staff_list.start && now < staff_list.end);
        if (staff_list.map[msg.sender].agree) {
            staff_list.result = staff_list.result.add(1);
        }
        staff_list.map[msg.sender].time = 0;
    }

    /// @author sykang
    /// @notice end polling and settle polling
    function haltPollStaff()
    isProjectOwner(msg.sender)
    isStateInit()
    external {
        //require(now > staff_list.end);
        if (staff_list.total_amount == 100) {
            if (staff_list.result == 0) {
                changeStage(1);
            } else {
                changeStage(4);
            }
        } else {
            changeStage(4);
        }
    }

    /// stage
    /// @author sykang
    /// @notice convert current state of crpMain
    /// @param _num set enum by _num
    function changeStage(uint256 _num)
    isProjectOwner(msg.sender)
    public {
        MAINSTAGE temp;
        if (_num == 0) {
            temp = MAINSTAGE.INIT;
        } else if (_num == 1) {
            temp = MAINSTAGE.READY;
        } else if (_num == 2) {
            temp = MAINSTAGE.SAILING;
        } else if (_num == 3) {
            temp = MAINSTAGE.PROCEEDING;
        } else if (_num == 4) {
            temp = MAINSTAGE.FAILED;
        } else if (_num == 5) {
            temp = MAINSTAGE.COMPLETED;
        }
        if(temp != stage) {
            stage = temp;
            if(temp == MAINSTAGE.FAILED) {
                // 종료 절차 수행
                for(address elmt = staff_list.head; elmt != address(0); elmt = staff_list.map[elmt].next) {
                    staffdb.deleteList(elmt, this);
                }
            }
            emit ChangeStage(stage);
        }
    }

    /// white paper  
    /// @author sykang
    /// @notice set white list contract address
    /// @param _addr white list contract address
    function setWhiteListAddress(address _addr)
    isProjectOwner(msg.sender)
    isStateInit()
    external {
        white_addr = _addr;
    }

    /// @author sykang
    /// @notice get white list contract address
    function getWhiteListAddress()
    public view returns(address) {
        return white_addr;
    }

    /// token function   
    /// @author sykang
    /// @notice set token params
    /// @param _name token name
    /// @param _symbol token symbol
    /// @param _sto ST20 사용 여부 플래그 변수
    function setTokenParams(string _name, string _symbol, uint256 _sto) external
    isProjectOwner(msg.sender)
    isStateInit() {
        token_param.name = _name;
        token_param.symbol = _symbol;
        token_param.sto = _sto;
    }

    /// @author sykang
    /// @notice set token contract address
    /// @param _addr regist this address
    function setTokenAddress(address _addr)
    isProjectOwner(msg.sender)
    isStateReady()
    external {
        token_addr = _addr;
    }

    /// fund function
    /// @author sykang
    /// @notice set CrpFund Contract address
    /// @dev set Crpfund contract address by _addr
    function setFundAddress(address _addr)
    isProjectOwner(msg.sender)
    isStateReady()
    external {
        fund_addr = _addr;
    }

    //crowdsale_function
    /// @author sykang
    /// @notice set SaleMain Contract params
    /// @param _start crowdsale start time
    /// @param _end crowdsale end time
    /// @param _softcap minimum fund for start this project
    /// @param _hardcap maximum fund for start this project
    /// @param _found_rate crowFunding rate of whole
    /// @param _crp_max maximum fund of transfer one account
    /// @param _crp_min minimum fund of transfer one account
    /// @param _default_ratio chage rate to token by transfered crp
    /// @param _init_amount withdraw initial amount to transfer stapps
    function setMainSaleParams(uint256 _start, uint256 _end, uint256 _softcap,
        uint256 _hardcap, uint256 _found_rate, uint256 _crp_max, uint256 _crp_min, uint256 _default_ratio, uint256 _init_amount)
    isProjectOwner(msg.sender)
    isStateInit()
    external {
        sale_param.start = _start;
        sale_param.end = _end;
        sale_param.softcap = _softcap;
        sale_param.hardcap = _hardcap;
        sale_param.found_rate = _found_rate;
        sale_param.crp_max = _crp_max;
        sale_param.crp_min = _crp_min;
        sale_param.default_ratio = _default_ratio;
        sale_param.init_amount = _init_amount;
    }

    /// @author sykang
    /// @notice set CrowdSaleContract
    /// @dev store crowdSaleContract address in array
    /// @param _addr the crowdslae contract
    function addCrowdSaleAddress(address _addr)
    isProjectOwner(msg.sender)
    external {
        crowd_addrs.push(_addr);
    }

    /// @author sykang
    /// @notice set poll addcrowdsale
    /// @dev store poll addcrowdsale contract address in array
    /// @param _addr the crowdslae contract
    function addPollCrowdSaleAddress(address _addr)
    isProjectOwner(msg.sender)
    external {
        crowd_poll_addrs.push(_addr);
    }

    /// @author sykang
    /// @notice add the generated roadmap-poll contact address. 
    /// @dev call object in array
    function addRoadmapPollAddress(address _addr)
    isProjectOwner(msg.sender)
    external {
        roadmap_addrs.push(_addr);
    }

    /// @author sykang
    /// @notice set RoadMap plan by parameter
    /// @dev abstract function definition
    /// @param _start RoadMap poll start time
    /// @param _end RoadMap poll end times
    /// @param _amount pending amount Crp
    function addRoadmapPollParams(uint256 _start, uint256 _end, uint256 _amount)
    isProjectOwner(msg.sender)
    external {
        roadmap_param.push(RoadmapInfo(_start, _end, _amount));
    }

    /// @author sykang
    /// @notice add the generated withdraw poll contact address. 
    /// @dev call object in array
    function addWithdrawPollAddress(address _addr)
    isProjectOwner(msg.sender)
    external {
        withdraw_addrs.push(_addr);
    }

    /// @author sykang
    /// @notice set withdraw params by parameter
    /// @dev abstract function definition
    /// @param _start withdraw poll start time
    /// @param _end withdraw poll end times
    /// @param _amount pending amount Crp
    function addWithdrawpPollParams(uint256 _start, uint256 _end, uint256 _amount)
    isProjectOwner(msg.sender)
    external {
        withdraw_param.push(AdWithdrawInfo(_start, _end, _amount));
    }

    /// @author sykang
    /// @notice add the generated refund poll contact address. 
    /// @dev call object in array
    function addRefundPollAddress(address _addr)
    external {
        refund_addrs.push(_addr);
    }

    // getter_functuin_list

    /// @author sykang
    /// @notice get sale contract number
    function getSaleContractNum()
    external view
    returns(uint256) {
        return crowd_addrs.length;
    }

    /// @author sykang
    /// @notice get poll_sale contract number
    function getPollSaleContractNum()
    external view
    returns(uint256) {
        return crowd_poll_addrs.length;
    }

    /// @author sykang
    /// @notice get Roadmap contract number
    function getRoadmapContractNum()
    external view
    returns(uint256) {
        return roadmap_addrs.length;
    }

    /// @author sykang
    /// @notice get poll_withdraw number
    function getWithdrawContractNum()
    external view
    returns(uint256) {
        return withdraw_addrs.length;
    }

    /// @author sykang
    /// @notice get poll_refund number
    function getRefundContractNum()
    external view
    returns(uint256) {
        return refund_addrs.length;
    }

    /// @author sykang
    /// @notice get poll_roadmap param number
    function getRoadmapParamsNum()
    external view
    returns(uint256) {
        return roadmap_param.length;
    }
}