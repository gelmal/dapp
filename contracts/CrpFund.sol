pragma solidity ^ 0.4 .24;

import "./SafeMath.sol";
import "./CrpInfc.sol";

/// @title the crpfund contract (version 0.1)
/// @author sykang
contract CrpFund is CrpInfc {
    using SafeMath
    for uint256;

    struct FundList { //잔고를 나타내는 변수를 묶어논 구조체이다
        uint256 total_fund; // 입금된 절대 수량의 Crp
        uint256 current_fund; // 출금가능한 crp의 양
        uint256 soft_fund; // 출금 가능한 소프트 펕드  양
        uint256 hard_fund; // 출금 가능한 하드 펀드 양
    }

    // public variables    
    address public owner; // 생성자 오너 주소    
    address public main_contract; // 메인 컨트렉트 주소
    FundList public fund_list; // 구조체 객체
    mapping(address => bool) public admins; // 컨트렉트 관리자 명부

    // private variables
    string constant contract_type = "FUND"; //컨트렉트 타입

    //modifier
    modifier isOwner(address _address) { // 토큰 Owner인지 검사 (관리자 권한부여, 게런티 설정/정산)
        require(_address == owner, "Not Owner!");
        _;
    }
    modifier isAdmin(address _address) { // 관리자 권한이 있는지 검사 (발행)
        require((_address == owner) || (admins[_address]), "Not Admin!");
        _;
    }   
    
    //event
    event Deposit(uint256 _amount); // 입금시 알림
    event Transfer(address _address, uint256 _amount); // 출금시 알림
    event AdminAdded(address _addr); // 이벤트 로그: 관리자 권한 계정 추가
    event AdminDeleted(address _addr); // 이벤트 로그: 관리자 권한 계정 제거

    /// @author sykang
    /// @notice the constructor crp fund contract
    /// @param _main mian contract
    constructor(address _main) public {
        main_contract = _main;
        owner = msg.sender; // 생성자 주소 저장
        fund_list.total_fund = fund_list.current_fund = fund_list.hard_fund = fund_list.soft_fund = 0;
    }

    /// @author sykang
    /// @notice interface, return contract type
    /// @return const variable of contract_type
    function getContractType()
    public view
    returns(string) {
        return contract_type;
    }

    /// @author jhhong
    /// @notice 관리자 리스트에 "_admin"을 추가한다.
    /// @param _admin 관리자 권한을 받을 account
    function addAdmin(address _admin) external 
    isOwner(msg.sender) {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    /// @author jhhong
    /// @notice 관리자 리스트에서 "_admin"을 제거한다.
    /// @param _admin 관리자 권한을 박탈할 account
    function deleteAdmin(address _admin) external
    isOwner(msg.sender) {
        admins[_admin] = false;
        emit AdminDeleted(_admin);
    }

    /// @author sykang
    /// @notice The function that is called when crowdsale contract sends Crp to the contract address
    /// @dev proceed below steps
    function receiveCrp()
    external payable {
        fund_list.total_fund = fund_list.total_fund.add(msg.value); // 절대량에 입금량 기록
        fund_list.current_fund = fund_list.current_fund.add(msg.value); // 출금가능 양에도 기록
        emit Deposit(msg.value); // 알림 
    }

    /// @author sykang
    /// @notice withdraw adrres _to, amount Crp
    /// @param _to transfer to adrress_to
    /// @param _amount transfer _amount
    /// @param _type transfer type
    function withdraw(address _to, uint256 _amount, uint256 _type)
    isAdmin(msg.sender)
    payable external {
        require(fund_list.current_fund >= _amount);

        if (_type == 0) { //soft
            require(fund_list.soft_fund >= _amount);
            fund_list.soft_fund = fund_list.soft_fund.sub(_amount);
        } else if (_type == 1) { // hard
            require(fund_list.hard_fund >= _amount);
            fund_list.hard_fund = fund_list.hard_fund.sub(_amount);
        }
        fund_list.current_fund = fund_list.current_fund.sub(_amount);
        _to.transfer(_amount);
        if(fund_list.current_fund == 0){
            fund_list.soft_fund = fund_list.hard_fund = 0;
        }
        emit Transfer(_to, _amount);
    }

    /// @author sykang
    /// @notice set available withdraw Crp by _amount
    /// @param _amount hardcap amount
    function setAvaileHard(uint256 _amount)
    isAdmin(msg.sender)
    external {
        fund_list.hard_fund = fund_list.hard_fund.add(_amount);
        if (fund_list.soft_fund == 0) { // 추가 크라우드 세일 발생 시 하드캡 양만 늘리기 위해서        
            fund_list.soft_fund = fund_list.total_fund.sub(fund_list.hard_fund);
        }
    }
}