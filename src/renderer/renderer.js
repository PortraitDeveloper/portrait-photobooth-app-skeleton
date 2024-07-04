// Filepath: ./src/renderer/renderer.js
let countdownHome = 11;
let countdownInstructions = 11;
let interval1;
let interval2;
let inputPin = "";
const correctPin = "2378";
let currentPrice;

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
    if (inputPin === correctPin) {
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
    const newPrice = $("#input-price").val();
    if (newPrice === "") {
      window.electron.savePrice(currentPrice);
    } else {
      window.electron.savePrice(newPrice);
      $("#inputValue").attr("placeholder", newPrice);
      $("#inputValue").val("");
    }
  });
  //------------------------------------------------------//
});
