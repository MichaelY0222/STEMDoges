import { get64ToBinaryMap } from "./binaryMapType";

function reportCodeScanError(error) {
  wx.navigateTo({
    url: "/pages/scanFailure/scanFailure",
    success: (res) => {
      res.eventChannel.emit('errorDetail', error);
    }
  });
}

export async function handleCode(openId, x) {
  // parse it
  console.log(openId)
  if (x.length<10) {
    // not a valid STEM Doges code
    console.log("Incorrect Length");
    reportCodeScanError("Not a valid STEM Doges Code");
    return;
  }
  if (x.substr(0,10)!=="stemDoges;") {
    // does not have the appropriate format header
    console.log("Incorrect Header");
    reportCodeScanError("Not a valid STEM Doges Code");
    return;
  }
  x=x.substr(10);
  if (x.indexOf(';')===-1||x.indexOf(';')===x.length) {
    console.log("Incorrect Semicolon Format");
    reportCodeScanError("Not a valid STEM Doges Code");
    return;
  }
  let qrCodeVersion = x.substr(0, x.indexOf(';'));
  if (qrCodeVersion !== "1") {
    reportCodeScanError(`Code version not supported (code version ${qrCodeVersion}, supported code version 1)`);
    return;
  }
  x=x.substr(x.indexOf(';')+1);
  let portions = [];
  let lastParsePart=0;
  for (let i=0;i<x.length;i++) {
    if (x.charAt(i)===';') {
      portions.push(x.substr(lastParsePart,i-lastParsePart));
      lastParsePart=i+1;
    }
  }
  if (lastParsePart<x.length) {
    portions.push(x.substr(lastParsePart, x.length-lastParsePart));
  }
  let keyToValueMap = new Map();
  for (let i=0;i<portions.length;i++) {
    if (portions[i].indexOf('-')===-1) {
      reportCodeScanError(`Code parse error: could not find corresponding value for key ${portions[i]}`);
      return;
    }
    keyToValueMap.set(portions[i].substr(0, portions[i].indexOf('-')), portions[i].substr(portions[i].indexOf('-')+1));
  }
  // process special key-value pairs
  if (keyToValueMap.has('dat')) {
    // convert from base64
    let payload = keyToValueMap.get('dat');
    if (payload.indexOf('-')===-1 || payload.indexOf('-')===payload.length-1) {
      reportCodeScanError(`Code parse error: bad syntax for key "dat"`);
      return;
    }
    let length = Number.parseInt(payload.substr(0, payload.indexOf('-')));
    if (length === NaN || length < 0 || length > 1024) {
      reportCodeScanError(`Code parse error: bad length ${payload.substr(0, payload.indexOf('-'))} for key "dat"`);
      return;
    }
    let base64ToBinaryMap = get64ToBinaryMap();
    let payloadBinaryData = [];
    payload = payload.substr(payload.indexOf('-')+1);
    for (let i=0;i<payload.length;i++) {
      payloadBinaryData.push.apply(payloadBinaryData, base64ToBinaryMap[payload.charAt(i)]);
    }
    if (length*8>payloadBinaryData.length) {
      reportCodeScanError(`Code parse error: reported length exceeds data length`);
      return;
    }
    let payloadData = [];
    for (let i=0;i<length;i++) {
      let value=0;
      for (let j=i*8;j<i*8+8;j++) {
        value+=(payloadBinaryData[j] ? 1:0)*(1<<(8-1-j%8));
      }
      payloadData.push(value);
    }
    keyToValueMap.set("dat", payloadData);
  }
  
  // handle the code
  console.log('Handle Code')
  if (keyToValueMap.get("event")==="PI25") {
    console.log('Pi Day 2025')
    if (keyToValueMap.get("type")==="questionCode") {
      console.log('Scav Hunt Quest')
      // Scavenger Hunt Question Code
      let scannedTicketId = String.fromCharCode(...keyToValueMap.get("dat"));
      console.log(scannedTicketId)
      let getTicketData = await wx.cloud.database().collection("piDayScav").where({
        questionId: scannedTicketId,
      }).get();
      console.log(getTicketData)
      if (getTicketData.data.length === 0) {
        reportCodeScanError(`This Pi Day Scavenger Hunt Question Code is invalid.`);
        return;
      }
      else {
        console.log('Navigating to Trivia Page')
        wx.navigateTo({
          url: '/pages/events/piday/trivia/trivia',
          success: (res) => {
            res.eventChannel.emit('questionId', getTicketData.data[0].questionId);
          },
          fail: (err) => {
            console.error("Navigation failed:", err);
          }
        })
        return;
      }
    } else if (keyToValueMap.get("type")==="activityCode") {
      let scannedTicketId = String.fromCharCode(...keyToValueMap.get("dat"));
      console.log(scannedTicketId)
      let getTicketData = await wx.cloud.database().collection("bitDayTemp").where({
        logId: scannedTicketId,
      }).get();
      console.log(getTicketData)
      if (getTicketData.data.length === 0 || getTicketData.data[0].used === true || Date.now() - getTicketData.data[0].timestamp > 7000) {
        reportCodeScanError(`This Pi Day Activity Code is invalid.`);
        return;
      }
      else {
        console.log(scannedTicketId)
        let res = await wx.cloud.callFunction({
          name: "pushAnyEventLog",
          data: {
            type: "useActivityCode",
            logId: scannedTicketId
          },
        });

        let checkStatus = await wx.cloud.database().collection("bitDayActivityLog").where({
          userId: openId,
          eventId: await getTicketData.data[0].eventId,
        }).get();

        let points = await getTicketData.data[0].points;
        let eventName = await getTicketData.data[0].eventName;
        console.log(points, eventName)
        if (checkStatus.data.length === 0) {
          let ans = await wx.cloud.callFunction({
            name: "pushAnyEventLog",
            data: {
              type: "activity",
              logId: scannedTicketId,
              issuerId: await getTicketData.data[0].issuerId,
              eventId: await getTicketData.data[0].eventId,
              eventName: eventName,
              points: points,
            },
          });
          
          wx.showModal({
            title: 'Activity Log Added',
            content: `Congratulations! You earned ${points} points from ${eventName}.`,
            showCancel: false,
            confirmText: 'Dismiss'
          })
          return;
        } else {
          wx.showModal({
            title: 'Activity Already Logged',
            content: `You already recceived Bits from ${eventName}. You may not receive points from this activity again.`,
            showCancel: false,
            confirmText: 'Dismiss'
          })
        }

        
      }
    } else {
      reportCodeScanError(`This Pi Day Code is of unknown type ${keyToValueMap.get("type")}.`);
      return;
    }
  }
  else if (keyToValueMap.get("event") === undefined) {
    console.log('Undefined event')
    if (keyToValueMap.get("type") === "adminDebugCode") {
      console.log('Admin Debug Code')
      wx.showModal({
        title: 'Admin Override',
        content: `Account openId: ${openId}`,
        showCancel: false,
        confirmText: 'Dismiss'
      })
    } else {
      reportCodeScanError(`This Agnostic Code is of unknown type ${keyToValueMap.get("type")}.`);
    }
  } else {
    reportCodeScanError(`This Code is bound to the unknown event ${keyToValueMap.get("event")}.`);
  }
}