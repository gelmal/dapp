pragma solidity ^ 0.4 .24;

import "./SafeMath.sol";
import "./CrpInfc.sol";
import "./CrpFund.sol";

/// @title the CRPSaleMain contract (version 0.1)
/// @author jhhong & sykang
contract CrpSaleMain is CrpInfc {
    using SafeMath
    for uint256;

    // struct: 계정 별 토큰 구매 목록 관리
    struct BuyerInfo {
        bool exist; // 구매 여부
        address account; // 계정
        uint256 amount; // 송금한 CRP 양
        uint256 balance; // 교환된 토큰 양액
        address prev; // 전 구매자
        address next; // 후 구매자
    }

    // struct : 세일 정보 관리
    struct SaleInfo {
        uint256 sale_started; //세일 시작시간
        uint256 sale_ended; // 세일 종료시간 
        uint256 softcap; // 소프트캡 금액
        uint256 hardcap; // 하드캡 금액 
        uint256 found_rate; // 크라우드세일 교환 비율
        uint256 crp_max; // 1계좌당 보낼수 있는 최대 갯수
        uint256 crp_min; // 전송가능한 최소 CRP 갯수        
        uint256 default_ratio; //기본 교환 비율
        uint256 init_amount; // 초기 인출액
    }

    // public variableuin 
    uint256 public total_CRP; // 총 모금된 CRP
    uint256 public total_staff_CRP; // 스탭 할당 CRP
    uint256 public ceiling; // 총 판매 이더
    uint256 public availe_hard; // 판매된 하드캡 양

    uint256 public chain_count; // 체일 체인 목록번호     
    address public chain_head; // 세일 체인 머리
    address public chain_last; // 세일 체인 꼬리

    address public owner; // 오너 계좌
    address public main_address; // 메인 컨트렉트 주소
    CrpFund public fund_contract; // fund contract 주소
    
    SaleInfo public sale_info; // 세일 정보 관리 구조체 객체

    // private variable
    mapping(address => BuyerInfo) public sales; // 계정 별 세일 정보 관리
    string constant contract_type = "SALEMAIN"; // 컨트렉트 타입

    // events
    event SaleStarted(uint256 _ceiling, uint256 _duration); // 세일 시작 이벤트 (v2)
    event SaleEnded(uint256 _ceiling, uint256 _elapsed); // 세일 만료 이벤트 (v2)
    event SaleHalted(uint256 _elapsed); // 세일 종료 이벤트 (v2)
    event FundSaled(address _purchaser, uint256 _amount, uint256 _rests, uint256 _elapsed, uint256 _ratio); // 펀드 전송 완료 이벤트
    event BuyCrp(address _buyer, uint256 _send_amount, uint256 _confirm, uint256 _exchange, uint256 _refund); // 세일 구매시 잔돈 환불 이벤트(v2)

    //modifier
    modifier isValidPayload() { // 지불 가능한지
        require(sale_info.crp_max == 0 || msg.value < sale_info.crp_max + 1);
        require(sale_info.crp_min == 0 || msg.value > sale_info.crp_min - 1);
        _;
    }
    modifier isProjectOwner(address _address) { // 토큰 owner인지 검사
        require(_address == owner);
        _;
    }

    /// @author sykang
    /// @notice the contructor of crpCrowdSale    
    /// @param _start_sale the start time crowdsale
    /// @param _end_sale the end time crowdsale
    /// @param _softcap Minimum amount of progress
    /// @param _hardcap maxmum amount of progress
    /// @param _found_rate fund rasing rate
    /// @param _max Maximum transferable amount per wallet
    /// @param _min minimum transferable amount per wallet
    /// @param _ratio token exchange rate
    /// @param _init init fund
    /// @param _main CrpMainContract
    constructor
        (uint256 _start_sale, uint256 _end_sale, uint256 _softcap, uint256 _hardcap, uint256 _found_rate, uint256 _max, uint256 _min, uint256 _ratio, uint256 _init, address _main, address _fund)
    public {
        sale_info.sale_started = _start_sale;
        sale_info.sale_ended = _end_sale;
        sale_info.softcap = _softcap;
        sale_info.hardcap = ceiling = _hardcap;
        sale_info.found_rate = _found_rate;
        sale_info.crp_max = _max;
        sale_info.crp_min = _min;
        sale_info.default_ratio = _ratio;
        sale_info.init_amount = _init;
        main_address = _main;
        fund_contract = CrpFund(_fund);
        chain_count = 0;
        owner = msg.sender;
    }

    /// @author sykang
    /// @notice interface, return contract type
    /// @return const variable of contract_type
    function getContractType()
    public view
    returns(string) {
        return contract_type;
    }

    /// @author sykang
    /// @notice The fallback function that is called when account sends ether to the contract address
    function buyToken()
    isValidPayload() // 수취 금액 검증
    payable external {       
        //require(sale_info.sale_started < now && sale_info.sale_ended > now);
        require(ceiling > 0); // 남은 금액

        uint256 refund = 0; // 환불금액
        uint256 exchanges = 1; //교환비율
        uint256 amount = msg.value; //입금금액

        if (amount > ceiling) {
            refund = amount.sub(ceiling);
            amount = ceiling;
        } //남은 토큰 양이 입금 양 보다 적을 경우

        total_CRP = total_CRP.add(amount); // 총 판매 CRP
        exchanges = amount.mul(sale_info.default_ratio); //총 판매 토큰, CRP * RATIO
        ceiling = ceiling.sub(amount); // 남은 판매 토큰 재고

        updateSaleInfo(msg.sender, amount, exchanges); // 정보 업데이트

        if (refund > 0) {
            msg.sender.transfer(refund);
        }
        emit BuyCrp(msg.sender, msg.value, amount, exchanges, refund);
    }

    /// @author jhhong, sykang
    /// @notice update variable "sales"
    /// @dev if "_sender" purchase first, crowdsale lock "_sender" not to transfer tokens
    /// v2: delete "token_obj.setAddressLock()", and add "buyer.push()"
    /// @param _sender the account address who send ethereum for purchasing tokens
    /// @param _amount the amount of ethereum for "_sender" to send
    /// @param _exchanges the amount of tokens for "_sender" to be received
    function updateSaleInfo(address _sender, uint256 _amount, uint256 _exchanges)
    private {
        require(_sender != 0);

        BuyerInfo storage crowd_data = sales[_sender];

        if (crowd_data.exist == true) {
            require(crowd_data.account == _sender);
            crowd_data.amount = crowd_data.amount.add(_amount);
            crowd_data.balance = crowd_data.balance.add(_exchanges);
        } else {
            if (chain_count == 0) {
                chain_head = chain_last = _sender;
            }
            crowd_data.exist = true;
            crowd_data.account = _sender;
            crowd_data.amount = _amount;
            crowd_data.balance = _exchanges;
            sales[chain_last].next = _sender;
            sales[_sender].prev = chain_last;
            chain_last = _sender;
            chain_count = chain_count.add(1);
        }
        sales[_sender] = crowd_data;
    }

    /// @author sykang
    /// @notice terminate the crowdsale
    /// @dev call only crowdsale owner
    function saleHalt()
    isProjectOwner(msg.sender)
    external {
        //require(sale_ended<now);

        if (total_CRP < sale_info.softcap) { // 환불 기능
            total_staff_CRP = 0;
        } else { /// 토큰 생성 기능
            availe_hard = total_CRP.sub(sale_info.softcap);
            ceiling = 0; // 판매금액 재 선언
            total_staff_CRP = ((sale_info.softcap.mul(sale_info.default_ratio)).mul(sale_info.found_rate)).div(100);
        }
    }

    ///@author sykang
    ///@notice withdraw to fund contract
    function TransferFund()
    isProjectOwner(msg.sender)
    payable external {
        fund_contract.receiveCrp.value(address(this).balance)();
    }

    /// @author sykang
    /// @notice refund crowdfund and return next buyer address
    /// @return return address of next buyer
    function refund(address _addr)
    isProjectOwner(msg.sender)
    external {
        _addr.transfer(sales[_addr].amount);
    }
}
