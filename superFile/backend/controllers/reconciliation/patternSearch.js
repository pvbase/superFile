/**
 * @author rahul.jain@zenqore.com 
 */

 /**
  * finds and returns the longest substring common to str and pattern 
  * @param {*} str 
  * @param {*} pattern 
  */
function longestSubstring(str, pattern) {
    if (str == null || str == "" || pattern == null || pattern == "") {
        return ""; 
    }
    str = str.toLowerCase();
    pattern = pattern.toLowerCase();
    var strSuffixArr = [];
    for (let i = 0; i < str.length; i++) {
        strSuffixArr.push(str.substring(i));
    }
    strSuffixArr.sort();

    var patternSuffixArr = [];
    for (let j = 0; j < pattern.length; j++) {
        patternSuffixArr.push(pattern.substring(j));
    }
    patternSuffixArr.sort();

    let i = 0; // tracks sorted strSuffixArr entries
    let j = 0; // tracks sorted patternSuffixArr entries 
    var maxLenMatch = 0; 
    var longestSubstring; 
    while (true) {
        if (i == strSuffixArr.length || j == patternSuffixArr.length) {
            break;
        }
        strPortion = strSuffixArr[i];
        patternPortion = patternSuffixArr[j];
        let d = startingCharsMatch(strPortion, patternPortion); 
        if (d != 0) {
            // console.log("(" + i + "," + j + "), found matching chars: " + strPortion.substring(0, d) ) ; 
            if (d > maxLenMatch) {
                maxLenMatch = d; 
                longestSubstring = strPortion.substring(0, d); 
            }
        }
        // console.log("xx: (" + i + "," + j + "), strPortion: " + strPortion + ", patternPortion: " + patternPortion); 
        if (strPortion > patternPortion) {
            j++;
        } else {
            i++;
        }
    }
    return longestSubstring;
} // longestSubstring

function startingCharsMatch(str, pattern) {
    var k;
    for (k = 0; k < Math.min(str.length, pattern.length); k++) {
        if (str.charAt(k) != pattern.charAt(k)) 
            break;
    }
    return k;
}

module.exports = longestSubstring;

// console.log( startingCharsMatch("zabcfe", "zyabc") ) ; 

// for testing above functions 
// console.log("longestSubstring: " + longestSubstring("someString", "stRAw")) ;
// console.log("longestSubstring: " + longestSubstring("someString", "somestring")) ;
// console.log("longestSubstring: " + longestSubstring("NEFT DR-YESB0000022-GIGAFLOW TECHNOLOGIE S LLP-NETBANK, MUM-N192201184617967-INIT IAL CAPITAL", 
//     "GIGAFLOW TECHNOLOGIES")) ;

// console.log("longestSubstring: " + longestSubstring("NEFT DR-YESB0000022-GIGAFLOW TECHNOLOGIE S LLP-NETBANK, MUM-N192201184617967-INIT IAL CAPITAL", 
//     "N192201184617967")) ;

// console.log("longestSubstring: " + longestSubstring("NEFT/CITIN19980428632/KELLY SERVICES I PVT LTD P", 
//     "test S")) ;
