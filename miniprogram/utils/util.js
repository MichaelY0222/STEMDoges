// const formatTime = date => {
//   const year = date.getFullYear()
//   const month = date.getMonth() + 1
//   const day = date.getDate()
//   const hour = date.getHours()
//   const minute = date.getMinutes()
//   const second = date.getSeconds()

//   return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
// }

// const formatNumber = n => {
//   n = n.toString()
//   return n[1] ? n : '0' + n
// }

export function extendNumberToLengthString(number, length) {
  let numberString = number.toString();
  if (numberString.length<length) {
    let result="";
    for (let i=0;i<length-numberString.length;i++) {
      result+="0";
    }
    result+=numberString;
    return result;
  } else {
    return numberString;
  }
}

// module.exports = {
//   formatTime: formatTime
// }
