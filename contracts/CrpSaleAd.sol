pragma solidity ^ 0.4 .24;

import "./SafeMath.sol";
import "./CrpInfc.sol";
import "./CrpFund.sol";
import "./CrpToken.sol";

/// @title the CRP crowdsale contract (version 0.1)
/// @author jhhong & sykang
contract CrpSaleAd is CrpInfc {
    using SafeMath
    for uint256;

    // struct: 계정 별 토큰 구매 목록 관리
    struct BuyerInfo {
        bool exist; // 구매 여부
        address account; // 계정
        uint256 amount; // 송금한 이더리움 양
        uint256 balance; // 교환된 토큰 양액 
        address prev; // 전 구매자
        address next; // 후 구매자      
    }

    struct SaleInfo {
        uint256 sale_started; //세일 시작시간
        uint256 sale_ended; // 세일 종료시간 
        uint256 mid_time; // 프리미엄 기간 
        uint256 hardcap; // 하드캡 금액        
        uint256 crp_max; // 1계좌당 보낼수 있는 최대 갯수
        uint256 crp_min; // 전송가능한 최소 이더리움 갯수
        uint256 default_ratio; //기본 교환 비율   
    }

    // public variableuin  
    uint256 public total_CRP; // 총 모금된 CRP
    uint256 public ceiling; // 총 판매 이더
    address public owner; // 오너 계좌
    address public main_address; // 메인컨트렉트 주소

    uint256 public chain_count; // 체일 체인 목록번호     
    address public chain_head; // 세일 체인 머리
    address public chain_last; // 세일 체인 꼬리

    CrpToken public token_contract; // 토큰 컨트렉트 객체
    CrpFund public fund_contract; // 펀드 컨트렉트 객체
    SaleInfo public sale_info; // 세일 정보

    // private variable
    string constant contract_type = "SALEMAIN";

    //maping    
    mapping(address => BuyerInfo) public sales; // 계정 별 세일 정보 관리

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
    /// @param _hardcap maxmum amount of progress
    /// @param _max Maximum transferable amount per wallet
    /// @param _min minimum transferable amount per wallet
    /// @param _ratio token exchange rate
    /// @param _main CrpMainContract
    /// @param _fund CrpFundContract
    constructor
        (uint256 _start_sale, uint256 _end_sale, uint256 _mid_time, uint256 _min, uint256 _max, uint256 _hardcap, uint256 _ratio, address _main, address _token, address _fund)
    public {
        sale_info.sale_started = _start_sale;
        sale_info.sale_ended = _end_sale;
        sale_info.mid_time = _mid_time;
        sale_info.hardcap = ceiling = _hardcap;
        sale_info.crp_min = _min;
        sale_info.crp_max = _max;
        sale_info.default_ratio = _ratio;
        main_address = _main;
        token_contract = CrpToken(_token);
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

        uint8 issue_type = 0;
        if(sale_info.sale_started < now && sale_info.mid_time > now){
            issue_type = 1;
        }        

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

        token_contract.issue(msg.sender, exchanges, issue_type, 0); // 발행 테스트

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
            if(chain_count ==0) {
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
        fund_contract.setAvaileHard(address(this).balance); 
        fund_contract.receiveCrp.value(address(this).balance)();               
    }
}