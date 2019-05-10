pragma solidity ^ 0.4 .24;

import "./CrpInfc.sol";

/// @title the CrpWhiteList contract (version 0.1)
/// @author sykang
contract CrpWhiteList {

    // public variable
    address public admin; // CRP admin address

    // mapping
    mapping(address => bool) white_list;
    string constant contract_type = "WHITELIST"; //컨트렉트 타입을 나타내는 변수

    // constructor
    constructor () public{
        admin = address(0x6f090f6cb125f77396d4b8f52fdabf7d5c1b53d4);
    }

    // modifier
    modifier isCrpAdmin(address _addr) { // 토큰 owner인지 검사
        require(_addr == admin);
        _;
    }

    /// @author jhhong
    /// @notice 컨트랙트 타입(string)을 반환한다.
    /// @return 컨트랙트 타입(string)
    function getContractType() external pure returns(string) {
        return contract_type;
    }

    /// @author sykang
    /// @notice insert _addr to white_list mapping variable
    /// @param _addr to insert this _addr
    function insertList(address _addr)
    isCrpAdmin(msg.sender)
    external {
        white_list[_addr] = true;
    }

    /// @author sykang
    /// @notice delete _addr to white_list mapping variable
    /// @param _addr to delete this _addr
    function deleteList(address _addr)
    isCrpAdmin(msg.sender)
    external {
        white_list[_addr] = false;
    }

    /// @author sykang
    /// @notice get white list registed data by _addr
    /// @param _addr data to bo viewd
    function getAuthorizedState(address _addr)
    public view
    returns(bool) {
        return white_list[_addr];
    }

}