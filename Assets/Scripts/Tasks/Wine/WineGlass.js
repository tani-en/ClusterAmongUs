// ワイン樽(WineBarrel.js)が出すグラス。World Item Template List に "wine_glass" で登録する。
// つかめなくてよい(Grabbable は付けない)。ワインの量は、子の wine1〜wine8 を、下から順に表示して表す。
//   wine1 = いちばん下の薄い層 … wine8 = いちばん上の層。各層は、細い円柱などのメッシュ。
//   「成功の範囲」(6〜7段目)が分かるように、グラスの外側に目印の線(ただのメッシュ)を付けるとよい。
// 樽から "level" {n} が届くと、wine1〜wine{n} を表示する。"close" で消える。

const LEVELS = 8;
const MAX_LIFE = 30; // 万一、樽から "close" が届かなかったときに消す秒数

$.onStart(() => {
  $.state.life = 0;
  showLevel(0);
});

$.onUpdate(deltaTime => {
  $.state.life += deltaTime;
  if ($.state.life >= MAX_LIFE) $.destroy();
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "level":
      showLevel(arg);
      break;
    case "close":
      $.destroy();
      break;
  }
});

function showLevel(n) {
  for (let i = 1; i <= LEVELS; i++) {
    try {
      $.subNode("wine" + i).setEnabled(i <= n);
    } catch (e) {
      $.log("[ワイン] 層が見つかりません: wine" + i);
    }
  }
}