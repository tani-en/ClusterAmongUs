// 曲ごとに1台置くピアノの判定役。ピアノの親オブジェクト(鍵盤をまとめるオブジェクト)に付ける。
// 4台とも同じスクリプトでよい。どの曲を担当するかは、GameManager が "start" で教えてくれる。
//
// 設定(ピアノ1台ごと。1台作って複製すると、鍵盤の参照も複製側に付け替わるはず):
//   このアイテムの World Item Reference List に
//     gameManager、白鍵 pianoKey0〜pianoKey7(左から ド レ ミ ファ ソ ラ シ 高ド)、黒鍵 pianoBlack0〜pianoBlack4(左から ド# レ# ファ# ソ# ラ#)
//   GameManager の World Item Reference List に piano0, piano1, ... (MELODIES の順に、曲を担当するピアノ)
//   このアイテムの Item Audio Set List に w0〜w7、b0〜b4 の音
//
// 流れ:
//   GameManager → ここ : "start" { notes: この台の曲の鍵盤番号の並び, players: この曲を割り当てられたプレイヤーのid }
//   鍵盤(PianoKey.js) → ここ : "key" { player }  (どの鍵盤かは、送ってきたアイテムから判断する)
//   ここ → GameManager : "taskStep" { taskId, step, player } (最後まで弾けたときだけ)
//
// 押すたびに判定する。間違えたら最初から(ただし、間違えて押した鍵盤が曲の最初の音なら、1音目として数える)。
// 進み具合は、GameManager には送らない。

const TASK_ID = "piano";
const VOLUME = 2.0;      // 音量(0〜2.5。標準は1)

const GAMEMANAGER = $.worldItemReference("gameManager");
const PIANO_KEYS = [
  $.worldItemReference("pianoKey0"), $.worldItemReference("pianoKey1"),
  $.worldItemReference("pianoKey2"), $.worldItemReference("pianoKey3"),
  $.worldItemReference("pianoKey4"), $.worldItemReference("pianoKey5"),
  $.worldItemReference("pianoKey6"), $.worldItemReference("pianoKey7"),
];
// 黒鍵は、音だけ鳴らし、タスクの判定には使わない
const BLACK_KEYS = [
  $.worldItemReference("pianoBlack0"), $.worldItemReference("pianoBlack1"),
  $.worldItemReference("pianoBlack2"), $.worldItemReference("pianoBlack3"),
  $.worldItemReference("pianoBlack4"),
];

// 音は、このアイテムの Item Audio Set List に登録した Id で鳴らす。
//   白鍵: w0〜w7(ド レ ミ ファ ソ ラ シ 高ド)  黒鍵: b0〜b4

function playSound(id) {
  try {
    const audio = $.audio(id);
    audio.volume = VOLUME; // volume はスクリプトの一番上では触れないので、ここ(処理の中)で設定する
    audio.play();
  } catch (e) {
    $.log("[ピアノ] 音を鳴らせませんでした: " + id);
  }
}

$.onStart(() => {
  $.state.notes = [];     // この台が担当する曲の、鍵盤番号の並び
  $.state.players = [];   // この曲を割り当てられたプレイヤーのid
  $.state.stateTask = {}; // { プレイヤーID: 正しく弾けた数 }
  $.state.done = [];      // 弾き終えたプレイヤーのid
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": { // from GameManager
      $.state.notes = arg.notes ?? [];
      $.state.players = arg.players ?? [];
      $.state.stateTask = {};
      $.state.done = [];
      break;
    }

    case "key": { // from PianoKey. arg: { player }
      if (!(sender instanceof ItemHandle)) break;

      const black = BLACK_KEYS.findIndex(k => k.id === sender.id);
      if (black !== -1) { // 黒鍵: 音だけ鳴らす(タスクには影響しない)
        playSound("b" + black);
        break;
      }
      const key = PIANO_KEYS.findIndex(k => k.id === sender.id); // 何番目の白鍵か
      if (key === -1) break; // 登録されていない鍵盤は無視する
      playSound("w" + key); // ロビーなど、タスク中でなくても鳴らす

      const player = arg && arg.player;
      if (!player) break;
      if (!$.state.players.includes(player.id)) break; // この曲の担当ではない(音だけ鳴る)
      if ($.state.done.includes(player.id)) break;

      const notes = $.state.notes;
      const stateTask = $.state.stateTask;
      const count = stateTask[player.id] ?? 0;

      let next;
      if (key === notes[count]) {
        next = count + 1;
      } else {
        next = (key === notes[0]) ? 1 : 0; // 間違えたら最初から。ただし1音目と同じ鍵盤なら1音目として数える
      }
      stateTask[player.id] = next;
      $.state.stateTask = stateTask;

      if (next === notes.length) {
        $.state.done = [...$.state.done, player.id];
        GAMEMANAGER.send("taskStep", { taskId: TASK_ID, player: player });
      }
      break;
    }
  }
});