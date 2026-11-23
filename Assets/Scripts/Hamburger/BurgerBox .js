// 材料の箱。材料ごとに1つ(パティ・チーズ・キャベツ・トマト・上のパン)、5つの箱に同じスクリプトを付ける。
// 箱の見た目に Text を付け、その文字を材料の種類にする: steak / cheese / cabbage / tomato / upper
// 出てくる材料のアイテムは、World Item Template List に "burger_" + 種類 のIdで登録しておく
//   (例: burger_steak, burger_cheese, burger_cabbage, burger_tomato, burger_upper)。
//
// World Item Reference List に burgerBase(土台)を入れる。
// 土台の World Item Reference List には burgerBox0〜4 を入れる(ゲーム開始時に、箱から出ていた材料を消すため)。

const MAX_ITEMS = 3;       // 同時に出しておける材料の数
const SPAWN_HEIGHT = 1.0;  // 箱の上、どれだけ高く出すか

const BASES = [$.worldItemReference("burgerBase"), $.worldItemReference("burgerBase1"), $.worldItemReference("burgerBase2")];

$.onStart(() => {
  $.state.items = [];
  const label = $.getUnityComponent("Text");
  $.state.type = label.unityProp.text.trim(); // この箱の材料の種類
});

$.onInteract((player) => {
  const items = $.state.items.filter(item => item.exists());
  if (items.length >= MAX_ITEMS) {
    $.state.items = items;
    return;
  }

  const position = $.getPosition();
  position.y += SPAWN_HEIGHT;

  const handle = $.createItem(new WorldItemTemplateId("burger_" + $.state.type), position, $.getRotation());
  handle.send("init", { type: $.state.type, bases: BASES });
  items.push(handle);
  $.state.items = items;
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from BurgerBase: 新しいゲーム。出ていた材料を消す
      $.state.items.forEach(item => {
        if (item.exists()) item.send("start", null);
      });
      $.state.items = [];
      break;
  }
});