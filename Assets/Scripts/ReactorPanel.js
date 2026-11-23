// 発電機の暴走を直すパネル。2つのパネル(reactorPanel0 / reactorPanel1)に、同じスクリプトを付ける。
// 触れるアイテム(Item、Scriptable Item、Collider)に付ける。
// 別々の2人が、それぞれのパネルを、続けて押す(押してから PANEL_HOLD_SECONDS の間は、押しているとみなす)と、復旧する。
// 同じ人が、2つのパネルを走って押しても、復旧しない(GameManager が、押した人の違いを確認する)。
//
// 設定: World Item Reference List に gameManager
//   GameManager の World Item Reference List に reactorPanel0 と reactorPanel1(それぞれ、この2つのパネル)

const GAMEMANAGER = $.worldItemReference("gameManager");

$.onInteract((player) => {
  GAMEMANAGER.send("sabotageFix", { player: player, kind: "reactor" });
});