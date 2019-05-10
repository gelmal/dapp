pragma solidity ^ 0.4 .24;

import "./ST20.sol";
import "./SafeMath.sol";
import "./CrpInfc.sol";
import "./CrpAdminTokenDb.sol";

/// @title 컨트랙트 코드 작성: CRP TOKEN
/// @author jhhong & sykang
contract CrpToken is ST20, CrpInfc {
    using SafeMath for uint256;

    // 구조체 : 사용자의 밸런스 정보
    struct BalanceInfo {
        address prev; // 현 노드의 전 노드
        address next; // 현 노드의 다음 노드
        uint256 active; // 현 노드의 가용한 밸런스
        uint256 pending; // 현 노드의 묶여있는 밸런스
        uint256 guarantee; // 현 노드의 게런티 (프로젝트 스탭 전용)
        uint256 immature; // 덜 성숙한 밸런스 (추가 크라우드세일을 통해 구매한 토큰은 세일 종료될 때까지 사용할 수 없다)
        uint256 pendtime; // 묶여있는 밸런스가 풀리는 시각 (epoch time)
    }
    // 구조체 : balance list
    struct BalanceList {
        uint256 count; // 리스트 노드의 총 개수
        address head; // 체인의 머리
        address tail; // 체인의 꼬리
        mapping(address => BalanceInfo) map; // balance 정보 관리 매핑
    }
    // 변수 선언 (public)
    string public name; // 토큰 이름
    string public symbol; // 토큰 심볼
    uint256 public decimals; // 소수점 자리수
    address public owner; // 토큰 owner 주소
    address public main_contract; // 메인컨트렉트 주소
    BalanceList public holder; // balance 리스트
    string constant public contract_type = "Token";
    bool public enable; // 토큰 활성화 여부 플래그 변수
    bool public whitelist; // 화이트리스트 존재 여부 플래그 변수
    uint256 public supply; // 토큰 총 발행량
    address public master; // CRP 마스터 주소
    CrpAdminTokenDb public tokendb; // user별 보유 토큰 컨트랙트 관리를 위한 컨트랙트 오브젝트
    mapping(address => bool) public locks; // 계정 별 lock 여부를 매핑한 변수
    mapping(address => bool) public admins; // 계정 별 관리자 권한 획득 여부를 매핑한 변수
    mapping(address => mapping(address => uint256)) public approvals; // 각 계정에 대해, 계정 별 허용 위임금액을 매핑한 변수
    // 이벤트
    event TokenCreated(); // 이벤트 로그: 토큰 생성되었음 --> 생성자에서 호출 (이걸 해야 eth.searchContractList()가 정상동작함)
    event Enabled(); // 이벤트 로그: 토큰 활성화
    event Disabled(); // 이벤트 로그: 토큰 비활성화
    event TransferFrom(address _from, address _to, uint _value); // 이벤트 로그: 위임 전송
    event Burned(uint _amount); // 이벤트 로그: 토큰 소각
    event AdminAdded(address _addr); // 이벤트 로그: 관리자 권한 계정 추가
    event AdminDeleted(address _addr); // 이벤트 로그: 관리자 권한 계정 제거
    event AddrLocked(address _addr); // 이벤트 로그: 계정 락 설정
    event AddrUnlocked(address _addr); // 이벤트 로그: 계정 락 해제
    event Issue(address _who, uint256 _amount, uint256 _supply); // 이벤트 로그 : 토큰 생성
    event Mature(address _who, uint256 _immature, uint256 _total); // 이벤트 로그 : Immature 토큰 Active로 전환
    event SetGuarantee(address _who, uint256 _guarantee); // 이벤트 로그: 스탭들에게 게런티 설정
    event SettleGuarantee(address _who, uint256 _guarantee, uint256 _active); // 이벤트 로그: 게런티 정산
    event Pend(address _who, uint256 _ratio, uint256 _locktime); // 이벤트 로그 : 토큰 팬딩
    event Activate(address _who, uint256 _pending, uint256 _total); // 이벤트 로그 : 토큰 활성화
    event Returned(address _who, uint256 _active, uint256 _pending, uint256 _guarantee); // 이벤트 로그: 토큰 환수
    // Modifier
    modifier isMaster(address _address) { // CRP 마스터인지 검사 (환수)
        require(_address == master, "Not Master!");
        _;
    }
    modifier isOwner(address _address) { // 토큰 Owner인지 검사 (관리자 권한부여, 게런티 설정/정산)
        require(_address == owner, "Not Owner!");
        _;
    }
    modifier isAdmin(address _address) { // 관리자 권한이 있는지 검사 (발행)
        require((_address == owner) || (_address == master) || (admins[_address]), "Not Admin!");
        _;
    }
    modifier isConstrainer(address _address) { // 제재를 가할 권한이 있는지 검사 (토큰 활성화/비활성화, 계정 락, 소각, 팬드)
        require((_address == master) || (_address == owner), "Not Constrainer!");
        _;
    }
    modifier isTokenTransfer(address _address) { // 토큰을 전송할 권한이 있는지 검사
        require((_address == owner) || (_address == master) || (admins[_address]) || (enable && !locks[_address]), "Not Able Transfer!");
        _;
    }
    modifier isPendable(address _address) { // 해당 주소가 팬딩 가능한 상태인지 검사
        require((enable == false) || (locks[_address] == true), "Not Pendable!");
        _;
    }

    /// @author jhhong
    /// @notice 토큰 컨트랙트 생성자
    /// @param _name 토큰 이름 (string)
    /// @param _symbol 토큰 심볼 (string)
    /// @param _type 토큰 타입 (ST20(1) / ERC20(1이 아닌 값): uint256)
    /// @param _main 메인 컨트랙트 주소
    /// @param _tokendbca user stat 컨트랙트 주소
    constructor(string _name, string _symbol, uint256 _type, address _main, address _tokendbca) public {
        require(_main != address(0), "Invalid Main CA!");
        require(_tokendbca != address(0), "Invalid TokenDB CA!");
        name = _name;
        symbol = _symbol;
        whitelist = (_type == 1)? (true) : (false);
        main_contract = _main;
        decimals = 18;
        supply = 0;
        owner = msg.sender;
        holder.count = 0;
        holder.head = 0;
        holder.tail = 0;
        enable = true;
        tokendb = CrpAdminTokenDb(_tokendbca);
        master = address(0x6f090f6cb125f77396d4b8f52fdabf7d5c1b53d4);
        emit TokenCreated();
    }

    /// @author jhhong
    /// @notice 토큰 활성화 여부 플래그를 반환한다.
    /// @return 토큰 활성화 여부
    function getTokenEnable() public view returns(bool) {
        return enable;
    }

    /// @author sykang
    /// @notice 컨트랙트 타입을 반환한다.
    /// @return 컨트랙트 타입 (string)
    function getContractType() public view returns(string) {
        return contract_type;
    }

    /// @author jhhong
    /// @notice 토큰의 발행된 총 통화량을 반환한다.
    /// @dev ST20의 추상함수이다.
    /// @return 총 통화량 (uint256)
    function totalSupply() public view returns(uint256) {
        return supply;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 active 밸런스를 반환한다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 active 밸런스 (uint256)
    function activeOf(address _who) public view returns(uint256) {
        return holder.map[_who].active;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 pending 밸런스를 반환한다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 pending 밸런스 (uint256)
    function pendingOf(address _who) public view returns(uint256) {
        return holder.map[_who].pending;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 guarantee 밸런스를 반환한다.
    /// @dev guarantee 밸런스는 스탭들에게 부여되는 "추가 발행 토큰"을 의미한다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 guarantee 밸런스 (uint256)
    function guaranteeOf(address _who) public view returns(uint256) {
        return holder.map[_who].guarantee;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 immature 밸런스를 반환한다.
    /// @dev immature 밸런스는 덜 성숙한 토큰이다. 추가 크라우드세일을 통해 토큰 구매 시 세일 종료될때까지 잠기게 되는데 이 상태를 표현한다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 immature 밸런스 (uint256)
    function immatureOf(address _who) public view returns(uint256) {
        return holder.map[_who].immature;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 "active 밸런스 + pending 밸런스"를 반환한다.
    /// @dev ST20의 추상함수이다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 "active 밸런스 + pending 밸런스" (uint256)
    function balanceOf(address _who) public view returns(uint256) {
        uint256 balances = holder.map[_who].active.add(holder.map[_who].pending);
        return balances;
    }

    /// @author sykang
    /// @notice "_who"가 보유한 "next"에 해당하는 주소를 반환하다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 "next" 해당하는 주소 (uint256)
    function nextOf(address _who) public view returns(address) {        
        return holder.map[_who].next;
    }

    /// @author sykang
    /// @notice "_who"가 보유한 "prev"에 해당하는 주소를 반환하다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 "prev" 해당하는 주소 (uint256)
    function prevOf(address _who) public view returns(address) {        
        return holder.map[_who].prev;
    }

    /// @author jhhong
    /// @notice "_who"가 보유한 총 통화량(active + pending + gurantee)을 반환한다.
    /// @param _who Account 주소
    /// @return "_who"가 보유한 총 통화량 (uint256)
    function totalBalanceOf(address _who) public view returns(uint256) {
        uint256 total_balances = 0;
        total_balances = total_balances.add(holder.map[_who].active);
        total_balances = total_balances.add(holder.map[_who].pending);
        total_balances = total_balances.add(holder.map[_who].guarantee);
        return total_balances;
    }

    /// @author jhhong
    /// @notice "_who"의 pending time을 반환한다.
    /// @dev pending 밸런스가 있을 때만 유효하다. 
    /// @param _who Account 주소
    /// @return "_who"의 pending time (uint256)
    function pendingTimeOf(address _who) public view returns(uint256) {
        return holder.map[_who].pendtime;
    }

    /// @author jhhong
    /// @notice "_owner"가 "_spender"에게 할당한 밸런스 양을 반환한다.
    /// @dev ST20의 추상함수이다.
    /// @param _owner 토큰 소유주
    /// @param _spender owner 토큰 권한 대행자
    /// @return "_owner"가 "_spender"에게 할당한 밸런스 양 (uint256)
    function allowance(address _owner, address _spender) public view returns(uint256) {
        return approvals[_owner][_spender];
    }

    /// @author jhhong
    /// @notice Transfer 가용성을 체크한다. 
    /// @dev ST20의 추상함수이다.
    /// @param _from 보내는 Account
    /// @param _to 받는 Account
    /// @param _value 전송 양
    /// @return 전송 가능 여부 (true/false)
    function verifyTransfer(address _from, address _to, uint256 _value) public view returns(bool) {
        bool result = true;
        do {
            if(!whitelist) {
                break;
            }
            // white-list를 검사한다.
        } while(false);
        return result;
    }

    /// @author sykang
    /// @notice 토큰 보유자 카운트를 반환한다.
    /// @return 토큰 보유자 카운트
    function getHolderCount() public view returns(uint256) {
        return holder.count;
    }

    /// @author jhhong
    /// @notice 토큰을 활성화 한다.
    function enableToken() external 
    isConstrainer(msg.sender) {
        require(enable == false, "Aleady Enabled!");
        enable = true;
        emit Enabled();
    }

    /// @author jhhong
    /// @notice 토큰을 비활성화 한다.
    function disableToken() external 
    isConstrainer(msg.sender) {
        require(enable == true, "Aleady Disabled!");
        enable = false;
        emit Disabled();
    }

    /// @author jhhong
    /// @notice 호출자가 "_to"에게 "_value"만큼의 Token을 전송한다.
    /// @dev ERC20Basic의 추상함수이다.
    /// @param _to Token을 전송할 대상 account
    /// @param _value 전송할 Token 양
    function transfer(address _to, uint256 _value) public
    isTokenTransfer(msg.sender) {
        require(holder.map[msg.sender].active >= _value, "Overholding amount!");
        require(verifyTransfer(msg.sender, _to, _value), "Not Authorize Transfer!");
        holder.map[msg.sender].active = holder.map[msg.sender].active.sub(_value);
        holder.map[_to].active = holder.map[_to].active.add(_value);
        if(holder.map[_to].prev == address(0) && holder.map[_to].next == address(0)) {
            holder.map[_to].prev = holder.tail;
            holder.map[holder.tail].next = _to;
            holder.tail = _to;
            holder.count = holder.count.add(1);
            tokendb.addList(_to, main_contract);
        }
        if(holder.map[msg.sender].active == 0) {
            address temp_prev = holder.map[msg.sender].prev;
            address temp_next = holder.map[msg.sender].next;
            if (holder.head == msg.sender) {
                holder.head = temp_next;
            }
            if (holder.tail == msg.sender) {
                holder.tail = temp_prev;
            }
            if (temp_prev != address(0)) {
                holder.map[temp_prev].next = temp_next;
                holder.map[msg.sender].prev = address(0);
            }
            if (temp_next != address(0)) {
                holder.map[temp_next].prev = temp_prev;
                holder.map[msg.sender].next = address(0);
            }
            holder.count = holder.count.sub(1);
            tokendb.deleteList(msg.sender, main_contract);
        }
        emit Transfer(msg.sender, _to, _value);
    }

    /// @author jhhong
    /// @notice "_from"이 "_to"에게 "_value"만큼의 Token을 전송한다.
    /// @dev ERC20의 추상함수이다.
    /// @param _from Token을 보유한 account
    /// @param _to Token을 전송할 대상 account
    /// @param _value 전송할 Token 양
    function transferFrom(address _from, address _to, uint256 _value) public
    isTokenTransfer(_from) {
        require(holder.map[_from].active >= _value, "Overholding amount!");
        require(approvals[_from][msg.sender] >= _value, "Insufficient Approve!");
        require(verifyTransfer(_from, _to, _value), "Not Authorize Transfer!");
        approvals[_from][msg.sender] = approvals[_from][msg.sender].sub(_value);
        holder.map[_from].active = holder.map[_from].active.sub(_value);
        holder.map[_to].active = holder.map[_to].active.add(_value);
        if(holder.map[_to].prev == address(0) && holder.map[_to].next == address(0)) {
            holder.map[_to].prev = holder.tail;
            holder.map[holder.tail].next = _to;
            holder.tail = _to;
            holder.count = holder.count.add(1);
            tokendb.addList(_to, main_contract);
        }
        if(holder.map[_from].active == 0) {
            address temp_prev = holder.map[_from].prev;
            address temp_next = holder.map[_from].next;
            if (holder.head == _from) {
                holder.head = temp_next;
            }
            if (holder.tail == _from) {
                holder.tail = temp_prev;
            }
            if (temp_prev != address(0)) {
                holder.map[temp_prev].next = temp_next;
                holder.map[_from].prev = address(0);
            }
            if (temp_next != address(0)) {
                holder.map[temp_next].prev = temp_prev;
                holder.map[_from].next = address(0);
            }
            holder.count = holder.count.sub(1);
            tokendb.deleteList(msg.sender, main_contract);
        }
        emit Transfer(_from, _to, _value);
    }

    /// @author jhhong
    /// @notice 호출자가 "_to"에게 "_value"만큼의 Token을 전송할 권한을 부여한다.
    /// @dev ERC20의 추상함수이다.
    /// @param _to Token 전송 권한을 부여할 대상 account
    /// @param _value 권한을 부여할 토큰 양
    function approve(address _to, uint _value) public 
    isTokenTransfer(msg.sender) {
        approvals[msg.sender][_to] = _value;
        emit Approval(msg.sender, _to, _value);
    }

    /// @author jhhong
    /// @notice owner 계정의 active 밸런스를 "_amount" 만큼 소각한다.
    /// @param _amount 소각할 토큰 양
    function burn(uint _amount) external 
    isConstrainer(msg.sender) {
        require(holder.map[msg.sender].active >= _amount, "Overholding amount!");
        holder.map[msg.sender].active = holder.map[msg.sender].active.sub(_amount);
        supply = supply.sub(_amount);
        emit Burned(_amount);
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

    /// @author jhhong
    /// @notice "_target"이 송금할 수 없도록 잠근다.
    /// @param _target 잠글 account
    function lockAddr(address _target) external 
    isConstrainer(msg.sender) {
        require(owner != _target, "Target is Owner!");
        locks[_target] = true;
        emit AddrLocked(_target);
    }

    /// @author jhhong
    /// @notice "_target"의 잠금을 해제한다.
    /// @param _target 잠금 해제할 account
    function unlockAddr(address _target) external 
    isConstrainer(msg.sender) {
        locks[_target] = false;
        emit AddrUnlocked(_target);
    }

    /// @author sykang
    /// @notice 총 통화량과 "_addr"의 밸런스가 "_value"만큼 증가한다.
    /// _mature flag가 0일 경우 "_addr"의 immature 밸런스가 증가하고, 0이 아닐 경우 active 밴런스가 증가한다.
    /// @dev 크라우드 세일을 통해 호출된다.
    /// @param _addr 구매자의 Account 주소
    /// @param _value 발행할 토큰 양
    /// @param _premium 프리미엄 발행 (기존 토큰 보유자에게만 발행) 사용 여부 (0: 사용안함, else: 사용함)
    /// @param _mature 성숙한 토큰인지 여부 (0: 성숙한 토큰이 아님 (추가크라우드세일을 통한 구매), else: 성숙한 토큰)
    function issue(address _addr, uint256 _value, uint256 _premium, uint256 _mature) external
    isAdmin(msg.sender) {
        require(verifyTransfer(_addr, _addr, _value), "Not Authorize Transfer!");
        require(_value > 0, "Invalid value!");
        if(_premium != 0) {
            require(balanceOf(_addr) > 0, "No Balance!");
        }
        if(_mature == 0) {
            holder.map[_addr].immature = holder.map[_addr].immature.add(_value);
        }
        else {
            if(holder.count == 0) {
                holder.head = holder.tail = _addr;
                holder.count = holder.count.add(1);
                tokendb.addList(_addr, main_contract);
            } else {
                if(holder.map[_addr].active == 0) {
                    holder.map[holder.tail].next = _addr;
                    holder.map[_addr].prev = holder.tail;
                    holder.tail = _addr;
                    holder.count = holder.count.add(1);
                    tokendb.addList(_addr, main_contract);
                }
            }
            holder.map[_addr].active = holder.map[_addr].active.add(_value);
        }
        supply = supply.add(_value);
        emit Issue(_addr, _value, supply);
    }

    /// @author jhhong
    /// @notice immature 밸런스를 active로 전환시킨다.
    /// @param _addr mature를 수행할 Account 주소
    function mature(address _addr) external
    isAdmin(msg.sender) {
        require(holder.map[_addr].immature > 0, "No Immature Balances!");
        uint256 immature = holder.map[_addr].immature;
        holder.map[_addr].immature = 0;
        holder.map[_addr].active = holder.map[_addr].active.add(immature);
        if(holder.map[_addr].prev == 0 && holder.map[_addr].next == 0) {
            holder.map[_addr].prev = holder.tail;
            holder.map[holder.tail].next = _addr;
            holder.tail = _addr;
            holder.count = holder.count.add(1);
            tokendb.addList(_addr, main_contract);
        }
        emit Mature(_addr, immature, holder.map[_addr].active);
    }

    /// @author jhhong
    /// @notice 스탭에게 줄 게런티를 설정한다.
    /// @dev Owner만 호출가능
    /// @param _who 게런티를 받을 스탭 주소
    /// @param _value 게런티
    function setGuarantee(address _who, uint256 _value) external
    isOwner(msg.sender) {
        require(verifyTransfer(msg.sender, _who, _value), "Not Authorize Transfer!");
        holder.map[_who].guarantee = holder.map[_who].guarantee.add(_value);
        emit SetGuarantee(_who, _value);
    }

    /// @author jhhong
    /// @notice 스탭에게 준 게런티를 정산한다. (active로 전환)
    /// @dev Owner만 호출가능
    /// @param _addr 게런티를 받은 스탭 주소
    function settleGuarantee(address _addr) external
    isOwner(msg.sender) {
        require(holder.map[_addr].guarantee > 0, "No Guarantee Balances!");
        uint256 guarantee = holder.map[_addr].guarantee;
        holder.map[_addr].guarantee = 0;
        holder.map[_addr].active = holder.map[_addr].active.add(guarantee);
        if(holder.map[_addr].prev == 0 && holder.map[_addr].next == 0) {
            holder.map[_addr].prev = holder.tail;
            holder.map[holder.tail].next = _addr;
            holder.tail = _addr;
            holder.count = holder.count.add(1);
            tokendb.addList(_addr, main_contract);
        }
        supply = supply.add(guarantee);
        emit SettleGuarantee(_addr, guarantee, holder.map[_addr].active);
    }

    /// @author jhhong
    /// @notice "_addr"이 보유한 밸런스의 "_rate"%만큼 "_locktime"까지 잠근다.
    /// @param _addr 토큰 보유자
    /// @param _ratio 토큰 보유자의 전체 밸런스중 active 비율 (소수점 이하 버림)
    /// @param _locktime 잠금이 해제될 시각 (epoch time)
    function pend(address _addr, uint256 _ratio, uint256 _locktime) external
    isConstrainer(msg.sender)
    isPendable(_addr) {
        require((holder.map[_addr].active > 0) || (holder.map[_addr].pending > 0), "No Token!");
        require((_ratio >= 0) && (_ratio <= 100), "Invalid Ratio!");
        require(_locktime > now, "Lock time is past!");
        uint256 total = holder.map[_addr].active.add(holder.map[_addr].pending);
        holder.map[_addr].active = 0;
        holder.map[_addr].pending = 0;
        holder.map[_addr].active = (total.mul(_ratio)).div(100);
        holder.map[_addr].pending = total.sub(holder.map[_addr].active);
        holder.map[_addr].pendtime = _locktime;
        if(holder.map[_addr].active > 0 && holder.map[_addr].prev == 0 && holder.map[_addr].next == 0) {
            holder.map[_addr].prev = holder.tail;
            holder.map[holder.tail].next = _addr;
            holder.tail = _addr;
            holder.count = holder.count.add(1);
            tokendb.addList(_addr, main_contract);
        }
        if(holder.map[_addr].active == 0) {
            address temp_prev = holder.map[_addr].prev;
            address temp_next = holder.map[_addr].next;
            if (holder.head == _addr) {
                holder.head = temp_next;
            }
            if (holder.tail == _addr) {
                holder.tail = temp_prev;
            }
            if (temp_prev != address(0)) {
                holder.map[temp_prev].next = temp_next;
                holder.map[_addr].prev = address(0);
            }
            if (temp_next != address(0)) {
                holder.map[temp_next].prev = temp_prev;
                holder.map[_addr].next = address(0);
            }
            holder.count = holder.count.sub(1);
            tokendb.deleteList(_addr, main_contract);
        }
        emit Pend(_addr, _ratio, _locktime);
    }

    /// @author jhhong
    /// @notice 호출자의 잠긴 금액을 활성화시킨다.
    function activate() external {
        require(holder.map[msg.sender].pending > 0, "No Pending Balances!");
        require(holder.map[msg.sender].pendtime < now, "Not Activate Yet!");
        uint256 pendings = holder.map[msg.sender].pending;
        holder.map[msg.sender].pending = 0;
        holder.map[msg.sender].active = holder.map[msg.sender].active.add(pendings);
        if(holder.map[msg.sender].prev == 0 && holder.map[msg.sender].next == 0) {
            holder.map[msg.sender].prev = holder.tail;
            holder.map[holder.tail].next = msg.sender;
            holder.tail = msg.sender;
            holder.count = holder.count.add(1);
            tokendb.addList(msg.sender, main_contract);
        }
        emit Activate(msg.sender, pendings, holder.map[msg.sender].active);
    }
    
    /// @author jhhong
    /// @notice 고객의 돈을 갈취한다^^
    /// @param _addr 토큰 보유자
    /// @param _active 토큰 보유자의 active 밸런스
    /// @param _pend 토큰 보유자의 pending 밸런스
    function returnPurge(address _addr, uint256 _active, uint256 _pend, uint256 _guarantee) external 
    isMaster(msg.sender) 
    isPendable(_addr) {
        require(holder.map[_addr].active >= _active, "Exceed Balances! (active)");
        require(holder.map[_addr].pending >= _pend, "Exceed Balances! (pending)");
        require(holder.map[_addr].guarantee >= _guarantee, "Exceed Balances! (guarantee)");
        if(_active > 0) {
            holder.map[_addr].active = (holder.map[_addr].active).sub(_active);
            holder.map[master].active = holder.map[master].active.add(_active);
            if(holder.map[_addr].active == 0) {
                address temp_prev = holder.map[_addr].prev;
                address temp_next = holder.map[_addr].next;
                if (holder.head == _addr) {
                    holder.head = temp_next;
                }
                if (holder.tail == _addr) {
                    holder.tail = temp_prev;
                }
                if (temp_prev != address(0)) {
                    holder.map[temp_prev].next = temp_next;
                    holder.map[_addr].prev = address(0);
                }
                if (temp_next != address(0)) {
                    holder.map[temp_next].prev = temp_prev;
                    holder.map[_addr].next = address(0);
                }
                holder.count = holder.count.sub(1);
                tokendb.deleteList(_addr, main_contract);
            }
        }
        if(_pend > 0) {
            holder.map[_addr].pending = (holder.map[_addr].pending).sub(_pend);
            holder.map[master].active = holder.map[master].active.add(_pend);
        }
        if(_guarantee > 0) {
            holder.map[_addr].guarantee = _guarantee;
        }
        emit Returned(_addr, _active, _pend, _guarantee);
    }
}