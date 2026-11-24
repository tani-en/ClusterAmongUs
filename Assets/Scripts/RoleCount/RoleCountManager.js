// 役職ごとに1つ設置する人数表示・変更の中継スクリプト。
// 役職を増やすときは ROLE_ID を変更したManagerを複製する。
const ROLE_ID = "engineer";
const GAME_MANAGER = $.worldItemReference("gameManager");
const TEXT_VIEW = $.subNode("Text");

$.onStart(() => {
  GAME_MANAGER.send("getRoleCount", ROLE_ID);
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "Change":
      if (!Number.isInteger(arg)) break;
      GAME_MANAGER.send("changeRoleCount", {
        roleId: ROLE_ID,
        delta: arg
      });
      break;

    case "roleCountChanged":
      if (!arg || arg.roleId !== ROLE_ID) break;
      TEXT_VIEW.setText((arg.name ?? ROLE_ID) + "：" + arg.count + "人");
      break;
  }
});
