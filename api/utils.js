/**
 * 지정된 시간(ms)만큼 대기한다.  
 *
 * @param _ms 지정한 시간 (ms)
 * @return promise object
 * @author jhhong
 */
module.exports.milisleep = function (_ms) {
    return new Promise(resolve => setTimeout(resolve, _ms));
}

/**
 * refund의 경우 나누어 떨어지는 지 확인한다. (be divisible)
 *
 * @param _token_balance 토큰 보유량
 * @param _remain_crp 남은 crp 양
 * @param _total_supply 토큰 총 공급량
 * @return wei값
 * @author sykang
 */
module.exports.isDivisible = function (_token_balance, _remain_crp, _total_supply) {
    let tmpA = _token_balance * _remain_crp / _total_supply;
    console.log("tmpA : " + tmpA);    
    let tmpC = (tmpA.toString()).split(".");
    let tmpD = tmpC[0] + "." + tmpC[1].substr(0, 4);
    return tmpD;    
}

/**
 * ether값을 wei값(10^18)으로 변환한다.
 *
 * @param _val wei값으로 변환할 값 (ether)
 * @return wei값
 * @author jhhong
 */
module.exports.getWei = function (_val) {
    let split = _val.split(".");
    let value = '0';
    do {
        if(!split[1]) { // 소수점이 없을 경우
            if(split[0] == '0') { // 입력값이 '0'일 경우
                break;
            }
            value = split[0].toString(10);
            value = value + '000000000000000000';
            break;
        }
        let decimals = 18 - split[1].length;
        if(decimals > 0) { // 소수점이 18자리가 아닐 경우
            let digits = '0';
            for(let i = 1; i < decimals; i++) {
                digits = digits + '0';
            }
            value = split[0].toString(10);
            value = value + split[1].toString(10);
            value = value + digits;
            break;
        }
        if(decimals == 0) { // 소수점이 18자리일 경우
            value = split[0].toString(10);
            value = value + split[1].toString(10);
            break;
        }
    } while(false);
    return value;
}

/**
 * wei값을 ether값으로 변환한다.  
 *
 * @param _val ether값으로 변환할 값 (wei)
 * @return ehter값
 * @author jhhong
 */
module.exports.getEther = function (_val) {
    let value;
    let count;
    do {
        if(_val == '0') {
            value = _val;
            break;
        }
        if(_val.length > 18) { // 10^n --> n이 18보다 큰 경우
            let seg1 = _val.substr(0, (_val.length - 18)); // 정수부분
            let seg2 = _val.substr((_val.length - 18), 18); // 소수부분
            for(count = seg2.length - 1; count >= 0; count--) {
                if(seg2.charCodeAt(count) != 48) {
                    break;
                }
            }
            if(count < 0) {
                value = seg1;
            } else {
                let decimals = seg2.substr(0, (count+1));
                value = seg1 + '.' + decimals;
            }
        } else if(_val.length == 18) { // 10^n --> n이 18일 경우
            for(count = _val.length - 1; count >= 0; count--) {
                if(_val.charCodeAt(count) != 48) {
                    break;
                }
            }
            let decimals = _val.substr(0, (count+1));
            value = '0.' + decimals;
        } else { // 10^n --> n이 18보다 작은 경우
            let digits = '0';
            for(count = _val.length + 1; count < 18; count++) {
                digits = digits + '0';
            }
            for(count = _val.length - 1; count >= 0; count--) {
                if(_val.charCodeAt(count) != 48) {
                    break;
                }
            }
            let decimals = _val.substr(0, (count+1));
            value = '0.' + digits + decimals;
        }
    } while(false);
    return value;
}

/**
 * Check address format.  
 *
 * @param _address Address (string)
 * @return promise object
 * @author sena
 */
module.exports.isAddress = function (_address) {
    // check if it has the basic requirements of an address
    if (!/^(0x)?[0-9a-f]{40}$/i.test(_address)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(_address) || /^(0x|0X)?[0-9A-F]{40}$/.test(_address)) {
        return true;
    }
    return false;
}
