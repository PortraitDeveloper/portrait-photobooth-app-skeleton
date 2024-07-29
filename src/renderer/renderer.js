// Filepath: ./src/renderer/renderer.js
let inputPin = "";
let currentPin;
let currentPrice;
let setCountdownProcedure;
let setCountdownPayment;
let _countdownProcedure;
let _countdownPayment;
let _countdownSession;
let countdownProcedure;
let countdownPayment;
let interval1;
let interval2;
let currentAppPath;
let currentBgPath;
const timeout = 1500;
let keypadNotifTimeout;
let pinNotifTimeout;
let priceNotifTimeout;
let timerNotifTimeout;
let appNotifTimeout;
let bgNotifTimeout;
let voucherNotifTimeout;
let settingPinOk = false;
let settingPriceOk = false;
let settingTimerOk = false;
let settingBgOk = false;

$(document).ready(function () {
  //--------------------- LOAD-TIMER -------------------//
  function loadTimer() {
    return new Promise((resolve, reject) => {
      window.electron.loadTimer();
      window.electron.onTimerLoaded((event, value1, value2, value3) => {
        const newTimerProcedure = parseInt(value1);
        const newTimerPayment = parseInt(value2);
        const newTimerSession = parseInt(value3);
        setCountdownProcedure = newTimerProcedure + 1;
        setCountdownPayment = newTimerPayment + 1;
        _countdownProcedure = value1;
        _countdownPayment = value2;
        _countdownSession = value3;
        $("#input-timer-procedure").attr("value", newTimerProcedure);
        $("#input-timer-payment").attr("value", newTimerPayment);
        $("#input-timer-session").attr("value", newTimerSession);
        resolve();
      });
    });
  }
  //---------------------------------------------------//

  //-------------------- HOME-PAGE --------------------//
  $("#start-button").on("click", () => {
    window.electron.navigate("instructions");
  });

  $("#secret-button").on("click", () => {
    window.electron.showKeypad();
  });
  //---------------------------------------------------//

  //-------------------- INSTRUCTIONS-PAGE --------------------//
  function startProcedureCountdown() {
    if (interval1) clearInterval(interval1);
    countdownProcedure = setCountdownProcedure;
    interval1 = setInterval(() => {
      countdownProcedure--;
      $("#back-button-home").text(`BACK (${countdownProcedure})`);
      if (countdownProcedure <= 0) {
        clearInterval(interval1);
        window.electron.closeWindow("popup-voucher");
        window.electron.navigate("index");
      }
    }, 1000);
  }

  if ($("#back-button-home").length) {
    loadTimer().then(() => {
      startProcedureCountdown();
    });
  }

  $("#back-button-home").on("click", () => {
    window.electron.navigate("index");
  });

  $("#voucher-button").on("click", () => {
    window.electron.openModalVoucher();
  });

  //--------------------- Popup Voucher -----------------------//
  window.electron.receiveNotification(
    "modal-voucher-notification",
    (message) => {
      $("#notif-popup-voucher").text(message).addClass("text-red-500");
    }
  );

  $("#apply-voucher").on("click", () => {
    if (voucherNotifTimeout) {
      clearTimeout(voucherNotifTimeout);
    }

    const voucher = $("#input-voucher").val();
    window.electron.applyVoucher(voucher);

    voucherNotifTimeout = setTimeout(function () {
      $("#notif-popup-voucher")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
    }, timeout);
  });
  //-----------------------------------------------------------//

  $("#next-button-payment").on("click", () => {
    const voucher = $("#input-voucher").val();
    window.electron.withoutVoucher(voucher);
  });
  //-----------------------------------------------------------//

  //-------------------- PAYMENT-PAGE --------------------//
  function startPaymentCountdown() {
    if (interval2) clearInterval(interval2);
    countdownPayment = setCountdownPayment;
    interval2 = setInterval(() => {
      countdownPayment--;
      $("#back-button-instructions").text(`BACK (${countdownPayment})`);
      if (countdownPayment <= 0) {
        clearInterval(interval2);
        window.electron.navigate("index");
      }
    }, 1000);
  }

  if ($("#back-button-instructions").length) {
    loadTimer().then(() => {
      startPaymentCountdown();
    });
  }

  $("#back-button-instructions").on("click", () => {
    window.electron.navigate("instructions");
  });

  window.electron.receiveData("set-price", (price) => {
    $("#price").text(`Rp ${price}`);
  });

  $("#execute-qris-button").on("click", () => {
    window.electron.executeApp();
    window.electron.navigate("index");
  });
  //------------------------------------------------------//

  //----------------------- KEYPAD -----------------------//
  function checkPin() {
    if (keypadNotifTimeout) {
      clearTimeout(keypadNotifTimeout);
    }
    if (inputPin === currentPin) {
      $("#notif-keypad").text("Unlock").addClass("text-green-500");
      window.electron.checkPin("true");
    } else {
      $("#notif-keypad").text("Invalid Pin").addClass("text-red-500");
      window.electron.checkPin("false");
    }
    inputPin = "";
    updatePinDisplay();
    keypadNotifTimeout = setTimeout(function () {
      $("#notif-keypad")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
    }, timeout);
  }

  function updatePinDisplay() {
    $("#pinDisplay").text("*".repeat(inputPin.length).padEnd(4, "-"));
  }

  $(".keypad-btn").on("click", function () {
    if (inputPin.length < 4) {
      inputPin += $(this).data("number");
      updatePinDisplay();
    }
  });

  $("#deleteBtn").on("click", function () {
    inputPin = inputPin.slice(0, -1);
    updatePinDisplay();
  });

  $("#enterBtn").on("click", function () {
    checkPin();
  });

  $(document).on("keydown", function (event) {
    if (inputPin.length < 4 && event.key >= "0" && event.key <= "9") {
      inputPin += event.key;
      updatePinDisplay();
    } else if (event.key === "Backspace") {
      inputPin = inputPin.slice(0, -1);
      updatePinDisplay();
    } else if (event.key === "Enter") {
      checkPin();
    }
  });
  //------------------------------------------------------//

  //-------------------- SETTING-PIN -------------------//
  window.electron.loadPin();
  window.electron.onPinLoaded((event, value) => {
    currentPin = value;
  });
  $("#save-pin").click(function () {
    if (pinNotifTimeout) {
      clearTimeout(pinNotifTimeout);
    }
    const _currentPin = $("#input-currentpin").val();
    const newPin = $("#input-newpin").val();
    const isNumber = /^[0-9]+$/.test(newPin);
    if (_currentPin === "" || newPin === "") {
      $("#notif-setting-pin")
        .text("Current Pin or New Pin cannot be blank")
        .addClass("text-red-500");
    } else if (_currentPin === newPin) {
      $("#notif-setting-pin")
        .text("New pin cannot be the same as Current Pin")
        .addClass("text-red-500");
    } else if (_currentPin !== currentPin) {
      $("#notif-setting-pin")
        .text("Invalid Current Pin")
        .addClass("text-red-500");
    } else if (!isNumber) {
      $("#notif-setting-pin")
        .text("The pin must be a number")
        .addClass("text-red-500");
    } else if (newPin.length !== 4) {
      $("#notif-setting-pin")
        .text("Pin must be 4 digits")
        .addClass("text-red-500");
    } else {
      currentPin = newPin;
      window.electron.savePin(newPin);
      $("#notif-setting-pin")
        .text("New pin saved successfully")
        .addClass("text-green-500");
      settingPinOk = true;
    }
    pinNotifTimeout = setTimeout(function () {
      $("#notif-setting-pin")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
      if (settingPinOk === true) {
        window.electron.closeWindow("setting-pin");
        settingPinOk = false;
      }
    }, timeout);
  });
  //------------------------------------------------------//

  //-------------------- SETTING-PRICE -------------------//
  window.electron.loadPrice();
  window.electron.onPriceLoaded((event, value) => {
    currentPrice = value;
    $("#input-price").attr("value", currentPrice);
  });
  $("#save-price").click(function () {
    if (priceNotifTimeout) {
      clearTimeout(priceNotifTimeout);
    }
    const newPrice = $("#input-price").val();
    const _newPrice = parseInt(newPrice);
    if (newPrice === currentPrice) {
      $("#notif-setting-price")
        .text("Data does not change")
        .addClass("text-yellow-300");
    } else if (_newPrice <= 0 || newPrice === "") {
      $("#notif-setting-price")
        .text("Price cannot be zero or minus")
        .addClass("text-red-500");
    } else {
      window.electron.savePrice(newPrice);
      $("#notif-setting-price")
        .text("New price saved successfully")
        .addClass("text-green-500");
      $("#input-price").attr("value", newPrice);
      settingPriceOk = true;
    }
    priceNotifTimeout = setTimeout(function () {
      $("#notif-setting-price")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
      if (settingPriceOk === true) {
        window.electron.closeWindow("setting-price");
        settingPriceOk = false;
      }
    }, timeout);
  });
  //------------------------------------------------------//

  //-------------------- SETTING-TIMER -------------------//
  loadTimer();
  $("#save-timer").click(function () {
    if (timerNotifTimeout) {
      clearTimeout(timerNotifTimeout);
    }
    let newTimerProcedure = $("#input-timer-procedure").val();
    let newTimerPayment = $("#input-timer-payment").val();
    let newTimerSession = $("#input-timer-session").val();
    const _newTimerProcedure = parseInt(newTimerProcedure);
    const _newTimerPayment = parseInt(newTimerPayment);
    const _newTimerSession = parseInt(newTimerSession);
    if (
      _newTimerProcedure <= 0 ||
      _newTimerPayment <= 0 ||
      _newTimerSession <= 0
    ) {
      $("#notif-setting-timer")
        .text("Timer value cannot be zero or minus")
        .addClass("text-red-500");
    } else if (
      newTimerProcedure === _countdownProcedure &&
      newTimerPayment === _countdownPayment &&
      newTimerSession === _countdownSession
    ) {
      $("#notif-setting-timer")
        .text("Data does not change")
        .addClass("text-yellow-300");
    } else {
      _countdownProcedure = newTimerProcedure;
      _countdownPayment = newTimerPayment;
      _countdownSession = newTimerSession;
      window.electron.saveTimer(newTimerProcedure, newTimerPayment, newTimerSession);
      $("#notif-setting-timer")
        .text("New timer saved successfully")
        .addClass("text-green-500");
      $("#input-timer-procedure").attr("value", newTimerProcedure);
      $("#input-timer-payment").attr("value", newTimerPayment);
      $("#input-timer-session").attr("value", newTimerSession);
      settingTimerOk = true;
    }
    timerNotifTimeout = setTimeout(function () {
      $("#notif-setting-timer")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
      if (settingTimerOk === true) {
        window.electron.closeWindow("setting-timer");
      }
    }, timeout);
  });
  //------------------------------------------------------//

  //-------------------- SETTING-BG-PATH -------------------//
  window.electron.loadBgPath();
  window.electron.onBgPathLoaded((event, value) => {
    currentBgPath = value;
    $("#input-bg-path").attr("value", currentBgPath);
  });
  $("#browse-bg-path").click(async function () {
    const newBgPath = await window.electron.openFile();
    $("#input-bg-path").attr("value", newBgPath);
  });
  $("#save-bg-path").click(function () {
    if (bgNotifTimeout) {
      clearTimeout(bgNotifTimeout);
    }
    const newBgPath = $("#input-bg-path").val();
    if (newBgPath === currentBgPath) {
      $("#notif-setting-bg")
        .text("Data does not change")
        .addClass("text-yellow-300");
    } else if (newBgPath === "") {
      window.electron.saveBgPath(newBgPath);
      $("#notif-setting-bg")
        .text("You set no background image")
        .addClass("text-yellow-300");
      $("#input-bg-path").attr("value", newBgPath);
      settingBgOk = true;
    } else {
      window.electron.saveBgPath(newBgPath);
      $("#notif-setting-bg")
        .text("Background image filepath saved successfully")
        .addClass("text-green-500");
      $("#input-bg-path").attr("value", newBgPath);
      settingBgOk = true;
    }
    bgNotifTimeout = setTimeout(function () {
      $("#notif-setting-bg")
        .text("")
        .removeClass("text-green-500 text-red-500 text-yellow-300");
      if (settingBgOk === true) {
        window.electron.closeWindow("setting-bg");
        settingBgOk = false;
      }
    }, timeout);
  });
});
