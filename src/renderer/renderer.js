// Filepath: ./src/renderer/renderer.js
let inputPin = "";
let currentPin;
let currentPrice;
let setCountdownProcedure;
let setCountdownPayment;
let countdownProcedure;
let countdownPayment;
let interval1;
let interval2;
let countdownHome = 11;
let countdownInstructions = 11;

$(document).ready(function () {
  //-------------------- HOME-PAGE --------------------//
  $("#start-button").on("click", () => {
    clearInterval(interval1);
    countdownInstructions = 60; // reset the countdown
    window.electron.startTimer(60);
    window.electron.navigate("instructions");
  });

  $("#secret-button").on("click", () => {
    clearInterval(interval1);
    //window.electron.toggleMenu();
    window.electron.showKeypad();
  });
  //---------------------------------------------------//

  //-------------------- INSTRUCTIONS-PAGE --------------------//
  function startHomeCountdown() {
    if (interval1) clearInterval(interval1);
    countdownHome = 11;
    interval1 = setInterval(() => {
      countdownHome--;
      $("#back-button-home").text(`BACK (${countdownHome})`);
      if (countdownHome <= 0) {
        clearInterval(interval1);
        window.electron.navigate("index");
      }
    }, 1000);
  }

  if ($("#back-button-home").length) {
    startHomeCountdown();
  }

  $("#back-button-home").on("click", () => {
    clearInterval(interval1);
    countdownHome = 60; // reset the countdown
    window.electron.stopTimer();
    window.electron.navigate("index");
  });

  $("#next-button-payment").on("click", () => {
    const voucher = $("#input-voucher").val();
    clearInterval(interval2);
    countdownHome = 60; // reset the countdown
    window.electron.startTimer(60);
    window.electron.applyVoucher(voucher);
  });
  //-----------------------------------------------------------//

  //-------------------- PAYMENT-PAGE --------------------//
  function startInstructionsCountdown() {
    if (interval2) clearInterval(interval2);
    countdownInstructions = 11;
    interval2 = setInterval(() => {
      countdownInstructions--;
      $("#back-button-instructions").text(`BACK (${countdownInstructions})`);
      if (countdownInstructions <= 0) {
        clearInterval(interval2);
        window.electron.navigate("index");
      }
    }, 1000);
  }

  if ($("#back-button-instructions").length) {
    startInstructionsCountdown();
  }

  $("#back-button-instructions").on("click", () => {
    clearInterval(interval2);
    countdownInstructions = 60; // reset the countdown
    window.electron.stopTimer();
    window.electron.navigate("instructions");
  });

  window.electron.receiveData("set-price", (price) => {
    $("#price").text(`Rp ${price}`);
  });

  $("#execute-qris-button").on("click", () => {
    countdownVoucher = 60; // reset the countdown
    window.electron.startTimer(60);
    window.electron.executeApp();
    window.electron.navigate("index");
  });
  //------------------------------------------------------//

  //----------------------- KEYPAD -----------------------//
  function checkPin() {
    if (inputPin === currentPin) {
      window.electron.checkPin("Pin benar");
    } else {
      window.electron.checkPin("Pin salah");
    }
    inputPin = "";
    updatePinDisplay();
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

  //-------------------- SETTING-PRICE -------------------//
  window.electron.loadPrice();
  window.electron.onPriceLoaded((event, value) => {
    currentPrice = value;
    $("#input-price").attr("placeholder", currentPrice);
  });
  $("#save-price").click(function () {
    $("#notif-setting-price")
      .text("")
      .removeClass("text-green-500 text-red-500");
    const newPrice = $("#input-price").val();
    const _newPrice = parseInt(newPrice);
    if (newPrice === "") {
      return;
    } else if (_newPrice <= 0) {
      $("#notif-setting-price")
        .text("Price cannot be zero or minus")
        .addClass("text-red-500");
    } else {
      window.electron.savePrice(newPrice);
      $("#notif-setting-price")
        .text("New price saved successfully")
        .addClass("text-green-500");
      $("#input-price").attr("placeholder", newPrice);
      $("#input-price").val("");
    }
  });
  //------------------------------------------------------//

  //-------------------- SETTING-PIN -------------------//
  window.electron.loadPin();
  window.electron.onPinLoaded((event, value) => {
    currentPin = value;
  });
  $("#save-pin").click(function () {
    $("#notif-setting-pin").text("").removeClass("text-green-500 text-red-500");
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
      $("#input-currentpin").val("");
      $("#input-newpin").val("");
    }
  });
  //------------------------------------------------------//

  //-------------------- SETTING-TIMER -------------------//
  window.electron.loadTimer();
  window.electron.onTimerLoaded((event, value1, value2) => {
    const newTimerProcedure = parseInt(value1);
    const newTimerPayment = parseInt(value2);
    setCountdownProcedure = newTimerProcedure + 1;
    setCountdownPayment = newTimerPayment + 1;
    $("#input-timer-procedure").attr("placeholder", newTimerProcedure);
    $("#input-timer-payment").attr("placeholder", newTimerPayment);
  });
  $("#save-timer").click(function () {
    $("#notif-setting-timer")
      .text("")
      .removeClass("text-green-500 text-red-500");
    const newTimerProcedure = $("#input-timer-procedure").val();
    const newTimerPayment = $("#input-timer-payment").val();
    const _newTimerProcedure = parseInt(newTimerProcedure);
    const _newTimerPayment = parseInt(newTimerPayment);
    if (_newTimerProcedure <= 0 || _newTimerPayment <= 0) {
      $("#notif-setting-timer")
        .text("Timer value cannot be zero or minus")
        .addClass("text-red-500");
    } else if (newTimerProcedure === "" || newTimerPayment === "") {
      return;
    } else {
      window.electron.saveTimer(newTimerProcedure, newTimerPayment);
      $("#notif-setting-timer")
        .text("New timer saved successfully")
        .addClass("text-green-500");
      $("#input-timer-procedure").attr("placeholder", newTimerProcedure);
      $("#input-timer-payment").attr("placeholder", newTimerPayment);
      $("#input-timer-procedure").val("");
      $("#input-timer-payment").val("");
    }
  });
  //------------------------------------------------------//
});
