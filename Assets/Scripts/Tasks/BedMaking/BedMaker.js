const BEDTEMPLATE = new WorldItemTemplateId("bed");
const BEDPOSES = [new Vector3(-30.35, 0, -1.1), new Vector3(-29.12, 0, -2.71)];
const BEDROTS  = [new Quaternion(0, 0.906307876, 0, -0.42261827), new Quaternion(0, 0.906307876, 0, -0.42261827)];

const MEETING_ROOM_POSITION = new Vector3(0, 3, -10);

const GAMEMANAGER = $.worldItemReference("gameManager");
const SHEET_DRAWER = $.worldItemReference("sheetDrawer");

const MEETING_COOLDOWN = 3;   // 会議の知らせを、この秒数のあいだは、続けて受け付けない(作り直しの連続を防ぐ)
const WARP_DELAY = 0.3;   // ベッドが消えて、乗っていた人が降りるのを待ってから動かす秒数
const SEND_DELAY = 1;     // ベッドを作ってから、SheetDrawer に一覧を教えるまでの秒数(相手の準備を待つ)

$.onStart(() => {
  $.state.beds = [];
  $.state.warps = [];     // [{ player, left }] 動かす順番待ち
  $.state.sendLeft = -1;  // 一覧を教えるまでの残り秒数(-1: 教え済み)
  $.state.cool = 0;       // 作り直しを、次に受け付けられるまでの残り秒数
  bedCreate();
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "meetingStart": // from GameManager だけ受け付ける(ベッドからの知らせでは、作り直さない)
      if (sender.id !== GAMEMANAGER.id) { break; }
      if ($.state.cool > 0) { break; }
      $.state.cool = MEETING_COOLDOWN;
      for (const bed of $.state.beds) {
        if (bed.exists()) bed.send("meetingStart", null); // ベッドが、乗っている人を知らせてから、自分を消す
      }
      bedCreate();
      break;

    case "bedGone": { // from bed. arg.player: 乗っていた人(いなければ null)
      if (!arg || !arg.player) break;
      const warps = $.state.warps;
      warps.push({ player: arg.player, left: WARP_DELAY });
      $.state.warps = warps;
      break;
    }
  }
});

$.onUpdate(deltaTime => {
  if ($.state.cool > 0) $.state.cool = Math.max(0, $.state.cool - deltaTime);

  // 乗っていた人を、会議室へ動かす
  const warps = $.state.warps;
  if (warps.length > 0) {
    const rest = [];
    for (const w of warps) {
      w.left -= deltaTime;
      if (w.left > 0) { rest.push(w); continue; }
      try {
        if (w.player.exists()) w.player.setPosition(MEETING_ROOM_POSITION);
      } catch (e) {
        $.log("setPosition エラー: " + e);
      }
    }
    $.state.warps = rest;
  }

  // 新しいベッドの一覧を、SheetDrawer に教える
  if ($.state.sendLeft > 0) {
    const left = $.state.sendLeft - deltaTime;
    if (left <= 0) {
      $.state.sendLeft = -1;
      SHEET_DRAWER.send("bedHd", $.state.beds);
    } else {
      $.state.sendLeft = left;
    }
  }
});

function bedCreate() {
  const beds = [];
  for (let i = 0; i < BEDPOSES.length; i++) {
    const bed = $.createItem(BEDTEMPLATE, BEDPOSES[i], BEDROTS[i]);
    bed.send("init", { gm: GAMEMANAGER });
    beds.push(bed);
  }
  $.state.beds = beds;
  $.state.sendLeft = SEND_DELAY;
}