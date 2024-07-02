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
    window.electron.toggleMenu();
  });
  //---------------------------------------------------//

  //-------------------- INSTRUCTIONS-PAGE --------------------//
  let countdownHome = 11;
  let interval1;

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
  let countdownInstructions = 11;
  let interval2;

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
});
