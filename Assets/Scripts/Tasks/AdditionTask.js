// 計算タスク。キーボード(別のスクリプト)から "Enter" { text, player } が届いたら、答え合わせをする。
// ・問題は、足し算・引き算・かけ算・組み合わせ(3つの数)から、ランダムに出る。答えはいつも0以上の整数。
// ・問題は、ボードを見ている全員で共有する(誰かが Enter を押すと、次の問題に変わる)。
// ・プレイヤーごとに、連続で正解した数を数える。REQUIRED 問、連続で正解するとタスク完了。間違えると、その人は0に戻る。
// ・GameManager から "start" が届くと、連続の数と問題を最初に戻す。

const TASK_ID = "addition";
const REQUIRED = 3; // 連続で正解する問題の数

const TEXT = $.subNode("TextView");

$.onStart(() => {
  $.state.streaks = {}; // { プレイヤーID: 連続正解の数 }
  $.state.message = "";
  newProblem();
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from GameManager
      $.state.streaks = {};
      $.state.message = "";
      newProblem();
      break;

    case "Enter": {
      if (!arg || !arg.player) break;
      const player = arg.player;
      const answer = $.state.answer;
      const typed = String(arg.text ?? "").trim();
      const streaks = $.state.streaks;
      const name = player.userDisplayName ?? "";

      if (typed === String(answer)) {
        const n = (streaks[player.id] ?? 0) + 1;
        if (n >= REQUIRED) {
          streaks[player.id] = 0;
          $.state.message = name + ": 完了!";
          $.worldItemReference("gameManager").send("taskStep", { taskId: TASK_ID, player: player });
        } else {
          streaks[player.id] = n;
          $.state.message = name + ": 正解 " + n + "/" + REQUIRED;
        }
      } else {
        streaks[player.id] = 0;
        $.state.message = name + ": 不正解(答え " + answer + ")";
      }
      $.state.streaks = streaks;
      newProblem();
      break;
    }
  }
});

function rand(min, max) { // min〜max の整数
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 次の問題を作って、ボードに出す
function newProblem() {
  let text, answer;
  switch (rand(0, 5)) {
    case 0: { // 2けた + 2けた
      const a = rand(10, 99), b = rand(10, 99);
      text = a + " + " + b; answer = a + b; break;
    }
    case 1: { // 2けた - 2けた(答えが0以上)
      const a = rand(20, 99), b = rand(10, a);
      text = a + " - " + b; answer = a - b; break;
    }
    case 2: { // 2けた × 1けた
      const a = rand(11, 49), b = rand(3, 9);
      text = a + " × " + b; answer = a * b; break;
    }
    case 3: { // a + b × c(かけ算が先)
      const a = rand(10, 50), b = rand(2, 9), c = rand(2, 9);
      text = a + " + " + b + " × " + c; answer = a + b * c; break;
    }
    case 4: { // (a + b) × c
      const a = rand(2, 20), b = rand(2, 20), c = rand(2, 6);
      text = "(" + a + " + " + b + ") × " + c; answer = (a + b) * c; break;
    }
    default: { // a - b + c(左から順に。答えが0以上)
      const a = rand(30, 99), b = rand(10, a), c = rand(10, 60);
      text = a + " - " + b + " + " + c; answer = a - b + c; break;
    }
  }
  $.state.answer = answer;
  TEXT.setText(text + " =\n" + ($.state.message ?? ""));
}