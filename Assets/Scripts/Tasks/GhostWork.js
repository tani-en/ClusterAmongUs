// 待機室の「ミニ計算」。死亡したクルーが、キーボードで答えると、タスクが自動で完了するまでの待ち時間が縮む。
// ・正解すると縮む。連続で正解するほど、縮む秒数が増える(BASE_REDUCE + BONUS_PER_STREAK × (連続数 - 1)、上限 MAX_REDUCE)。
// ・間違えると、その人の連続は0に戻る(縮まない)。
// ・問題は、キーボードの前にいる全員で共有する(誰かが Enter を押すと、次の問題に変わる)。
// ・死亡したクルー以外が答えても、時間は縮まない(GameManager が確認する)。
//
// 設定:
//   待機室に、KeyBoard.js と Key.js のセットをもう1組置く(計算タスク用のものとは、別のセット)。
//   待機室のキーボード(KeyBoard.js)の World Item Reference List: task にこのアイテム
//   待機室の各キー(Key.js)の World Item Reference List: keyBoard に、待機室のキーボード
//   このアイテムの World Item Reference List: gameManager
//   GameManager の World Item Reference List: ghostCalc にこのアイテム
//   このアイテムの子に、問題を出す TextView(Text)を置く

const BASE_REDUCE = 5;        // 1問正解したときに縮む秒数
const BONUS_PER_STREAK = 3;    // 連続正解が1つ増えるごとに、増える秒数
const MAX_REDUCE = 20;         // 1回で縮む秒数の上限(GameManager の GHOST_ACTION_MAX 以下にする)

const GAMEMANAGER = $.worldItemReference("gameManager");
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

    case "Enter": { // from KeyBoard
      if (!arg || !arg.player) break;
      const player = arg.player;
      const typed = String(arg.text ?? "").trim();
      const streaks = $.state.streaks;
      const name = player.userDisplayName ?? "";

      if (typed === String($.state.answer)) {
        const streak = (streaks[player.id] ?? 0) + 1;
        streaks[player.id] = streak;
        const amount = Math.min(MAX_REDUCE, BASE_REDUCE + BONUS_PER_STREAK * (streak - 1));
        GAMEMANAGER.send("ghostAction", { player: player, amount: amount });
        $.state.message = name + ": 正解";
      } else {
        streaks[player.id] = 0;
        $.state.message = name + ": 不正解(答え " + $.state.answer + ")";
      }
      $.state.streaks = streaks;
      newProblem();
      break;
    }
  }
});

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 次の問題を作って、ボードに出す。答えはいつも0以上の整数。
function newProblem() {
  let text, answer;
  switch (rand(0, 3)) {
    case 0: {
      const a = rand(10, 99), b = rand(10, 99);
      text = a + " + " + b; answer = a + b; break;
    }
    case 1: {
      const a = rand(20, 99), b = rand(10, a);
      text = a + " - " + b; answer = a - b; break;
    }
    case 2: {
      const a = rand(11, 29), b = rand(3, 9);
      text = a + " × " + b; answer = a * b; break;
    }
    default: {
      const a = rand(10, 50), b = rand(2, 9), c = rand(2, 9);
      text = a + " + " + b + " × " + c; answer = a + b * c; break;
    }
  }
  $.state.answer = answer;
  TEXT.setText(text + " =\n" + ($.state.message ?? ""));
}